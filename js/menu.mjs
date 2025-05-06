import { player, handleData } from '/js/data.mjs';
 
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

    const text = data.bet > 0 ? 'Call' : 'Check';
    check.textContent = text;

    const sliderWrapper = document.getElementsByClassName( 'slider' )[ 0 ];
    const slider = sliderWrapper.children[ 0 ];

    slider.min = data[ 'current_required_bet' ] + 1;
    slider.max = data.players[ 0 ].chips;
    slider.value = slider.min;

    const output = sliderWrapper.children[ 1 ];
    output.value = slider.min;

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
}

async function handleFold() {
    disableMenu();

    const body = JSON.stringify({ key: player.key, action: 'fold' });
    await handleData( 'action', body );

    for( let i = 0; i < 2; i++ ) {
        const card = scene.getObjectByName( `player_card_${ playerId }_${ i }` );
        card.translateY( -0.5 );

        card.rotation.set( Math.PI * 0.5, 0, ( Math.random() * 1 ) - 0.5 );
    }

    playerStatus = 'fold';
}
 
async function handleRaise() {
    disableMenu();

    const slider = document.getElementsByClassName( 'slider' )[ 0 ].children[ 0 ];
    const body = JSON.stringify({ key: player.key, action: { raise: slider.value } });
    await handleData( 'action', body );

    playerStatus = 'raise';
}

async function handleCheck() {
    disableMenu();

    const check = document.getElementById( 'check' );
    const action = check.textContent.toLocaleLowerCase();

    const body = JSON.stringify({ key: player.key, action: action });
    await handleData( 'action', body );

    playerStatus = action;
}