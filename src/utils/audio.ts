// Web Audio API Procedural Sound Engine
// Realistic running game ambience, rhythmic footfalls, and cinematic UI sounds

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private ambientGain: GainNode | null = null;
  private windNode: AudioBufferSourceNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private footstepTimer: number | null = null;
  private currentWorld: number = 1;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.ambientGain.connect(this.ctx.destination);
    } catch {
      // AudioContext creation blocked until user interaction
    }
  }

  public toggleMute(): boolean {
    this.init();
    if (!this.ctx || !this.ambientGain) return this.isMuted;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.isMuted = !this.isMuted;

    if (!this.isMuted) {
      this.startAmbient();
      this.startFootsteps();
      this.ambientGain.gain.setTargetAtTime(0.2, this.ctx.currentTime, 0.4);
      this.playChime(587.33); // D5 chime
    } else {
      this.ambientGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      this.stopAmbient();
      if (this.footstepTimer !== null) {
        window.clearInterval(this.footstepTimer);
        this.footstepTimer = null;
      }
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setWorld(worldId: number) {
    if (this.currentWorld !== worldId) {
      this.currentWorld = worldId;
      if (!this.isMuted) {
        this.playWhoosh();
        const frequencies = [440, 554.37, 659.25, 880];
        const note = frequencies[worldId - 1] || 440;
        this.playChime(note);
      }
    }
  }

  public playClick() {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // AudioContext handled gracefully
    }
  }

  public playHover() {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(680, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Ignore
    }
  }

  public playWhoosh() {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.5;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 3.0;
      filter.frequency.setValueAtTime(300, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(2200, this.ctx.currentTime + 0.2);
      filter.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.onended = () => {
        noise.disconnect();
        filter.disconnect();
        gain.disconnect();
      };

      noise.start();
      noise.stop(this.ctx.currentTime + 0.4);
    } catch {
      // Ignore
    }
  }

  public playChime(freq: number) {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };

      osc.start();
      osc.stop(this.ctx.currentTime + 1.2);
    } catch {
      // Ignore
    }
  }

  private startAmbient() {
    if (!this.ctx || !this.ambientGain) return;
    try {
      // Ensure any existing node is cleaned up first
      this.stopAmbient();

      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
      }

      this.windNode = this.ctx.createBufferSource();
      this.windNode.buffer = buffer;
      this.windNode.loop = true;

      this.ambientFilter = this.ctx.createBiquadFilter();
      this.ambientFilter.type = 'lowpass';
      this.ambientFilter.frequency.value = 350;

      this.windNode.connect(this.ambientFilter);
      this.ambientFilter.connect(this.ambientGain);

      this.windNode.start();
    } catch {
      // Ignore
    }
  }

  private stopAmbient() {
    if (this.windNode) {
      try {
        this.windNode.stop();
        this.windNode.disconnect();
      } catch {
        // Already stopped
      }
      this.windNode = null;
    }
    if (this.ambientFilter) {
      try {
        this.ambientFilter.disconnect();
      } catch {
        // Disconnected
      }
      this.ambientFilter = null;
    }
  }

  private startFootsteps() {
    if (this.footstepTimer !== null) {
      window.clearInterval(this.footstepTimer);
      this.footstepTimer = null;
    }
    this.footstepTimer = window.setInterval(() => {
      this.triggerStep();
    }, 320);
  }

  private triggerStep() {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';

      let baseFreq = 80;
      if (this.currentWorld === 1) baseFreq = 95;
      if (this.currentWorld === 2) baseFreq = 110;
      if (this.currentWorld === 3) baseFreq = 85;
      if (this.currentWorld === 4) baseFreq = 70;

      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Ignore
    }
  }

  public dispose() {
    this.stopAmbient();
    if (this.footstepTimer !== null) {
      window.clearInterval(this.footstepTimer);
      this.footstepTimer = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const soundEngine = new SoundEngine();
