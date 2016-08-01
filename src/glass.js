import * as THREE from '../node_modules/three/build/three.js';

import {rad, assert, letter_index, V3} from './utils';
import * as colors from './colors';


// (figure 1) Ring vertex mapping:
//
// (outer side - top)
//  1           3 (current layer)
// +-----------+
// |(front)    |            5            7 (next layer)
// |           |            +------------+
// |           |            |            |
// |           |(back)      |            |
// |           |            |            |
// |0          |2           |            |
// +-----------+            |            |
// (inner side - bottom)    |4           |6
//                          +------------+
//
function ring() {
    var ring_geom = new THREE.Geometry();

    const segments = 20;
    const depth = 0.5;
    const r_outer = 1, r_inner = 0.9;

    for (let s = 0; s < segments; s++) {
        const d = s/segments * 360;

        const x_inner = r_inner*Math.cos(rad(d));
        const y_inner = r_inner*Math.sin(rad(d));

        const x_outer = r_outer*Math.cos(rad(d));
        const y_outer = r_outer*Math.sin(rad(d));

        // See (figure 1) above for vertex map
        ring_geom.vertices.push(V3(x_inner, y_inner, -depth/2)); // 0
        ring_geom.vertices.push(V3(x_outer, y_outer, -depth/2)); // 1
        ring_geom.vertices.push(V3(x_inner, y_inner, depth/2)); // 2
        ring_geom.vertices.push(V3(x_outer, y_outer, depth/2)); // 3
    }

    for (let s = 0; s < segments; s++) {
        const i = s * 4;
        function wrap(index) {
            return index % (segments * 4);
        }
        function face(a, b, c) {
            return new THREE.Face3(
                wrap(i + a),
                wrap(i + b),
                wrap(i + c),
                null,
                null
            );
        }
        ring_geom.faces.push(face(0, 5, 1));
        ring_geom.faces.push(face(0, 4, 5));
        ring_geom.faces.push(face(1, 7, 3));
        ring_geom.faces.push(face(1, 5, 7));
        ring_geom.faces.push(face(2, 3, 7));
        ring_geom.faces.push(face(2, 7, 6));
        ring_geom.faces.push(face(0, 2, 6));
        ring_geom.faces.push(face(0, 6, 4));
    }
    return ring_geom;
}

function handle() {
    const tube_geom = new THREE.CylinderGeometry(0.2, 0.25, 2.25, 20, 1);
    return tube_geom;
}

export const glass = function() {
    const ringMaterial = new THREE.MeshPhongMaterial({ color: colors.silver });
    const handleMaterial = new THREE.MeshPhongMaterial({ color: colors.wood });
    const meshFaceMaterial = new THREE.MeshFaceMaterial( [ ringMaterial, handleMaterial ] );

    const ring_geom = ring();
    ring_geom.computeFaceNormals();

    const handle_geom = handle();
    handle_geom.translate(0, -(1 + (2.25/2) ), 0);
    handle_geom.computeFaceNormals();

    for (const face in ring_geom.faces ) {
        ring_geom.faces[face].materialIndex = 0;
    }
    for (const face in handle_geom.faces ) {
        handle_geom.faces[face].materialIndex = 1;
    }

    const mergeGeometry = new THREE.Geometry();

    mergeGeometry.merge(ring_geom, ring_geom.matrix);
    mergeGeometry.merge(handle_geom, handle_geom.matrix);

    const mergeMesh = new THREE.Mesh(mergeGeometry, meshFaceMaterial);

    return mergeMesh;
};
