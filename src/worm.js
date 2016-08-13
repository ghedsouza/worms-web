import $ from '../node_modules/jquery/dist/jquery.js';
import * as THREE from '../node_modules/three/build/three.js';

import {
    rad,
    assert,
    letter_index,
    V3,
    V2,
    time,
} from './utils';
import * as colors from './colors';



export const wormTest = function() {
    const tubeGeom = new THREE.CylinderGeometry(0.25, 0.25, 1, 8, 1);

    const tubeMaterial = new THREE.MeshPhongMaterial({ color: colors.silver });
    const meshFaceMaterial = new THREE.MeshFaceMaterial( [ tubeMaterial ] );

    tubeGeom.computeFaceNormals();
    for (const face in tubeGeom.faces ) {
        tubeGeom.faces[face].materialIndex = 0;
    }
    const mesh = new THREE.Mesh(tubeGeom, meshFaceMaterial);

    return mesh;
};



export class Worm {
    constructor() {
        this.timeZero = time();
        this.lastUpdate = 0;

        this.currentWayPoint = V2(0,0);
        this.nextWayPoint = V2(2,2);

        this.currentPosition = this.currentWayPoint;

        this.wormMesh = wormTest();
        this.wormMesh.position.set(
            this.currentPosition.x,
            this.currentPosition.y,
            0
            );
    }

    time() {
        return (time() - this.timeZero);
    }

    update() {
        const timeDelta = this.time() - this.lastUpdate;
        const speed = 0.2;

        const distanceLeft = this.currentPosition.distanceTo(this.nextWayPoint);

        const distanceToTravel = Math.min(speed * timeDelta, distanceLeft);

        const ratio = distanceLeft > 0 ?
            distanceToTravel/distanceLeft : 1;

        if (distanceLeft < 0.1) {
            this.currentWayPoint = this.nextWayPoint;
            this.nextWayPoint = V2(-4 + Math.random()*8, -4 + Math.random()*8);
            return;
        }

        const newPosition = this.currentPosition.clone().lerp(
            this.nextWayPoint,
            ratio
            );
        this.currentPosition = newPosition;

        const v = this.nextWayPoint.clone().sub(this.currentWayPoint);
        const vPerp = V2(-v.y, v.x).clone().normalize();

        const currentDistance = this.currentWayPoint.distanceTo(this.currentPosition);
        const totalDistance = this.currentWayPoint.distanceTo(this.nextWayPoint);
        const xRatio = currentDistance/totalDistance;
        const sinX = xRatio * (2*Math.PI);

        const fPos = this.currentPosition.clone().addScaledVector(
            vPerp,
            Math.sin(sinX)
            );

        this.wormMesh.position.set(
            fPos.x,
            fPos.y,
            0
            );
        this.wormMesh.rotation.z = v.angle() + rad(90) + (V2(1, Math.cos(sinX)).angle());
        // debugger;

        console.log(", timeDelta: " + timeDelta +
            ", scale: " + speed +
            ", distanceLeft: " + distanceLeft +
            ", distanceToTravel: " + distanceToTravel +
            ", ratio: " + ratio +
            ", newPosition: " + newPosition,
            ", fPos: " + fPos.x + ", " + fPos.y
            );

        $("#debug2").html(
            "worm: " +
            "<br>, timeDelta: " + timeDelta +
            "<br>, scale: " + speed +
            "<br>, distanceLeft: " + distanceLeft +
            "<br>, distanceToTravel: " + distanceToTravel +
            "<br>, ratio: " + ratio +
            "<br>, newPosition: " + newPosition +
            ""
            );


        this.lastUpdate = this.time();
    }
}
