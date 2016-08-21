import $ from '../node_modules/jquery/dist/jquery.js';
import * as THREE from '../node_modules/three/build/three.js';

import {
    rad,
    assert,
    letter_index,
    F3,
    V3,
    V2,
    time,
} from './utils';
import * as colors from './colors';
import * as spring from './physics/spring';


function stopOnNaN(value) {
    if (isNaN(value)) {
        debugger;
    }
}


export const wormGeom = function(segments, slices) {
    const geom = new THREE.Geometry();

    // Vertex locations (dynamic)
    // These will get updated later.
    for (let i = 0; i < (segments+1); i++) {
        for (let j = 0; j < slices; j++) {
            geom.vertices.push(V3());
        }
    }

    // Face definitions: (static)
    for (let i = 0; i < segments; i++) {
        const start = i * slices;

        for (let j = 0; j < slices; j++) {
            const a = start + j;
            const b = start + (j + 1) % slices;
            const c = a + slices;
            const d = b + slices;
            geom.faces.push(F3(a,b,d));
            geom.faces.push(F3(a,d,c));
        }
    }

    function cap(start) {
        for(let i=1; i<slices-1; i++) {
            geom.faces.push(F3(start, start+i, start+i+1));
            geom.faces.push(F3(start, start+i+1, start+i));
        }
    }
    cap(0);
    cap(slices * segments);
    return geom;
}

export const wormMesh = function(segments, slices) {
    const geom = wormGeom(segments, slices);

    const wormMaterial = new THREE.MeshPhongMaterial({
        color: colors.silver,
        specular: 0x05aa05,
        shininess: 100,
    });
    const meshFaceMaterial = new THREE.MeshFaceMaterial( [ wormMaterial ] );

    geom.computeFaceNormals();
    for (const face in geom.faces) {
        geom.faces[face].materialIndex = 0;
    }
    const mesh = new THREE.Mesh(geom, meshFaceMaterial);
    return mesh;
}

export class Worm {
    constructor() {
        this.clock = new THREE.Clock();

        this.springModel = new spring.SpringModel({
            c: 100,
            maxDistance: 2,
            environment: {
                heat: 0.0,
            },
        });

        this.target = V3(1, -1, 0);

        this.segHeight = 0.4;
        this.segLength = 0.25;

        this.segments = 8;
        this.rings = this.segments + 1;
        this.slices = 12;

        this.wormMesh = wormMesh(this.segments, this.slices);

        this.skel = [];
        for (let i=0; i<this.rings; i++) {
            this.skel.push({
                position: V3(0, i * this.segLength, 0),
                direction: V3(0,1,0),
                velocity: V3(0, 0, 0),
                speed: 0.3,
                turnSpeed: 0.005,
                m: 25,
                k: 20,
                b: 30,
            });
        }
        // this.skel[0].velocity = V3(0.2, -0.3, 0);
    }

    update() {
        const timeDelta = this.clock.getDelta();

        const rotateXY = function(point, center, angle) {
            return point.clone().add(
                center.clone().negate()
                ).applyAxisAngle(V3(0,0,1), angle).add(
                    center
                    );
        }
        const midPoint = function(p1, p2) {
            return p1.clone().lerp(p2, 0.5);
        }

        const v = this.wormMesh.geometry.vertices;
        const setVertex = function(i, vert) {
            v[i].fromArray( vert.toArray() );
        }

        // Update Head (special case):
        const head = this.skel[0];
        let facing = head.direction.clone().negate();
        const idealDirection = (this.target.clone().sub(head.position));
        const distanceLeft = idealDirection.length();
        const angleBetween = facing.angleTo(idealDirection);

        const slow = ((5*distanceLeft)/(5*distanceLeft + 1));

        if (angleBetween > 0) {
            const cross = facing.clone().cross(idealDirection);
            const toTurn = Math.min(angleBetween, head.turnSpeed);
            const newFacing = facing.clone().applyAxisAngle(
                cross,
                slow * toTurn * (0.5 * (1 + Math.cos(timeDelta/2)))
                )
            head.direction = newFacing.clone().negate();
        }
        facing = head.direction.clone().negate();
        head.velocity = facing.normalize().multiplyScalar(
            slow * head.speed * timeDelta
            );
        head.position.add( head.velocity );

        // console.log("Distance left: ",distanceLeft,", position: ",head.position.x,", ",head.position.y);

        // if (this.skel[0].position.y > -3) {
        //     // this.skel[0].position.add( this.skel[0].velocity.clone().multiplyScalar(timeDelta) );
        //     this.skel[0].direction.applyAxisAngle(V3(0,0,1), rad(timeDelta * 20 * Math.random()));
        // } else {
        //     this.skel[0].velocity = V3(0,0,0);
        // }

        // Update rest of skeleton:
        for (let ring = 1; ring < this.rings; ring++) {
            const targetIndex = ring - 1;
            assert(targetIndex >= 0);
            const targetRing = this.skel[targetIndex];

            const targetEndPos = targetRing.position.clone().add(
                targetRing.direction.clone().setLength(
                    this.segLength
                    )
                );

            const alice = this.skel[ring];
            const bob = {
                position: targetEndPos,
                velocity: targetRing.velocity.clone(),
                m: targetRing.m,
                k: targetRing.k,
                b: targetRing.b,
            };

            alice.velocity = this.springModel.updateVelocity(
                alice, bob, timeDelta
                );
            alice.position = this.springModel.updatePosition(
                alice, bob, timeDelta
                );

            const directionRay = new THREE.Ray(targetRing.position, targetRing.direction);
            const rayTarget = directionRay.closestPointToPoint(alice.position);
            const maxRayDist = 0.1;
            if (alice.position.distanceTo(rayTarget) > maxRayDist) {
                const newPos = alice.position.clone().lerp(
                    rayTarget,
                    (alice.position.distanceTo(rayTarget)-maxRayDist)/alice.position.distanceTo(rayTarget)
                    )
                alice.position = newPos;
            }


            const angleDiff = this.skel[ring].direction.angleTo(
                this.skel[targetIndex].direction
                );

            const moveAngle = angleDiff * 0.75; // Math.pow(angleDiff, 10);

            this.skel[ring].direction.applyAxisAngle(V3(0,0,1), angleDiff);
        }

        for (let ring=0; ring<this.rings; ring++) {
            const skel = this.skel[ring];

            let needle = skel.position.clone().add(V3(0, 0, this.segHeight));

            for (let j = 0; j < this.slices; j++) {
                const vert = needle.clone();

                setVertex(ring*12 + j, vert);

                const temp = needle.clone().sub(skel.position).applyAxisAngle(
                    skel.direction, rad(360/this.slices)
                    ).add(
                        skel.position
                        )
                // needle.applyAxisAngle(skel.direction, rad(360/this.slices));
                needle = temp;
            }
        }

        this.wormMesh.geometry.computeFaceNormals();
        this.wormMesh.geometry.verticesNeedUpdate = true;
    }
}
