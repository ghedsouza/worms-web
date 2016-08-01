import * as THREE from '../node_modules/three/build/three.js';

import {rad, assert, letter_index, V3} from './utils';
import * as colors from './colors';


const get_surface_geom = function() {
    const length = 8;
    const surface_geom = new THREE.Geometry();
    surface_geom.vertices.push(V3(-(length/2), -(length/2), 0));
    surface_geom.vertices.push(V3(-(length/2), (length/2), 0));
    surface_geom.vertices.push(V3((length/2), -(length/2), 0));
    surface_geom.vertices.push(V3((length/2), (length/2), 0));

    function wrap(index) {
        return index % 4;
    }
    function face(a, b, c) {
        return new THREE.Face3(
            wrap(a),
            wrap(b),
            wrap(c),
            null,
            null
        );
    }

    surface_geom.faces.push(face(0, 2, 3));
    surface_geom.faces.push(face(0, 3, 1));
    return surface_geom;
};

export const surface = function() {
    const surfaceMaterial = new THREE.MeshPhongMaterial({ color: colors.red });
    const meshFaceMaterial = new THREE.MeshFaceMaterial([surfaceMaterial,]);

    const surface_geom = get_surface_geom();
    surface_geom.computeFaceNormals();
    for (const face in surface_geom.faces) {
        surface_geom.faces[face].materialIndex = 0;
    }

    return new THREE.Mesh(surface_geom, meshFaceMaterial);
};
