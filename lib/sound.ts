// Sound Manager: Supports both custom HTML5 audio files (/public/sounds) and Web Audio API synthesized effects.
class SoundManager {
  private ctx: AudioContext | null = null;
  private muted = false;
  private listeners = new Set<(muted: boolean) => void>();

  // Audio elements cache
  private audioFiles: {
    coin?: HTMLAudioElement;
    move?: HTMLAudioElement;
    drop?: HTMLAudioElement;
    ballDrop?: HTMLAudioElement;
    win?: HTMLAudioElement;
    loss?: HTMLAudioElement;
  } = {};

  private isMovePlaying = false;
  private moveStopTimeout: any = null;
  private moveLoopInterval: any = null;

  private isDropPlaying = false;
  private dropLoopInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.muted = localStorage.getItem('blnk_sound_muted') === 'true';
      this.initAudioFiles();
    }
  }

  private initAudioFiles() {
    if (typeof window === 'undefined') return;

    // Load custom sound files from /public/sounds/
    this.audioFiles.coin = new Audio('/sounds/coinsound.mp3');
    this.audioFiles.move = new Audio('/sounds/clawmovingsound.mp3');
    this.audioFiles.drop = new Audio('/sounds/clawmovingsound.mp3');
    this.audioFiles.ballDrop = new Audio('/sounds/balldropingsound.mp3');
    this.audioFiles.win = new Audio('/sounds/winsound.mp3');
    this.audioFiles.loss = new Audio('/sounds/losssound.mp3');

    // Configure loop and max 8-sec limit for move/drop sound
    if (this.audioFiles.move) {
      this.audioFiles.move.loop = false;
    }
    if (this.audioFiles.drop) {
      this.audioFiles.drop.loop = false;
    }
  }

  private initContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(
    frequency: number,
    start: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.1,
    endFrequency?: number
  ) {
    const ctx = this.ctx!;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
    }
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.012, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
  }

  private noise(start: number, duration: number, volume = 0.08, highpass = 900) {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = 'highpass';
    filter.frequency.value = highpass;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(start);
  }

  private ready() {
    return !this.muted && this.initContext();
  }

  public isMuted() {
    return this.muted;
  }

  public toggleMute() {
    this.muted = !this.muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('blnk_sound_muted', String(this.muted));
    }
    if (this.muted) {
      this.stopMove();
      this.stopDrop();
    }
    this.listeners.forEach((listener) => listener(this.muted));
    return this.muted;
  }

  public subscribe(fn: (muted: boolean) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  // UI button click sound (synth)
  public playClick() {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.tone(660, t, 0.045, 'square', 0.07, 880);
  }

  // 1. Joystick in use: Claw Moving sound (first 8 seconds of clawmovingsound.mp3)
  public playMove() {
    if (this.muted) return;
    const audio = this.audioFiles.move;
    if (audio) {
      if (!this.isMovePlaying || audio.paused) {
        this.isMovePlaying = true;
        audio.currentTime = 0;
        audio.play().catch(() => {});
        // Monitor playback to loop within first 8 seconds
        if (!this.moveLoopInterval) {
          this.moveLoopInterval = setInterval(() => {
            if (audio.currentTime >= 8) {
              audio.currentTime = 0;
            }
          }, 100);
        }
      }
      // Reset stop timeout: if joystick is idle for 180ms, stop sound
      if (this.moveStopTimeout) clearTimeout(this.moveStopTimeout);
      this.moveStopTimeout = setTimeout(() => {
        this.stopMove();
      }, 180);
    }
  }

  public stopMove() {
    this.isMovePlaying = false;
    if (this.moveStopTimeout) {
      clearTimeout(this.moveStopTimeout);
      this.moveStopTimeout = null;
    }
    if (this.moveLoopInterval) {
      clearInterval(this.moveLoopInterval);
      this.moveLoopInterval = null;
    }
    const audio = this.audioFiles.move;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  // 2. Drop section: Claw Dropping sound (first 8 seconds of clawmovingsound.mp3)
  public playDrop() {
    if (this.muted) return;
    const audio = this.audioFiles.drop;
    if (audio) {
      this.isDropPlaying = true;
      audio.currentTime = 0;
      audio.play().catch(() => {});
      if (!this.dropLoopInterval) {
        this.dropLoopInterval = setInterval(() => {
          if (audio.currentTime >= 8) {
            audio.currentTime = 0;
          }
        }, 100);
      }
    }
  }

  public stopDrop() {
    this.isDropPlaying = false;
    if (this.dropLoopInterval) {
      clearInterval(this.dropLoopInterval);
      this.dropLoopInterval = null;
    }
    const audio = this.audioFiles.drop;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  // 3. Claw Prongs Clamping + Ball Collision (synth)
  public playGrab() {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    [0, 0.04, 0.08].forEach((offset, index) => {
      this.tone(160 + index * 25, t + offset, 0.05, 'square', 0.09, 100);
      this.noise(t + offset, 0.025, 0.05, 1200);
    });
    this.tone(840, t + 0.12, 0.04, 'triangle', 0.12, 320);
    this.noise(t + 0.12, 0.035, 0.08, 600);
  }

  // 4. Ball Falling into Chute (/sounds/balldropingsound.mp3)
  public playBallDrop() {
    this.stopDrop(); // ensure dropping sound stops when ball lands in chute
    if (this.muted) return;
    const audio = this.audioFiles.ballDrop;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }

  // 5. Pokeball opening POP sound (synth)
  public playPop() {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.noise(t, 0.05, 0.2, 1000);
    this.tone(980, t, 0.06, 'square', 0.16, 140);
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((frequency, index) => {
      this.tone(frequency, t + 0.07 + index * 0.06, 0.14, 'square', 0.08);
      this.tone(frequency * 1.5, t + 0.07 + index * 0.06, 0.1, 'triangle', 0.05);
    });
  }

  public playReveal() {
    this.playPop();
  }

  // 6. Coin Toss Sound (/sounds/coinsound.mp3)
  public playCoin() {
    if (this.muted) return;
    const audio = this.audioFiles.coin;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }

  // 7. Win Sound (/sounds/winsound.mp3)
  public playWin(isGrand = false) {
    if (this.muted) return;
    const audio = this.audioFiles.win;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }

  // 8. Loss Sound (/sounds/losssound.mp3)
  public playLoss() {
    if (this.muted) return;
    const audio = this.audioFiles.loss;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }
}

export const soundManager = new SoundManager();
