import { player, handleData, scene } from '/js/data.mjs';
import { tableCards, deleteTableCards } from './cards.mjs';
 
export async function prepareMenu() {

    const body = { key: player.key };
    const data = await handleData( 'get_table', body );

    if( data.players[ player.id ][ 'has_folded' ] == true ) return;

    const fold = document.getElementById( 'fold' );
    fold.addEventListener( 'click', handleFold );

    const raise = document.getElementById( 'raise' );
    raise.addEventListener( 'click', handleRaise );

    const check = document.getElementById( 'check' );
    check.addEventListener( 'click', handleCheck );

    const text = data[ 'current_required_bet' ] > data.players[ player.id ][ 'current_bet' ] ? 'Call' : 'Check';
    check.textContent = text;

    const sliderWrapper = document.getElementsByClassName( 'slider' )[ 0 ];
    const slider = sliderWrapper.children[ 0 ];

    const min = data[ 'minimal_bid' ] < data[ 'current_required_bet' ] ? data[ 'current_required_bet' ] : data[ 'minimal_bid' ];

    slider.disabled = false;
    slider.min = min;
    slider.max = data.players[ 0 ].chips;
    slider.value = slider.min;

    const output = sliderWrapper.children[ 1 ];
    output.value = slider.min;

    if( data.player != 0 ) {
        const start = document.getElementById( 'start' );
        start.remove();
    }

    const menu = document.getElementById( 'menu' );
    menu.style.opacity = 1;
}

function disableMenu() {
    const fold = document.getElementById( 'fold' );
    const raise = document.getElementById( 'raise' );
    const check = document.getElementById( 'check' );

    fold.removeEventListener( 'click', handleFold );
    raise.removeEventListener( 'click', handleRaise );
    check.removeEventListener( 'click', handleCheck );

    const menu = document.getElementById( 'menu' );
    menu.style.opacity = 0.5;

    const slider = document.getElementsByClassName( 'slider' )[ 0 ].children[ 0 ];
    slider.disabled = true;
}

async function foldCards( playerId ) {
    for( let i = 0; i < 2; i++ ) {
        const card = scene.getObjectByName( `player_card_${ playerId }_${ i }` );
        card.translateY( -0.5 );

        card.rotation.set( 0, 0, ( Math.random() * 1 ) - 0.5 );
    }
}

async function handleFold() {
    disableMenu();

    const body = { key: player.key, action: 'Fold' };
    await handleData( 'action', body );

    foldCards( player.id );

    player.status  = 'fold';

    awaitYourTurn()
}
 
async function handleRaise() {
    disableMenu();

    const slider = document.getElementsByClassName( 'slider' )[ 0 ].children[ 0 ];
    const body = { key: player.key, action: { Raise: slider.value } };
    await handleData( 'action', body );

    player.status = 'raise';

    awaitYourTurn()
}

async function handleCheck() {
    disableMenu();

    const check = document.getElementById( 'check' );
    const action = check.textContent;

    const body = { key: player.key, action: action };
    await handleData( 'action', body );

    player.status = action;

    awaitYourTurn()
}

async function showInfo( text ) {
    const info = document.getElementById( 'info' );

    info.textContent = text;

    info.animate( 
        [ 
            { opacity: 0 },
            { opacity: 1 }
        ], 
        {
            duration: 150,
            fill: 'forwards'
        }
    );

    setTimeout( () => {
        info.animate( 
            [ 
                { opacity: 1 },
                { opacity: 0 }
            ], 
            {
                duration: 150,
                fill: 'forwards'
            }
        );
    }, 3000);

}

async function awaitYourTurn() {
    const body = { key: player.key };
    let data = await handleData( 'get_table', body );

    const gameUpdateInterval = setInterval( async () => {
        const newData = await handleData( 'get_table', body );
        
        if( newData[ newData[ 'current_player_id' ] ] == data[ 'current_player_id' ]  ) return;

        console.log( 'next player turn!' );

        const oldPlayer = data[ 'players' ][ data[ 'current_player_id' ] ];
        if ( oldPlayer[ 'has_folded' ] ) {
            foldCards( data[ 'current_player_id' ] );
            //fold

            showInfo( `Player ${ oldPlayer[ 'name' ] } has folded.` );
        }
        else if ( newData[ 'current_required_bet' ] > data[ 'current_required_bet' ] ) {
            //raise

            showInfo( `Player ${ oldPlayer[ 'name' ] } has raised by ${ newData[ 'current_required_bet' ] - data[ 'current_required_bet' ] }.` );
        }
        else if ( newData[ 'players' ][ data[ 'current_player_id' ] ][ 'current_bet' ] > oldPlayer[ 'current_bet' ] ) {
            //call

            showInfo( `Player ${ oldPlayer[ 'name' ] } has called.` );
        }
        else {
            //check

            showInfo( `Player ${ oldPlayer[ 'name' ] } has checked.` );
        }

        if( newData[ 'revealed_cards' ] != data[ 'revealed_cards' ] ) {
            console.log( newData[ 'revealed_cards' ], data[ 'revealed_cards' ] );
            
            deleteTableCards();
            tableCards();
        }

        if( newData[ 'current_player_id' ] == player.id ) {
            clearInterval( gameUpdateInterval );
            prepareMenu();
            return;
        }
        
        data = await handleData( 'get_table', body );
    } , 3000);
}