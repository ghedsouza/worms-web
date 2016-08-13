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


export const wormGeom = function() {
    const geom = new THREE.Geometry();
    const segHeight = 0.5;
    const segLength = 1;

    const segments = 2;

    for (let i = 0; i < (segments+1); i++) {
        geom.vertices.push(V3(0 + i*segLength, -segHeight/2, segHeight/2)) // 0
        geom.vertices.push(V3(0 + i*segLength, segHeight/2, segHeight/2)) // 1
        geom.vertices.push(V3(0 + i*segLength, -segHeight/2, -segHeight/2)) // 2
        geom.vertices.push(V3(0 + i*segLength, -segHeight/2, -segHeight/2)) // 3
    }

    for (let i = 0; i<segments; i++) {
        const start = i*4;
        function face(a, b, c) {
            return F3(start + a, start + b, start + c);
        }
        geom.faces.push(face(0, 5, 1));
        geom.faces.push(face(0, 4, 5));
        geom.faces.push(face(1, 7, 3));
        geom.faces.push(face(1, 5, 7));
        geom.faces.push(face(2, 3, 7));
        geom.faces.push(face(2, 7, 6));
        geom.faces.push(face(0, 2, 6));
        geom.faces.push(face(0, 6, 4));
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
    }

    update() {
        const v = this.wormMesh.geometry.vertices;
        const midPoint1 = v[0].clone().lerp(v[1], 0.5);
        const midPoint2 = v[2].clone().lerp(v[3], 0.5);

        const rotate = function(point, center, angle) {
            return point.clone().add(center.clone().negate()).applyAxisAngle(V3(0,0,1), angle).add(center);
        }

        v[0].fromArray(rotate(v[0], midPoint1, rad(0.1)).toArray());
        v[1].fromArray(rotate(v[1], midPoint1, rad(0.1)).toArray());

        v[2].fromArray(rotate(v[2], midPoint1, rad(0.1)).toArray());
        v[3].fromArray(rotate(v[3], midPoint1, rad(0.1)).toArray());

        // for (let i=0; i<4; i++) {
        //     this.wormMesh.geometry.vertices[i].add(V3(-0.1, 0.1, 0));
        // }

        this.wormMesh.geometry.verticesNeedUpdate = true;
    }
}
