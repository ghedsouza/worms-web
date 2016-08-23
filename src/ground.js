import * as THREE from '../node_modules/three/build/three.js';

export const surface = function() {

	var floorTexture = new THREE.ImageUtils.loadTexture( 'images/dirt-seamless.jpg' );
	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
	floorTexture.repeat.set(100, 100);
	
	var floorNorm = new THREE.ImageUtils.loadTexture( 'images/dirt-seamless_NRM.png' );
	floorNorm.wrapS = floorNorm.wrapT = THREE.RepeatWrapping;
	floorNorm.repeat.set(100, 100);
	
	var floorSpec = new THREE.ImageUtils.loadTexture( 'images/dirt-seamless_SPEC.png' );
	floorSpec.wrapS = floorSpec.wrapT = THREE.RepeatWrapping;
	floorSpec.repeat.set(100, 100);
	
	var floorDisp = new THREE.ImageUtils.loadTexture( 'images/dirt-seamless_DISP.png' );
	floorDisp.wrapS = floorDisp.wrapT = THREE.RepeatWrapping;
	floorDisp.repeat.set(100, 100);
	
	const basicMaterial = new THREE.MeshPhongMaterial({ map: floorTexture, normalMap: floorNorm, specularMap: floorSpec, displacementMap: floorDisp, side: THREE.FrontSide });
	const floorGeometry = new THREE.PlaneGeometry(1280, 1024);
    return new THREE.Mesh(floorGeometry, basicMaterial);
};
