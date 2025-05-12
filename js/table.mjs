import * as THREE from "three";
import { handleData, player, scene } from "./data.mjs";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

export async function pot() {
    const data = await handleData( 'get_table', { key: player.key } );
    
    let geometry = new THREE.PlaneGeometry( 2, 0.5 );
    let material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }); 
    const sprite = new THREE.Mesh( geometry, material );

    sprite.position.set( 0, 2.5, 0 );

    const fontLoader = new FontLoader();

    fontLoader.load( 'assets/fonts/text.json', ( font ) => {
        geometry = new TextGeometry( `pot: ${ data.pot }`,
            { 
                size: 0.18,
                depth: 0.01,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.001,
                bevelSize: 0.001,
                bevelOffset: 0,
                bevelSegments: 5,
                font: font
            } 
        );
        material = new THREE.MeshBasicMaterial({ color: 0x999999 });
        const text = new THREE.Mesh( geometry, material );

        sprite.add( text );

        const boundingBox = new THREE.Box3().setFromObject( text );
        const width = boundingBox.max.x - boundingBox.min.x;
        text.position.set( ( -width / 2 ) - 0.08 , -0.07, 0 )
    } );

    sprite.lookAt( player.camera.position );
    scene.add( sprite );
}

