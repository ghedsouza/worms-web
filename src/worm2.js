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

const axisAngle = function(v, target, axis) {
    const angle = v.angleTo(target);
    const positive = v.clone().applyAxisAngle(axis, angle);
    const negative = v.clone().applyAxisAngle(axis, -angle);
    if (positive.distanceTo(target) < negative.distanceTo(target)) {
        return angle;
    } else {
        return -angle;
    }
}

// Assume point and center are on the XY plane
// Rotate point around center on the XY plane
const rotateXY = function(point, center, angle) {
    return point.clone().add(
        center.clone().negate()
        ).applyAxisAngle(V3(0,0,1), angle).add(
            center
            );
}

const midPoint = function(p1, p2) {
    return p1.clone().lerp(p2, 0.5);
};


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
        this.segLength = 0.5;

        this.segments = 2;
        this.rings = this.segments + 1;
        this.slices = 12;

        this.wormMesh = wormMesh(this.segments, this.slices);

        this.skel = [];
        for (let i=0; i<this.rings; i++) {
            this.skel.push({
                // Dynamic values:
                // Start the skeleton in a straight line.
                position: V3(0, i * this.segLength, 0),
                backDirection: V3(0,1,0),
                velocity: V3(0, 0, 0),

                // Fixed settings:
                speed: 0.3,
                turnSpeed: 0.05,
                m: 25*(i+1),
                k: 20,
                b: 30,
            });
        }
    }

    update() {
        const timeDelta = this.clock.getDelta();

        const setVertex = (function(i, vert) {
            const v = this.wormMesh.geometry.vertices;
            v[i].fromArray( vert.toArray() );
        }).bind(this);

        const Z = V3(0,0,1);
        const wormTarget = this.target;

        //
        // Update Head (special case):
        //
        const head = this.skel[0];
        const prevRing = this.skel[1];

        const direction = head.backDirection.clone().negate();
        const idealDirection = (wormTarget.clone().sub(prevRing.position))
            .setLength(this.segLength)
            ;
        const idealPosition = prevRing.position.clone().add(idealDirection);

        const angle = axisAngle(direction, idealDirection, Z);
        const newDirection = direction.clone().applyAxisAngle(
            Z,
            angle * head.turnSpeed * timeDelta
            );

        head.position = prevRing.position.clone().add(newDirection);
        head.backDirection = newDirection.clone().negate();


        const facing = head.backDirection.clone().negate();

        head.velocity = facing.normalize().multiplyScalar(
            head.speed * timeDelta
            );
        head.position.add(head.velocity);

        //
        // Update rest of skeleton:
        //
        for (let ring = 1; ring < this.rings; ring++) {
            const targetIndex = ring - 1;
            assert(targetIndex >= 0);
            const targetRing = this.skel[targetIndex];

            const targetEndPos = targetRing.position.clone().add(
                targetRing.backDirection.clone().setLength(
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

            const directionRay = new THREE.Ray(targetRing.position, targetRing.backDirection);
            const rayTarget = directionRay.closestPointToPoint(alice.position);
            const maxRayDist = 0.2;
            if (alice.position.distanceTo(rayTarget) > maxRayDist) {
                const newPos = alice.position.clone().lerp(
                    rayTarget,
                    (alice.position.distanceTo(rayTarget)-maxRayDist)/alice.position.distanceTo(rayTarget)
                    )
                alice.position = newPos;
            }


            const angleDiff = this.skel[ring].backDirection.angleTo(
                this.skel[targetIndex].backDirection
                );

            const moveAngle = angleDiff * 0.75; // Math.pow(angleDiff, 10);

            // this.skel[ring].backDirection.applyAxisAngle(V3(0,0,1), angleDiff);
        }

        for (let ring=0; ring<this.rings; ring++) {
            const skel = this.skel[ring];

            let needle = skel.position.clone().add(V3(0, 0, this.segHeight));

            for (let j = 0; j < this.slices; j++) {
                const vert = needle.clone();

                setVertex(ring*12 + j, vert);

                const nextNeedle = needle.clone().sub(skel.position).applyAxisAngle(
                    skel.backDirection, rad(360/this.slices)
                    ).add(
                        skel.position
                        )
                needle = nextNeedle;
            }
        }

        this.wormMesh.geometry.computeFaceNormals();
        this.wormMesh.geometry.verticesNeedUpdate = true;
    }
}
