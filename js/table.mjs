import * as THREE from "three";
import { handleData, player, scene } from "./data.mjs";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js"

export function createTableSprite( value, name, y, showName ) {
    let geometry = new THREE.PlaneGeometry( 2, 0.5 );
    let material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }); 
    const sprite = new THREE.Mesh( geometry, material );
    sprite.name = name;

    sprite.position.set( 0, y, 0 );

    const fontLoader = new FontLoader();

    fontLoader.load( 'assets/fonts/text.json', ( font ) => {
        const text = showName == true ? `${ name[ 0 ].toUpperCase() + name.slice( 1 ) }: ${ value }` : value;

        geometry = new TextGeometry( text,
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
        const textMesh = new THREE.Mesh( geometry, material );

        sprite.add( textMesh );

        const boundingBox = new THREE.Box3().setFromObject( textMesh );
        const width = boundingBox.max.x - boundingBox.min.x;
        textMesh.position.set( ( -width / 2 ) - 0.08 , -0.07, 0 )
    } );

    sprite.lookAt( player.camera.position );
    scene.add( sprite );
}

export function removeTableSprite( name ) {
    const sprite = scene.getObjectByName( name );
    sprite.removeFromParent();
}