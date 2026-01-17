class AudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized = false;
  private unlocked = false;

  constructor() {
    this.bindUnlockEvents();
  }

  // ---------- INITIALIZATION ----------
  init() {
    if (this.initialized) return;

    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      // 🔊 FULL VOLUME
      this.masterGain.gain.value = 0.4;

      this.initialized = true;
    } catch (err) {
      console.warn("Web Audio API not supported", err);
    }
  }

  // ---------- AUDIO UNLOCK (CRITICAL) ----------
  private bindUnlockEvents() {
    const unlock = async () => {
      this.init();
      if (!this.ctx || this.unlocked) return;

      if (this.ctx.state === "suspended") {
        await this.ctx.resume();
      }

      // 🔓 Silent buffer unlock (iOS / Android)
      const buffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);

      this.unlocked = true;

      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };

    window.addEventListener("click", unlock, { passive: true });
    window.addEventListener("touchstart", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
  }

  // ---------- ENSURE AUDIO IS RUNNING ----------
  private ensureRunning() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // ---------- OSCILLATOR HELPER ----------
  private createOscillator(
    type: OscillatorType,
    freq: number
  ): { osc: OscillatorNode; gain: GainNode } | null {
    if (!this.ctx || !this.masterGain) return null;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    osc.connect(gain);
    gain.connect(this.masterGain);

    return { osc, gain };
  }

  // ---------- UI SOUNDS ----------
  playTick() {
    this.ensureRunning();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const sound = this.createOscillator("sine", 1200);
    if (!sound) return;

    sound.gain.gain.setValueAtTime(0.15, t);
    sound.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    sound.osc.start(t);
    sound.osc.stop(t + 0.05);
  }

  playShuffle() {
    this.ensureRunning();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const sound = this.createOscillator(
      "square",
      Math.random() * 200 + 100
    );
    if (!sound) return;

    sound.gain.gain.setValueAtTime(0.12, t);
    sound.gain.gain.linearRampToValueAtTime(0, t + 0.03);

    sound.osc.start(t);
    sound.osc.stop(t + 0.03);
  }

  playLock(step: number = 1) {
    this.ensureRunning();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    const baseFreq = step === 3 ? 80 : 150 + (step - 1) * 50;
    const duration = step === 3 ? 0.6 : 0.3;
    const volume = step === 3 ? 0.8 : 0.5;

    // Core impact
    const core = this.createOscillator(
      step === 3 ? "square" : "triangle",
      baseFreq
    );
    if (core) {
      core.osc.frequency.exponentialRampToValueAtTime(
        40,
        t + duration * 0.5
      );
      core.gain.gain.setValueAtTime(volume, t);
      core.gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      core.osc.start(t);
      core.osc.stop(t + duration);
    }

    // Metallic overtone
    const metal = this.createOscillator("sawtooth", 800 * step);
    if (metal) {
      metal.gain.gain.setValueAtTime(0.2, t);
      metal.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      metal.osc.start(t);
      metal.osc.stop(t + 0.15);
    }
  }

  playTransition() {
    this.ensureRunning();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const sound = this.createOscillator("sine", 100);
    if (!sound) return;

    sound.osc.frequency.exponentialRampToValueAtTime(400, t + 1.0);
    sound.gain.gain.setValueAtTime(0, t);
    sound.gain.gain.linearRampToValueAtTime(0.4, t + 0.5);
    sound.gain.gain.linearRampToValueAtTime(0, t + 1.0);

    sound.osc.start(t);
    sound.osc.stop(t + 1.0);
  }

  playReveal() {
    this.ensureRunning();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 🎶 Major chord arpeggio (C Major)
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, i) => {
      const start = t + i * 0.05;
      const sound = this.createOscillator("triangle", freq);
      if (!sound) return;

      sound.gain.gain.setValueAtTime(0, start);
      sound.gain.gain.linearRampToValueAtTime(0.4, start + 0.1);
      sound.gain.gain.exponentialRampToValueAtTime(
        0.001,
        start + 1.5
      );

      sound.osc.start(start);
      sound.osc.stop(start + 1.5);
    });

    // 🔊 Bass hit
    const bass = this.createOscillator("sine", 60);
    if (bass) {
      bass.gain.gain.setValueAtTime(0.8, t);
      bass.gain.gain.exponentialRampToValueAtTime(0.001, t + 2);

      bass.osc.start(t);
      bass.osc.stop(t + 2);
    }

    // ✨ Crystal chime
    const chimeTime = t + 0.4;
    const chime = this.createOscillator("sine", 2093);
    if (chime) {
      chime.gain.gain.setValueAtTime(0, chimeTime);
      chime.gain.gain.linearRampToValueAtTime(
        0.15,
        chimeTime + 0.1
      );
      chime.gain.gain.exponentialRampToValueAtTime(
        0.001,
        chimeTime + 3
      );

      chime.osc.start(chimeTime);
      chime.osc.stop(chimeTime + 3);
    }
  }
}

export const audioController = new AudioController();
