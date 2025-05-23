import { player, handleData, scene } from '/js/data.mjs';
import { tableCards, deleteTableCards, foldCards } from './cards.mjs';
import { createTableSprite, removeTableSprite } from './table.mjs';
 
export async function prepareMenu() {

    const body = { key: player.key };
    const data = await handleData( 'get_table', body );

    const slider = document.getElementById( 'slider' );

    const min = data[ 'minimal_bid' ] < data[ 'current_required_bet' ] ? data[ 'current_required_bet' ] + 1 : data[ 'minimal_bid' ];

    slider.disabled = false;
    slider.min = min;
    slider.max = data[ 'players' ][ player.id ][ 'chips' ];
    slider.value = slider.min;

    const output = slider.nextElementSibling;
    output.value = slider.min;

    const balance = document.getElementById( 'balance' );
    balance.innerHTML = `Balance: ${ data[ 'players' ][ player.id ][ 'chips' ] }`; 

    const bet = document.getElementById( 'bet' );
    bet.innerHTML = `Bet: ${ data[ 'players' ][ player.id ][ 'current_bet' ] }`; 

    if( data.current_player_index != player.id ) {
        awaitYourTurn();
        disableMenu();
        return;
    } 

    if( data.players[ player.id ][ 'has_folded' ] == true ) return;

    const fold = document.getElementById( 'fold' );
    fold.addEventListener( 'click', handleFold );

    const raise = document.getElementById( 'raise' );
    raise.innerHTML = data[ 'current_required_bet' ] > 0 ? 'Raise' : 'Bet';
    raise.addEventListener( 'click', handleRaise );

    const action = document.getElementById( 'action' );
    action.innerHTML = data[ 'current_required_bet' ] > 0 ? 'Call' : 'Check';
    action.addEventListener( 'click', handleAction );

    if( data[ 'current_required_bet' ] > data[ 'players' ][ player.id ][ 'chips' ] ) {
        raise.removeEventListener( 'click', handleRaise );
        raise.style.opacity = 0.5;

        if( action.innerHTML == 'Call' ) {
            action.removeEventListener( 'click', handleAction );
            action.style.opacity = 0.5;
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

async function handleRaise() {
    disableMenu();

    const slider = document.getElementById( 'slider' );
    const sliderValue = parseInt( slider.value );
    const body = { key: player.key, action: { Raise: sliderValue } };
    await handleData( 'action', body );

    const bet = document.getElementById( 'bet' );
    const betValue = parseFloat( bet.textContent.replace(/^\D+/g, '') );    
    bet.textContent = `Bet: ${ betValue + sliderValue }`;

    const balance = document.getElementById( 'balance' );
    const balanceValue = parseFloat( balance.textContent.replace(/^\D+/g, '') );  
    balance.textContent = `Balance: ${ balanceValue - sliderValue }`

    player.status = 'raise';

    awaitYourTurn()
}
 
async function handleAction() {
    disableMenu();

    const action = document.getElementById( 'action' );
    const value = action.textContent;
    const body = { key: player.key, action: value };
    await handleData( 'action', body );

    player.status = value;

    awaitYourTurn()
}

export function infoAnimation( type ) {
    const info = document.getElementById( 'info' )
    const keyframes = [ 
        { opacity: 0 },
        { opacity: 1 }
    ]

    if( type == 'out' ) keyframes.reverse();

    info.animate( 
        keyframes,
        {
            duration: 150,
            fill: 'forwards'
        }
    );
}

async function showInfo( text ) {
    const info = document.getElementById( 'info' );

    info.textContent = text;

    infoAnimation( 'in' );

    setTimeout( () => {
        infoAnimation( 'out' );
    }, 5000);

}

async function awaitYourTurn() {
    const body = { key: player.key };
    let data = await handleData( 'get_table', body );

    removeTableSprite( 'pot' );
    createTableSprite( data.pot, 'pot', 2.5 );

    removeTableSprite( 'bet' );
    createTableSprite( data.current_required_bet, 'bet', 3 );

    const gameUpdateInterval = setInterval( async () => {

        console.log( 'update' );
        const newData = await handleData( 'get_table', body );
        
        if( newData[ 'current_player_index' ] == data[ 'current_player_index' ]  ) return;

        console.log( 'next player turn!' );
        removeTableSprite( 'pot' );
        createTableSprite( data.pot, 'pot', 2.5 );

        removeTableSprite( 'bet' );
        createTableSprite( data.current_required_bet, 'bet', 3 );

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

            showInfo( `Player ${ oldPlayer[ 'name' ] } has checked.` );
        }

        if( newData[ 'revealed_cards' ] != data[ 'revealed_cards' ] ) {       
            deleteTableCards();
            tableCards();
        }

        prepareMenu();
        if( newData[ 'current_player_index' ] == player.id ) {
            clearInterval( gameUpdateInterval );
            return;
        }
    } , 5000);
}