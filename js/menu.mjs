import { player, handleData, scene } from '/js/data.mjs';
import { tableCards, deleteTableCards, foldCards } from './cards.mjs';
import { refreshPot } from './table.mjs';
 
export async function prepareMenu() {

    const body = { key: player.key };
    const data = await handleData( 'get_table', body );

    const slider = document.getElementById( 'slider' );

    const min = data[ 'minimal_bid' ] < data[ 'current_required_bet' ] ? data[ 'current_required_bet' ] : data[ 'minimal_bid' ];

    slider.disabled = false;
    slider.min = min;
    slider.max = data[ 'players' ][ player.id ][ 'chips' ];
    slider.value = slider.min;

    slider.addEventListener( 'input', () => {
        slider.nextElementSibling.children[ 0 ].value = slider.value;

        const action = document.getElementById( 'action' );

        if( slider.value > slider.min ) {
            action.innerHTML = "Raise";
        }
        else if( slider.value == slider.min ) {
            action.innerHTML = data[ 'current_required_bet' ] > 0 ? "Call" : "Check";
        }
    } );

    const outputWrapper = document.getElementById( 'output-wrapper' );
    const output = outputWrapper.children[ 0 ];
    const maxOutput = outputWrapper.children[ 1 ];
    output.value = slider.min;
    maxOutput.innerHTML = data[ 'players' ][ player.id ][ 'chips' ]; 

    if( data.current_player_index != player.id ) {
        awaitYourTurn();
        disableMenu();
        return;
    } 

    if( data.players[ player.id ][ 'has_folded' ] == true ) return;

    const fold = document.getElementById( 'fold' );
    fold.addEventListener( 'click', handleFold );

    const action = document.getElementById( 'action' );
    action.addEventListener( 'click', handleAction );

    if( data.player != 0 ) {
        const start = document.getElementById( 'start' );
    
        if( start != null ) {
            start.remove();
        }
    }

    const menu = document.getElementById( 'menu' );
    menu.style.opacity = 1;
}

function disableMenu() {
    const fold = document.getElementById( 'fold' );
    const action = document.getElementById( 'action' );

    fold.removeEventListener( 'click', handleFold );
    action.removeEventListener( 'click', handleAction );

    const menu = document.getElementById( 'menu' );
    menu.style.opacity = 0.5;

    const slider = document.getElementById( 'slider' );
    slider.disabled = true;
}

async function handleFold() {
    disableMenu();

    const body = { key: player.key, action: 'Fold' };
    await handleData( 'action', body );

    foldCards( player.id );

    player.status  = 'fold';

    awaitYourTurn()
}
 
async function handleAction() {
    disableMenu();

    const action = document.getElementById( 'action' );
    const value = action.textContent;

    if( value == 'Raise' ) {
        const slider = document.getElementById( 'slider' );
        const body = { key: player.key, action: { Raise: parseInt( slider.value ) } };
        await handleData( 'action', body );
    }
    else {
        const body = { key: player.key, action: value };
        await handleData( 'action', body );
    }

    player.status = value;

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
    }, 5000);

}

async function awaitYourTurn() {
    const body = { key: player.key };
    let data = await handleData( 'get_table', body );

    refreshPot( data.pot );

    const gameUpdateInterval = setInterval( async () => {

        console.log( 'update' );
        const newData = await handleData( 'get_table', body );
        
        console.log( newData[ 'current_player_index' ] == data[ 'current_player_index' ]  );
        if( newData[ 'current_player_index' ] == data[ 'current_player_index' ]  ) return;

        console.log( 'next player turn!' );
        refreshPot( data.pot );

        const oldPlayer = data[ 'players' ][ data[ 'current_player_index' ] ];

        if ( newData[ 'players' ][ data[ 'current_player_index' ] ][ 'has_folded' ] ) {
            foldCards( data[ 'current_player_index' ] );
            //fold

            showInfo( `Player ${ oldPlayer[ 'name' ] } has folded.` );
        }
        else if ( newData[ 'current_required_bet' ] > data[ 'current_required_bet' ] ) {
            //raise

            showInfo( `Player ${ oldPlayer[ 'name' ] } has raised by ${ newData[ 'current_required_bet' ] - data[ 'current_required_bet' ] }.` );
        }
        else if ( newData[ 'players' ][ data[ 'current_player_index' ] ][ 'current_bet' ] > oldPlayer[ 'current_bet' ] ) {
            //call

            showInfo( `Player ${ oldPlayer[ 'name' ] } has called.` );
        }
        else {
            //check
            console.log( 'checked' )

            showInfo( `Player ${ oldPlayer[ 'name' ] } has checked.` );
        }

        if( newData[ 'revealed_cards' ] != data[ 'revealed_cards' ] ) {
            console.log( newData[ 'revealed_cards' ], data[ 'revealed_cards' ] );
            
            deleteTableCards();
            tableCards();
        }

        if( newData[ 'current_player_index' ] == player.id ) {
            clearInterval( gameUpdateInterval );
            prepareMenu();
            return;
        }
        
        data = await handleData( 'get_table', body );
    } , 3000);
}