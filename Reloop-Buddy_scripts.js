
//
// ****************************************************************************
// * Mixxx mapping script file for the Hercules DJControl Starlight.
// * Author: DJ Phatso
// * Version 1.0 (March 2019)
// * Forum: http://www.mixxx.org/forums/
// * Wiki: http://www.mixxx.org/wiki/
// ****************************************************************************

// ****************************************************************************
//Functions that could be implemented to the script:
//
//* Tweak/map the base LED to other functions (if possible)
//* FX:
//   - Potentially pre-select/load effects into deck and set parameters  			  
//* Tweak Jog wheels sensitivity
//* Make the vinyl buttons (scratch enable/Disable) actually work.... 
//* Optimize JS code.
// ****************************************************************************


const BLUE = 0x6B;
const GREEN = 0x7C;
const WHITE = 0x7F;
const PINK = 0x72;
const VIOLET = 0x73;
const ORANGE = 0x74;
const LIGHTGREEN = 0x78;
const RED = 0x70;


const MODE_NORMAL = 0x01;
const MODE_SAMPLER = 0x02;
const MODE_SETCOLOR = 0x04;

function ReloopBuddy() {}
var MyController = {};
var lMSB = 0;
var lLSB = 0;
var mode;

var STATE_ACTIVE = 0x01;
var STATE_INACTIVE = 0x00;
MyController.previewPlaying = false;
MyController.pitchMsbValue = [0x40, 0x40];
MyController.playState = [STATE_INACTIVE, STATE_INACTIVE];
MyController.loopState = [STATE_INACTIVE, STATE_INACTIVE];
MyController.cueButtonPressed = [STATE_INACTIVE, STATE_INACTIVE];
MyController.mode = [MODE_NORMAL, MODE_NORMAL];

var previousMode;

MyController.lastDeckLoaded = "";

MyController.init = function() {


    //All LEDs off
    var i;
    for (i = 0; i < 8; i++) { 
        midi.sendShortMsg(0x94, 0x14 + i, 0x00);    //Pads left
        midi.sendShortMsg(0x95, 0x14 + i, 0x00);    //Pads right
        //midi.sendShortMsg(0x95, 0x14 + i, 0x70);
    }
    
    midi.sendShortMsg(0x90, 0x1B, 0x00);    // Headphone-cue left
    midi.sendShortMsg(0x91, 0x1B, 0x00);    // Headphone-cue right

    //----QuickFX initially OFF; setValue also works
    engine.setParameter("[QuickEffectRack1_[Channel1]_Effect1]", "enabled", 0);
    engine.setParameter("[QuickEffectRack1_[Channel2]_Effect1]", "enabled", 0);

    //----Library focussed on the right-side pane
    //engine.setValue("[Library]", "MoveFocusForward", 1);
    //engine.setValue("[Library]", "MoveFocusBackward", 1);

    //----Zum Start das Item mit Playlists aufklappen
    engine.setValue("[Library]", "MoveDown", 1);
    engine.setValue("[Library]", "MoveDown", 1);
    engine.setValue("[Library]", "GoToItem", 1);



};

MyController.shutdown = function() {
    //All LEDs off
    var i;
    for (i = 0; i < 8; i++) { 
        midi.sendShortMsg(0x94, 0x14 + i, 0x00);    //Pads left
        midi.sendShortMsg(0x95, 0x14 + i, 0x00);    //Pads right
    }
    
    midi.sendShortMsg(0x90, 0x1B, 0x00);    // Headphone-cue left
    midi.sendShortMsg(0x91, 0x1B, 0x00);    // Headphone-cue right
};

MyController.padsOff_Deck = function(deck){
    if(deck == 1){
        for (var i = 0; i < 8; i++) { 
            midi.sendShortMsg(0x94, 0x14 + i, 0x00);    //Pads left
        }
    }else if(deck == 2){
        for (var i = 0; i < 8; i++) { 
            midi.sendShortMsg(0x95, 0x14 + i, 0x00);    //Pads left
        }
    }
};

MyController.padsOff_Deck1 = function(){
    for (var i = 0; i < 8; i++) { 
        midi.sendShortMsg(0x94, 0x14 + i, 0x00);    //Pads left
        //midi.sendShortMsg(0x95, 0x14 + i, 0x00);    //Pads right
        //midi.sendShortMsg(0x95, 0x14 + i, 0x70);
    }
};

MyController.padsOff_Deck2 = function(){
    for (var i = 0; i < 8; i++) { 
        //midi.sendShortMsg(0x94, 0x14 + i, 0x00);    //Pads left
        midi.sendShortMsg(0x95, 0x14 + i, 0x00);    //Pads right
        //midi.sendShortMsg(0x95, 0x14 + i, 0x70);
    }
};

//var i;
//for (i = 0; i < 8; i++) { 
//    engine.connectControl("[Channel1]","hotcue_"+ (i+1).toString() +"_enabled", function(value, offset) { MyController.hcue_deck1(value, 0x14 + i); });
//}
    
engine.connectControl("[Channel1]","hotcue_1_enabled", function(value, offset) { MyController.hcue_deck1(value, 0x14); });
engine.connectControl("[Channel1]","hotcue_2_enabled", function(value, offset) { MyController.hcue_deck1(value, 0x15); });
engine.connectControl("[Channel1]","hotcue_3_enabled", function(value, offset) { MyController.hcue_deck1(value, 0x16); });
engine.connectControl("[Channel1]","hotcue_4_enabled", function(value, offset) { MyController.hcue_deck1(value, 0x17); });
engine.connectControl("[Channel1]","hotcue_5_enabled", function(value, offset) { MyController.hcue_deck1(value, 0x18); });
engine.connectControl("[Channel1]","hotcue_6_enabled", function(value, offset) { MyController.hcue_deck1(value, 0x19); });
engine.connectControl("[Channel1]","hotcue_7_enabled", function(value, offset) { MyController.hcue_deck1(value, 0x1A); });
engine.connectControl("[Channel1]","hotcue_8_enabled", function(value, offset) { MyController.hcue_deck1(value, 0x1B); });
    
engine.connectControl("[Channel2]","hotcue_1_enabled", function(value, offset) { MyController.hcue_deck2(value, 0x14); });
engine.connectControl("[Channel2]","hotcue_2_enabled", function(value, offset) { MyController.hcue_deck2(value, 0x15); });
engine.connectControl("[Channel2]","hotcue_3_enabled", function(value, offset) { MyController.hcue_deck2(value, 0x16); });
engine.connectControl("[Channel2]","hotcue_4_enabled", function(value, offset) { MyController.hcue_deck2(value, 0x17); });
engine.connectControl("[Channel2]","hotcue_5_enabled", function(value, offset) { MyController.hcue_deck2(value, 0x18); });
engine.connectControl("[Channel2]","hotcue_6_enabled", function(value, offset) { MyController.hcue_deck2(value, 0x19); });
engine.connectControl("[Channel2]","hotcue_7_enabled", function(value, offset) { MyController.hcue_deck2(value, 0x1A); });
engine.connectControl("[Channel2]","hotcue_8_enabled", function(value, offset) { MyController.hcue_deck2(value, 0x1B); });


engine.connectControl("[Channel1]","play_latched", function(value, offset, group) { MyController.setLED(value, 0x00, "[Channel1]"); });
engine.connectControl("[Channel2]","play_latched", function(value, offset, group) { MyController.setLED(value, 0x00, "[Channel2]"); });

engine.connectControl("[Channel1]","pfl", function(value, offset, group) { MyController.setLED(value, 0x1B, "[Channel1]"); });
engine.connectControl("[Channel2]","pfl", function(value, offset, group) { MyController.setLED(value, 0x1B, "[Channel2]"); });

//----The SYNC-Button is connected to Preview. The CUE button is just too close to the PLAY button
engine.connectControl("[PreviewDeck1]","play", function(value, offset, group) { MyController.setLED(value, 0x02, "[Channel1]"); });
engine.connectControl("[PreviewDeck1]","play", function(value, offset, group) { MyController.setLED(value, 0x02, "[Channel2]"); });

/*
engine.connectControl("[Channel1]","play", function(index, value) { MyController.setPlayState(0, value); });
engine.connectControl("[Channel2]","play", function(index, value) { MyController.setPlayState(1, value); });
*/
/*
MyController.setPlayState = function(index, value){
    MyController.playState[index] = value;
};
*/

MyController.starsDown = function(midichan, control, value, status, group){
    /*engine.setValue("[Library]", "track_color_prev", 1.0);*/
    engine.setValue(MyController.lastDeckLoaded, "stars_down", 1.0);
};
MyController.starsUp = function(midichan, control, value, status, group){
    engine.setValue(MyController.lastDeckLoaded, "stars_up", 1.0);
};

// Make PFL Control a little less aggressive
MyController.headGain = function(midichan, control, value, status, group){
    engine.setValue("[Master]", "headGain", value/666);
};

MyController.starsDeck = function(midichan, control, value, status, group){
    
    var deck = script.deckFromGroup(group);
    if (value == 1){
        engine.setValue(group, "stars_up", 1.0);
    }else if(value==127){
        engine.setValue(group, "stars_down", 1.0);
    }
    //engine.setValue(MyController.lastDeckLoaded, "stars_up", 1.0);
};

MyController.resetColor = function(midichan, control, value, status, group){
    //track_color_prev
    //track_color_next
    //engine.setValue(group, "track_color", -1.0);
    
};

MyController.setColor = function(midichan, control, value, status, group){
    var deck = script.deckFromGroup(group);
    var midiID = 0x94 + parseInt(deck-1);
    for (var i = 0; i < 8; i++) { 
        midi.sendShortMsg(midiID, 0x14 + i, 0x00);    //Pads OFF   
    }
    if(value == 127){
        previousMode = MyController.mode[deck-1]; //Eine Variable: Hickhack bei gleichzeitiger Verwendung auf beiden Decks
        MyController.mode[deck-1] = MODE_SETCOLOR;
        midi.sendShortMsg(midiID, 0x14 + 0, RED);
        midi.sendShortMsg(midiID, 0x14 + 1, GREEN);
        midi.sendShortMsg(midiID, 0x14 + 2, VIOLET);
        midi.sendShortMsg(midiID, 0x14 + 3, ORANGE);

        midi.sendShortMsg(midiID, 0x14 + 4, BLUE);
        midi.sendShortMsg(midiID, 0x14 + 6, WHITE);
        midi.sendShortMsg(midiID, 0x14 + 7, WHITE);
        /*

        const GREEN = 0x7C;
        const WHITE = 0x7F;
        const PINK = 0x72;
        const VIOLET = 0x73;
        const ORANGE = 0x74;
        const LIGHTGREEN = 0x78;
        const RED = 0x70;
        const BLUE = 0x67 / 0x6B
        */
    }else if(value == 0){
        MyController.mode[deck-1] = previousMode;
        MyController.updateDecksAfterModeChange(group);
    }

};


MyController.setLED = function (value, offset, group){
    var deck = script.deckFromGroup(group);

    var state_full;
    state_full = value ? 0x7F : 0x00;

    //send the commands
    if(deck == 1){
        midi.sendShortMsg(0x90, offset, state_full);
    }else if (deck == 2){
        midi.sendShortMsg(0x91, offset, state_full);
    }
};

MyController.loadTrack = function(midichan, control, value, status, group){
    var deck = script.deckFromGroup(group);
    MyController.padsOff_Deck( deck );
    MyController.mode[deck-1]= MODE_NORMAL;
    
    engine.setValue(group, "LoadSelectedTrack", 1 );
    MyController.lastDeckLoaded = group;

    // PFL fuer das Deck aktivieren
    midi.sendShortMsg(0x90 + deck-1, 0x1B, 0x7F);    // Headphone-cue left
    // midi.sendShortMsg(0x91 + deck-1, 0x1B, 0x7F);    // Headphone-cue right

    engine.setParameter("[Channel" + deck.toString() +"]", "pfl", 1);

};

MyController.previewLoadAndPlay = function(midichan, control, value, status, group){
    if(value == 127){
        // var isPlaying = engine.getValue(group,"play",1);
        //if(isPlaying==0){
        //    engine.setValue(group, "LoadSelectedTrackAndPlay", 1);
        //}else{
        //    engine.setValue(group, "stop", 1); 
        //}
        engine.setValue(group, "LoadSelectedTrackAndPlay", 1);
    }else{
        engine.setValue(group, "stop", 1); 
    }

};

MyController.moveVertical = function(midichan, control, value, status, group){
    var iStepSize = 1;
    if(control == 0x78){ // Shift+Twist
        iStepSize = 15;
    }
    if(value == 1){ // Clockwise
        
    }else{
        iStepSize = iStepSize * (-1);
    }
    engine.setValue("[Library]", "MoveVertical", iStepSize);
};

MyController.toggleMode = function(midichan, control, value, status, group){
    
    var deck = script.deckFromGroup(group);
    //var color = GREEN;
    //var midiID = 0x94 + parseInt(deck-1);
    
    if( value == 127 ){ //Button DOWN    
        if (MyController.mode[deck-1]==MODE_NORMAL){
            MyController.mode[deck-1]= MODE_SAMPLER;
            //color = RED;        
        }else if(MyController.mode[deck-1]==MODE_SAMPLER){
            MyController.mode[deck-1]=MODE_NORMAL;
            //color = WHITE;
        } 
    }  
    MyController.updateDecksAfterModeChange(group);
};

MyController.updateDecksAfterModeChange = function(group){
    //----Decks updaten
    var deck = script.deckFromGroup(group);
    var mode = MyController.mode[deck-1];
    var midiID = 0x94 + parseInt(deck-1);
    var color = GREEN;
    if(mode == MODE_NORMAL){
        color = WHITE;
    }else if(mode == MODE_SAMPLER){
        color = RED;
    }


    for (var i = 0; i < 8; i++) { 
        if (MyController.mode[deck-1]==MODE_NORMAL){
            var x = engine.getValue(group, "hotcue_" + (i+1).toString() + "_enabled", 1 );
            if(x==1){
                midi.sendShortMsg(midiID, 0x14 + i, color);   
            }else{
                midi.sendShortMsg(midiID, 0x14 + i, 0x00);  
            }
        }else if(MyController.mode[deck-1]==MODE_SAMPLER){
            var x = engine.getValue("[Sampler"+ (i+1).toString()+"]", "track_loaded", 1 );
            if(x==1){
                var tmpCol = engine.getValue("[Sampler"+ (i+1).toString()+"]", "track_color", 1 );
                if(tmpCol==-1){
                    midi.sendShortMsg(midiID, 0x14 + i, color);   
                }else{
                    midi.sendShortMsg(midiID, 0x14 + i, GREEN);
                }
                
            }else{
                midi.sendShortMsg(midiID, 0x14 + i, 0x00);  
            }
        }
    }
}

//Control the hot cue leds for deck 1
MyController.hcue_deck1 = function (value, offset) {
    var state_full;
    
    var col;
    if(MyController.mode[0] == MODE_NORMAL){
        col=WHITE;
    }else if(MyController.mode[0]==MODE_SAMPLER){
        col=RED;
    }
    //Check if we want them illuminated or not and set the
    //relative brightness
    state_full = value ? /*0x7F*/ col : 0x00;

    //send the commands
    midi.sendShortMsg(0x94, offset, state_full);
};



//Control the hot cue leds for deck 2
MyController.hcue_deck2 = function (value, offset) {
    var state_full;
    
    var col;
    if(MyController.mode[1] == MODE_NORMAL){
        col=WHITE;
    }else if(MyController.mode[1]==MODE_SAMPLER){
        col=RED;
    }
    //Check if we want them illuminated or not and set the
    //relative brightness
    state_full = value ? /*0x7F*/ col : 0x00;

    //send the commands
    midi.sendShortMsg(0x95, offset, state_full);
};	

MyController.storeMSB_Left = function(midichan, control, value, status, group) {
    lMSB = value;
};

MyController.leftRate = function(midichan, control, value, status, group) {
    tmp = script.midiPitch(value,lMSB, status);
    tmp = lMSB*127 + value;
    engine.setValue(group, "rate", (lMSB*127 + value)/1016);
};

//----Momentary mapping for the fx-pedal
MyController.fxSwitch = function(midichan, control, value, status, group){
    if(value == 127){
        engine.setValue(group, "enabled", 1);
    }else if(value == 0){
        engine.setValue(group, "enabled", 0);
    }
};

MyController.moveToLibraryPane = function(midichan, control, value, status, group){
    if(value == 127){
        //----Left pane
        engine.setValue("[Library]", "MoveFocusBackward", 1);
        //engine.setValue("[Library]", "MoveFocus", -1);
    }else if(value == 0){
        //----Right pane
        //engine.setValue("[Library]", "MoveFocusForward", 1);
        //engine.setValue("[Library]", "MoveFocus", 1);
    }
    
};

MyController.playpause = function(midichan, control, value, status, group) {
    var deck = script.deckFromGroup(group);
    
    if(value == 127){
        
        // If a CUE is played by holding down the corresponding CUE button
        // we want the deck to continue playing when we also hit the PLAY button
        // and release the CUE button afterwards.
        if (engine.getValue(group, "play") == 1 ){
            if( MyController.cueButtonPressed[deck - 1] == STATE_INACTIVE){
                MyController.playState[deck-1]=STATE_INACTIVE;
                engine.setValue(group, "stop", 1);
            }else if( MyController.cueButtonPressed[deck - 1] == STATE_ACTIVE){
                MyController.playState[deck-1]=STATE_ACTIVE;
                engine.setValue(group, "play", 1);
            }
        }else{
            MyController.playState[deck-1]=1;
            engine.setValue(group, "play", 1);
        }
    }
};

/* Play cue 1, stop wehen releasing button */
MyController.hotcue_1 = function(midichan, control, value, status, group) {
   this._hotcue_playstop(midichan, value, group, 1);
};

MyController.hotcue_2 = function(midichan, control, value, status, group) {
    this._hotcue_playstop(midichan, value, group, 2);
 };

 MyController.hotcue_3 = function(midichan, control, value, status, group) {
    this._hotcue_playstop(midichan, value, group, 3);
 };

 MyController.hotcue_4 = function(midichan, control, value, status, group) {
    this._hotcue_playstop(midichan, value, group, 4);
 };

 MyController.hotcue_5 = function(midichan, control, value, status, group) {
    this._hotcue_playstop(midichan, value, group, 5);
 };

 MyController.hotcue_6 = function(midichan, control, value, status, group) {
    this._hotcue_playstop(midichan, value, group, 6);
 };

 MyController.hotcue_7 = function(midichan, control, value, status, group) {
    this._hotcue_playstop(midichan, value, group, 7);
 };

 MyController.hotcue_8 = function(midichan, control, value, status, group) {
    this._hotcue_playstop(midichan, value, group, 8);
 };

 /* set cue if it does not exist, clear cue if it does */
 MyController.hotcue_setclear_1 = function(midichan, control, value, status, group) {
    this._hotcue_setclear(value, group, 1);
 };

 MyController.hotcue_setclear_2 = function(midichan, control, value, status, group) {
    this._hotcue_setclear(value, group, 2);
 };

 MyController.hotcue_setclear_3 = function(midichan, control, value, status, group) {
    this._hotcue_setclear(value, group, 3);
 };

 MyController.hotcue_setclear_4 = function(midichan, control, value, status, group) {
    this._hotcue_setclear(value, group, 4);
 };

 MyController.hotcue_setclear_5 = function(midichan, control, value, status, group) {
    this._hotcue_setclear(value, group, 5);
 };

 MyController.hotcue_setclear_6 = function(midichan, control, value, status, group) {
    this._hotcue_setclear(value, group, 6);
 };

 MyController.hotcue_setclear_7 = function(midichan, control, value, status, group) {
    this._hotcue_setclear(value, group, 7);
 };

 MyController.hotcue_setclear_8 = function(midichan, control, value, status, group) {
    this._hotcue_setclear(value, group, 8);
 };
 
 MyController._hotcue_setclear = function(value, group, hotcue){
    if(value == 127){
        var x = engine.getValue(group, "hotcue_" + hotcue.toString() + "_enabled", 1 );
        if(x===1){
            //Cue exists
            engine.setValue(group, "hotcue_" + hotcue.toString() + "_clear", 1 );  
        }else{
            //Cue does not exist
            engine.setValue(group, "hotcue_" + hotcue.toString() + "_set", 1 );  
        }
    }
 };


MyController._hotcue_playstop = function(midichan, value, group, hotcue){
    var tmpOrientation;
    var tmpVolume;

    var deck = script.deckFromGroup(group);
    var tmpMode = MyController.mode[deck-1];
    
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
                MyController.playState[deck-1] = STATE_ACTIVE;  
            }else{
                MyController.playState[deck-1] = STATE_INACTIVE;      
            }
            var x = engine.getValue(group, "hotcue_" + hotcue.toString() + "_enabled", 1 );
            engine.setValue(group, "hotcue_" + hotcue.toString() +  "_gotoandplay", 1);   
            MyController.cueButtonPressed[deck - 1] = STATE_ACTIVE;
        }else{
            if (MyController.playState[deck-1] == STATE_INACTIVE){
                //Deck is not already playing
                engine.setValue(group, "hotcue_" + hotcue.toString() + "_gotoandstop", 1);
            }else if (MyController.playState[deck-1] == STATE_ACTIVE){
                // Deck is already playing
            }  
            MyController.cueButtonPressed[deck - 1] = STATE_INACTIVE;      
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





// Pitch slider rate change, MSB (Most significant bits in 14bit mode, or directly the value in 7bit)
MyController.deckRateMsb = function(midichan, control, value, status, group) {
    
    //var invertval = 127-value;
    var deck = script.deckFromGroup(group);
    //Calculating this always, or else the first time will not work
    //(which is precisely when the controller reports the initial positions)
    MyController.pitchMsbValue[deck - 1] = value;
    //if (MyController.pitch14bitMode === false) {
    //    engine.setValue(group, "rate", script.midiPitch(0,invertval, status));
    //}
};

// Pitch slider rate change, LSB (Least significant bits in 14bit mode, not called in 7bit)
MyController.deckRateLsb = function(midichan, control, value, status, group) {
        var invertval = 127-value;
        var deck = script.deckFromGroup(group);
        var msbval = MyController.pitchMsbValue[deck - 1];
        //MyController.pitch14bitMode = true;
        // engine.setValue(group, "rate", script.midiPitch(invertval,msbval,/*0xE0*/ status));
        var xvalue = (msbval << 7) | value;// invertval;
        var xrate = (512-xvalue) / 512;
        engine.setValue(group, "rate", xrate);
};

MyController.toggleLoop = function(midichan, control, value, status, group){
    // beatloop_activate
    var deck = script.deckFromGroup(group);

    var loopActive = engine.getValue(group, "loop_enabled");

    //---Maybe 'someone' cvhanged 'something' via the GUI
    MyController.loopState[deck -1]= loopActive;

   if(value == 127){
        if(MyController.loopState[deck -1]==STATE_INACTIVE){
            MyController.loopState[deck -1] = STATE_ACTIVE;
            engine.setValue(group, "beatloop_activate", 1);
        }else if(MyController.loopState[deck -1]==STATE_ACTIVE){
            MyController.loopState[deck -1] = STATE_INACTIVE;
            engine.setValue(group, "loop_exit", 1);
        }
    }
};

MyController.setLoopsize = function(midichan, control, value, status, group){
    // [Channel1],loop_double
    var deck = script.deckFromGroup(group);
    
    if(value == 127){ //CounterClockWise
        engine.setValue(group, "loop_halve", 1);
    }else{
        engine.setValue(group, "loop_double", 1);
    }
};

MyController.wheelTouchA = function (midichan, control, value, status, group) {
    var deck = script.deckFromGroup(group);
    if(value > 0){
        var alpha = 1.0/8;
        var beta = alpha/32;
        engine.scratchEnable(deck, 360, 33+1/3, alpha, beta);
    }else{
        engine.scratchDisable(deck);
    }
};

MyController.scratchWheelA = function (midichan, control, value, status, group) {
    var deck = script.deckFromGroup(group);
    
    var newValue;
    if (value < 64) {
        newValue = value;
    } else {
        newValue = value - 128;
    }

    if (engine.isScratching(deck)) {
        engine.scratchTick(deck, newValue); // Scratch!
    }else{
        engine.setValue(group, 'jog', newValue); // Pitch bend
    }
};


MyController.wheelTouchB = function (midichan, control, value, status, group) {
    var deck = script.deckFromGroup(group);
    if(value > 0){
        var alpha = 1.0/8;
        var beta = alpha/32;
        engine.scratchEnable(deck, 360, 33+1/3, alpha, beta);
    }else{
        engine.scratchDisable(deck);
    }
};

MyController.scratchWheelB = function (midichan, control, value, status, group) {
    var deck = script.deckFromGroup(group);
    
    var newValue;
    if (value < 64) {
        newValue = value;
    } else {
        newValue = value - 128;
    }

    if (engine.isScratching(deck)) {
        engine.scratchTick(deck, newValue); // Scratch!
    }else{
        engine.setValue(group, 'jog', newValue); // Pitch bend
    }
};

MyController.addAutoDJ = function (midichan, control, value, status, group) {
    if (value > 64) {
        engine.setValue("[Library]", "AutoDjAddBottom", 1);
    } else {
        //NOP
    }
};
