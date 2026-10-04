// Subtle, soothing audio micro-interactions using Web Audio API
// No external assets required, purely synthesized soft acoustic feedback

class SoundEffects {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playRatingFeedback(rating: 1 | 2 | 3 | 4) {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      gain.connect(ctx.destination);
      osc.connect(gain);

      // Warm, subtle harmonic frequencies for each rating level
      if (rating === 1) {
        // Subtle, neutral reset chord
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (rating === 2) {
        // Soft focus chime
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.12);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (rating === 3) {
        // Gentle positive step
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.14);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else {
        // Crisp rewarding harmonic chime (Easy / Mumtaz)
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.16);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      }
    } catch {
      // Audio playback silently ignored if context restricted
    }
  }

  public playReviewSuccess() {
    this.playRatingFeedback(3);
  }

  public playReviewAgain() {
    this.playRatingFeedback(1);
  }

  public playMasteredCelebration() {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.05, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch {
      // Ignored
    }
  }

  public playSoftClick() {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignored
    }
  }

  public playSuccessChime() {
    this.playMasteredCelebration();
  }

  public playStreakMilestone() {
    this.playMasteredCelebration();
  }
}

export const soundEffects = new SoundEffects();
