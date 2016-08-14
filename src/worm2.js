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

const slices = 12;
const segments = 1;

export const wormGeom = function() {
    const geom = new THREE.Geometry();
    const segHeight = 0.5;
    const segLength = 1;

    // Vertex locations (dynamic)
    for (let i = 0; i < (segments+1); i++) {
        const needle = V3(0,segHeight,0);
        for (let j = 0; j < slices; j++) {
            const vert = needle.clone().add(V3(i*segLength, 0, 0));
            geom.vertices.push(vert);
            needle.applyAxisAngle(V3(1,0,0), rad(360/slices));
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
    return geom;
}

export const wormMesh = function() {
    const geom = wormGeom();

    const tubeMaterial = new THREE.MeshPhongMaterial({ color: colors.silver });
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
        this.wormMesh = wormMesh();
        this.skel = [
            {
                location: V3(0,0,0),
                direction: V3(1,0,0),
            },
            {
                location: V3(0.5,0,0),
                direction: V3(1,0,0),
            },
        ]
    }

    update() {
        const rotate = function(point, center, angle) {
            return point.clone().add(center.clone().negate()).applyAxisAngle(V3(0,0,1), angle).add(center);
        }
        const midPoint = function(p1, p2) {
            return p1.clone().lerp(p2, 0.5);
        }

        const v = this.wormMesh.geometry.vertices;

        const rings = segments + 1;
        let angle = 0.2;

        for (let ring = 0; ring < rings; ring++) {
            const start = ring * slices;
            const mid = midPoint(v[start], v[start + slices/2]);

            for (let p = 0; p < slices; p++) {
                v[start + p].fromArray( rotate(v[start + p], mid, rad(angle)).add(
                    V3(-0.0, 0.0, 0)
                    ).toArray());
            }

            angle /= 2;
        }
        this.wormMesh.geometry.verticesNeedUpdate = true;
    }
}
