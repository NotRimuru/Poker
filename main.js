async function handle_data( location, body ) {
    const myHeaders = new Headers();
    myHeaders.append( 'Content-Type', 'application/json' );

    try {
        const response = await fetch( `https://poker.shizue.dev/api/${ location }`, {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify( body )
        });

        if( response.status == 403 || response.status == 425 ) {
            return 'Failed';
        }

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        let result;
        if( location == 'search' ) result = response.json();
        else if( location == 'create' ) result = response.text();
        
        return result;

    } catch( error ) {
        console.error( 'Fetch error:', error.message );
    }
}

async function show_avaliavble_tables( tables ) {
    const main = document.getElementById( 'main' );

    const person_transform = [
        [ 30, 100 ],
        [ 70, 100 ],
        [ 95, 85 ],
        [ 95, 15 ],
        [ 70, 0 ],
        [ 30, 0 ],
        [ 5, 15 ],
        [ 5, 85 ]
    ];

    for( let i = 0; i < tables.length; i++ ) {
        const table_wrapper_div = document.createElement( 'div' );
        table_wrapper_div.classList.add( 'table-wrapper' );

        const table_div = document.createElement( 'div' );
        table_div.classList.add( 'table' );

        const table_text_div = document.createElement( 'div' );
        table_text_div.classList.add( 'text' );
        table_text_div.innerHTML = `
            name:</br>
            id:</br>
            current players:</br>
            max players:</br>
            minimal bid:</br>
            starting chips:</br>
        `;
        table_wrapper_div.appendChild( table_text_div );

        const table_info = tables[ i ];
        const table_info_div = document.createElement( 'div' );
        table_info_div.classList.add( 'table-info' );
        table_info_div.innerHTML = `
            ${ table_info.name } </br>
            ${ table_info.id } </br>
            ${ table_info.current_players } </br>
            ${ table_info.max_players } </br>
            ${ table_info.minimal_bid } </br>
            ${ table_info.starting_chips } </br>
        `;
        table_wrapper_div.appendChild( table_info_div );

        for( let j = 0; j < table_info.max_players; j++ ) {
            const person_div = document.createElement( 'div' );
            person_div.classList.add( 'person' );

            person_div.style[ 'left' ] = `${ person_transform[ j ][ 0 ] }%`;
            person_div.style[ 'top' ] = `${ person_transform[ j ][ 1 ] }%`;

            table_div.appendChild( person_div );    
            if( table_info.current_players <= j ) continue;
            
            person_div.style[ 'background-color' ] = '#ccc';

            const person_image = document.createElement( 'img' );
            person_image.src = 'png/user.png';
            person_image.classList.add( 'image' );
            person_div.appendChild( person_image );
        }

        table_wrapper_div.appendChild( table_div );
        main.appendChild( table_wrapper_div );

        table_wrapper_div.addEventListener( 'click', () => {
            location.replace( `/game/?id=${ table_info.id }` );
        } );
    }

    if( tables.length > 0 ) return;

    main.textContent = 'No tables found!';
}

async function search_for_tables() {
    const max_players = document.getElementById( 'max-players' );
    const max_players_value = document.getElementById( 'max-players-checkbox' ).checked ? parseInt( max_players.value ) : 0;
    const current_players = document.getElementById( 'current-players' );
    const current_players_value = document.getElementById( 'current-players-checkbox' ).checked ? parseInt( current_players.value ) : 0;
    const minimal_bid = document.getElementById( 'minimal-bid' );
    const minimal_bid_value = document.getElementById( 'minimal-bid-checkbox' ).checked ? parseInt( minimal_bid.value ) : 0;
    const starting_chips = document.getElementById( 'starting-chips' );
    const starting_chips_value = document.getElementById( 'starting-chips-checkbox' ).checked ? parseInt( starting_chips.value ) : 0;
    const name = document.getElementById( 'name' );
    const name_value = document.getElementById( 'name-checkbox' ).checked ? name.value : '';

    return await handle_data( 'search', { name: name_value, max_players: max_players_value, current_players: current_players_value, minimal_bid: minimal_bid_value, starting_chips: starting_chips_value } );
}

async function refresh_tables() {
    const main = document.getElementById( 'main' );
    main.innerHTML = '';

    const tables = await search_for_tables();
    show_avaliavble_tables( tables );
}

refresh_tables();

const create = document.getElementById( 'create' );
create.addEventListener( 'click', async () => {

    let name = sessionStorage.getItem( 'name' );
    if( name == undefined ) {
        name = prompt( 'Name' );
        sessionStorage.setItem( 'name', name );
    }

    const max_players = document.getElementById( 'max-players' );
    const minimal_bid = document.getElementById( 'minimal-bid' );
    const starting_chips = document.getElementById( 'starting-chips' );
    const table_name = document.getElementById( 'name' );

    const key = await handle_data( 'create', { name: name, table_name: table_name.value, max_players: parseInt( max_players.value ), minimal_bid: parseInt( minimal_bid.value ), starting_chips: parseInt( starting_chips.value ) } );
    localStorage.setItem( 'key', key );

    const tables = await search_for_tables();

    location.replace( `/game/?id=${ tables[ tables.length - 1 ].id }` );
} );

const refresh = document.getElementById( 'refresh' );
refresh.addEventListener( 'click', refresh_tables );