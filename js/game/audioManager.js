'use strict'

//createjs用CDN引入

var AudioManager = function () {
    this.instances = {};
    this.isOk = 0;
    this.audioConfig = [
        // 'bg',
        'cool',
        'perfect',
        'success',
        'fail',
        'start',
        'push',
        'push_loop',
    ];
    this.SoundJS = createjs.Sound;
    
    this._registerMusic();
    this._initMusicInstance();
}

Object.assign(AudioManager.prototype, {
    _registerMusic : function(){
        // console.log(createjs, this.SoundJS)
        this.SoundJS.alternateExtensions = ["mp3"];
        this.SoundJS.on("fileload", ()=>{
            this.isOk+=1;
            if(this.isOk == 6) console.log("Loading Sound ... 100%");
        });
        for(let i=0;i<this.audioConfig.length;i++){
            let c = this.audioConfig[i];
            this.SoundJS.registerSound(`../../res/audio/${c}.mp3`, c, i);
        }
    },
    _initMusicInstance: function(){
        for(let i=0;i<this.audioConfig.length;i++){
            let c = this.audioConfig[i];
            let instance = this.SoundJS.play(`../../res/audio/${c}.mp3`);
            this.instances[c] = instance;
        }
    },
    play(key){
        let ins = this.instances[key];
        ins.volume = 0.7;
        if(key === 'bg') ins.volume = 0.2;
        else if(key === 'cool' || key === 'perfect') ins.volume = 1;
        ins.play();
    },
    stop(key){
        let ins = this.instances[key];
        ins.stop();
    },
    replay(key){
        let ins = this.instances[key];
        ins.play();
    }
})

module.exports = AudioManager