import * as glass from './glass';
import $ from '../node_modules/jquery/dist/jquery.js';
import * as THREE from '../node_modules/three/build/three.js';
import Stats from '../node_modules/stats.js/build/stats.min.js';


console.log(Stats);


function run() {
    var $container = $('#container');
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
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(
        VIEW_ANGLE,
        ASPECT,
        NEAR,
        FAR
        );
    // the camera starts at 0,0,0 so pull it back
    camera.position.z = 10;
    // camera.position.x = 1;
    camera.position.y = 0;
    scene.add(camera);

    renderer.setSize(WIDTH, HEIGHT);
    // attach the render-supplied DOM element
    $container.append(renderer.domElement);

    const mag_glass = glass.glass();

    scene.add(mag_glass);

    const pointLight = new THREE.PointLight( 0xFFFFFF );
    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 130;
    scene.add(pointLight);

    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    function animate() {
        stats.begin();
        mag_glass.rotation.y += 0.01;
        renderer.render(scene, camera);
        stats.end();
        requestAnimationFrame( animate );
    }
    requestAnimationFrame( animate );
}

window.run = run;
