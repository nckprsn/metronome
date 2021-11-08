
class Metronome
{
	// --------------------------------------------------

	// https://grantjam.es/creating-a-simple-metronome-using-javascript-and-the-web-audio-api

	// --------------------------------------------------

	constructor( $root )
	{
		// Set our defaults here
		var default_settings =
		{
			'tempo': 120, // BPM
			'pattern': [ 'tick' , 'tock' , 'tock' , 'tock' ],
		};

		this.settings = {};

		// TODO: Get settings from local storage
		var settings_keys = Object.keys( default_settings );
		for( var i = 0 ; i < settings_keys.length ; i ++ )
		{
			if( window.localStorage.getItem( settings_keys[ i ] ) )
			{
				this.settings[ settings_keys[ i ] ] = JSON.parse( window.localStorage.getItem( settings_keys[ i ] ) );
			}
			else
			{
				this.settings[ settings_keys[ i ] ] = default_settings[ settings_keys[ i ] ];
			}
		}

		// Set a root DOM element for event firing
		this.$root = ( $root || document );

		// This will be the ID of the timer that calls the scheduler
		this.timer = null;

		// Interval between scheduler calls in milliseconds
		this.timer_interval = 20;

		// This will track which beat we're on in the pattern
		this.beat_cursor = 0;

		// This will be updated each beat and used to plan the next one
		this.next_beat_time = null;

		// Placeholder for our audioContext object
		// (We can't initialise it before any user interaction; we'll do that when the metronome starts)
		this.audio_context == null;
	}

	// --------------------------------------------------
	// Get/set the tempo

	get tempo()
	{
		return parseInt( this.settings.tempo );
	}

	set tempo( value )
	{
		this.settings.tempo = value;

		// Dispatch an event to broadcast the updated tempo
		var tempo_change_event = new CustomEvent( 'tempo_change' , { 'detail': { 'tempo': this.settings.tempo } } );
		this.$root.dispatchEvent( tempo_change_event );

		// Save changes to local storage
		window.localStorage.setItem( 'tempo' , JSON.stringify( value ) );

	}

	// --------------------------------------------------
	// Get/set the beat pattern

	get pattern()
	{
		return this.settings.pattern;
	}

	set pattern( pattern )
	{
		this.settings.pattern = pattern;

		// Make sure the cursor isn't out of bounds
		if( ( this.beat_cursor + 1 ) > pattern.length ) this.beat_cursor = 0;

		// Dispatch an event to broadcast the updated pattern
		var pattern_change_event = new CustomEvent( 'pattern_change' , { 'detail': { 'pattern': this.settings.pattern } } );
		this.$root.dispatchEvent( pattern_change_event );

		// Save changes to local storage
		window.localStorage.setItem( 'pattern' , JSON.stringify( pattern ) );
	}

	// --------------------------------------------------
	// Returns the interval between beats in seconds

	beat_interval()
	{
		return ( 60 / this.settings.tempo );
	}

	// --------------------------------------------------

	is_playing()
	{
		// If there's a timer then it's playing
		return ( this.timer != null );
	}

	// --------------------------------------------------

	play()
	{
		// Abandon if already playing
		if( this.is_playing() ) return;

		// Initialise our audio context
		// (doing this now because it must happen _after_ a user interaction)
		if( this.audio_context == null ) this.audio_context = new window.AudioContext();

		// Set the next beat to play really soon
		this.next_beat_time = this.audio_context.currentTime + 0.1;

		// Start calling the schedule updater
		this.timer = setInterval( this.scheduler.bind( this ) , this.timer_interval );

		// Dispatch an event to broadcast that we're playing
		var play_event = new Event( 'play' );
		this.$root.dispatchEvent( play_event );
	}

	// --------------------------------------------------

	stop()
	{
		// Abandon if already stopped
		if( !this.is_playing() ) return;

		// Stop the timer that updates the scheduler
		clearInterval( this.timer );

		// Set this to null so we know we've stopped
		this.timer = null;

		// Reset the beat index to the start of the pattern
		this.beat_cursor = 0;

		// Dispatch an event to broadcast that we're stopping
		var stop_event = new Event( 'stop' );
		this.$root.dispatchEvent( stop_event );
	}

	// --------------------------------------------------

	play_or_stop()
	{
		if( this.is_playing() )
		{
			this.stop();
		}
		else
		{
			this.play();
		}
	}

	// --------------------------------------------------

	scheduler()
	{
		// If there's a beat to play soon then queue it and move on
		if( this.next_beat_time < this.audio_context.currentTime + 0.1 )
		{
			// Set the beat to play
			this.schedule_beat( this.next_beat_time , this.beat_cursor );

			// Move the beat cursor along
			this.beat_cursor++;
			this.beat_cursor %= this.settings.pattern.length; // Wrap back to 0 if required

			// Set up the time for the next beat
			this.next_beat_time += this.beat_interval();
		}
	}

	// --------------------------------------------------

	schedule_beat( beat_time , beat_cursor )
	{
		// Create an oscillator generator for the beep
		var oscillator = this.audio_context.createOscillator();

		// Get the type of beat we're on and then...
		var beat_type = this.settings.pattern[ beat_cursor ];

		// ...use it to set the beep's frequency
		switch( beat_type )
		{
			case 'tick' : oscillator.frequency.value = 1000; break;
			case 'tock' : oscillator.frequency.value =  800; break;
		}

		// Create a gain envelope to round off the start and end of the beep
		var envelope = this.audio_context.createGain();
        envelope.gain.value = 1;
        envelope.gain.exponentialRampToValueAtTime( 1 , beat_time + 0.001 );
        envelope.gain.exponentialRampToValueAtTime( 0.001 , beat_time + 0.03 );

		// Hook up the generator with the gain envelope and the output
        oscillator.connect( envelope );
        envelope.connect( this.audio_context.destination );

		// Set our sound to play at the right time
        oscillator.start( beat_time );
        oscillator.stop( beat_time + 0.03 );

		// Dispatch an event to broadcast the beat
		var beat_event = new CustomEvent( 'beat' , { 'detail': { 'cursor': beat_cursor , 'type': beat_type } } );
		setTimeout( function(){ this.$root.dispatchEvent( beat_event ); }.bind( this ) , beat_time / 1000 );
	}

	// --------------------------------------------------
}
