

class AudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized: boolean = false;

  constructor() {
    // Lazy initialization
  }

  init() {
    if (this.initialized) return;
    
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.4; // Master volume
      this.initialized = true;

      // Handle browser autoplay policy
      if (this.ctx.state === 'suspended') {
        const resume = () => {
          this.ctx?.resume();
          // Play a silent buffer to fully unlock iOS/Android audio
          const buffer = this.ctx?.createBuffer(1, 1, 22050);
          const source = this.ctx?.createBufferSource();
          if (source && buffer) {
            source.buffer = buffer;
            source.connect(this.ctx!.destination);
            source.start(0);
          }
          window.removeEventListener('click', resume);
          window.removeEventListener('touchstart', resume);
          window.removeEventListener('keydown', resume);
        };
        window.addEventListener('click', resume);
        window.addEventListener('touchstart', resume);
        window.addEventListener('keydown', resume);
      }
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  private createOscillator(type: OscillatorType, freq: number, startTime: number, duration: number) {
    if (!this.ctx || !this.masterGain) return null;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    return { osc, gain };
  }

  playTick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    
    // High-tech blip
    const { osc, gain } = this.createOscillator('sine', 1200, t, 0.05) || {};
    if (osc && gain) {
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);
    }
  }

  playShuffle() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    
    // Soft mechanical click (filtered noise simulation via random freq)
    const { osc, gain } = this.createOscillator('square', Math.random() * 200 + 100, t, 0.03) || {};
    if (osc && gain) {
      gain.gain.setValueAtTime(0.02, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.02);
      osc.start(t);
      osc.stop(t + 0.02);
    }
  }

  playLock(step: number = 1) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;

    // Distinct sounds for each step
    // Step 1 & 2: Mechanical lock
    // Step 3: Heavy final lock
    const baseFreq = step === 3 ? 80 : (150 + (step - 1) * 50); 
    const duration = step === 3 ? 0.6 : 0.3;
    const volume = step === 3 ? 0.6 : 0.3;

    // Core impact sound
    const { osc, gain } = this.createOscillator(step === 3 ? 'square' : 'triangle', baseFreq, t, duration) || {};
    if (osc && gain) {
      osc.frequency.exponentialRampToValueAtTime(40, t + (duration * 0.5));
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.start(t);
      osc.stop(t + duration);
    }
    
    // Metallic/High-tech overtone - Pitch rises with each step
    const metalFreq = 800 * step;
    const metal = this.createOscillator('sawtooth', metalFreq, t, 0.15);
    if (metal) {
      metal.gain.gain.setValueAtTime(0.05 + (step * 0.03), t);
      metal.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      metal.osc.start(t);
      metal.osc.stop(t + 0.15);
    }
  }

  playTransition() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;

    // Swell/Charge up
    const { osc, gain } = this.createOscillator('sine', 100, t, 1.0) || {};
    if (osc && gain) {
      osc.frequency.exponentialRampToValueAtTime(400, t + 1.0);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.5);
      gain.gain.linearRampToValueAtTime(0, t + 1.0);
      osc.start(t);
      osc.stop(t + 1.0);
    }
  }

  playReveal() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    
    // Major Chord Arpeggio (C Major: C, E, G, C)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, i) => {
      const startTime = t + i * 0.05;
      const { osc, gain } = this.createOscillator('triangle', freq, startTime, 1.5) || {};
      if (osc && gain) {
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5);
        osc.start(startTime);
        osc.stop(startTime + 1.5);
      }
    });

    // Low Bass Impact
    const bass = this.createOscillator('sine', 60, t, 2.0);
    if (bass) {
      bass.gain.gain.setValueAtTime(0.4, t);
      bass.gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
      bass.osc.start(t);
      bass.osc.stop(t + 2.0);
    }
  }
}

export const audioController = new AudioController();
