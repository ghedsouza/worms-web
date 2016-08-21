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

const slices = 12;
const segments = 2;

export const wormGeom = function() {
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
        }
    }
    cap(0);
    cap(slices * segments);
    return geom;
}

export const wormMesh = function() {
    const geom = wormGeom();

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
        this.springModel = new spring.SpringModel({
            c: 100,
            maxDistance: 2,
            environment: {
                heat: 0.05,
            },
        });

        this.segHeight = 0.5;
        this.segLength = 0.5;

        this.rings = segments + 1;

        this.skel = [];
        for (let i=0; i<this.rings; i++) {
            this.skel.push({
                position: V3(0, i * this.segLength, 2),
                direction: V3(0,1,0),
                velocity: V3(0, 0, 0),
                m: 45,
                k: 10,
                b: 30,
            });
        }

        this.skel[0].velocity = V3(0.2, -0.3, 0);

        this.wormMesh = wormMesh();
        this.clock = new THREE.Clock();
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
        if (this.skel[0].position.y > -3) {
            this.skel[0].position.add( this.skel[0].velocity.clone().multiplyScalar(timeDelta) );
            this.skel[0].direction.applyAxisAngle(V3(0,0,1), rad(timeDelta * 6));
        } else {
            this.skel[0].velocity = V3(0,0,0);
        }

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

            const angleDiff = this.skel[ring].direction.angleTo(
                this.skel[targetIndex].direction
                );

            const moveAngle = angleDiff/2; // Math.pow(angleDiff, 10);

            this.skel[ring].direction.applyAxisAngle(V3(0,0,1), angleDiff);
        }

        for (let ring=0; ring<this.rings; ring++) {
            const skel = this.skel[ring];

            let needle = skel.position.clone().add(V3(0, 0, this.segHeight));
            // debugger

            for (let j = 0; j < slices; j++) {
                const vert = needle.clone(); // .add( skel.position );

                setVertex(ring*slices + j, vert);

                const temp = needle.clone().sub(skel.position).applyAxisAngle(
                    skel.direction, rad(360/slices)
                    ).add(
                        skel.position
                        )
                // needle.applyAxisAngle(skel.direction, rad(360/slices));
                needle = temp;
            }
        }

        this.wormMesh.geometry.computeFaceNormals();
        this.wormMesh.geometry.verticesNeedUpdate = true;
    }
}
