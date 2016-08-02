import * as THREE from '../node_modules/three/build/three.js';

import {rad, assert, letter_index, V3} from './utils';
import * as colors from './colors';


export const wormTest = function() {
    const tubeGeom = new THREE.CylinderGeometry(0.25, 0.25, 1, 8, 1);

    const tubeMaterial = new THREE.MeshPhongMaterial({ color: colors.silver });
    const meshFaceMaterial = new THREE.MeshFaceMaterial( [ tubeMaterial ] );

    tubeGeom.computeFaceNormals();
    for (const face in tubeGeom.faces ) {
        tubeGeom.faces[face].materialIndex = 0;
    }
    const mesh = new THREE.Mesh(tubeGeom, meshFaceMaterial);

    return mesh;
}
