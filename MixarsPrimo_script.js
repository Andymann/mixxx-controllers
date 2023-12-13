
//
// ****************************************************************************
// * Mixxx mapping script file for Mixars Primo.
// * Author: Crocodile Andy
// * Version 1.0 (July 2023)
// * Forum: http://www.mixxx.org/forums/
// * Wiki: http://www.mixxx.org/wiki/
// ****************************************************************************

const OFF = 0x00;
const RED = 0x01;
const MANGO = 0x02;
const BLUE = 0x03;
const RIOJA = 0x04;
const LIME = 0x05;
const MAGENTA = 0x06;
const LIGHTBLUE = 0x07;
const PURPLE = 0x08;
const ORANGE = 0x09;
const FERRARIRED = 0x0a;
const INDIGO = 0x0b;
const CYAN = 0x0c;
const EMERALD = 0x0d;
const GRASSGREEN = 0x0e;


const MODE_NORMAL = 0x01; //a.k.a. HOT CUE
const MODE_ROLL = 0x02;
const MODE_SLICER = 0x03;
const MODE_SAMPLER = 0x04;
const MODE_SETCOLOR = 0x05;

const STATE_ACTIVE = 0x01;
const STATE_INACTIVE = 0x00;

function MixarsPrimmo() {}
var mp = {};
var lMSB = 0;
var lLSB = 0;
var mode;

var bShift = false;
var bScrollWheelClick = false;


mp.previewPlaying = false;
mp.pitchMsbValue = [0x40, 0x40];
mp.playState = [STATE_INACTIVE, STATE_INACTIVE];
mp.loopState = [STATE_INACTIVE, STATE_INACTIVE];
mp.cueButtonPressed = [STATE_INACTIVE, STATE_INACTIVE];
mp.mode = [MODE_NORMAL, MODE_NORMAL];
mp.isVinylMode = [true, true];
mp.prevJogLED = [0, 0];

mp.pitchMsbValue = [0x00, 0x00];
mp.pitchLsbValue = [0x00, 0x00];

// Scratch algorithm parameters
mp.scratchParams = {
    ticks: 600,
    recordSpeed: 33 + 1/3,
    alpha: (1.0/10),
    beta: (1.0/10)/32,
    ramp: true
};

var previousMode;

mp.lastDeckLoaded = "";

mp.init = function() {

    //Indicate that something is actually happening
    var i;
    for (i = 0; i < 8; i++) { 
        midi.sendShortMsg(0x94, 0x14 + i, MAGENTA);    //Pads left
        midi.sendShortMsg(0x95, 0x14 + i, BLUE);
    }

    midi.sendShortMsg(0xb0, 0x0c, 0x05);    // left platter max out red
    midi.sendShortMsg(0xb0, 0x0d, 0x05);    // green
    midi.sendShortMsg(0xb0, 0x0e, 0x05);    // blue
    midi.sendShortMsg(0xb0, 0x0a, 0x7f);    // left platter ring

    midi.sendShortMsg(0xb1, 0x0c, 0x05);    // right platter max out red
    midi.sendShortMsg(0xb1, 0x0d, 0x05);
    midi.sendShortMsg(0xb1, 0x0e, 0x05);
    midi.sendShortMsg(0xb1, 0x0a, 0x7f);    // right platter ring

	//----QuickFX initially OFF; setValue also works
    engine.setParameter("[QuickEffectRack1_[Channel1]_Effect1]", "enabled", 0);
    engine.setParameter("[QuickEffectRack1_[Channel2]_Effect1]", "enabled", 0);


    engine.beginTimer(500, function() {
        mp.padsOff_Deck(0);
        mp.padsOff_Deck(1);
        mp.platterOff(0);
        mp.platterOff(1);
        mp.modeButtonsOff(0);
        mp.modeButtonsOff(1);

        //initially set the mode-buttons.
        midi.sendShortMsg(0x94, 0x01, 0x7f);
        midi.sendShortMsg(0x95, 0x01, 0x7f);

        mp.recreatePads(0);
        mp.recreatePads(1);
    }, true);

    //----Library focussed on the right-side pane
    //engine.setValue("[Library]", "MoveFocusForward", 1);
    //engine.setValue("[Library]", "MoveFocusBackward", 1);

    //----Zum Start das Item mit Playlists aufklappen
    //engine.setValue("[Library]", "MoveVertical", 2);

};

mp.shutdown = function() {
    
};

mp.padsOff_Deck = function(deck){
    if(deck == 0){
        for (var i = 0; i < 8; i++) { 
            midi.sendShortMsg(0x94, 0x14 + i, 0x00);    //Pads left
        }
        midi.sendShortMsg(0x94, 0x32, 0x00); // Turn Loop-Button off
    }else if(deck == 1){
        for (var i = 0; i < 8; i++) { 
            midi.sendShortMsg(0x95, 0x14 + i, 0x00);    //Pads left
            midi.sendShortMsg(0x94, 0x34, 0x00);
        }
    }
};

mp.platterOff = function(deck){
    if(deck == 0){
        midi.sendShortMsg(0xb0, 0x0c, 0x00); 
        midi.sendShortMsg(0xb0, 0x0d, 0x00);
        midi.sendShortMsg(0xb0, 0x0e, 0x00);
        midi.sendShortMsg(0xb0, 0x0a, 0x00);    //LED ring
    }else if(deck == 1){
        midi.sendShortMsg(0xb1, 0x0c, 0x00); 
        midi.sendShortMsg(0xb1, 0x0d, 0x00);
        midi.sendShortMsg(0xb1, 0x0e, 0x00);
        midi.sendShortMsg(0xb1, 0x0a, 0x00);
    }
};

mp.modeButtonsOff = function(deck){
    if(deck == 0){
        midi.sendShortMsg(0x94, 0x01, 0x00);
        midi.sendShortMsg(0x94, 0x07, 0x00);
        midi.sendShortMsg(0x94, 0x09, 0x00);
        midi.sendShortMsg(0x94, 0x0b, 0x00);
    }else if(deck == 1){
        midi.sendShortMsg(0x95, 0x01, 0x00);
        midi.sendShortMsg(0x95, 0x07, 0x00);
        midi.sendShortMsg(0x95, 0x09, 0x00);
        midi.sendShortMsg(0x95, 0x0b, 0x00);
    }
}

    
engine.connectControl("[Channel1]","hotcue_1_enabled", function(value) { mp.hcue_deck(0, value, 0x14); });
engine.connectControl("[Channel1]","hotcue_2_enabled", function(value) { mp.hcue_deck(0, value, 0x15); });
engine.connectControl("[Channel1]","hotcue_3_enabled", function(value) { mp.hcue_deck(0, value, 0x16); });
engine.connectControl("[Channel1]","hotcue_4_enabled", function(value) { mp.hcue_deck(0, value, 0x17); });
engine.connectControl("[Channel1]","hotcue_5_enabled", function(value) { mp.hcue_deck(0, value, 0x18); });
engine.connectControl("[Channel1]","hotcue_6_enabled", function(value) { mp.hcue_deck(0, value, 0x19); });
engine.connectControl("[Channel1]","hotcue_7_enabled", function(value) { mp.hcue_deck(0, value, 0x1A); });
engine.connectControl("[Channel1]","hotcue_8_enabled", function(value) { mp.hcue_deck(0, value, 0x1B); });
    
engine.connectControl("[Channel2]","hotcue_1_enabled", function(value) { mp.hcue_deck(1, value, 0x14); });
engine.connectControl("[Channel2]","hotcue_2_enabled", function(value) { mp.hcue_deck(1, value, 0x15); });
engine.connectControl("[Channel2]","hotcue_3_enabled", function(value) { mp.hcue_deck(1, value, 0x16); });
engine.connectControl("[Channel2]","hotcue_4_enabled", function(value) { mp.hcue_deck(1, value, 0x17); });
engine.connectControl("[Channel2]","hotcue_5_enabled", function(value) { mp.hcue_deck(1, value, 0x18); });
engine.connectControl("[Channel2]","hotcue_6_enabled", function(value) { mp.hcue_deck(1, value, 0x19); });
engine.connectControl("[Channel2]","hotcue_7_enabled", function(value) { mp.hcue_deck(1, value, 0x1A); });
engine.connectControl("[Channel2]","hotcue_8_enabled", function(value) { mp.hcue_deck(1, value, 0x1B); });

engine.connectControl("[Channel1]","play_latched", function(value, offset, group) { mp.setLED(0x90, 0x00, value); });
engine.connectControl("[Channel2]","play_latched", function(value, offset, group) { mp.setLED(0x91, 0x00, value); });

engine.connectControl("[Channel1]","end_of_track", function(value, group) { mp.endOfTrack(value, group); });
engine.connectControl("[Channel2]","end_of_track", function(value, group) { mp.endOfTrack(value, group); });

engine.connectControl("[Channel1]", "playposition", function(value, group) { mp.trackPositionLEDs(value, group); });
engine.connectControl("[Channel2]", "playposition", function(value, group) { mp.trackPositionLEDs(value, group); });

engine.connectControl("[Channel1]", "pfl", function(value, group) { mp.setLED(0x90, 0x1b, value); });
engine.connectControl("[Channel2]", "pfl", function(value, group) { mp.setLED(0x91, 0x1b, value); });

//engine.connectControl("[Channel1]", "VuMeter", function(value, group) { mp.setMasterVU(0xb0, 0x1f, value); });
//engine.connectControl("[Channel2]", "VuMeter", function(value, group) { mp.setMasterVU(0xb1, 0x1f, value); });
engine.connectControl("[Master]", "VuMeterL", function(value, group) { mp.setMasterVU(0xb0, 0x1f, value, -1); });
engine.connectControl("[Master]", "VuMeterR", function(value, group) { mp.setMasterVU(0xb1, 0x1f, value, 1); });

engine.connectControl("[Channel1]", "VuMeter", function(value, group) { mp.setChannelVU(0xbf, 0x19, value, group); });
engine.connectControl("[Channel2]", "VuMeter", function(value, group) { mp.setChannelVU(0xbf, 0x1d, value, group); });

engine.connectControl("[EffectRack1_EffectUnit1_Effect1]", "enabled", function(value, group) { mp.setLED(0x98, 0x00, value); });
engine.connectControl("[EffectRack1_EffectUnit1_Effect2]", "enabled", function(value, group) { mp.setLED(0x98, 0x01, value); });
engine.connectControl("[EffectRack1_EffectUnit1_Effect3]", "enabled", function(value, group) { mp.setLED(0x98, 0x02, value); });
engine.connectControl("[EffectRack1_EffectUnit2_Effect1]", "enabled", function(value, group) { mp.setLED(0x99, 0x00, value); });
engine.connectControl("[EffectRack1_EffectUnit2_Effect2]", "enabled", function(value, group) { mp.setLED(0x99, 0x01, value); });
engine.connectControl("[EffectRack1_EffectUnit2_Effect3]", "enabled", function(value, group) { mp.setLED(0x99, 0x02, value); });

engine.connectControl("[Channel1]","loop_enabled", function(group) { mp.loopEnabled("[Channel1]"); });
engine.connectControl("[Channel2]","loop_enabled", function(group) { mp.loopEnabled("[Channel2]"); });

//----The SYNC-Button is connected to Preview. The CUE button is just too close to the PLAY button
//engine.connectControl("[PreviewDeck1]","play", function(value, offset, group) { mp.setLED(value, 0x02, "[Channel1]"); });
//engine.connectControl("[PreviewDeck1]","play", function(value, offset, group) { mp.setLED(value, 0x02, "[Channel2]"); });


mp.loadTrack = function (midichan, control, value, status, group) {
	var deck = script.deckFromGroup(group);
    mp.lastDeckLoaded = group;
    mp.mode[deck-1]= MODE_NORMAL;
    
	if(value > 0){
		engine.setValue(group, "LoadSelectedTrack", 1 );
	}

    //light up the LOAD button
	midi.sendShortMsg(0x9f, deck+1, value);

    // PFL fuer das Deck aktivieren
    midi.sendShortMsg(0x90 + deck-1, 0x1B, 0x7F);    // Headphone-cue
    engine.setParameter("[Channel" + deck.toString() +"]", "pfl", 1);
};

mp.playpause = function(midichan, control, value, status, group) {
    var deck = script.deckFromGroup(group);
    
    if(value == 0x7f){
        
        // If a CUE is played by holding down the corresponding CUE button
        // we want the deck to continue playing when we also hit the PLAY button
        // and release the CUE button afterwards.
        if (engine.getValue(group, "play") == 1 ){
            if( mp.cueButtonPressed[deck - 1] == STATE_INACTIVE){
                mp.playState[deck-1]=STATE_INACTIVE;
                engine.setValue(group, "stop", 1);
            }else if( mp.cueButtonPressed[deck - 1] == STATE_ACTIVE){
                mp.playState[deck-1]=STATE_ACTIVE;
                engine.setValue(group, "play", 1);
            }
        }else{
            mp.playState[deck-1]=1;
            engine.setValue(group, "play", 1);
        }
    }
};


//Control the hot cue leds for a deck
mp.hcue_deck = function (deck, value, offset) {

    var state_full;
    var col;

    if(mp.mode[0] == MODE_NORMAL){
        col=GRASSGREEN;

        //Check if we want them illuminated or not and set the corresponding brightness
        state_full = value ? col : 0x00;
    
        //send the commands
        midi.sendShortMsg(0x94 + deck, offset, state_full);
    }
};

/* Play cue 1, stop wehen releasing button */
mp.hotcue_1 = function(midichan, control, value, status, group) {
    this._hotcue_playstop(midichan, value, group, 1);
 };
 
 mp.hotcue_2 = function(midichan, control, value, status, group) {
     this._hotcue_playstop(midichan, value, group, 2);
  };
 
  mp.hotcue_3 = function(midichan, control, value, status, group) {
     this._hotcue_playstop(midichan, value, group, 3);
  };
 
  mp.hotcue_4 = function(midichan, control, value, status, group) {
     this._hotcue_playstop(midichan, value, group, 4);
  };
 
  mp.hotcue_5 = function(midichan, control, value, status, group) {
     this._hotcue_playstop(midichan, value, group, 5);
  };
 
  mp.hotcue_6 = function(midichan, control, value, status, group) {
     this._hotcue_playstop(midichan, value, group, 6);
  };
 
  mp.hotcue_7 = function(midichan, control, value, status, group) {
     this._hotcue_playstop(midichan, value, group, 7);
  };
 
  mp.hotcue_8 = function(midichan, control, value, status, group) {
     this._hotcue_playstop(midichan, value, group, 8);
  };
 
  /* set cue if it does not exist, clear cue if it does */
  mp.hotcue_setclear_1 = function(midichan, control, value, status, group) {
     this._hotcue_setclear(value, group, 1);
  };
 
  mp.hotcue_setclear_2 = function(midichan, control, value, status, group) {
     this._hotcue_setclear(value, group, 2);
  };
 
  mp.hotcue_setclear_3 = function(midichan, control, value, status, group) {
     this._hotcue_setclear(value, group, 3);
  };
 
  mp.hotcue_setclear_4 = function(midichan, control, value, status, group) {
     this._hotcue_setclear(value, group, 4);
  };
 
  mp.hotcue_setclear_5 = function(midichan, control, value, status, group) {
     this._hotcue_setclear(value, group, 5);
  };
 
  mp.hotcue_setclear_6 = function(midichan, control, value, status, group) {
     this._hotcue_setclear(value, group, 6);
  };
 
  mp.hotcue_setclear_7 = function(midichan, control, value, status, group) {
     this._hotcue_setclear(value, group, 7);
  };
 
  mp.hotcue_setclear_8 = function(midichan, control, value, status, group) {
     this._hotcue_setclear(value, group, 8);
  };

  mp._hotcue_playstop = function(midichan, value, group, hotcue){
    var tmpOrientation;
    var tmpVolume;

    var deck = script.deckFromGroup(group);
    var tmpMode = mp.mode[deck-1];
    
    if(midichan == 4){
        // Links
        tmpOrientation = 0;
        tmpVolume = engine.getParameter("[Channel1]","volume");
    }else if(midichan == 5){
        // Rechts
        tmpOrientation = 2;
        tmpVolume = engine.getParameter("[Channel2]","volume");
    }
    
    if(tmpMode == MODE_NORMAL){
        if(value == 127){
            var isPlaying = engine.getValue(group, "play", 1);
            if(isPlaying==STATE_ACTIVE){
                mp.playState[deck-1] = STATE_ACTIVE;  
            }else{
                mp.playState[deck-1] = STATE_INACTIVE;      
            }
            var x = engine.getValue(group, "hotcue_" + hotcue.toString() + "_enabled", 1 );
            engine.setValue(group, "hotcue_" + hotcue.toString() +  "_gotoandplay", 1);   
            mp.cueButtonPressed[deck - 1] = STATE_ACTIVE;
        }else{
            if (mp.playState[deck-1] == STATE_INACTIVE){
                //Deck is not already playing
                engine.setValue(group, "hotcue_" + hotcue.toString() + "_gotoandstop", 1);
            }else if (mp.playState[deck-1] == STATE_ACTIVE){
                // Deck is already playing
            }  
            mp.cueButtonPressed[deck - 1] = STATE_INACTIVE;      
        }

    }else if(tmpMode == MODE_SAMPLER){
        // Both Decks can play samples. When played the sampler's volume is
        // set according to the deck's volume and the sampler's orientation is adjusted
        // to the left or to the right.
        if(value == 127){
            engine.setParameter("[Sampler"+ hotcue +"]", "orientation", tmpOrientation);
            engine.setParameter("[Sampler"+ hotcue +"]", "volume", tmpVolume);
            engine.setParameter("[Sampler"+ hotcue +"]", "start_play", 1);
        }

    }else if(tmpMode == MODE_SETCOLOR){
        if(value ==127){
            if(hotcue == 1){
                //RED
                engine.setParameter(group, "track_color", 0xFF0000);
            }else if(hotcue == 2){
                //GREEN
                engine.setParameter(group, "track_color", 0x00FF00);
            }else if(hotcue == 3){
                //PINK
                engine.setParameter(group, "track_color", 0xFF00FF);
            }else if(hotcue == 4){
                //ORA
                engine.setParameter(group, "track_color", 0xFF9900);
            }else if(hotcue == 5){
                //Col DOWN
                //engine.setParameter(group, "track_color_prev", 1.0);

                //BLUE
                engine.setParameter(group, "track_color", 0x0000FF);
            }else if(hotcue == 6){
                //Col UP
                //engine.setParameter(group, "track_color_next", 1.0);

                //Col OFF
                engine.setParameter(group, "track_color", -1);
            }else if(hotcue == 7){
                //Col OFF
                engine.setParameter("[Library]", "track_color_prev", 1);
            }else if(hotcue == 8){
                //Col OFF
                engine.setParameter("[Library]", "track_color_next", 1);
            }
        }
    }
};

mp._hotcue_setclear = function(value, group, hotcue){
    if(value == 0x7f){
        var x = engine.getValue(group, "hotcue_" + hotcue.toString() + "_enabled", 1 );
        if(x===1){
            //Cue exists, clear it
            engine.setValue(group, "hotcue_" + hotcue.toString() + "_clear", 1 );  
        }else{
            //Cue does not exist, set it
            engine.setValue(group, "hotcue_" + hotcue.toString() + "_set", 1 );  
        }
    }
 };

 mp.shiftButton = function(midichan, control, value, status, group){
    midi.sendShortMsg(0x9f, 0x00, value);
	if (value > 0){
		bShift = true;
	}else{
		bShift = false;
	}
 }

//
 mp.setMode = function(midichan, control, value, status, group){

    if(value == 0x7f){

        if(status == 0x94){     //left
            mp.modeButtonsOff(0);
            midi.sendShortMsg(status, control, value);

            mp.padsOff_Deck(0);
            if(control == 0x01){
                mp.mode[0] = MODE_NORMAL;
            }else if(control == 0x07){
                mp.mode[0] = MODE_ROLL;
            }else if(control == 0x09){
                mp.mode[0] = MODE_SLICER;
            }else if(control == 0x0b){
                mp.mode[0] = MODE_SAMPLER;
            }
            mp.recreatePads(0);
        }else if(status == 0x95){   //right
            mp.modeButtonsOff(1);
            midi.sendShortMsg(status, control, value);

            mp.padsOff_Deck(1);
            if(control == 0x01){
                mp.mode[1] = MODE_NORMAL;
            }else if(control == 0x07){
                mp.mode[1] = MODE_ROLL;
            }else if(control == 0x09){
                mp.mode[1] = MODE_SLICER;
            }else if(control == 0x0b){
                mp.mode[1] = MODE_SAMPLER;
            }
            mp.recreatePads(1);
        }
        
    }
 }
 
 mp.recreatePads = function(deck){
    if(mp.mode[deck] == MODE_NORMAL){
        for(var i=0; i<8; i++){
            var value = engine.getValue("[Channel" + (deck+1).toString() + "]", "hotcue_" + (i+1).toString() + "_enabled", 1 )
            mp.hcue_deck(deck, value, 0x14 + i);
        }
    }
 };


 mp.loopToggle = function(midichan, control, value, status, group){
    // beatloop_activate
    var deck = script.deckFromGroup(group)-1;
    var loopActive = engine.getValue(group, "loop_enabled");

    //---Maybe 'someone' changed 'something' via the GUI
    mp.loopState[deck]= loopActive;

   if(value == 0x7f){
        if(mp.loopState[deck]==STATE_INACTIVE){
            mp.loopState[deck] = STATE_ACTIVE;
            engine.setValue(group, "beatloop_activate", 1);
            //midi.sendShortMsg(0x94 + deck, control, 0x7f);
            midi.sendShortMsg(status, control, 0x7f);
        }else if(mp.loopState[deck]==STATE_ACTIVE){
            mp.loopState[deck] = STATE_INACTIVE;
            engine.setValue(group, "loop_exit", 1);
            //midi.sendShortMsg(0x94 + deck, control, 0x00);
            midi.sendShortMsg(status, control, 0x00);
        }
    }
 }

 mp.loopHalf = function(midichan, control, value, status, group){
    if(value== 0x7f){
        engine.setValue(group, "loop_halve", 1);
    }
    midi.sendShortMsg(status, control, value);
 }

 mp.loopDouble = function(midichan, control, value, status, group){
    if(value== 0x7f){
        engine.setValue(group, "loop_double", 1);
    }
    midi.sendShortMsg(status, control, value);
 }

mp.parameterLeft = function(midichan, control, value, status, group){
    if(value == 0x7f){
        if(engine.getValue(group, "loop_enabled")){
            engine.setValue(group, "loop_move", -1);
        }else{
			engine.setValue(group, "stars_down", 1);
		}
    }
    midi.sendShortMsg(status, control, value);
}

mp.parameterRight  =function(midichan, control, value, status, group){
    if(value == 0x7f){
        if(engine.getValue(group, "loop_enabled")){
            engine.setValue(group, "loop_move", +1);
        }else{
			engine.setValue(group, "stars_up", 1);
		}
    }
    midi.sendShortMsg(status, control, value);
}

mp.endOfTrack = function(value, group){
    var deck = script.deckFromGroup(group)-1;
    if(value == 1){
        mp.flashDeck(deck, true);
    }else{
        //will only be reached if the warning already occured
        mp.flashDeck(deck, false);

    }
}

mp.flashTimer = [0,0];
mp.bIsOn = [false, false];

mp.flashDeck = function(deck, bOnOff){
    if(bOnOff === true){
        if(mp.flashTimer[deck]!=0){
            engine.stopTimer(mp.flashTimer[deck]);
            mp.flashTimer[deck] = 0;
        }
        mp.flashTimer[deck] = engine.beginTimer(250, function() {
            mp.flashX(deck);
        });
    }else{
        if(mp.flashTimer[deck]!=0){
            engine.stopTimer(mp.flashTimer[deck]);
            mp.flashTimer[deck] = 0;
        }
        midi.sendShortMsg(0xb0 + deck, 0x0c, 0x00); 
        //midi.sendShortMsg(0xb0 + deck, 0x0e, 0x00); 
    }
};

mp.flashX = function(deck){
    if(mp.bIsOn[deck] == true){
        mp.bIsOn[deck] = false;
        midi.sendShortMsg(0xb0 + deck, 0x0c, 0x05);
    }else{
        mp.bIsOn[deck]=true;
        midi.sendShortMsg(0xb0 + deck, 0x0c, 0x00);
    }
};


mp.crossFaderCoarse = function(midichan, control, value, status, group){
    engine.setValue(group, "crossfader", value/0x3f -1);

    engine.setParameter("[EffectRack1_EffectUnit1]", "mix", 1.0 -value/0x7F);
    engine.setParameter("[EffectRack1_EffectUnit2]", "mix", value/0x7F);

};

mp.crossFaderFine = function(midichan, control, value, status, group){
    //Who on this earth really needs 14bit Crossfaders?
};

mp.nudgeMinus = function(midichan, control, value, status, group){
    midi.sendShortMsg(status, control, value);
    if(value == 0x7f){
        engine.setValue(group, "rate_temp_down", 1);
    }else{
        engine.setValue(group, "rate_temp_down", 0);
    }
}

mp.nudgePlus = function(midichan, control, value, status, group){
    midi.sendShortMsg(status, control, value);
    if(value == 0x7f){
        engine.setValue(group, "rate_temp_up", 1);
    }else{
        engine.setValue(group, "rate_temp_up", 0);
    }
}

mp.lineFaderCoarse = function(midichan, control, value, status, group){
    engine.setValue(group, "volume", value/0x7f);
}

mp.lineFaderFine = function(midichan, control, value, status, group){
    //14bit linefader .... not on my watch today
}

mp.jogWheelTouch = function(midichan, control, value, status, group){
    var deckFromGroup = script.deckFromGroup(group);
    if(value == 0x7f){
        engine.scratchEnable(deckFromGroup, mp.scratchParams.ticks, mp.scratchParams.recordSpeed, mp.scratchParams.alpha, mp.scratchParams.beta, mp.scratchParams.ramp);
    }else{
        engine.scratchDisable(deckFromGroup);
    }
};

mp.jogWheelTwist = function(midichan, control, value, status, group){
    //var deckFromGroup = script.deckFromGroup(group);
    // We want extra-tight behaviour that's why deckFromGroup is not derived from an
    // expensive string-operation
    var deckFromGroup = 1;
    if(status==0xB1){
        deckFromGroup=2;
    }
    
    var newValue;
    
    if (value > 0x40) {
        newValue = value-0x3F;
    } 
    else if (value < 0x40) {
        newValue = value-0x41;
    }
    
    if (engine.isScratching(deckFromGroup)) {
        engine.scratchTick(deckFromGroup, (newValue/1.0)); // Scratch!
    }else{
        engine.setValue(group, 'jog', newValue/0x0a); // Pitch bend
    }
};

// Spinning Platter LEDs & Slicer Loop PAD LEDs as beat counter
// pulled together for the calculation to be done only once and then
// send LED signals to Jog or PAD LEDs when needed.
mp.trackPositionLEDs = function(value, group) {
    // do nothing before track starts
    if (value === 0) {
        return;
    }

    const deck = script.deckFromGroup(group)-1;
    const trackDuration = engine.getValue(group, "duration"); // in seconds
    const beatLength = engine.getValue(group, "file_bpm") / 60; // in Beats Per Seconds
    const cuePosition = engine.getValue(group, "cue_point") / engine.getValue(group, "track_samplerate") / 2; // in seconds
    const playPosition = value * trackDuration; // in seconds
    const jogLEDPosition = playPosition / 60 * mp.scratchParams.recordSpeed;
    const jogLEDNumber = 24; // LED ring contains 24 segments each triggered by the next even Midi value
    // check for Vinyl Mode and decide to spin the Jog LED or show play position
    const activeJogLED = mp.isVinylMode[deck] ? Math.round(jogLEDPosition * jogLEDNumber) % jogLEDNumber : Math.round(value * jogLEDNumber);
    // count the beats (1 to 8) after the CUE point
    const beatCountLED = (Math.floor((playPosition - cuePosition) * beatLength) % 8); //calculate PAD LED position
    // TODO(all): check for playposition < (trackduration - warning length) for sending position signals
    // check if a Jog LED has changed and if so then send the signal to the next Jog LED
    if (mp.prevJogLED[deck] !== activeJogLED) {
        midi.sendShortMsg(0xb0 + deck, 0x0a, activeJogLED + 0x00); // only each 2nd midi signal triggers the next LED
        mp.prevJogLED[deck] = activeJogLED;
    }
    // TODO(all): else blink the platter LEDs
    // check if Slicer mode is active and illuminate PAD LEDs counting with the beat while playing
    //if (!MC7000.experimental) {
    //    return;
    //}

    /*
    if (MC7000.PADModeSlicer[deck]) {
        // only send new LED status when beatCountLED really changes
        if (MC7000.prevPadLED[deck] !== beatCountLED) {
            // first set all LEDs to default color incl shifted
            for (let slicerIdx = 0; slicerIdx < 16; slicerIdx++) {
                midi.sendShortMsg(0x94 + deck, 0x14 + slicerIdx, MC7000.padColor.sliceron);
            }
            // now chose which PAD LED to turn on (+8 means shifted PAD LEDs)
            if (beatCountLED === 0) {
                midi.sendShortMsg(0x94 + deck, 0x14, MC7000.padColor.slicerJumpFwd);
                midi.sendShortMsg(0x94 + deck, 0x14 + 8, MC7000.padColor.slicerJumpFwd);
            } else if (beatCountLED === 7) {
                midi.sendShortMsg(0x94 + deck, 0x1B, MC7000.padColor.slicerJumpFwd);
                midi.sendShortMsg(0x94 + deck, 0x1B + 8, MC7000.padColor.slicerJumpFwd);
            } else if (beatCountLED > 0 && beatCountLED < 7) {
                midi.sendShortMsg(0x94 + deck, 0x14 + beatCountLED, MC7000.padColor.slicerJumpFwd);
                midi.sendShortMsg(0x94 + deck, 0x14 + 8 + beatCountLED, MC7000.padColor.slicerJumpFwd);
            }
        }
        MC7000.prevPadLED[deck] = beatCountLED;
    }
    */
};

mp.setLED = function (value, offset, group){
    var state_full;
    state_full = value ? 0x7F : 0x00;

    //send the commands
    if(deck == 1){
        midi.sendShortMsg(0x90, offset, state_full);
    }else if (deck == 2){
        midi.sendShortMsg(0x91, offset, state_full);
    }
};


mp.loopEnabled = function(group){
    var deck = script.deckFromGroup(group)-1;
    var b = engine.getValue(group, "loop_enabled");
    var val = 0x7F && b;
    midi.sendShortMsg(0x94 + deck, 0x32, val);
};



mp.keyLock = function (midichan, control, value, status, group) {
	var deck = script.deckFromGroup(group);
	deck -= 1;
	if(value > 0){
		//script.toggleControl(group, "keylock_toggle", 100);
		var keyLock = engine.getValue(group, "keylock");
		engine.setValue(group, "keylock", !keyLock);
		midi.sendShortMsg(0x90 + deck, 0x0d, value && !keyLock);
	}else{
		//engine.setValue(group, "keylock", 1);
	}
	
};

mp.headphoneCue = function (midichan, control, value, status, group) {
	var deck = script.deckFromGroup(group);
	//deck -= 1;
	var isEnabled = engine.getParameter("[Channel" + deck.toString() +"]", "pfl");
	if(value > 0){
		engine.setParameter("[Channel" + deck.toString() +"]", "pfl", !isEnabled);
	}else{
		
	}
};

mp.eq = function (midichan, control, value, status, group) {
	if(control==0x19){
		//Low
		engine.setValue("[EqualizerRack1_" + group + "_Effect1]","parameter1" , value*(4/127.0)-value*(2.0/127));
	}else if(control==0x18){
		//Mid
		engine.setValue("[EqualizerRack1_" + group + "_Effect1]","parameter2" , value*(4/127.0)-value*(2.0/127));
	}else if(control==0x17){
		//High
		engine.setValue("[EqualizerRack1_" + group + "_Effect1]","parameter3" , value*(4/127.0)-value*(2.0/127));

	}
};

mp.masterGain = function (midichan, control, value, status, group) {
    //engine.setValue("[Master]","gain" , value*(5/127.0) -value*(3.0/127));
    engine.setValue("[Master]","gain" , value*(5.0/127.0) );
};

mp.gain = function (midichan, control, value, status, group) {
	engine.setValue(group,"pregain" , value*(4/127.0)-value*(2.0/127));
};

mp.setLED = function(pStatus, pNumber, pValue){
	var val = (pValue>0) ? 0x7f : 0x00;
	midi.sendShortMsg(pStatus, pNumber, val);    //Pads left
};

mp.setChannelVU = function(pStatus, pNumber, pValue, group){
	var val = pValue*10.0;
	var multi = engine.getParameter(group,"volume")
	midi.sendShortMsg(pStatus, pNumber, val*multi);    //Pads left
};

mp.setMasterVU = function(pStatus, pNumber, pValue, pChannel){
	var val = pValue*10.0;
	//var multi = engine.getParameter("[Master]","crossfader");
	//multi += -1;
    var multi;
    if(pChannel==-1){
        multi = engine.getParameter("[Master]","VuMeterL");
    }else if(pChannel==1){
        multi = engine.getParameter("[Master]","VuMeterR");
    }else{
        multi = 0;
    }
    
	midi.sendShortMsg(pStatus, pNumber, val*multi);    //Pads left
};

mp.pitch = function (midichan, control, value, status, group) {
	var deck = script.deckFromGroup(group);
	deck -= 1;
	if(control==0x08){	//coarse
		mp.pitchMsbValue[deck] = value;
	}else if(control==0x09){	//fine
		mp.pitchLsbValue[deck] = value;
	}
	
	var tmp = (mp.pitchLsbValue[deck] << 3) | (mp.pitchMsbValue[deck] >> 4);
	engine.setValue(group, "rate", ((-1)*tmp/512)+1);

};

mp.fx = function (midichan, control, value, status, group) {
	var deck = script.deckFromGroup(group);
	
	if(value>0){
		if((status==0x98)||(status==0x99)){	// Buttons
			var enabled;
			if(control==0x00){
				enabled = engine.getParameter("[EffectRack1_EffectUnit" + deck + "_Effect1]", "enabled");
				engine.setParameter("[EffectRack1_EffectUnit" + deck + "_Effect1]", "enabled", !enabled);
			}else if(control==0x01){
				enabled = engine.getParameter("[EffectRack1_EffectUnit" + deck + "_Effect2]", "enabled");
				engine.setParameter("[EffectRack1_EffectUnit" + deck + "_Effect2]", "enabled", !enabled);
			}else if(control==0x02){
				enabled = engine.getParameter("[EffectRack1_EffectUnit" + deck + "_Effect3]", "enabled");
				engine.setParameter("[EffectRack1_EffectUnit" + deck + "_Effect3]", "enabled", !enabled);
			}
		}else if((status==0xb8)||(status==0xb9)){ // Pots
			if(control==0x00){
				engine.setParameter("[EffectRack1_EffectUnit" + deck + "_Effect1]", "meta", value/0x7f);
			}else if(control==0x01){
				engine.setParameter("[EffectRack1_EffectUnit" + deck + "_Effect2]", "meta", value/0x7f);
			}else if(control==0x02){
				engine.setParameter("[EffectRack1_EffectUnit" + deck + "_Effect3]", "meta", value/0x7f);
			}
		}
	}
};

mp.cueButton = function (midichan, control, value, status, group) {
	//var deck = script.deckFromGroup(group);
};

mp.censor = function (midichan, control, value, status, group) {
	var val = (value > 0)? 1:0;
	engine.setValue(group, "reverseroll", val);
    mp.setLED(status, control, value)
};

mp.touchStrip = function (midichan, control, value, status, group) {
	if(!bShift){
		engine.setValue(group, "playposition", value/127);
	}

};
mp.syncButton = function(midichan, control, value, status, group){
    
};

mp.libraryScroll = function (midichan, control, value, status, group) {
	var iStepSize = 1;
	if(control == 0x01){
		iStepSize = 10;
	}
	if(value==0x3f){
		engine.setValue("[Library]", "MoveVertical", iStepSize);
	}else if(value==0x41){
		engine.setValue("[Library]", "MoveVertical", iStepSize * (-1));
	}
};

mp.scrollWheelClick = function (midichan, control, value, status, group) {
	if(control == 0x06){
		if(value > 0){
			bScrollWheelClick = true;
			engine.setValue("[Library]", "MoveFocusBackward", 1);
		}else{
			bScrollWheelClick = false;
		}
	}else if(control == 0x07){ // Click+Shift
		if(value > 0){
			engine.setValue("[Library]", "GoToItem", 1);
		}
	}
};