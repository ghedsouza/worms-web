import $ from '../node_modules/jquery/dist/jquery.js';
import * as THREE from '../node_modules/three/build/three.js';

import {
    assert,
    deg,
    F3,
    letter_index,
    midPoint,
    rad,
    stopOnNan,
    time,
    V2,
    V3,
    V3toString,
} from './utils';
import * as colors from './colors';
import * as spring from './physics/spring';


const Zaxis = V3(0,0,1);


const intersect = function(x1, y1, x2, y2, x3, y3, x4, y4) {
    // https://en.wikipedia.org/wiki/Line–line_intersection#Given_two_points_on_each_line
    const xNum = (
        (x1*y2 - y1*x2)*(x3-x4) - (x1-x2)*(x3*y4 - y3*x4)
        );
    const xDen = (
        (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4)
        );
    const yNum = (
        (x1*y2 - y1*x2)*(y3-y4) - (y1-y2)*(x3*y4 - y3*x4)
        );
    const yDen = (
        (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4)
        );
    if (xDen === 0) {
        return undefined;
    }

    return V3(xNum/xDen, yNum/yDen, 0);
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
};

// Assume point and center are on the XY plane
// Rotate point around center on the XY plane
const rotateXY = function(point, center, angle) {
    return point.clone().add(
        center.clone().negate()
        ).applyAxisAngle(V3(0,0,1), angle).add(
            center
            );
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

    const wormMaterial = new THREE.MeshLambertMaterial({
        color: colors.silver,
        specular: 0x05aa05,
        shininess: 100,
        shading: THREE.SmoothShading,
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

        this.target = V3(3, -3, 0);

        this.segments = 8;
        this.rings = this.segments + 1;
        this.slices = 36;

        this.segHeight = 0.4;
        this.segLength = 2/this.segments;

        this.wormMesh = wormMesh(this.segments, this.slices);

        this.skeleton = [];

        class Ring {
            constructor(worm, index, position) {
                this.worm = worm;
                this.index = index;
                this.position = position;
                this.velocity = V3(0,0,0);

                // speed settings:
                this.speed = 0.5;
                this.turnSpeed = 360/10;
                // spring constant settings:
                this.m = 5;
                this.k = 200;
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

            clampedRotation(angle, timeDelta) {
                return THREE.Math.clamp(
                    angle,
                    -rad(this.turnSpeed * timeDelta),
                    rad(this.turnSpeed * timeDelta)
                    );
            }

            rotateTowards(target, timeDelta) {
                assert(this.index < (this.worm.skeleton.length -2));

                const ring = this;
                const prevRing = this.worm.skeleton[this.index + 1];

                const direction = ring.backDirection().negate();
                const idealDirection = target.clone().sub(prevRing.position);

                const angle = axisAngle(direction, idealDirection, Zaxis);

                const fulcrum = prevRing.position;

                for (let i=this.index; i >= 0; i--) {
                    const ringToRotate = this.worm.skeleton[i];
                    const newPosition = rotateXY(
                        ringToRotate.position,
                        fulcrum,
                        ringToRotate.clampedRotation(angle, timeDelta)
                    );
                    ringToRotate.position = newPosition;
                }
                return angle;
            }

            currentBend() {
                assert(this.index < (this.worm.skeleton.length -2));

                const ring = this;
                const prevRing = this.worm.skeleton[this.index + 1];

                const angle = axisAngle(
                    ring.backDirection().negate(),
                    prevRing.backDirection(),
                    Zaxis
                    );
                return Math.abs(angle);
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

    checkTarget() {
        let reached = false;

        const headRay = new THREE.Ray(
            this.skeleton[1].position.clone(),
            this.skeleton[0].backDirection().negate().normalize()
            );
        const closest = headRay.closestPointToPoint(this.target);
        // console.log("Distance: " + closest.distanceTo(this.skeleton[1].position));
        if (closest.distanceTo(this.skeleton[1].position) <= this.segLength) {
            if (this.target.distanceTo(closest) < 0.1) {
                reached = true;
            }
        }

        if (reached || this.skeleton[0].position.distanceTo(this.target) < 0.1) {
            this.target = V3(
                -3 + (Math.random() * 6),
                -3 + (Math.random() * 6),
                0
                )
            // console.log("Target found! Next target: " + V3toString(this.target));
        }
    }

    // Update vertices based on ring positions:
    updateVertices() {
        const scaledTime = this.clock.elapsedTime * 2;

        const setVertex = (function(i, vertex) {
            const vertices = this.wormMesh.geometry.vertices;
            vertices[i].fromArray(vertex.toArray());
        }).bind(this);

        for (let ringIndex = 0; ringIndex < this.skeleton.length; ringIndex++) {
            const sinX = scaledTime + ringIndex * Math.PI / 2;
            const ring = this.skeleton[ringIndex];

            let needle = ring.position.clone().add(V3(
                0,
                0,
                this.segHeight * (ringIndex == 0 ? 0.8 : 1) + (Math.sin(sinX) * 0.02)
                ));

            for (let j = 0; j < this.slices; j++) {
                const vertex = needle.clone();

                setVertex(ringIndex*this.slices + j, vertex);

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

        this.checkTarget();
        const wormTarget = this.target;

        const prevHeadPosition = this.skeleton[0].position.clone();

        // Rotate segments towards target
        let didBend = false;
        let completelyBent = true;

        for (let ringIndex = 0; ringIndex < this.skeleton.length-2; ringIndex++) {
            const ring = this.skeleton[ringIndex];
            const maxed = deg(ring.currentBend()) < 160;
            completelyBent = completelyBent && maxed;
            if (!didBend && !maxed) {
                const angle = ring.rotateTowards(wormTarget, timeDelta);
                if (true) {
                    didBend = true;
                    // console.log("Bent at " + ringIndex + ", " + angle);
                }
            }
        }
        if (completelyBent)
        {
            const segment0 = this.skeleton[0].backDirection();
            const segment1 = this.skeleton[1].backDirection();

            const perp0 = V3(-segment0.y, segment0.x, 0);
            const perp1 = V3(-segment1.y, segment1.x, 0);

            const mid0 = midPoint(this.skeleton[0].position, this.skeleton[1].position);
            const mid1 = midPoint(this.skeleton[1].position, this.skeleton[2].position);

            const mid0_2 = mid0.clone().add(perp0);
            const mid1_2 = mid1.clone().add(perp1);

            const fulcrum = intersect(
                mid0.x, mid0.y,
                mid0_2.x, mid0_2.y,
                mid1.x, mid1.y,
                mid1_2.x, mid1_2.y
                );
            const forwardsAngle = axisAngle(
                fulcrum.clone().sub(this.skeleton[1].position),
                fulcrum.clone().sub(this.skeleton[0].position),
                Zaxis
                )
            if (fulcrum) {
                const radius = (fulcrum.clone().sub(this.skeleton[0].position).length());
                // assert(radius > 2);
                // assert(radius < 3);

                // console.log("Rotate: " +  radius);

                for (let ringIndex = 0; ringIndex < this.skeleton.length; ringIndex++)
                {
                    this.skeleton[ringIndex].position = rotateXY(
                        this.skeleton[ringIndex].position,
                        fulcrum,
                        Math.sign(forwardsAngle) * rad(this.skeleton[0].turnSpeed * timeDelta)
                        );
                }
            }
        }


        // if (!didBend) {
        //     let straightened = false;
        //     for (let ringIndex = this.skeleton.length-1; ringIndex >= 3; ringIndex--) {
        //         const ring = this.skeleton[ringIndex];
        //         const nextRing = this.skeleton[ringIndex - 1];
        //         const nextNextRing = this.skeleton[ringIndex - 2];

        //         const direction = nextRing.backDirection();
        //         const idealDirection = nextNextRing.backDirection();

        //         const angle = axisAngle(direction, idealDirection, Zaxis);
        //         const toTurn = ring.clampedRotation(angle, timeDelta);
        //         const newPosition = rotateXY(
        //             ring.position,
        //             nextRing.position,
        //             ring.clampedRotation(angle, timeDelta)
        //             );
        //         let check = true;
        //         if (ringIndex < this.skeleton.length - 1) {
        //             if (deg(nextRing.currentBend()) < 150) {
        //                 check = false;
        //             }
        //         }
        //         console.log(`st ${ringIndex}: angle: ${angle} (${V3toString(direction)}, ${V3toString(idealDirection)})`);
        //         if (check && !straightened && Math.abs(deg(angle)) > 0) {
        //             straightened = true;
        //             ring.position = newPosition;
        //             console.log("Straigtened at " + ringIndex + ", : " + Math.abs(deg(angle)));
        //         }
        //     }
        // }

        // Move head forward
        const head = this.skeleton[0];
        const direction = head.backDirection().negate();

        head.velocity = direction.setLength(head.speed * timeDelta);

        const newHeadPosition = head.position.clone().add(head.velocity);
        if (newHeadPosition.distanceTo(wormTarget) < head.position.distanceTo(wormTarget)) {
            head.position = newHeadPosition;
            // console.log("Moving head to " + V3toString(newHeadPosition));
        } else {
            // console.log("Stuck");
        }

        head.velocity = head.position.clone().sub(prevHeadPosition);

        // Correct positions of other rings
        for (let ringIndex = 1; ringIndex < this.skeleton.length; ringIndex++) {
            const ring = this.skeleton[ringIndex];
            const nextRing = this.skeleton[ringIndex - 1];

            const idealPositionVector = nextRing.backDirection().setLength(
                this.segLength
                );
            const idealPosition = nextRing.position.clone().add(
                idealPositionVector
                );

            ring.position = idealPosition;

            // const bob = {
            //     position: idealPosition,
            //     velocity: nextRing.velocity.clone(),
            //     m: nextRing.m,
            //     k: nextRing.k,
            //     b: nextRing.b,
            // };
            // ring.velocity = this.springModel.updateVelocity(
            //     ring, bob, timeDelta
            //     )
            // ring.position = this.springModel.updatePosition(
            //     ring, bob, timeDelta
            //     )

        }

        this.updateVertices();
    }
}
