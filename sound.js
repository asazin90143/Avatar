const SoundManager = {
    ctx: null,
    muted: false,

    init: function () {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            console.log("AudioContext initialized");
        } catch (e) {
            console.error("Web Audio API is not supported in this browser");
        }
    },

    toggleMute: function () {
        this.muted = !this.muted;
        return this.muted;
    },

    // Base tone generator
    playTone: function (freq, type, duration, vol = 0.1) {
        if (!this.ctx || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    // Noise generator for hits/explosions
    playNoise: function (duration, vol = 0.2) {
        if (!this.ctx || this.muted) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    },

    /* --- SOUND EFFECTS --- */

    playHover: function () {
        this.playTone(400, 'sine', 0.05, 0.05);
    },

    playClick: function () {
        this.playTone(600, 'square', 0.1, 0.1);
    },

    playAttack: function (type) {
        // Light: High pitch, fast
        // Heavy: Low pitch, longer
        if (type === 'light') {
            this.playTone(800, 'triangle', 0.1, 0.1);
        } else if (type === 'mid') {
            this.playTone(600, 'sawtooth', 0.2, 0.15);
        } else if (type === 'heavy') {
            this.playTone(300, 'square', 0.3, 0.2);
        } else {
            // Special
            this.playTone(1000, 'sine', 0.5, 0.2);
            setTimeout(() => this.playTone(800, 'sine', 0.5, 0.2), 100);
            setTimeout(() => this.playTone(600, 'sine', 0.5, 0.2), 200);
        }
    },

    playDamage: function () {
        this.playNoise(0.2, 0.3);
    },

    playWin: function () {
        if (!this.ctx || this.muted) return;
        // Simple Arpeggio: C - E - G - C
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            gain.gain.setValueAtTime(0.1, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    },

    playLose: function () {
        if (!this.ctx || this.muted) return;
        // Descending tones
        const now = this.ctx.currentTime;
        [400, 300, 200].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + i * 0.3);
            gain.gain.setValueAtTime(0.1, now + i * 0.3);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.3);
            osc.stop(now + i * 0.3 + 0.3);
        });
    }
};
