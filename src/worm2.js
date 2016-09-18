import $ from '../node_modules/jquery/dist/jquery.js';
import * as THREE from '../node_modules/three/build/three.js';

import {
    rad,
    deg,
    assert,
    letter_index,
    F3,
    V3,
    V2,
    time,
} from './utils';
import * as colors from './colors';
import * as spring from './physics/spring';


//******************************
// Helper functions
//******************************

function stopOnNaN(value) {
    if (isNaN(value)) {
        debugger;
    }
}

// Calculate how many radians `v` would have to rotate towards `target` along
// `axis` so that it would be coincident with `target`.
//
// Given Vector3 a, b, z, and angle = axisAngle(a, b, z),
// a.applyAxisAngle(z, angle).normalize() == b.normalize()
const axisAngle = function(v, target, axis) {
    const angle = v.angleTo(target);
    const positive = v.clone().applyAxisAngle(axis, angle);
    const negative = v.clone().applyAxisAngle(axis, -angle);
    if (positive.distanceTo(target) < negative.distanceTo(target)) {
        return angle;
    } else {
        return -angle;
    }
}

// Assume point and center are on the XY plane
// Rotate point around center on the XY plane
const rotateXY = function(point, center, angle) {
    return point.clone().add(
        center.clone().negate()
        ).applyAxisAngle(V3(0,0,1), angle).add(
            center
            );
}

const midPoint = function(p1, p2) {
    return p1.clone().lerp(p2, 0.5);
};


//******************************
// Worm model
//******************************

export const wormGeom = function(segments, slices) {
    const geom = new THREE.Geometry();

    // Vertex locations (dynamic)
    // These will get updated as the worm moves.
    for (let i = 0; i < (segments+1); i++) {
        for (let j = 0; j < slices; j++) {
            geom.vertices.push(V3());
        }
    }

    // Face definitions (fixed)
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
            geom.faces.push(F3(start, start+i+1, start+i));
        }
    }
    cap(0);
    cap(slices * segments);
    return geom;
}

export const wormMesh = function(segments, slices) {
    const geom = wormGeom(segments, slices);

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


export class Worm {
    constructor() {
        this.clock = new THREE.Clock();

        this.springModel = new spring.SpringModel({
            c: 100,
            maxDistance: 2,
            environment: {
                heat: 0.0,
            },
        });

        this.target = V3(1, -1, 0);

        this.segments = 3;
        this.rings = this.segments + 1;
        this.slices = 12;

        this.segHeight = 0.4;
        this.segLength = 2/this.segments;

        this.wormMesh = wormMesh(this.segments, this.slices);

        this.skeleton = [];

        class Ring {
            constructor(worm, index, position) {
                this.worm = worm;
                this.index = index;
                this.position = position;

                // speed settings:
                this.speed = 0.3;
                this.turnSpeed = 0.5;
                // spring constant settings:
                this.m = 25*(this.index+1);
                this.k = 20;
                this.b = 30;
            }

            backDirection() {
                if (this.index === this.worm.skeleton.length-1) {
                    return this.worm.skeleton[this.index-1].backDirection();
                } else {
                    return this.worm.skeleton[this.index + 1].position.clone().sub(
                        this.position
                        ).normalize();
                }
            }
        }

        for (let i=0; i<this.rings; i++) {
            this.skeleton.push(new Ring(
                this,
                i,
                // Start the skeleton in a straight line.
                V3(0, i * this.segLength, 0)
                )
            );
        }
    }

    // Update vertices based on ring positions:
    updateVertices() {
        const setVertex = (function(i, vertex) {
            const vertices = this.wormMesh.geometry.vertices;
            vertices[i].fromArray(vertex.toArray());
        }).bind(this);

        for (let ringIndex = 0; ringIndex < this.skeleton.length; ringIndex++) {
            const ring = this.skeleton[ringIndex];

            let needle = ring.position.clone().add(V3(0, 0, this.segHeight));

            for (let j = 0; j < this.slices; j++) {
                const vertex = needle.clone();

                setVertex(ringIndex*12 + j, vertex);

                const nextNeedle = needle.clone().sub(ring.position).applyAxisAngle(
                    ring.backDirection(), rad(360/this.slices)
                    ).add(
                        ring.position
                        )
                needle = nextNeedle;
            }
        }
        this.wormMesh.geometry.computeFaceNormals();
        this.wormMesh.geometry.verticesNeedUpdate = true;
    }

    update() {
        const timeDelta = this.clock.getDelta();

        const Zaxis = V3(0,0,1);
        const wormTarget = this.target;

        this.updateVertices();
    }
}
