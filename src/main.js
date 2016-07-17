import * as glass from './glass';
import $ from '../node_modules/jquery/dist/jquery.js'
import * as THREE from '../node_modules/three/build/three.js'

console.log(glass.glassType);
console.log(THREE.Scene());

// console.log("x: ", three, THREE)

function run() {
    var $container = $('#container');
    console.log($container);

    // set the scene size
    var WIDTH = 500,
        HEIGHT = 500;

    // set some camera attributes
    var VIEW_ANGLE = 45,
        ASPECT = WIDTH / HEIGHT,
        NEAR = 0.1,
        FAR = 10000;

    // create a WebGL renderer, camera
    // and a scene
    var renderer = new THREE.WebGLRenderer();
    var camera = new THREE.PerspectiveCamera(
        VIEW_ANGLE,
        ASPECT,
        NEAR,
        FAR
        );
    var scene = new THREE.Scene();

    // the camera starts at 0,0,0 so pull it back
    camera.position.z = 10;
    // camera.position.x = 1;
    camera.position.y = 0;

    // start the renderer
    renderer.setSize(WIDTH, HEIGHT);

    // attach the render-supplied DOM element
    $container.append(renderer.domElement);

    const mag_glass = glass.glass();

    scene.add(mag_glass);

    // and the camera
    scene.add(camera);

    // create a point light
    var pointLight = new THREE.PointLight( 0xFFFFFF );

    // set its position
    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 130;

    // add to the scene
    scene.add(pointLight);

    function animate() {
        mag_glass.rotation.y += 0.01;
        // draw!
        renderer.render(scene, camera);
        requestAnimationFrame( animate );
    }
    requestAnimationFrame( animate );
}

window.run = run;
// run();
