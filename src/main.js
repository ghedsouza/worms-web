import $ from '../node_modules/jquery/dist/jquery.js';
import * as THREE from '../node_modules/three/build/three.js';
import Stats from '../node_modules/stats.js/build/stats.min.js';

import {
    rad,
    assert,
    letter_index,
    V3,
    V2,
    time,
} from './utils';

import * as glass from './glass';
import * as ground from './ground';
import * as worm from './worm';
import * as worm2 from './worm2';


const mousePos = V2(0,0);

function onDocumentMouseMove( event )
{
    // the following line would stop any other event handler from firing
    // (such as the mouse's TrackballControls)
    // event.preventDefault();
    // update sprite position
    mousePos.x = Math.min(event.clientX, 500);
    mousePos.y = Math.min(event.clientY, 500);
}


const timeZero = time();
const t = function() {
    return time() - timeZero;
}


function run() {
    const $container = $('#container');
    const $debug = $('#debug');

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

    renderer.setSize(WIDTH, HEIGHT);

    // attach the render-supplied DOM element
    $container.append(renderer.domElement);

    const mag_glass = glass.glass();
    const surface = ground.surface();
    const wormModel = worm.wormTest();
    const worm1 = new worm.Worm();
    const wormB = new worm2.Worm();

    window.worm = wormB;

    const pointLight = new THREE.PointLight( 0xFFFFFF );
    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 130;

    scene.add(camera);
    scene.add(pointLight);
    scene.add(surface);
    scene.add(mag_glass);
    // scene.add(wormModel);
    // scene.add(worm1.wormMesh);
    scene.add(wormB.wormMesh);

    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    // when the mouse moves, call the given function
    document.addEventListener('mousemove', onDocumentMouseMove, false );

    function animate() {
        stats.begin();
        const xPercentage = mousePos.x / 500;
        const yPercentage = (500-mousePos.y) / 500;

        const xMagPos = -4 + (8 * xPercentage);
        const yMagPos = -4 + (8 * yPercentage);

        mag_glass.rotation.x = -rad(-45 + (yPercentage * 90));
        mag_glass.rotation.y = rad(-45 + (xPercentage * 90));

        // $debug.html('t: ' + t() + ', x: ' + mousePos.x + ', y: ' + mousePos.y);

        const worm_t = t()/5;
        wormModel.position.set(
            worm_t, Math.sin(worm_t), 0
            );
        wormModel.rotation.z = Math.cos(worm_t) + rad(90);

        worm1.update();
        wormB.update();

        mag_glass.position.set(
            xMagPos, yMagPos, 3
            );

        renderer.render(scene, camera);

        requestAnimationFrame( animate );
        stats.end();
    }
    requestAnimationFrame( animate );
}

window.run = run;
