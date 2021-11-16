
// --------------------------------------------------
// Create a new metronome

var $metronome = document.querySelector( '.m_metronome' );
var metronome = new Metronome( $metronome );

// --------------------------------------------------
// Get all our UI elements

var $playpause_button = document.querySelector( '.m_playpause_button' );

var $tempo_increase_button = document.querySelector( '.m_tempo_increase_button' );
var $tempo_decrease_button = document.querySelector( '.m_tempo_decrease_button' );
var $tempo_input = document.querySelector( '.m_tempo_input' );

var $sequencer_steps = document.querySelector( '.m_sequencer_steps' );

var $beats_remove_button = document.querySelector( '.m_beats_remove_button' );
var $beats_add_button = document.querySelector( '.m_beats_add_button' );
var $beats_input = document.querySelector( '.m_beats_input' );

// --------------------------------------------------
// Initial state

$tempo_input.value = metronome.tempo;
$beats_input.value = metronome.pattern.length;
sequencer_sync( metronome.pattern );

// --------------------------------------------------
// Bind our controls

// Play/pause
$playpause_button.addEventListener( 'click' , function(){ metronome.play_or_stop(); } );

// Tempo increase/decrease
$tempo_increase_button.addEventListener( 'click' , function(){ metronome.tempo += 10; } );
$tempo_decrease_button.addEventListener( 'click' , function(){ metronome.tempo -= 10; } );

// Tempo input
$tempo_input.addEventListener( 'change' , function(){ metronome.tempo = this.value; } );
$metronome.addEventListener( 'tempo_change' , function( e ){ $tempo_input.value = e.detail.tempo; } );

// Beats input

$beats_input.addEventListener( 'change' , function()
{
	pattern = metronome.pattern;
	length_old = pattern.length;
	length_new = this.value;

	if( length_old < length_new )
	{
		while( pattern.length < length_new ) pattern.push( 'tock' );
	}
	else if( length_old > length_new )
	{
		while( pattern.length > length_new ) pattern.pop();
	}

	metronome.pattern = pattern;
} );

$metronome.addEventListener( 'pattern_change' , function( e ){ sequencer_sync( e.detail.pattern ); } );

// Add/remove beat buttons

$beats_remove_button.addEventListener( 'click' , function()
{
	$beats_input.value = parseInt( $beats_input.value ) - 1;
	$beats_input.dispatchEvent( new Event( 'change' ) );
} );

$beats_add_button.addEventListener( 'click' , function()
{
	$beats_input.value = parseInt( $beats_input.value ) + 1;
	$beats_input.dispatchEvent( new Event( 'change' ) );
} );

// Beat button clicks

$sequencer_steps.addEventListener( 'click' , function( e )
{
	var types = [ 'tick' , 'tock' ];
	if( e.target.classList.contains( 'm_sequencer_step' ) )
	{
		var current_type = e.target.getAttribute( 'data-type' );
		e.target.setAttribute( 'data-type' , types[ ( types.indexOf( current_type ) + 1 ) % types.length ] );

		metronome.pattern = get_pattern();
	}
} );

// --------------------------------------------------
// Play/pause states

$metronome.addEventListener( 'play' , function( e )
{
	$metronome.classList.add( 'is_playing' );
	$metronome.classList.remove( 'is_stopped' );
} );

$metronome.addEventListener( 'stop' , function( e )
{
	$metronome.classList.add( 'is_stopped' );
	$metronome.classList.remove( 'is_playing' );
} );

// --------------------------------------------------
// Beat!

$metronome.addEventListener( 'beat' , function( e )
{
	// Get the active step element
	var $step = $sequencer_steps.querySelector( '.m_sequencer_step:nth-child(' + parseInt( e.detail.cursor + 1 ) + ')' );

	// Add the is_active class then...
	$step.classList.add( 'is_active' );

	// ...remove it after the animation has played
	setTimeout( function(){ $step.classList.remove( 'is_active' ); } , 300 );
} );

// --------------------------------------------------
// Sync the sequencer UI with metronome's pattern

function sequencer_sync( new_pattern )
{
	var old_pattern = get_pattern();

	for( var i = 0 ; i < Math.max( new_pattern.length , old_pattern.length ) ; i ++ )
	{
		// Add a step
		if( old_pattern[ i ] == undefined )
		{
			var $step = document.createElement( 'button' );
			$step.classList.add( 'm_sequencer_step' );
			$step.setAttribute( 'data-type' , new_pattern[ i ] );

			$sequencer_steps.appendChild( $step );
		}
		// Truncate the existing steps and break
		else if( new_pattern[ i ] == undefined )
		{
			var $step_to_remove = null;

			while( $step_to_remove = $sequencer_steps.querySelector( '.m_sequencer_step:nth-child( ' + parseInt( i + 1 ) + ' )' ) )
			{
				$step_to_remove.remove();
			}

			break;
		}
		// Otherwise just make sure the type is up-to-date
		else
		{
			var $step = $sequencer_steps.querySelector( '.m_sequencer_step:nth-child( ' + parseInt( i + 1 ) + ' )' );
			$step.setAttribute( 'data-type' , new_pattern[ i ] );
		}
	}
}

// --------------------------------------------------
// Read the beat pattern from the DOM

function get_pattern()
{
	var steps = $sequencer_steps.querySelectorAll( '.m_sequencer_step' );
	var pattern = [];

	for( var i = 0 ; i < steps.length ; i++ )
	{
		pattern.push( steps[ i ].getAttribute( 'data-type' ) );
	}

	return pattern;
}

// --------------------------------------------------
