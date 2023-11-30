
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

/*

    
*/

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


function TrackDataOut() {}
var controller = {};

controller.init = function() {  
    //----QuickFX initially OFF; setValue also works
    engine.setParameter("[QuickEffectRack1_[Channel1]_Effect1]", "enabled", 0);
    engine.setParameter("[QuickEffectRack1_[Channel2]_Effect1]", "enabled", 0);
};

controller.shutdown = function() {};

engine.connectControl("[Channel1]","play_latched", function(value, offset, group) { controller.buildSysex("[Channel1]"); });
engine.connectControl("[Channel1]","track_loaded", function(group) { controller.buildSysex("[Channel1]"); });
engine.connectControl("[Channel1]","bpm", function(group) { controller.buildSysex("[Channel1]"); });
engine.connectControl("[Channel1]","key", function(group) { controller.buildSysex("[Channel1]"); });
engine.connectControl("[Master]","crossfader", function(group) { controller.buildSysex("[Master]"); });

controller.getKeySysex = function(group){
    var t = engine.getValue(group, "key");
    var tSysex = "0x" + decimalToHex(t).toString();
    return tSysex;
};

// BPM is always 5 digits: 3 plus 2 decimals, leading zeros are padded
controller.getBpmSysex = function(group){
    var x = engine.getValue(group, "bpm");
    x *= 100;

    var s = Math.floor( x );
    var t = prePadding(s.toString(), 5, "0");

    var sArr = t.split('');
    var tSysex = "";
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
    return isPlaying;
}


controller.getCrossFaderSysex = function(){
    // -1.0 .. 1.0
    var t = engine.getValue("[Master]", "crossfader");
    t += 1.0;  //0.0..2.0
    return 127.0 * t/2.0;
};

// Duration is always 5 decimal digits, leading zeros are padded
controller.getDurationSysex = function(group){
    var t = engine.getValue(group, "duration");
    var s = Math.floor( t );
    var t = s.toString();

    t = prePadding(t, 5, "0");
    var sArr = t.split('');
    var tSysex = "";
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
    var tSysex = "";
    for(var i=0; i<sArr.length; i++){
        tSysex += " " + "0x0" + sArr[i];
    }
    tSysex = tSysex.trim();
    return tSysex;
}

controller.getFileKeySysex = function(group){
    var t = engine.getValue(group, "file_key");
    var tSysex = "0x" + decimalToHex(t).toString();
    return tSysex;
}

// Decimal representation of 3-byte Value. 8 digits: 0..16777215, leading zeros are padded
controller.getColorSysex = function(group){
    var strSysex = "";
    var s = parseInt(engine.getValue(group, "track_color"));
    if(s==-1){
        s=0;
    }
    var t = prePadding(s.toString(), 8, "0");

    var sArr = t.split('');
    var tSysex = "";
    for(var i=0; i<sArr.length; i++){
        tSysex += " " + "0x0" + sArr[i];
    }
    tSysex = tSysex.trim();
    return tSysex;
}


controller.buildSysex = function(group){
    var tRet = "";
    var tmpChan;
    tRet = SYSEX_MSG_START;

    if(group=="[Master]"){
        tmpChan = "0";
    }else if(group=="[Channel1]"){
       tmpChan = "1";
    }else if(group=="[Channel2]"){
        tmpChan = "2";
    }
    tRet += " " + SYSEX_ID_BPM + tmpChan;
    tRet += this.getBpmSysex(group);
    tRet += " " + SYSEX_ID_KEY + tmpChan;
    tRet += " " +this.getKeySysex(group);

    tRet += " " + SYSEX_ID_ISPLAYING + tmpChan;
    tRet += " " + this.getIsPlayingSysex(group);

    tRet += " " + SYSEX_ID_CROSSFADER + tmpChan;
    tRet += " " + this.getCrossFaderSysex();

    tRet += " " + SYSEX_ID_DURATION + tmpChan;
    tRet += " " + this.getDurationSysex(group);
    tRet += " " + SYSEX_ID_FILEBPM + tmpChan;
    tRet += " " + this.getFileBPMSysex(group);
    
    tRet += " " + SYSEX_ID_FILEKEY + tmpChan;
    tRet += " " + this.getFileKeySysex(group);

    tRet += " " + SYSEX_ID_COLOR + tmpChan;
    tRet += " " + this.getColorSysex(group);

    tRet += " " + SYSEX_MSG_END;
    
    sendSysex(tRet);
};

function sendSysex(p){
    p= p.replace("  ", " "); // Wo kommt das her?
    var arrVal = p.split(' ');
    var arrSysex = [SYSEX_MSG_START];

    for(var i=0; i<arrVal.length; i++){
       arrSysex.push( Number(arrVal[i]) );
    }
    arrSysex.push( SYSEX_MSG_END );
    if(arrSysex.length > 2){
        midi.sendSysexMsg(arrSysex, arrSysex.length);
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