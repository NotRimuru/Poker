import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

import * as DATA from './data.mjs';

function createCard( suit, rank, name ) {

    const card = new THREE.Mesh( new THREE.BoxGeometry( 0.5, 0.75, 0.01 ), new THREE.MeshStandardMaterial({ color: 0xEEEEEE }) );
    card.name = name;
    DATA.scene.add( card );

    if( suit == "" || rank == "" ) return;

    const fontLoader = new FontLoader();

    let geometryParams = {
        size: 0.18,
        depth: 0.01,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.001,
        bevelSize: 0.001,
        bevelOffset: 0,
        bevelSegments: 5
    };

    fontLoader.load( 'assets/fonts/text.json', ( font ) => {

        geometryParams.font = font;
        const geometry = new TextGeometry( `${ DATA.ranks[ rank ] }`, geometryParams );
        const material = new THREE.MeshBasicMaterial({ color: 0x222222 });
        const mesh = new THREE.Mesh( geometry, material );

        const box3 = new THREE.Box3().setFromObject( mesh );
        const width = box3.max.x - box3.min.x;

        const offset = rank == 'Ten' ? -0.16 : -width / 2 - 0.015;
        mesh.position.set( offset, 0.1, 0 );

        card.add( mesh );

    } );

    fontLoader.load( 'assets/fonts/emoji.json', ( font ) => {

        geometryParams.font = font;
        const geometry = new TextGeometry( `${ DATA.suits[ suit ] }`, geometryParams );
        const material = new THREE.MeshBasicMaterial({ color: DATA.colors[ suit ] });
        const mesh = new THREE.Mesh( geometry, material );

        mesh.position.set( -0.165, -0.25, 0 );

        card.add( mesh );

    } );
}


export async function tableCards() {

    const cardSprite = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }) );
    cardSprite.name = 'card_sprite';
    cardSprite.position.set( -0.38, 1.6, -0.375 );
    DATA.scene.add( cardSprite );

    const body = { key: DATA.player.key };
    const data = await DATA.handleData( 'get_table', body );

    for( let i = 0; i < 10; i++ ) {
        const number = i % 5;
        const cardData = data[ 'revealed_cards' ][ number ];
        
        const type = i < 5 ? 'mesh' : 'sprite';

        if( cardData == null ) createCard( "", "", `${ type }_table_card_${ number }` );
        else createCard( cardData.color, cardData.rank, `${ type }_table_card_${ number }` );

        const card = DATA.scene.getObjectByName( `${ type }_table_card_${ number }` );
        
        const box3 = new THREE.Box3().setFromObject( card );
        const width = box3.max.x - box3.min.x; 
        const gap = 0.3;

        if( i < 5 ) {
            const rotation = cardData == null ? 0.5 : -0.5;

            card.rotation.set( Math.PI * rotation, 0, 0 );
            card.position.set( ( -( ( width + gap ) * 5 ) / 2 ) + ( width + gap ) * number, 0.927, 0 );
            
            continue;
        }

        cardSprite.add( card );

        const rotation = cardData == null ? 1 : 0;
            
        card.rotation.set( Math.PI * rotation, 0, 0 );
        card.position.set( ( -( ( width + gap ) * 5 ) / 2 ) + ( width + gap ) * number + 0.375, 0, 0 );
    }

    cardSprite.lookAt( DATA.player.camera.position );
}

export function deleteTableCards() {
    for( let i = 0; i < 5; i++ ) {
        const card = DATA.scene.getObjectByName( `mesh_table_card_${ i }` );

        if( card == undefined ) continue;

        card.removeFromParent();
    }
    for( let i = 0; i < 5; i++ ) {
        const card = DATA.scene.getObjectByName( `sprite_table_card_${ i }` );

        if( card == undefined ) continue;

        card.removeFromParent();
    }
}
  
export function foldCards( id ) {
    for( let i = 0; i < 2; i++ ) {
        const card = DATA.scene.getObjectByName( `player_card_${ id }_${ i }` );
        card.translateY( -0.5 );

        card.rotation.set( 0, 0, ( Math.random() * 1 ) - 0.5 );
    }
}

export async function playerCards( id ) {
    const body = { key: DATA.player.key };
    const data = await DATA.handleData( 'get_table', body );

    const group = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }) )
    group.name = `player_cards_${ id }`;
    group.position.set( DATA.playerTransform[ id ][ 0 ] , 0.927, DATA.playerTransform[ id ][ 2 ] );

    for( let i = 0; i < 2; i++ ) {
        const cardData = data[ 'players' ][ DATA.player.id ][ "cards" ][ i ];

        const color = cardData == null ? "" : cardData.color;
        const rank = cardData == null ? "" : cardData.rank;
        createCard( color, rank, `player_card_${ id }_${ i }` );
        const card = DATA.scene.getObjectByName( `player_card_${ id }_${ i }` );
        
        const box3 = new THREE.Box3().setFromObject( card );
        const width = box3.max.x - box3.min.x; 
        const gap = 0.6;

        card.position.set( DATA.playerTransform[ id ][ 0 ] - ( width + ( gap / 2 ) ) + ( width + gap * i ), 0.927, DATA.playerTransform[ id ][ 2 ] );
        
        group.attach( card );
    }

    group.rotation.set( 0, DATA.playerTransform[ id ][ 3 ] * 3.2, 0 );
    group.rotateX( Math.PI * 0.5 );
    group.translateY( -1 );
    
    DATA.scene.add( group );

    if( data[ 'players' ][ id ][ 'has_folded' ] ) foldCards( id );
}

export function rotateCards( revealed ) {
    if( DATA.player.status == 'fold' ) return;

    for( let i = 0; i < 2; i++ ) {
        const card = DATA.scene.getObjectByName( `player_card_${ DATA.player.id }_${ i }` );

        if( card == undefined ) return;

        const rotation = revealed ? -1 : 1
        card.rotateX( Math.PI * rotation );
    }
}

export function createBestHand( hand, y ) {
    const group = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }) );
    group.name = 'winning_hand_cards';

    group.position.set( 0, y, 0 )

    for( let i = 0; i < hand.length; i++ ) {
        createCard( hand[ i ].color, hand[ i ].rank, `winning_hand_card_${ i }` );
        const card = DATA.scene.getObjectByName( `winning_hand_card_${ i }` );

        const box3 = new THREE.Box3().setFromObject( card );
        const width = box3.max.x - box3.min.x; 
        const gap = 0.6;

        group.add( card );
        card.position.set( -( width + ( gap / 2 ) ) + ( width + gap * i ), 0, 0 );
    }

    group.lookAt( DATA.player.camera.position );

    DATA.scene.add( group );
}