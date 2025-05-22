//three js imports
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

//js files imports
import { rotateCamera } from '/js/keyboard.mjs';
import * as DATA from '/js/data.mjs';
import * as CARDS from '/js/cards.mjs';
import * as MENU from '/js/menu.mjs';
import { refreshPot } from './js/table.mjs';
 
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

window.onresize = () => {
    DATA.player.camera.aspect = window.innerWidth / window.innerHeight;
    DATA.player.camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

const light = new THREE.HemisphereLight( 0xffffff, 0x444444, 4 );
light.position.set( 0, 4, 0 );
DATA.scene.add( light );

const gltfLoader = new GLTFLoader();

gltfLoader.load( 'assets/models/table.glb', ( gltf ) => {
    const table = gltf.scene;

    table.rotateY( Math.PI * 0.5 );
    table.scale.set( 3, 3, 3 );

    table.position.set( 0, 0.5, 0 );
    table.name = 'table';

    DATA.scene.add( table );
} );

for( let i = 0; i < DATA.playerTransform.length; i++ ) {
    gltfLoader.load( 'assets/models/chair.glb', ( gltf ) => {
        const chair = gltf.scene;
    
        chair.rotateY( Math.PI + ( Math.PI * DATA.playerTransform[ i ][ 3 ] ) );
        chair.scale.set( 0.5, 0.5, 0.5 );
        chair.position.set( DATA.playerTransform[ i ][ 0 ], 0, DATA.playerTransform[ i ][ 2 ] );
    
        DATA.scene.add( chair );
    } );
}

let keyboard = {};
window.onkeydown = ( e ) => {
    const key = e.key.toLowerCase();

    if( key == ' ' && !keyboard[ key ] ) CARDS.rotateCards( true );

    keyboard[ key ] = true;
}

window.onkeyup = ( e ) => {
    const key = e.key.toLowerCase();

    if( key == ' ' && keyboard[ key ] ) CARDS.rotateCards( false );

    keyboard[ key ] = false;
}

async function startGame() {

    if( !localStorage.getItem( 'name' ) ) {
        const name = prompt( 'Podaj imie: ', );
        localStorage.setItem( 'name', name );
    }

    let key = localStorage.getItem( 'key' );
    const table = await DATA.handleData( 'find', { key: key } );
    console.log( table[ 'table' ] )
    if( table[ 'table' ] == -1 ) {
        key = await DATA.handleData( 'join', { name: localStorage.getItem( 'name' ), table: 0 } );

        if( key == "Failed" ) {
            key = await DATA.handleData( 'create', { name: localStorage.getItem( 'name' ) } );
        }
        localStorage.setItem( 'key', key );
    }

    DATA.player.setKey( key );

    const start = document.getElementById( 'start' );
    start.addEventListener( 'click', async () => {
        start.style.display = 'none';

        await DATA.handleData( 'start', { key: key } );
        location.reload();
    } );

    const data = await DATA.handleData( 'get_table', { key: key } );
    DATA.player.id = data[ 'player' ];

    // DATA.player.setId( 0 );

    console.log( data );

    DATA.player.camera.position.set( DATA.playerTransform[ DATA.player.id ][ 0 ], DATA.playerTransform[ DATA.player.id ][ 1 ], DATA.playerTransform[ DATA.player.id ][ 2 ] );
    DATA.player.camera.rotation.set( 0, DATA.playerTransform[ DATA.player.id ][ 3 ] * 3.2, 0 );

    //spawn table cards
    CARDS.tableCards();

    //spawn player cards
    for( let i = 0; i < data.players.length; i++ ) {
        if( data.players[ i ] == null ) break;

        CARDS.playerCards( i );
    }

    //show pot
    refreshPot( data.pot );

    //prepare ui
    MENU.prepareMenu();
}

startGame();

const clock = new THREE.Clock();
let delta;

function animate() {

    delta = clock.getDelta();

    rotateCamera( keyboard, delta );
    
    renderer.render( DATA.scene, DATA.player.camera );
}

renderer.setAnimationLoop( animate );   