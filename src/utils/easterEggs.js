/**
 * EZ_UIU - Pop Culture Easter Eggs & Secret Retro Gaming Modes
 * Built with Web Audio API synth and classic pop culture references.
 */

import confetti from 'canvas-confetti';

const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

let konamiIndex = 0;

/**
 * Play authentic 8-bit retro fanfare using Web Audio API (Zero external audio files needed)
 */
export function playRetroFanfare() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const notes = [
      { freq: 261.63, duration: 0.1, delay: 0.0 },   // C4
      { freq: 329.63, duration: 0.1, delay: 0.1 },   // E4
      { freq: 392.00, duration: 0.1, delay: 0.2 },   // G4
      { freq: 523.25, duration: 0.25, delay: 0.3 },  // C5
    ];

    notes.forEach(({ freq, duration, delay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square'; // 8-bit chiptune square wave
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    });
  } catch {}
}

/**
 * Check key event for Konami code sequence
 */
export function handleKonamiKey(key, onSuccess) {
  const expected = KONAMI_SEQUENCE[konamiIndex];
  if (key && key.toLowerCase() === expected.toLowerCase()) {
    konamiIndex++;
    if (konamiIndex === KONAMI_SEQUENCE.length) {
      konamiIndex = 0;
      // Trigger Konami Celebration!
      playRetroFanfare();
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#ff0055', '#00e5ff', '#ffbe00', '#00ff66'],
      });
      onSuccess?.();
      return true;
    }
  } else {
    // Reset if wrong key, unless starting over with ArrowUp
    konamiIndex = key === 'ArrowUp' ? 1 : 0;
  }
  return false;
}

/**
 * Secret Pop Culture Commands for Command Palette (⌘K)
 */
export const POP_CULTURE_EASTER_EGGS = [
  {
    id: 'egg-matrix',
    triggers: ['matrix', 'neo', 'red pill', 'white rabbit'],
    title: '🐇 Follow the White Rabbit (The Matrix)',
    desc: 'You take the red pill, you stay in UIU and I show you how deep the CGPA rabbit hole goes.',
    quote: '🕶️ "Wake up, Neo... The Matrix has you. Now go study for Operating Systems."',
  },
  {
    id: 'egg-heisenberg',
    triggers: ['heisenberg', 'say my name', 'breaking bad', 'walter white'],
    title: '🧪 Say My Name (Breaking Bad)',
    desc: 'I am not in danger, Skyler. I am the danger. A guy gets an F and you think that of me? No. I am the one who retakes.',
    quote: '🎩 "You\'re Heisenberg. (50% tuition waiver applied. Now let him cook)."',
  },
  {
    id: 'egg-highground',
    triggers: ['high ground', 'star wars', 'anakin', 'obi wan'],
    title: '⚔️ It\'s Over Anakin, I Have the High Ground! (Star Wars)',
    desc: 'Don\'t try it! You underestimate my 4.00 CGPA power!',
    quote: '🗡️ "It\'s over Anakin! I have the High Ground (Summa Cum Laude 3.90+ GPA)!"',
  },
  {
    id: 'egg-order66',
    triggers: ['order 66', 'execute order 66', 'palpatine'],
    title: '⚡ Execute Order 66 (Star Wars)',
    desc: 'Every single assignment must be submitted before the 11:59 PM deadline.',
    quote: '🛡️ "Good students follow regulations. All 13 UIU statutes shall be enforced."',
  },
  {
    id: 'egg-interstellar',
    triggers: ['interstellar', 'murph', 'cooper', 'gargantua'],
    title: '🚀 This Maneuver\'s Gonna Cost Us 12 Trimesters (Interstellar)',
    desc: 'Do not go gentle into that final exam week. Rage, rage against the dying of the CGPA.',
    quote: '🪐 "This little graduation maneuver is gonna cost us 12 trimesters. Don\'t let me leave without 138 credits!"',
  },
  {
    id: 'egg-portal',
    triggers: ['the cake is a lie', 'portal', 'glados', 'aperture'],
    title: '🍰 The Cake is a Lie (Portal)',
    desc: 'This was a triumph. I\'m making a note here: HUGE SUCCESS. It\'s hard to overstate my satisfaction.',
    quote: '🤖 "The 100% waiver is not a lie — as long as you maintain GPA ≥ 3.50 in the top 2%!"',
  },
  {
    id: 'egg-dragonball',
    triggers: ['over 9000', 'power level', 'goku', 'vegeta', 'kakarot'],
    title: '💥 It\'s Over 9000! (Dragon Ball Z)',
    desc: 'What?! Nine thousand?! There\'s no way that can be right! Can it?!',
    quote: '🔥 "IT\'S OVER 9000! (Wait, UIU CGPA is capped at 4.00, calm down Super Saiyan)!"',
  },
  {
    id: 'egg-thanos',
    triggers: ['thanos', 'snap', 'infinity gauntlet', 'inevitable'],
    title: '🧤 I Am Inevitable (Avengers)',
    desc: 'Dread it. Run from it. Midterms arrive all the same.',
    quote: '💎 "Perfectly balanced workload, as all course registrations should be (12 credits max)."',
  },
  {
    id: 'egg-spiderman',
    triggers: ['spiderman', 'with great power', 'uncle ben', 'peter parker'],
    title: '🕷️ With Great CGPA Comes Great Responsibility (Spider-Man)',
    desc: 'Remember, with a 3.90+ CGPA comes great responsibility to help your group project members.',
    quote: '🕸️ "With great CGPA comes great responsibility. Form your FYDP group wisely!"',
  },
  {
    id: 'egg-ricknmorty',
    triggers: ['wubba lubba dub dub', 'rick and morty', 'pickle rick'],
    title: '🥒 Wubba Lubba Dub Dub! (Rick and Morty)',
    desc: 'Morty, I turned myself into a UIU Routine Solver! I\'m Routine Rick!',
    quote: '🛸 "Wubba Lubba Dub Dub! In and out, 20-minute advising session, let\'s go!"',
  },
];
