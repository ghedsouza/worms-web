// Damped Spring Model
//
// Based on code from Ruben:
// https://github.com/romxz/romxz.github.io/blob/master/three/test_09/src/physics_test2.js
// Also see notes in ./damped_spring_model_notes.pdf
//

import * as THREE from '../../node_modules/three/build/three.js';

import {
    assert,
    V3,
} from './../utils';

// Reference numbers:
// var mInit = 500;
// var kInit = 700;
// var bInit = 15;

// Spring equation constants:

function getC0(m, k, b, delta){ return (1-k*delta*delta/(2*m)); }
function getC1(m, k, b, delta){ return k*delta*delta/(2*m); }
function getC2(m, k, b, delta){ return (delta-b*delta*delta/(2*m)); }
function getC3(m, k, b, delta){ return b*delta*delta/(2*m); }

function getC4(m, k, b, delta){ return -k*delta/m; }
function getC5(m, k, b, delta){ return k*delta/m; }
function getC6(m, k, b, delta){ return (1-b*delta/m); }
function getC7(m, k, b, delta){ return b*delta/m; }


export function updatePosition(p, q, delta, maxDistance) {
    var c0 = getC0(p.m, p.k, p.b, delta);
    var c1 = getC1(p.m, p.k, p.b, delta);
    var c2 = getC2(p.m, p.k, p.b, delta);
    var c3 = getC3(p.m, p.k, p.b, delta);

    var ppx = p.position.x, ppy = p.position.y, ppz = p.position.z;
    var qqx = q.position.x, qqy = q.position.y, qqz = q.position.z;

    var px = c0*ppx+c1*qqx+c2*p.velocity.x+c3*q.velocity.x;
    var py = c0*ppy+c1*qqy+c2*p.velocity.y+c3*q.velocity.y;
    var pz = c0*ppz+c1*qqz+c2*p.velocity.z+c3*q.velocity.z;

    var ppos = V3(px, py, pz);
    var qpos = q.position.clone();
    var disp = V3(0,0,0).subVectors(ppos, qpos);
    var dist = disp.length;

    if (dist > maxDistance){
        disp.multiplyScalar(maxDistance/(dist+1));
        ppos.addVectors(qpos, disp);
    }

    return ppos;
}

export function updateVelocity(p, q, delta, environment, c){
    var c4, c5, c6, c7;

    var ppx = p.position.x, ppy = p.position.y, ppz = p.position.z;
    var ppvx = p.velocity.x, ppvy = p.velocity.y, ppvz = p.velocity.z;
    var qqx = q.position.x, qqy = q.position.y, qqz = q.position.z;
    var vx, vy, vz;

    c4 = getC4(p.m, p.k, p.b, delta);
    c5 = getC5(p.m, p.k, p.b, delta);
    c6 = getC6(p.m, p.k, p.b, delta);
    c7 = getC7(p.m, p.k, p.b, delta);

    vx = c4*ppx+c5*qqx+c6*ppvx+c7*q.velocity.x;
    vy = c4*ppy+c5*qqy+c6*ppvy+c7*q.velocity.y;
    vz = c4*ppz+c5*qqz+c6*ppvz+c7*q.velocity.z;

    var vel = V3(
        vx+environment.heat*(0.5-Math.random()),
        vy+environment.heat*(0.5-Math.random()),
        0 // vz+environment.heat*(0.5-Math.random())
        );

    // limiting speed:
    var speed = vel.length();
    if (speed > c){
        vel.multiplyScalar(c/(speed+1));
    }

    return vel;
}


export class SpringModel {
    constructor({c=100, maxDistance=2, heat=0.0} = {}) {
        this.c = c;
        this.maxDistance = maxDistance;
        this.environment = {heat};
    }

    updateVelocity(p, q, delta) {
        return updateVelocity(p, q, delta, this.environment, this.c);
    }

    updatePosition(p, q, delta) {
        return updatePosition(p, q, delta, this.maxDistance);
    }
}
