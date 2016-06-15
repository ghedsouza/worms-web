import * as glass from './glass';
import $ from '../node_modules/jquery/dist/jquery.js'
import * as three from '../node_modules/three/build/three.js'

console.log(glass.glassType);
console.log(three.Scene());

function run() {
    var $container = $('#container');
    console.log($container);
}

run();
