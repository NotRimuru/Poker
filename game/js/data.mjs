import * as THREE from 'three';

export const ranks = { 
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

export const suits = {
    Heart:   "♥︎",
    Diamond: "♦︎",
    Club:    "♣︎",
    Spade:   "♠︎"
}

export const colors = {
    Heart: 0x9b1c31, 
    Diamond: 0x9b1c31,
    Club: 0x222222,
    Spade: 0x222222,
}

export const playerTransform = [ 
    [ -2.5, 1.7, 3.2, 0 ], 
    [ 2.5, 1.7, 3.2, 0 ], 
    [ 6.5, 1.7, 2.2, 0.22 ], 
    [ 7.2, 1.7, -1.3, -1.37 ], 
    [ 4, 1.7, -3.2, 1 ], 
    [ -4, 1.7, -3.2, 1 ],  
    [ -7.2, 1.7, -1.3, 1.37 ], 
    [ -6.5, 1.7, 2.2, -0.25 ]  
];

export async function handleData( location, body ) {
    const myHeaders = new Headers();
    myHeaders.append( "Content-Type", "application/json" );

    try {
        const response = await fetch( `http://localhost:3000/${ location }`, {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify( body )
        });

        if( response.status == 403 || response.status == 425 || response.status == 404 ) {
            return "Failed";
        }

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        let result;
        if( location == 'create' || location == 'join' ) result = response.text();
        else if( location == 'get_table' || location == 'find' ) result = response.json();

        return result;

    } catch( error ) {
        console.error( "Fetch error:", error.message );
    }
}

class Player { 
    constructor( key, id, status ){
        this.key = key;
        this.id = id;
        this.status = status;
        this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
        this.gameloop = null;
    }

    setKey( key ) {
        this.key = key;
    }

    setId( id ) {
        this.id = id;
    }
}

export const player = new Player( '', '', 'none' )
export const scene = new THREE.Scene();