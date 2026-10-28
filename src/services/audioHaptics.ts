import { NotificationPersona, PopUpState } from '../types';

class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playSafeChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Two warm harmonious notes: C5 (523Hz) -> G5 (784Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15);

      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playWarningChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Double cautionary pulse
      [0, 0.12].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now + offset); // A4
        gain.gain.setValueAtTime(0.3, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
    } catch {}
  }

  playBreachAlert() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Distinct alert siren / triple descending harsh alert
      [0, 0.15, 0.3].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880 - idx * 140, now + offset);
        gain.gain.setValueAtTime(0.35, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      });
    } catch {}
  }

  playCashSweep() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Coin register arcade sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch {}
  }
}

export const soundSynth = new SoundSynthesizer();

/**
 * Savage Roast Mode vs Gentle Coach Generator
 */
export function getPersonalityRoast(
  persona: NotificationPersona,
  state: PopUpState,
  merchantName: string,
  amount: number,
  remainingAllowance: number,
  percentUsed: number
): string {
  const isBlinkitZepto = /blinkit|zepto|instamart/i.test(merchantName);
  const isCoffee = /coffee|starbucks|third\s*wave|tokai|chai/i.test(merchantName);
  const isFood = /swiggy|zomato|domino|mcdonald/i.test(merchantName);

  if (persona === 'GENTLE') {
    if (state === 'SAFE') {
      return `Nicely done! You've used ${percentUsed}% of today's allowance. Still ₹${remainingAllowance.toLocaleString('en-IN')} safe to spend.`;
    } else if (state === 'CAUTION') {
      return `Pacing reminder: you're at ${percentUsed}% of today's budget with ₹${remainingAllowance.toLocaleString('en-IN')} remaining. Save the rest for dinner!`;
    } else {
      return `No stress! Tomorrow's allowance will adapt dynamically so you stay on target for the month.`;
    }
  }

  // SAVAGE ROAST MODE (Reel style)
  if (state === 'BREACHED') {
    if (isBlinkitZepto) {
      return `Another 10-minute grocery delivery? Bro, you're literally paying ₹150 surcharge for a single packet of chips. Overspent by ₹${Math.abs(remainingAllowance).toLocaleString('en-IN')}!`;
    }
    if (isCoffee) {
      return `₹${amount} for crushed beans and heated oat milk? Your retirement plan just wept silently. Allowance breached!`;
    }
    if (isFood) {
      return `Swiggy again? At this rate, the delivery rider knows your apartment gate code better than your own family. You are broke for today.`;
    }
    return `Bro, you just blew your entire daily budget by ₹${Math.abs(remainingAllowance).toLocaleString('en-IN')}. Tomorrow you are eating air for lunch.`;
  }

  if (state === 'CAUTION') {
    if (isBlinkitZepto) {
      return `Warning: ${percentUsed}% gone. Blinkit order confirmed, financial sanity unconfirmed. Only ₹${remainingAllowance} left!`;
    }
    return `Careful! ${percentUsed}% consumed already. Put the phone down before Zomato senses your emotional hunger.`;
  }

  // Safe mode roast
  if (isCoffee) {
    return `Fancy coffee logged (₹${amount}). Within limit, but your wallet is giving you side-eye. ₹${remainingAllowance} left.`;
  }
  return `Under budget so far. Keep it up and your future self might actually afford Goa next month.`;
}

/**
 * Text-to-Speech synthesis for instant pop-up feedback
 */
export function speakRoast(text: string, enabled: boolean) {
  if (!enabled || typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel(); // cancel pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    // Try to pick an Indian English voice if available
    const voices = window.speechSynthesis.getVoices();
    const inVoice = voices.find(v => v.lang.includes('en-IN') || v.name.includes('India'));
    if (inVoice) {
      utterance.voice = inVoice;
    }
    window.speechSynthesis.speak(utterance);
  } catch {}
}
