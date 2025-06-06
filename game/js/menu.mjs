import { player, handleData, scene } from './data.mjs';
import { tableCards, deleteTableCards, foldCards, createBestHand, playerCards } from './cards.mjs';
import { createTableSprite, removeTableSprite } from './table.mjs';

let globalData;

export async function prepareEditMenu() {
    const data = await handleData( 'get_table', { key: player.key } );
    const edit_menu = document.createElement( 'div' );
    edit_menu.id = 'edit-menu';

    edit_menu.innerHTML += `
        <div id = "edit">
            <img src = "./assets/png/edit.png" class = "image">
        </div>

        <div class = "label-wrapper">
            <label for = "name">name</label>
            <input id = "name" type = "text" placeholder = "Table" value = ${ data.name }>
        </div>

        <div class = "label-wrapper">
            <label for = "max-players">max players</label>
            <div class = "range-input-wrapper">
                <input id = "max-players" type = "range" min = 3 max = 8 value = ${ data.max_players } placeholder = "8" oninput = "this.nextElementSibling.textContent = this.value"><output id = "max-players-output">${ data.max_players }</output>
            </div>
        </div>
        
        <div class = "label-wrapper">
            <label for = "minimal-bid">minimal bid</label>
            <input id = "minimal-bid" type = "number" placeholder = "10" value = ${ data.minimal_bid }>
        </div>
        
        <div class = "label-wrapper">
            <label for = "starting-chips">starting chips</label>
            <input id = "starting-chips" type = "number" placeholder = "100" value = ${ data.starting_chips }>
        </div>
    `
    document.body.appendChild( edit_menu );

    const edit = document.getElementById( 'edit' );
    edit.addEventListener( 'click', async () => {
        const name = document.getElementById( 'name' );
        const max_players = document.getElementById( 'max-players' );
        const minimal_bid = document.getElementById( 'minimal-bid' );
        const starting_chips = document.getElementById( 'starting-chips' );

        await handleData( 'edit', { key: player.key, name: name.value, minimal_bid: parseInt( minimal_bid.value ), max_players: parseInt( max_players.value ), starting_chips: parseInt( starting_chips.value ) } )
    } );
}

export async function prepareMenu() {

    const body = { key: player.key };
    globalData = await handleData( 'get_table', body );

    if( document.getElementById( 'edit-menu' ) ) {
        document.getElementById( 'edit-menu' ).remove();
    }
    
    const slider = document.getElementById( 'slider' );

    const min = globalData[ 'minimal_bid' ] < globalData[ 'current_required_bet' ] ? globalData[ 'current_required_bet' ] + 1 : globalData[ 'minimal_bid' ] + 1;

    slider.disabled = false;
    slider.min = min;
    slider.max = globalData[ 'players' ][ player.id ][ 'chips' ];
    slider.value = slider.min;

    const output = slider.nextElementSibling;
    output.value = slider.min;

    const balance = document.getElementById( 'balance' );
    balance.innerHTML = `Balance: ${ globalData[ 'players' ][ player.id ][ 'chips' ] }`; 

    const bet = document.getElementById( 'bet' );
    bet.innerHTML = `Bet: ${ globalData[ 'players' ][ player.id ][ 'current_bet' ] }`; 

    if( globalData.current_player_index != player.id ) {
        disableMenu();
        return;
    } 

    if( globalData.players[ player.id ][ 'has_folded' ] == true ) return;

    const fold = document.getElementById( 'fold' );
    fold.addEventListener( 'click', handleFold );

    const raise = document.getElementById( 'raise' );
    raise.innerHTML = globalData[ 'current_required_bet' ] > 0 ? 'Raise' : 'Bet';
    raise.addEventListener( 'click', handleRaise );

    const action = document.getElementById( 'action' );
    action.innerHTML = globalData[ 'current_required_bet' ] > 0 && globalData[ 'current_required_bet' ] != globalData[ 'players' ][ player.id ][ 'current_bet' ] ? 'Call' : 'Check';
    action.addEventListener( 'click', handleAction );

    if( globalData[ 'current_required_bet' ] > globalData[ 'players' ][ player.id ][ 'chips' ] ) {
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

export function disableMenu() {
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

async function win( oldData, newData ) {

    if( player.id == 0 ) {
        prepareEditMenu();
    }

    let winningPlayers = [];
    for( let i = 0; i < 8; i++ ) {
        if( oldData[ 'players' ][ i ] == null ) break;

        if( !( newData[ 'players' ][ i ][ 'chips' ] > oldData[ 'players' ][ i ][ 'chips' ] ) ) continue;

        createTableSprite( newData[ 'players' ][ i ][ 'name' ] ,`winning_player_${ winningPlayers.length }`, 3.5 + ( 0.5 * winningPlayers.length ), false );
        winningPlayers.push( i );
    }

    createTableSprite( 'Winning Players:', 'winning_players_text', 3.5 + ( 0.5 * winningPlayers.length ), false );

    createBestHand( newData[ 'players' ][ winningPlayers[ 0 ] ][ 'cards' ], 4.25 + ( 0.5 * winningPlayers.length ) );
    createTableSprite( newData[ 'players' ][ winningPlayers[ 0 ] ][ 'best_hand' ][ 'hand_type' ], 'winning_hand_type', 5 + ( 0.5 * winningPlayers.length ), false );
    createTableSprite( 'Winning Hand:', 'winning_hand_text', 5.5 + ( 0.5 * winningPlayers.length ), false );

    const info = document.getElementById( 'info' );
    info.textContent = 'Waiting for new round to start!';
    infoAnimation( 'in' );

    if( player.id == 0 ) {
        const start = document.getElementById( 'start' );

        if( start != undefined ) {
            start.style.opacity = 1;
        }
        else {
            const start = document.createElement( 'div' );
            start.id = 'start';
            start.textContent = 'Start';

            start.addEventListener( 'click', async () => {
                start.style.opacity = 0;
                
                info.textContent = 'Starting the game!';
                setTimeout( () => {
                    infoAnimation( 'out' );
                }, 2000 );

                await handleData( 'start', { key: player.key } );
                await handleData( 'start', { key: player.key } );
            } );

            document.body.appendChild( start );
        }
    }

    player.gameloop = setInterval( async () => {
        const body = { key: player.key };
        const newData = await handleData( 'get_table', body );
        
        if( newData[ 'is_game_running' ] ) {

            player.status = 'none';

            removeTableSprite( 'winning_players_text' );
            removeTableSprite( 'winning_hand_type' );
            removeTableSprite( 'winning_hand_text' );
            removeTableSprite( 'winning_hand_cards' );

            for( let i = 0; i < winningPlayers.length; i++ ) {
                removeTableSprite( `winning_player_${ i }` );
            }
            
            //refresh table cards
            deleteTableCards();
            tableCards();

            //refresh player cards
            for( let i = 0; i < newData.players.length; i++ ) {
                if( newData.players[ i ] == null ) break;

                scene.getObjectByName( `player_cards_${ i }` ).removeFromParent();
                playerCards( i );
            }

            //show pot
            removeTableSprite( 'pot' );
            createTableSprite( newData.pot, 'pot', 2.5, true );

            //show bet
            removeTableSprite( 'bet' );
            createTableSprite( newData.current_required_bet, 'bet', 3, true );

            //prepare ui
            prepareMenu();

            info.textContent = 'Starting the game!';
            setTimeout( () => {
                infoAnimation( 'out' )
            }, 2000 );

            awaitYourTurn();

            clearInterval( player.gameloop );    
        }
    } , 5000);
}

export async function awaitYourTurn() {
    const body = { key: player.key };
    const data = await handleData( 'get_table', body );

    removeTableSprite( 'pot' );
    createTableSprite( data.pot, 'pot', 2.5, true );

    removeTableSprite( 'bet' );
    createTableSprite( data.current_required_bet, 'bet', 3, true  );

    const gameUpdateInterval = setInterval( async () => {

        const newData = await handleData( 'get_table', body );

        if( !newData[ 'is_game_running' ] ) {
            clearInterval( gameUpdateInterval );

            if( globalData[ 'current_player_index' ] == player.id ) {
                win( globalData, newData );
                return;
            }

            win( data, newData );
            return;
        }
        
        if( newData[ 'current_player_index' ] == data[ 'current_player_index' ]  ) return;

        removeTableSprite( 'pot' );
        createTableSprite( newData.pot, 'pot', 2.5, true );

        removeTableSprite( 'bet' );
        createTableSprite( newData.current_required_bet, 'bet', 3, true );

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