import * as THREE from 'three';
import { player, scene, playerTransform } from './data.mjs'; 

const rotationHelper = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), new THREE.MeshBasicMaterial( { opacity: 0, transparent: true } ) );

export function rotateCamera( keyboard, delta ) {
    rotationHelper.position.set( player.camera.position.x, player.camera.position.y, player.camera.position.z );

    rotationHelper.attach( player.camera );

    if( player.id > 2 && player.id < 7 ) {
        if( player.camera.rotation.x >= Math.PI - Math.PI * 0.25 || player.camera.rotation.x <= -Math.PI + Math.PI * 0.25 ) {
            

            if( keyboard[ "arrowup" ] || keyboard[ "w" ] ) player.camera.rotateX( Math.PI * 0.3 * delta );
            if( keyboard[ "arrowdown" ] || keyboard[ "s" ] ) player.camera.rotateX( Math.PI * -0.3 * delta );
        }

        if( player.camera.rotation.x < Math.PI - Math.PI * 0.25 && player.camera.rotation.x > Math.PI - Math.PI * 0.3 ) player.camera.rotateX( Math.PI * -0.3 * delta );
        if( player.camera.rotation.x > -Math.PI + Math.PI * 0.25 && player.camera.rotation.x < -Math.PI + Math.PI * 0.3 ) player.camera.rotateX( Math.PI * 0.3 * delta );
    }
    else {
        if( ( keyboard[ "arrowup" ] || keyboard[ "w" ] ) || player.camera.rotation.x <= -Math.PI * 0.25 ) player.camera.rotateX( Math.PI * 0.3 * delta );
        if( ( keyboard[ "arrowdown" ] || keyboard[ "s" ]  ) || player.camera.rotation.x >= Math.PI * 0.25 ) player.camera.rotateX( Math.PI * -0.3 * delta );
    }

    if( player.id == 7 || player.id == 2 ) {
        if( ( keyboard[ "arrowleft" ] || keyboard[ "a" ] ) && rotationHelper.rotation.y < playerTransform[ player.id ][ 3 ] + Math.PI * 0.4 ) rotationHelper.rotateY( Math.PI * 0.3 * delta );
        if( ( keyboard[ "arrowright" ] || keyboard[ "d" ] ) && rotationHelper.rotation.y > playerTransform[ player.id ][ 3 ] - Math.PI * 0.4 ) rotationHelper.rotateY( Math.PI * -0.3 * delta );
    }
    else if( player.id == 6 || player.id == 3 ) {
        if( ( keyboard[ "arrowleft" ] || keyboard[ "a" ] ) && rotationHelper.rotation.y < 1.5 ) rotationHelper.rotateY( Math.PI * 0.3 * delta );
        if( ( keyboard[ "arrowright" ] || keyboard[ "d" ] ) && rotationHelper.rotation.y > -1.5 ) rotationHelper.rotateY( Math.PI * -0.3 * delta );
    }
    else {
        if( ( keyboard[ "arrowleft" ] || keyboard[ "a" ] ) && rotationHelper.rotation.y < Math.PI * 0.4 ) rotationHelper.rotateY( Math.PI * 0.3 * delta );
        if( ( keyboard[ "arrowright" ] || keyboard[ "d" ] ) && rotationHelper.rotation.y > -Math.PI * 0.4 ) rotationHelper.rotateY( Math.PI * -0.3 * delta );
    }
    
    // if( keyboard[ "arrowup" ] || keyboard[ "w" ] ) player.camera.rotateX( Math.PI * 0.3 * delta );
    // if( keyboard[ "arrowdown" ] || keyboard[ "s" ]) player.camera.rotateX( Math.PI * -0.3 * delta );

    // if( keyboard[ "arrowleft" ] || keyboard[ "a" ] ) rotationHelper.rotateY( Math.PI * 0.3 * delta );
    // if( keyboard[ "arrowright" ] || keyboard[ "d" ] ) rotationHelper.rotateY( Math.PI * -0.3 * delta );

    scene.attach( player.camera );
}