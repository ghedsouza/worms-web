import * as THREE from '../node_modules/three/build/three.js'

import {rad, assert, letter_index, V3} from './utils';

export const glassType = "magnifying";

// Polar Logo
var alpha = 30; // degrees

function ring() {
    const purple = new THREE.Color( 0xff00ff );

    var ring_geom = new THREE.Geometry();

    const segments = 20;

    const x_vals = [];
    const y_vals = [];

    for (let s = 0; s < segments; s++) {
        const d = s/segments * 360;
        const r_outer = 1, r_inner = 0.9;
        const x_outer = r_outer*Math.cos(rad(d)), y_outer = r_outer*Math.sin(rad(d));
        const x_inner = r_inner*Math.cos(rad(d)), y_inner = r_inner*Math.sin(rad(d));
        x_vals[s] = [];
        y_vals[s] = [];
        x_vals[s][0] = x_inner
        y_vals[s][0] = y_inner
        x_vals[s][1] = x_outer
        y_vals[s][1] = y_outer

        ring_geom.vertices.push(V3(x_inner, y_inner, 0));
        ring_geom.vertices.push(V3(x_outer, y_outer, 0));
    }

    for (let s = 0; s < segments; s++) {
        function wrap(index) {
            return index % (segments* 2);
        }
        const start_vert_index = s * 2;
        ring_geom.faces.push(new THREE.Face3(
            wrap(start_vert_index),
            wrap(start_vert_index + 1),
            wrap(start_vert_index + 3),
            null,
            purple
            ));
        ring_geom.faces.push(new THREE.Face3(
            wrap(start_vert_index),
            wrap(start_vert_index + 3),
            wrap(start_vert_index + 2),
            null,
            purple
            ));
    }
    return ring_geom;
}


export const glass = function(){
    const vomit = new THREE.Color( 0xBAD646 );
    const green = new THREE.Color( 0x33B24A );
    const purple = new THREE.Color( 0xff00ff );
    const red = new THREE.Color( 0xF15B29 );
    const blue = new THREE.Color( 0x1877AB );

    const ring_geom = ring();
    ring_geom.computeFaceNormals();

    var mag_glass_object = new THREE.Mesh(
        ring_geom,
        new THREE.MeshPhongMaterial({
            vertexColors: THREE.FaceColors
            })
        );
    return mag_glass_object;
};
