import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { rotateCamera } from '/js/keyboard.mjs';

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );

window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

const light = new THREE.HemisphereLight( 0xffffff, 0x444444, 4 );
light.position.set( 0, 4, 0 );
scene.add( light );

const gltfLoader = new GLTFLoader();
const fontLoader = new FontLoader();

const ranks = { 
    Two:   2,
    Three: 3,
    Four:  4,
    Five:  5,
    Six:   6,
    Seven: 7,
    Eight: 8,
    Nine:  9,
    Ten:   10,
    Jack:  "J",
    Queen: "Q",
    King:  "K",
    Ace:   "A"
}

const suits = {
    Heart:   "♥︎",
    Diamond: "♦︎",
    Club:    "♣︎",
    Spade:   "♠︎"
}

const colors = {
    Heart: 0x9b1c31, 
    Diamond: 0x9b1c31,
    Club: 0x222222,
    Spade: 0x222222,
}

let keyboard = {};
window.onkeydown = ( e ) => {
    const key = e.key.toLowerCase();

    if( key == " " && !keyboard[ key ] ) rotateCards( true );

    keyboard[ key ] = true;
}

window.onkeyup = ( e ) => {
    const key = e.key.toLowerCase();

    if( key == " " && keyboard[ key ] ) rotateCards( false );

    keyboard[ key ] = false;
}

function rotateCards( revealed ) {
    if( playerStatus == 'fold' ) return;

    for( let i = 0; i < 2; i++ ) {
        const card = scene.getObjectByName( `player_card_${ playerId }_${ i }` );

        if( card == undefined ) return;

        const rotation = revealed ? -1 : 1
        card.rotateX( Math.PI * rotation );
    }
}


gltfLoader.load( 'assets/models/table.glb', ( gltf ) => {
    const table = gltf.scene;

    table.rotateY( Math.PI * 0.5 );
    table.scale.set( 3, 3, 3 );

    table.position.set( 0, 0.5, 0 );
    table.name = 'table';

    scene.add( table );
} );

if( !localStorage.getItem( 'name' ) ) {
    const name = prompt( 'Podaj imie: ', );
    localStorage.setItem( 'name', name );
}

const playerId = 0;
const keyBody = JSON.stringify({ name: localStorage.getItem( 'name' ) });
const key = await handleData( 'join', keyBody );
let playerStatus = 'none';
const playerTransform = [ [ -2.5, 1.7, 3.2, 0 ], [ 2.5, 1.7, 3.2, 0 ], [ 6.5, 1.7, 2.2, 0.25 ], [ 7.2, 1.7, -1.3, -1.37 ], [ 4, 1.7, -3.2, 1 ], [ -4, 1.7, -3.2, 1 ],  [ -7.2, 1.7, -1.3, 1.37 ], [ -6.5, 1.7, 2.2, -0.25 ]  ];
camera.position.set( playerTransform[ playerId ][ 0 ], playerTransform[ playerId ][ 1 ], playerTransform[ playerId ][ 2 ] ); 

for( let i = 0; i < playerTransform.length; i++ ) {
    gltfLoader.load( 'assets/models/chair.glb', ( gltf ) => {
        const chair = gltf.scene;
    
        chair.rotateY( Math.PI + ( Math.PI * playerTransform[ i ][ 3 ] ) );
        chair.scale.set( 0.5, 0.5, 0.5 );
        chair.position.set( playerTransform[ i ][ 0 ], 0, playerTransform[ i ][ 2 ] );
    
        scene.add( chair );
    } );
}

function createCard( suit, rank, name ) {

    const card = new THREE.Mesh( new THREE.BoxGeometry( 0.5, 0.75, 0.01 ), new THREE.MeshStandardMaterial({ color: 0xEEEEEE }) );
    card.name = name;
    scene.add( card );

    if( suit == "" || rank == "" ) return;

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
        const geometry = new TextGeometry( `${ ranks[ rank ] }`, geometryParams );
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
        const geometry = new TextGeometry( `${ suits[ suit ] }`, geometryParams );
        const material = new THREE.MeshBasicMaterial({ color: colors[ suit ] });
        const mesh = new THREE.Mesh( geometry, material );

        mesh.position.set( -0.165, -0.25, 0 );

        card.add( mesh );

    } );
}

async function handleData( location, body ) {
    const myHeaders = new Headers();
    myHeaders.append( "Content-Type", "application/json" );

    try {
        const response = await fetch( `http://localhost:3000/${ location }`, {
            method: 'POST',
            headers: myHeaders,
            body: body
        });

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = location == 'join' ? response.text() : response.json();

        return await result;

    } catch( error ) {
        console.error( "Fetch error:", error.message );
    }
}

async function spawnCards() {

    const cardSprite = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }) );
    cardSprite.name = 'card_sprite';
    cardSprite.position.set( -0.38, 1.6, -0.375 );
    cardSprite.lookAt( camera.position );
    scene.add( cardSprite );

    const body = JSON.stringify({ key: key });
    const data = await handleData( 'get_table', body );

    console.log( data )

    for( let i = 0; i < 10; i++ ) {
        const number = i % 5;
        const cardData = data[ 'revealed_cards' ][ number ];
        
        const type = i < 5 ? 'mesh' : 'sprite';

        if( cardData == null ) createCard( "", "", `${ type }_table_card_${ number }` );
        else createCard( cardData.color, cardData.rank, `${ type }_table_card_${ number }` );

        const card = scene.getObjectByName( `${ type }_table_card_${ number }` );
        
        if( i < 5 ) {

            const rotation = cardData == null ? 0.5 : -0.5;
            
            const box3 = new THREE.Box3().setFromObject( card );
            const width = box3.max.x - box3.min.x; 
            const gap = 0.3;

            card.rotation.set( Math.PI * rotation, 0, 0 );
            card.position.set( ( -( ( width + gap ) * 5 ) / 2 ) + ( width + gap ) * number, 0.927, 0 );
            
            continue;
        }
        cardSprite.add( card );

        const rotation = cardData == null ? 1 : 0;
            
        const box3 = new THREE.Box3().setFromObject( card );
        const width = box3.max.x - box3.min.x; 
        const gap = 0.3;

        card.rotation.set( Math.PI * rotation, 0, 0 );
        card.position.set( ( -( ( width + gap ) * 5 ) / 2 ) + ( width + gap ) * number + 0.375, 0, 0 );
    }

    setTimeout( () => {
        cardSprite.removeFromParent();
    }, 3000 );
}

spawnCards();


async function playerCards() {
    const body = JSON.stringify({ key: key });
    const data = await handleData( 'get_table', body );

    for( let i = 0; i < 2; i++ ) {
        const cardData = data[ 'players' ][ 0 ][ "cards" ][ i ];

        createCard( cardData.color, cardData.rank, `player_card_${ playerId }_${ i }` );
        const card = scene.getObjectByName( `player_card_${ playerId }_${ i }` );
        
        const box3 = new THREE.Box3().setFromObject( card );
        const width = box3.max.x - box3.min.x; 
        const gap = 0.6;

        card.rotation.set( Math.PI * 0.5, playerTransform[ playerId ][ 3 ], 0 );
        card.position.set( playerTransform[ playerId ][ 0 ] - ( width + ( gap / 2 ) ) + ( width + gap * i ), 0.927, playerTransform[ playerId ][ 2 ] );
        card.translateY( -1 );
    }
}

playerCards();

async function prepareMenu() {
    const fold = document.getElementById( 'fold' );
    fold.addEventListener( 'click', handleFold );

    const raise = document.getElementById( 'raise' );
    raise.addEventListener( 'click', handleRaise );

    const body = JSON.stringify({ key: key });
    const data = await handleData( 'get_table', body );

    console.log( data.players )

    const sliderWrapper = document.getElementsByClassName( 'slider' )[ 0 ];
    const slider = sliderWrapper.children[ 0 ];

    console.log( slider )

    slider.min = data.pot + 1;
    slider.max = data.players[ 0 ].chips;
    slider.value = slider.min;

    const output = sliderWrapper.children[ 1 ];
    output.value = slider.min;
}

prepareMenu();

async function handleFold( ) {
    fold.removeEventListener( 'click', handleFold );
    raise.removeEventListener( 'click', handleRaise );

    const body = JSON.stringify({ key: key, action: 'fold' });
    await handleData( 'action', body );

    for( let i = 0; i < 2; i++ ) {
        const card = scene.getObjectByName( `player_card_${ playerId }_${ i }` );
        card.translateY( -0.5 );

        card.rotation.set( Math.PI * 0.5, 0, ( Math.random() * 1 ) - 0.5 );
    }

    const menu = document.getElementById( 'menu' );
    menu.style.opacity = 0.5;

    playerStatus = 'fold';
}
 
async function handleRaise( ) {
    raise.removeEventListener( 'click', handleRaise );
    fold.removeEventListener( 'click', handleFold );

    const slider = document.getElementsByClassName( 'slider' )[ 0 ].children[ 0 ];
    const body = JSON.stringify({ key: key, action: { raise: slider.value } });
    await handleData( 'action', body );

    const menu = document.getElementById( 'menu' );
    menu.style.opacity = 0.5;

    playerStatus = 'raise'
}

const clock = new THREE.Clock();
let delta;

function animate() {

    delta = clock.getDelta();

    rotateCamera( scene, camera, delta, keyboard );
    
    renderer.render( scene, camera );
}

renderer.setAnimationLoop( animate );