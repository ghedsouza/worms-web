import * as THREE from '../node_modules/three/build/three.js';


/******************
*    Debug
*******************/

export function assert(condition, message) {
    if (!condition) {
        debugger;
        throw message || 'Assertion failed';
    }
}

function stopOnNaN(value) {
    if (isNaN(value)) {
        debugger;
    }
}


/******************
*    Time
*******************/

/** Return current time in seconds. */
export function time() {
    return Date.now()/1000;
}


/******************
*    Math
*******************/

export function rad(deg) {
    return deg * Math.PI / 180;
}

export function deg(rad) {
    return rad * 180 / Math.PI;
}


/************************
*    Three.js helpers
*************************/

export function F3(i, j, k) {
    return new THREE.Face3(i, j, k);
}

export function V3(x,y,z) {
    return new THREE.Vector3(x,y,z);
}

export function V2(x,y) {
    return new THREE.Vector2(x,y);
}

export function V3toString(v) {
    return `V3(${v.x}, ${v.y}, ${v.z})`;
}


/******************
*    Math
*******************/

export function letter_index(letter) {
    assert(letter.length === 1);
    assert(letter >= 'a');
    assert(letter <= 'z');
    var index = letter.charCodeAt(0) - 97;
    assert(index >= 0 && index <= 25);
    return index;
}
