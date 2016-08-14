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


function stopOnNaN(value) {
    if (isNaN(value)) {
        debugger;
    }
}

const slices = 12;
const segments = 3;

export const wormGeom = function() {
    const geom = new THREE.Geometry();
    const segHeight = 0.5;
    const segLength = 1;

    // Vertex locations (dynamic)
    // These will get updated later.
    for (let i = 0; i < (segments+1); i++) {
        for (let j = 0; j < slices; j++) {
            geom.vertices.push(V3());
        }
    }

    // Face definitions: (fixed)

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

    const tubeMaterial = new THREE.MeshPhongMaterial({
        color: colors.silver,
        specular: 0x05aa05,
        shininess: 100,
    });
    const meshFaceMaterial = new THREE.MeshFaceMaterial( [ tubeMaterial ] );

    geom.computeFaceNormals();
    for (const face in geom.faces ) {
        geom.faces[face].materialIndex = 0;
    }
    const mesh = new THREE.Mesh(geom, meshFaceMaterial);
    return mesh;
}


export class Worm {
    constructor() {
        this.timeZero = time();
        this.lastUpdate = this.time();

        this.segHeight = 0.5;
        this.segLength = 1;

        this.rings = segments + 1;

        this.skel = [];
        for (let i=0; i<this.rings; i++) {
            this.skel.push({
                location: V3(0, i * this.segLength, 0),
                direction: V3(0,1,0),
                velocity: Math.exp(-i/4),
            });
        }

        this.wormMesh = wormMesh();
    }

    time() {
        return (time() - this.timeZero);
    }

    update() {
        const currentTime = this.time();
        const timeDelta = this.time() - this.lastUpdate;

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

        let angle = 0.2;

        // Head special case:
        if (this.skel[0].location.y > -3) {
            this.skel[0].location.y -= ((timeDelta * this.skel[0].velocity));
            this.skel[0].direction.applyAxisAngle(V3(0,0,1), rad(timeDelta * 6));
        }

        // Update rest of skeleton:
        for (let ring=1; ring < this.rings; ring++) {
            const targetIndex = ring-1;
            assert(targetIndex >= 0);

            const target = this.skel[targetIndex].location.clone().add(
                this.skel[targetIndex].direction.clone().setLength(
                    this.segLength
                    )
                );

            const f = function(t) {
                const alpha = 0.2, beta = 2;
                return Math.exp(-alpha * t) * Math.cos(beta * currentTime);
            }

            const current = this.skel[ring].location.clone();
            const dir = current.clone().sub(target);
            const newLoc = target.clone().add(dir.multiplyScalar(f(timeDelta)));

            // this.skel[ring].location = newLoc;

            const targetVector = target.clone().sub(current);
            let velocity = this.skel[ring].velocity + 0.5 * this.skel[ring].velocity * Math.abs(Math.cos(this.time()));
            if (targetVector.length() > 0.4) {
                velocity = this.skel[targetIndex].velocity;
            }

            const move = Math.min(velocity * timeDelta, targetVector.length());


            this.skel[ring].location.add(targetVector.setLength(move));

            const angleDiff = this.skel[ring].direction.angleTo(
                this.skel[targetIndex].direction
                );

            const moveAngle = angleDiff/2; // Math.pow(angleDiff, 10);

            this.skel[ring].direction.applyAxisAngle(V3(0,0,1), angleDiff);
        }

        for (let ring=0; ring<this.rings; ring++) {
            const skel = this.skel[ring];
            const needle = V3(0, 0, this.segHeight);
            for (let j = 0; j < slices; j++) {
                const vert = needle.clone().add( skel.location );
                setVertex(ring*slices + j, vert);

                needle.applyAxisAngle(skel.direction, rad(360/slices));
            }
        }

        // for (let ring = 0; ring < rings; ring++) {
        //     const start = ring * slices;
        //     const mid = midPoint(v[start], v[start + slices/2]);

        //     for (let p = 0; p < slices; p++) {
        //         v[start + p].fromArray( rotate(v[start + p], mid, rad(angle)).add(
        //             V3(-0.0, 0.0, 0)
        //             ).toArray());
        //     }

        //     angle /= 2;
        // }

        this.wormMesh.geometry.computeFaceNormals();
        this.wormMesh.geometry.verticesNeedUpdate = true;
        this.lastUpdate = this.time();
    }
}
