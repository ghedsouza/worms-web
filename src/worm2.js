import $ from '../node_modules/jquery/dist/jquery.js';
import * as THREE from '../node_modules/three/build/three.js';

import {
    rad,
    assert,
    letter_index,
    F3,
    V3,
    V2,
    time,
} from './utils';
import * as colors from './colors';


function stopOnNaN(value) {
    if (isNaN(value)) {
        debugger;
    }
}

const slices = 12;
const segments = 4;

export const wormGeom = function() {
    const geom = new THREE.Geometry();

    // Vertex locations (dynamic)
    // These will get updated later.
    for (let i = 0; i < (segments+1); i++) {
        for (let j = 0; j < slices; j++) {
            geom.vertices.push(V3());
        }
    }

    // Face definitions: (static)
    for (let i = 0; i < segments; i++) {
        const start = i * slices;

        for (let j = 0; j < slices; j++) {
            const a = start + j;
            const b = start + (j + 1) % slices;
            const c = a + slices;
            const d = b + slices;
            geom.faces.push(F3(a,b,d));
            geom.faces.push(F3(a,d,c));
        }
    }

    function cap(start) {
        for(let i=1; i<slices-1; i++) {
            geom.faces.push(F3(start, start+i, start+i+1));
        }
    }
    cap(0);
    cap(slices * segments);
    return geom;
}

export const wormMesh = function() {
    const geom = wormGeom();

    const wormMaterial = new THREE.MeshPhongMaterial({
        color: colors.silver,
        specular: 0x05aa05,
        shininess: 100,
    });
    const meshFaceMaterial = new THREE.MeshFaceMaterial( [ wormMaterial ] );

    geom.computeFaceNormals();
    for (const face in geom.faces) {
        geom.faces[face].materialIndex = 0;
    }
    const mesh = new THREE.Mesh(geom, meshFaceMaterial);
    return mesh;
}

var aliceRad = 9, bobRad = 10, carlRad = 9.5, eveRad = 8.5;
var mInit = 500;
var kInit = 700;
var bInit = 15;
var c = 100;
var maxDistance = 2;
var environment = {heat: 0, strongDistance: bobRad*20, gravity: 1000};

// function V3(x,y,z){ return new THREE.Vector3(x,y,z);}
function V4(x,y,z,w){ return new THREE.Vector4(x,y,z,w);}
// function F3(x,y,z){ return new THREE.Face3(x,y,z);}

function log(check){ window.console.log(check);}
function dist3(x1,y1,z1,x2,y2,z2){
    return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2)+(z1-z2)*(z1-z2));
}
function distV3(V3a, V3b){
    var vx = V3a.x, vy = V3a.y, vz = V3a.z;
    var ux = V3b.x, uy = V3b.y, uz = V3b.z;
    return Math.sqrt((vx-ux)*(vx-ux)+(vy-uy)*(vy-uy)+(vz-uz)*(vz-uz));
}

function getC0(m, k, b, delta){ return (1-k*delta*delta/(2*m)); }
function getC1(m, k, b, delta){ return k*delta*delta/(2*m); }
function getC2(m, k, b, delta){ return (delta-b*delta*delta/(2*m)); }
function getC3(m, k, b, delta){ return b*delta*delta/(2*m); }
function getC4(m, k, b, delta){ return -k*delta/m; }
function getC5(m, k, b, delta){ return k*delta/m; }
function getC6(m, k, b, delta){ return (1-b*delta/m); }
function getC7(m, k, b, delta){ return b*delta/m; }

function updatePosition(p, q, delta){
    //var c0, c1, c2, c3;
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

function updateVelocity(p, q, delta){
    var c4, c5, c6, c7;

    var ppx = p.position.x, ppy = p.position.y, ppz = p.position.z;
    var ppvx = p.velocity.x, ppvy = p.velocity.y, ppvz = p.velocity.z;
    var qqx = q.position.x, qqy = q.position.y, qqz = q.position.z;
    var vx, vy, vz, velDelta, rad;
    var distance = dist3(ppx,ppy,ppz,qqx,qqy,qqz);

    if (true){
        c4 = getC4(p.m, p.k, p.b, delta);
        c5 = getC5(p.m, p.k, p.b, delta);
        c6 = getC6(p.m, p.k, p.b, delta);
        c7 = getC7(p.m, p.k, p.b, delta);

        vx = c4*ppx+c5*qqx+c6*ppvx+c7*q.velocity.x;
        vy = c4*ppy+c5*qqy+c6*ppvy+c7*q.velocity.y;
        vz = c4*ppz+c5*qqz+c6*ppvz+c7*q.velocity.z;
    } else {
        velDelta = V3(qqx-ppx, qqy-ppy, qqz-ppz);
        rad = velDelta.length;
        velDelta.multiplyScalar(environment.gravity*q.m/(p.m*Math.pow(0.01+rad,0.5)));
        velDelta.multiplyScalar(delta);
        vx = ppvx+velDelta.x;
        vy = ppvy+velDelta.y;
        vz = ppvz+velDelta.z;
    }

    // limiting speed:
    var vel = V3(vx+environment.heat*(0.5-Math.random()),vy+environment.heat*(0.5-Math.random()),vz+environment.heat*(0.5-Math.random()));
    var speed = vel.length();

    if (speed > c){
        vel.multiplyScalar(c/(speed+1));
    }

    return vel;
}

export class Worm {
    constructor() {
        this.segHeight = 0.5;
        this.segLength = 0.5;

        this.rings = segments + 1;

        this.skel = [];
        for (let i=0; i<this.rings; i++) {
            this.skel.push({
                position: V3(0, i * this.segLength, 0),
                direction: V3(0,1,0),
                velocity: V3(0, 0, 0),
                m: 45,
                k: 10,
                b: 30,
            });
        }

        this.skel[0].velocity = V3(0.2, -0.3, 0);

        this.wormMesh = wormMesh();
        this.clock = new THREE.Clock();
    }

    update() {
        const timeDelta = this.clock.getDelta();

        const rotateXY = function(point, center, angle) {
            return point.clone().add(
                center.clone().negate()
                ).applyAxisAngle(V3(0,0,1), angle).add(
                    center
                    );
        }
        const midPoint = function(p1, p2) {
            return p1.clone().lerp(p2, 0.5);
        }

        const v = this.wormMesh.geometry.vertices;
        const setVertex = function(i, vert) {
            v[i].fromArray( vert.toArray() );
        }

        // Update Head (special case):
        if (this.skel[0].position.y > -3) {
            this.skel[0].position.add( this.skel[0].velocity.clone().multiplyScalar(timeDelta) );
            this.skel[0].direction.applyAxisAngle(V3(0,0,1), rad(timeDelta * 6));
        } else {
            this.skel[0].velocity = V3(0,0,0);
        }

        // Update rest of skeleton:
        for (let ring = 1; ring < this.rings; ring++) {
            const targetIndex = ring - 1;
            assert(targetIndex >= 0);
            const targetRing = this.skel[targetIndex];

            const targetEndPos = targetRing.position.clone().add(
                targetRing.direction.clone().setLength(
                    this.segLength
                    )
                );

            const alice = this.skel[ring];
            const bob = {
                position: targetEndPos,
                velocity: targetRing.velocity.clone(),
                m: targetRing.m,
                k: targetRing.k,
                b: targetRing.b,
            };

            alice.velocity = updateVelocity(alice, bob, timeDelta);
            alice.position = updatePosition(alice, bob, timeDelta);

            const angleDiff = this.skel[ring].direction.angleTo(
                this.skel[targetIndex].direction
                );

            const moveAngle = angleDiff/2; // Math.pow(angleDiff, 10);

            this.skel[ring].direction.applyAxisAngle(V3(0,0,1), angleDiff);
        }

        for (let ring=0; ring<this.rings; ring++) {
            const skel = this.skel[ring];
            const needle = V3(0, 0, this.segHeight);
            for (let j = 0; j < slices; j++) {
                const vert = needle.clone().add( skel.position );
                setVertex(ring*slices + j, vert);
                needle.applyAxisAngle(skel.direction, rad(360/slices));
            }
        }

        this.wormMesh.geometry.computeFaceNormals();
        this.wormMesh.geometry.verticesNeedUpdate = true;
    }
}
