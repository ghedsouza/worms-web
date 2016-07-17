import * as THREE from '../node_modules/three/build/three.js'


export function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}

export function rad(deg) {
    return deg * Math.PI / 180;
}

export function letter_index(letter) {
    assert(letter.length === 1);
    assert(letter >= "a");
    assert(letter <= "z");
    var index = letter.charCodeAt(0) - 97;
    assert(index >= 0 && index <= 25);
    return index;
}

export function V3(x,y,z) {
    return new THREE.Vector3(x,y,z);
}
