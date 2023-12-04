
//
// ****************************************************************************
// * Mixxx script for sending out trackdata via Sysex.
// * Author: Andy Fischer
// * Version 1.0 (November 2023)
// * Forum: http://www.mixxx.org/forums/
// * Wiki: http://www.mixxx.org/wiki/
// * Github: 
// * Corresponding hardware: https://github.com/Andymann/Arduino_ClockBox_v3
// ****************************************************************************



const SYSEX_MSG_START = "0xF0";
const SYSEX_MSG_END = "0xF7";
const SYSEX_ID_BPM = "0x7F 0x01 0x1";        // 5 Bytes, Digit by digit, decimal representation, real-time value: 123,45 Bpm: 0x01 0x02 0x03 0x04 0x05
const SYSEX_ID_KEY = "0x7F 0x01 0x2";        // 1 Byte, real-time value, dependent on pitch (if keylock is disabled)
const SYSEX_ID_ISPLAYING = "0x7F 0x01 0x3";  // 1 Byte, 0x00 or 0x01
const SYSEX_ID_CROSSFADER = "0x7F 0x01 0x4"; // 1 Byte: 0..127 (left..right)
const SYSEX_ID_DURATION = "0x7F 0x02 0x1";   // 4 Bytes: Value in seconds, constant value
const SYSEX_ID_FILEBPM = "0x7F 0x02 0x2";    // 5 Bytes (27 hours max), digit by digit, decimal representation, constant value
const SYSEX_ID_FILEKEY = "0x7F 0x02 0x3";    // 1 Byte, constant value, https://manual.mixxx.org/2.3/en/chapters/appendix/mixxx_controls.html#control-[ChannelN]-key
const SYSEX_ID_COLOR = "0x7F 0x02 0x4";      // Decimal representation of 3 Bytes: 8 digits. 0..16777215, constant value

const RESENDS = 3;

//function TrackDataOut() {}
var controller = {};

var sLastSysexString = "";
var fLastBPM = 0.0;
var iResendCounter = RESENDS;

controller.init = function() {  
    //----QuickFX initially OFF; setValue also works
    engine.setParameter("[QuickEffectRack1_[Channel1]_Effect1]", "enabled", 0);
    engine.setParameter("[QuickEffectRack1_[Channel2]_Effect1]", "enabled", 0);
};

controller.shutdown = function() {};

engine.connectControl("[Channel1]","track_loaded", function(group, bResend) { controller.changeTrack("[Channel1]", false); });
engine.connectControl("[Channel2]","track_loaded", function(group, bResend) { controller.changeTrack("[Channel2]", false); });

//engine.connectControl("[Channel1]","track_loaded", function(group) { changeTrack2("[Channel1]"); });

engine.connectControl("[Channel1]","play_latched", function(group, bResend) { controller.changePlaystate("[Channel1]", false); });
engine.connectControl("[Channel2]","play_latched", function(group, bResend) { controller.changePlaystate("[Channel2]", false); });

engine.connectControl("[Channel1]","bpm", function(group, bResend) { controller.changeBPM("[Channel1]", true); });
engine.connectControl("[Channel2]","bpm", function(group, bResend) { controller.changeBPM("[Channel2]", true); });

engine.connectControl("[Channel1]","bpm", function(group, bResend) { controller.changeCrossfaderBPM("[Channel1]", true); });
engine.connectControl("[Channel2]","bpm", function(group, bResend) { controller.changeCrossfaderBPM("[Channel2]", true); });

engine.connectControl("[Channel1]","key", function(group, bResend) { controller.changeKey("[Channel1]", false); });
engine.connectControl("[Channel2]","key", function(group, bResend) { controller.changeKey("[Channel2]", false); });

engine.connectControl("[Master]","crossfader", function(group, bResend) { controller.changeCrossfader("[Master]", true); });


engine.beginTimer(500, function() {
    resendLastSysex();
}, false);


// New track: complete sysex data are sent
controller.changeTrack = function(group, bResend){
    
    engine.beginTimer(500, function() {
        this.changeBPM(group, bResend);
        this.changeKey(group, bResend);
        this.changePlaystate(group, bResend);
        this.changeCrossfader(group, bResend);

        // Constant values
        this.sendDuration(group, bResend);
        this.sendFileBPM(group, bResend);
        this.sendFileKey(group, bResend);
        this.sendColor(group, bResend);
        
    }, true);
};

changeTrack2 = function(group){
    engine.beginTimer(5, function() {
        var t = engine.getValue(group, "duration");
    print("--------------------" + group + " " + t);

    var u = engine.getValue(group, "bpm");
    print("--------------------" + group + " " + u);
    }, true);
    // BUG:
    // duration is alway 1 behind.
    
};

controller.sendDuration = function(group, bResend){
    var sysex = "";
    sysex += SYSEX_MSG_START;
    sysex += " ";
    sysex += this.getDurationSysex(group);
    sysex +=" ";
    sysex += SYSEX_MSG_END;
    sendSysex( sysex, bResend);
};

controller.sendFileBPM = function(group, bResend){
    var sysex = SYSEX_MSG_START;
    sysex += " ";
    sysex += this.getFileBPMSysex(group);
    sysex +=" ";
    sysex += SYSEX_MSG_END;
    sendSysex( sysex, bResend);
};

controller.sendFileKey = function(group, bResend){
    var sysex = SYSEX_MSG_START;
    sysex += " ";
    sysex += this.getFileKeySysex(group);
    sysex +=" ";
    sysex += SYSEX_MSG_END;
    sendSysex( sysex, bResend);
};

controller.sendColor = function(group, bResend){
    var sysex = SYSEX_MSG_START;
    sysex += " ";
    sysex += this.getColorSysex(group);
    sysex +=" ";
    sysex += "0xF7";
    sendSysex( sysex, bResend);
};

//Sends out BPM values on CHANGE
controller.changeBPM = function(group, bResend){
    var tmp = engine.getValue(group, "bpm");
    if( tmp!=fLastBPM){
        var sysex = SYSEX_MSG_START;
        sysex += " ";
        sysex += this.getBpmSysex(group);
        sysex +=" ";
        sysex += SYSEX_MSG_END;
        sysex = sysex.trim();
        sendSysex( sysex, bResend);
        fLastBPM = tmp;
    }   
    
};

// Send BPM data based on Crossfader setting
controller.changeCrossfaderBPM = function(group, bResend){

    var t = engine.getValue("[Master]", "crossfader");
    if(t<=0.0){
        //Crossfader links + mitte
        if(group=="[Channel1]"){
            this.changeBPM("[Channel1]", bResend);
        }
    }else{
        if(group=="[Channel2]"){
            this.changeBPM("[Channel2]", bResend);
        }
    }
};


controller.changeKey = function(group, bResend){
    var sysex = SYSEX_MSG_START;
    sysex += " ";
    sysex += this.getFileKeySysex(group);
    sysex +=" ";
    sysex += SYSEX_MSG_END;
    sendSysex( sysex, bResend);
};

//changing the crossfader also affects which deck is setting the BPM for external gear
controller.changeCrossfader = function(group, bResend){

    var t = engine.getValue("[Master]", "crossfader");
    if(t<=0.0){
        this.changeBPM("[Channel1]", false);
    }else{
        this.changeBPM("[Channel2]", false);
    }

    var sysex = SYSEX_MSG_START;
    sysex += " ";
    sysex += this.getCrossFaderSysex(group);
    sysex +=" ";
    sysex += SYSEX_MSG_END;
    sendSysex( sysex, bResend);
};

controller.changePlaystate = function(group, bResend){
    
    var sysex = SYSEX_MSG_START;
    sysex += " ";
    sysex += this.getIsPlayingSysex(group);
    sysex +=" ";
    sysex += SYSEX_MSG_END;
    sendSysex( sysex, bResend);
};


controller.getKeySysex = function(group){
    var t = engine.getValue(group, "key");
    var tSysex = "0x" + decimalToHex(t).toString();
    return tSysex;
};

// BPM is always 5 digits: 3 plus 2 decimals, leading zeros are padded
controller.getBpmSysex = function(group){
    var x = engine.getValue(group, "bpm");
    x *= 100;

    //var s = Math.floor( x );
    var s = Math.round( x );
    var t = prePadding(s.toString(), 5, "0");

    var sArr = t.split('');
    var tSysex = SYSEX_ID_BPM + script.deckFromGroup(group);
    for(var i=0; i<sArr.length; i++){
        tSysex += " " + "0x0" + sArr[i];
    }
    return tSysex;
};

controller.getIsPlayingSysex = function(group){
    var isPlaying = "";
    if(engine.getValue(group, "play_latched") == 1){
        isPlaying = "0x01";
    }else{
        isPlaying = "0x00";
    }
    isPlaying = SYSEX_ID_ISPLAYING + script.deckFromGroup(group) + " " + isPlaying;
    return isPlaying;
}


controller.getCrossFaderSysex = function(group){
    // -1.0 .. 1.0
    var t = engine.getValue("[Master]", "crossfader");
    t += 1.0;  //0.0..2.0
    var cf =  127.0 * t/2.0;
    cf = String(cf, 16);
    cf = prePadding(cf, 1, "0");
    return SYSEX_ID_CROSSFADER + script.deckFromGroup(group) + " " + cf.toString();
};

// Duration is always 5 decimal digits, leading zeros are padded
controller.getDurationSysex = function(group){
    var t = engine.getValue(group, "duration");
    print("--------------------" + group + " " + t);
    var s = Math.floor( t );
    var p = s.toString();

    p = prePadding(p, 5, "0");
    var sArr = p.split('');
    var tSysex = SYSEX_ID_DURATION + script.deckFromGroup(group);
    for(var i=0; i<sArr.length; i++){
        tSysex += " " + "0x0" + sArr[i];
    }
    return tSysex;
};

controller.getFileBPMSysex = function(group){
    var x = engine.getValue(group, "file_bpm");
    x *= 100;
    var s = Math.floor( x );
    var t = prePadding(s.toString(), 5, "0");
    var sArr = t.split('');
    var tSysex = SYSEX_ID_FILEBPM + script.deckFromGroup(group);
    for(var i=0; i<sArr.length; i++){
        tSysex += " " + "0x0" + sArr[i];
    }
    tSysex = tSysex.trim();
    return tSysex;
};

controller.getFileKeySysex = function(group){
    var t = engine.getValue(group, "file_key");
    var tSysex = SYSEX_ID_FILEKEY + script.deckFromGroup(group) + " " + "0x" + decimalToHex(t).toString();
    return tSysex;
};

// Decimal representation of 3-byte Value. 8 digits: 0..16777215, leading zeros are padded
controller.getColorSysex = function(group){
    var s = parseInt(engine.getValue(group, "track_color"));
    if(s==-1){
        s=0;
    }
    var t = prePadding(s.toString(), 8, "0");

    var sArr = t.split('');
    var tSysex = SYSEX_ID_COLOR + script.deckFromGroup(group);
    for(var i=0; i<sArr.length; i++){
        tSysex += " " + "0x0" + sArr[i];
    }
    tSysex = tSysex.trim();
    return tSysex;
};




function sendSysex(p, bResend){
    p= p.replace("  ", " "); // Wo kommt das her?
    var arrVal = p.split(' ');
    var arrSysex = [];

    if(bResend){
        iResendCounter = RESENDS;
    }else{
        iResendCounter = 0;
    }

    sLastSysexString = p; //global parken um ggf nochmal senden zu koennen

    for(var i=0; i<arrVal.length; i++){
       arrSysex.push( Number(arrVal[i]) );
    }
    arrSysex.push( SYSEX_MSG_END );
    if(arrSysex.length > 2){
        midi.sendSysexMsg(arrSysex, arrSysex.length);
    }
}

// sometimes data processing via midi is too slow (e.g. pitch fader) so we make sure that the last value is
// transmitted another time
//
// this function is repeatedly called via timer interval
function resendLastSysex(){
    if(sLastSysexString.length>0){ 
        if(iResendCounter>0){
            sendSysex( sLastSysexString, false );
            iResendCounter--;
        }
    } 
}

function decimalToHex(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
    while (hex.length < padding) {
        hex = "0" + hex;
    }
    return hex;
}

function prePadding(sInputstring, sTargetLength, sPaddigChar){
    var sOut ="";
    var padding = "";
    if(sInputstring.length<sTargetLength){
        for(var i=sInputstring.length; i< sTargetLength; i++){
            padding += sPaddigChar;
        }
    }
    sOut = padding.toString() + sInputstring.toString();
    return sOut.toString();
}