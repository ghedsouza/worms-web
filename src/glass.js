import * as THREE from '../node_modules/three/build/three.js'

import {rad, assert, letter_index, V3} from './utils';

export const glassType = "magnifying";

// Polar Logo
var alpha = 30; // degrees

export const glass = function(){
    var g_height = Math.tan(rad(alpha));
    var h_depth = 1 - g_height;

    var a = V3(0, 3, 0);
    var b = V3(1, 3 + g_height, 0);
    var c = V3(3, 3 + 3*g_height, 0);
    var d = V3(3, 2 + 3*g_height, 0);
    var e = V3(3, 3*g_height, 0)
    var f = V3(2, 2*g_height, 0)
    var g = V3(1, g_height, 0);
    var h = V3(1, -h_depth, 0);
    var i = V3(0,0,0);
    var j = V3(0,1,0);
    var k = V3(1, 2 + g_height, 0);
    var l = V3(2, 1 + 2*g_height, 0);
    var m = V3(1, 1 + g_height, 0);
    var n = V3(2, 2 + 2*g_height, 0);

    var logo_geom = new THREE.Geometry();
    var verts = [a,b,c,d,e,f,g,h,i,j,k,l,m,n];
    for(var ii = 0; ii<verts.length; ii++){
        verts[ii].x -= 1.5;
        logo_geom.vertices.push(verts[ii]);
    }

    const vomit = new THREE.Color( 0xBAD646 );
    const green = new THREE.Color( 0x33B24A );
    const purple = new THREE.Color( 0xff00ff );
    const red = new THREE.Color( 0xF15B29 );
    const blue = new THREE.Color( 0x1877AB );

    function pF3(l1, l2, l3, color) {
        return new THREE.Face3(
            letter_index(l1),
            letter_index(l2),
            letter_index(l3),
            null,
            color
        )
    }

    function add_front_and_back_face(l1, l2, l3, color) {
        logo_geom.faces.push(pF3(l1, l2, l3, color));
        logo_geom.faces.push(pF3(l3, l2, l1, color));
    }

    add_front_and_back_face('i','g','j', purple);
    add_front_and_back_face('g','m','j', green);
    add_front_and_back_face('h','g','i', red);

    add_front_and_back_face('m','b','j', vomit);
    add_front_and_back_face('j','b','a', vomit);

    add_front_and_back_face('k','c','b', blue);
    add_front_and_back_face('d','c','k', blue);

    add_front_and_back_face('g','l','m', blue);
    add_front_and_back_face('f','l','g', blue);

    add_front_and_back_face('e','d','f', blue);
    add_front_and_back_face('f','d','n', blue);

    logo_geom.computeFaceNormals();

    var logo_object = new THREE.Mesh(
        logo_geom,
        new THREE.MeshPhongMaterial({
            vertexColors: THREE.FaceColors
            })
        );
    // logo_object.translateX(1.5);
    return logo_object;
};
