//three js imports
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

//js files imports
import { rotateCamera } from './js/keyboard.mjs';
import * as DATA from './js/data.mjs';
import * as CARDS from './js/cards.mjs';
import * as MENU from './js/menu.mjs';
import { createTableSprite } from './js/table.mjs';
 
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

async function startGame( data ) {

    //spawn table cards
    CARDS.tableCards();

    //spawn player cards
    for( let i = 0; i < data.players.length; i++ ) {
        if( data.players[ i ] == null ) break;

        CARDS.playerCards( i );
    }

    //show pot
    createTableSprite( data.pot, 'pot', 2.5, true );

    //show bet
    createTableSprite( data.current_required_bet, 'bet', 3, true );

    //prepare ui
    MENU.prepareMenu();
}

async function waitForTheGame() {
    
    if( !sessionStorage.getItem( 'name' ) ) {
        const name = prompt( 'Name' );
        sessionStorage.setItem( 'name', name );
    }

    let key = localStorage.getItem( 'key' );
    if( key == undefined ) {
        const params = new URLSearchParams( window.location.search );
        const id = parseInt( params.get('id') );

        if( id == undefined ) {
            console.log( 'no id in the url' );
            return;
        }

        key = await DATA.handleData( 'join', { name: sessionStorage.getItem( 'name' ), table: id } );
        localStorage.setItem( 'key', key );
    }
    let data = await DATA.handleData( 'get_table', { key: localStorage.getItem( 'key' ) } );
    if( data == 'Failed' ) {
        const params = new URLSearchParams( window.location.search );
        const id = parseInt( params.get('id') );

        if( id == undefined ) {
            console.log( 'no id in the url' );
            return;
        }

        key = await DATA.handleData( 'join', { name: sessionStorage.getItem( 'name' ), table: id } );

        if( key == "Failed" ) {
            console.log( 'failed to join' );
            return;
        }

        localStorage.setItem( 'key', key );

        data = await DATA.handleData( 'get_table', { key: localStorage.getItem( 'key' ) } );
    }

    DATA.player.setKey( key );
    DATA.player.setId( data[ 'player' ] );

    DATA.player.camera.position.set( DATA.playerTransform[ DATA.player.id ][ 0 ], DATA.playerTransform[ DATA.player.id ][ 1 ], DATA.playerTransform[ DATA.player.id ][ 2 ] );
    DATA.player.camera.rotation.set( 0, DATA.playerTransform[ DATA.player.id ][ 3 ] * 3.2, 0 );

    let latest_player_id = 0;
    for( let i = 0; i < data.max_players; i++ ) {
        if( i == DATA.player.id ) continue;
        if( data[ 'players' ][ i ] == null ) {
            latest_player_id = i - 1;
            break;
        }

        gltfLoader.load( 'assets/models/player.glb', ( gltf ) => {
            const player = gltf.scene;
        
            player.rotateY( Math.PI * 0.5 + ( Math.PI * DATA.playerTransform[ i ][ 3 ] ) );
            player.scale.set( 1.5, 1.5, 1.5 );
            player.position.set( DATA.playerTransform[ i ][ 0 ], 1, DATA.playerTransform[ i ][ 2 ] );
            player.translateX( -0.3 );
        
            DATA.scene.add( player );
        } );
    }

    MENU.disableMenu();
    if( DATA.player.id == 0 ) {
        MENU.prepareEditMenu();
    }

    if( data[ 'is_game_running' ] ) {
        startGame( data );
        return;
    }

    const info = document.getElementById( 'info' );
    info.textContent = 'Waiting for the game to start!';
    info.style.opacity = 1;

    if( DATA.player.id == 0 ) {
        const start = document.createElement( 'div' );
        start.id = 'start';
        start.textContent = 'Start';

        start.addEventListener( 'click', async () => {
            start.style.opacity = 0;

            info.textContent = 'Starting the game!';
            const infoTimeout = setTimeout( () => {
                MENU.infoAnimation( 'out' );
            }, 2000 );

            const status = await DATA.handleData( 'start', { key: key } );
            if( status == "Failed" ) {
                start.style.opacity = 1;
                clearTimeout( infoTimeout );

                info.textContent = 'You atleast 3 people to start the game!';
                setTimeout( () => {
                    MENU.infoAnimation( 'out' );

                    info.textContent = 'Waiting for the game to start!';
                    MENU.infoAnimation( 'in' );
                }, 3000 );

                return;
            }
        } );

        document.body.appendChild( start );
    }

    DATA.player.gameloop = setInterval( async () => {
        const body = { key: DATA.player.key };
        const newData = await DATA.handleData( 'get_table', body );

        if( newData[ 'players' ][ latest_player_id + 1 ] != null ) {
            latest_player_id ++;

            gltfLoader.load( 'assets/models/player.glb', ( gltf ) => {
                const player = gltf.scene;
            
                console.log( latest_player_id );

                player.rotateY( Math.PI * 0.5 + ( Math.PI * DATA.playerTransform[ latest_player_id ][ 3 ] ) );
                player.scale.set( 1.5, 1.5, 1.5 );
                player.position.set( DATA.playerTransform[ latest_player_id ][ 0 ], 1, DATA.playerTransform[ latest_player_id ][ 2 ] );
                player.translateX( -0.3 );
            
                DATA.scene.add( player );
            } );
        }
        
        if( newData[ 'is_game_running' ] ) {
            
            startGame( newData );

            info.textContent = 'Starting the game!';
            setTimeout( () => {
                MENU.infoAnimation( 'out' )
            }, 2000 );

            clearInterval( DATA.player.gameloop );    
            
            MENU.awaitYourTurn();
            return;
        }
    } , 5000);
}

waitForTheGame();

const clock = new THREE.Clock();
let delta;

const exit = document.getElementById( 'exit' );
exit.addEventListener( 'click', async () => {
    await DATA.handleData( 'exit', { key: DATA.player.key } );

    clearInterval( DATA.player.gameloop );

    const info = document.getElementById( 'info' );
    info.textContent = 'You quit the table!';
    MENU.infoAnimation( 'in' );

    location.replace( `https://poker.shizue.dev/` );
} );

function animate() {

    delta = clock.getDelta();

    rotateCamera( keyboard, delta );
    
    renderer.render( DATA.scene, DATA.player.camera );
}

renderer.setAnimationLoop( animate );   