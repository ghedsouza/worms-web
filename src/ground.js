import * as THREE from '../node_modules/three/build/three.js';

export const surface = function() {
    const floorTexture = new THREE.ImageUtils.loadTexture(
        'images/dirt-seamless.jpg'
    );
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(100, 100);

    const basicMaterial = new THREE.MeshBasicMaterial({
        map: floorTexture,
        side: THREE.FrontSide,
    });
    const floorGeometry = new THREE.PlaneGeometry(500, 500);

    return new THREE.Mesh(floorGeometry, basicMaterial);
};
