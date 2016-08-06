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
        this.nextWayPoint = V2(5,5);
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
        const speed = 0.1;

        const distanceLeft = this.currentPosition.distanceTo(this.nextWayPoint);

        const distanceToTravel = Math.min(distanceLeft, timeDelta * speed);

        const ratio = distanceLeft > 0 ?
            distanceToTravel/distanceLeft : 1;

        if (distanceLeft < 0.1 || this.time() > 5) {
            return;
        }

        const newPosition = this.currentPosition.lerp(
            this.nextWayPoint,
            ratio
            );


        console.log(", timeDelta: " + timeDelta +
            ", scale: " + speed +
            ", distanceLeft: " + distanceLeft +
            ", distanceToTravel: " + distanceToTravel +
            ", ratio: " + ratio +
            ", newPosition: " + newPosition);

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

        this.currentPosition = newPosition;

        this.wormMesh.position.set(
            this.currentPosition.x,
            this.currentPosition.y,
            0
            );
        this.lastUpdate = this.time();
    }
}
