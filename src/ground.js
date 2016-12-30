import * as THREE from '../node_modules/three/build/three.js';

import * as colors from './colors';


export const surface = function() {
    // const floorTexture = new THREE.ImageUtils.loadTexture(
    //     'images/dirt-seamless.jpg'
    // );
    // floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    // floorTexture.repeat.set(100, 100);

    // const basicMaterial = new THREE.MeshBasicMaterial({
    //     map: floorTexture,
    //     side: THREE.FrontSide,
    // });

    const floorGeometry = new THREE.PlaneGeometry(500, 500);

    const floorMaterial = new THREE.MeshLambertMaterial({
        color: colors.sand,
        // specular: 0x05aa05,
        // shininess: 100,
        shading: THREE.SmoothShading,
    });
    const meshFaceMaterial = new THREE.MeshFaceMaterial([ floorMaterial ]);


    var planeMaterial = new THREE.MeshPhongMaterial({
        color: 0x777777,
        wireframe: false,
    });
    planeMaterial.side = THREE.DoubleSide;

    return new THREE.Mesh(floorGeometry, planeMaterial);
};
