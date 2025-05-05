import * as THREE from 'three';

const rotationHelper = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), new THREE.MeshBasicMaterial( { opacity: 0, transparent: true } ) );

export function rotateCamera( scene, camera, delta, keyboard ) {
    rotationHelper.position.set( camera.position.x, camera.position.y, camera.position.z );

    rotationHelper.attach( camera );

    
    if( keyboard[ "arrowup" ] && camera.rotation.x < Math.PI * 0.25 ) camera.rotateX( Math.PI * 0.3 * delta );
    if( keyboard[ "arrowdown" ] && camera.rotation.x > -Math.PI * 0.25 ) camera.rotateX( Math.PI * -0.3 * delta );

    if( keyboard[ "arrowleft" ] && rotationHelper.rotation.y < Math.PI * 0.4 ) rotationHelper.rotateY( Math.PI * 0.3 * delta );
    if( keyboard[ "arrowright" ] && rotationHelper.rotation.y > -Math.PI * 0.4 ) rotationHelper.rotateY( Math.PI * -0.3 * delta );

    scene.attach( camera );

}