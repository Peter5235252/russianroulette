import { vibrateGamepad, getControllerSettings } from './controller';

const SOUND_URLS = {
  cock: 'https://cdn.freesound.org/previews/402/402790_7111288-hq.mp3',
  gunshot: 'https://cdn.freesound.org/previews/396/396316_5937039-hq.mp3',
  click: 'https://cdn.freesound.org/previews/677/677159_7157894-hq.mp3',
  splatter: 'https://cdn.freesound.org/previews/406/406582_6068748-hq.mp3',
  heartbeat: 'https://cdn.freesound.org/previews/332/332821_5859881-lq.mp3',
  load: 'https://cdn.freesound.org/previews/139/139001_2534439-hq.mp3',
  ambient: 'https://cdn.freesound.org/previews/799/799355_2520418-lq.mp3',
  item: 'https://cdn.freesound.org/previews/538/538000_3377875-hq.mp3',
  tap: 'https://cdn.freesound.org/previews/253/253168_4404552-hq.mp3',
  purchase: 'https://cdn.freesound.org/previews/209/209578_2558531-hq.mp3',
  syringeCap: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABgAZGF0YQQAAAAAAAAA',
  syringeSlam: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABgAZGF0YQQAAAAAAAAA',
  thump: 'https://cdn.freesound.org/previews/454/454418_612689-hq.mp3',
  pliers: 'https://pixabay.com/sound-effects/download/film-special-effects-pliers-155627/'
};

const audioInstances = new Map<string, HTMLAudioElement>();

let globalMasterVolume = 1.0;
let globalAmbientVolume = 0.4;

export const setMasterVolume = (vol: number) => {
  globalMasterVolume = Math.max(0, Math.min(1, vol));
  const ambient = audioInstances.get('ambient');
  if (ambient) ambient.volume = globalAmbientVolume * globalMasterVolume;
  const heartbeat = audioInstances.get('heartbeat');
  if (heartbeat) heartbeat.volume = 1.0 * globalMasterVolume;
};

export const setAmbientVolume = (vol: number) => {
  globalAmbientVolume = Math.max(0, Math.min(1, vol));
  const ambient = audioInstances.get('ambient');
  if (ambient) ambient.volume = globalAmbientVolume * globalMasterVolume;
};

export const getMasterVolume = () => globalMasterVolume;
export const getAmbientVolume = () => globalAmbientVolume;

export const initAudio = () => {
  // Preload all audio
  for (const [key, url] of Object.entries(SOUND_URLS)) {
    if (!audioInstances.has(key)) {
      const audio = new Audio(url);
      if (key === 'ambient' || key === 'heartbeat') {
        audio.loop = true;
      }
      audioInstances.set(key, audio);
    }
  }
};

const playSound = (key: string, restart = true, baseVolume = 1.0) => {
  let audio = audioInstances.get(key);
  if (!audio && key in SOUND_URLS) {
     audio = new Audio(SOUND_URLS[key as keyof typeof SOUND_URLS]);
     if (key === 'ambient' || key === 'heartbeat') audio.loop = true;
     audioInstances.set(key, audio);
  }
  if (audio) {
    if (restart) {
      audio.currentTime = 0;
    }
    const finalVol = key === 'ambient' ? (globalAmbientVolume * globalMasterVolume) : (baseVolume * globalMasterVolume);
    audio.volume = finalVol;
    audio.play().catch(e => console.warn(`Audio play failed for ${key}:`, e));
  }
};

const stopSound = (key: string) => {
  const audio = audioInstances.get(key);
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
};

export const playStartAudio = () => {
  initAudio();
};

export const startAmbientDrone = () => {
  playSound('ambient', false, 0.4);
};

export const playGunshot = () => {
  playSound('gunshot', true, 1.0);
};

export const playCockSound = () => {
  playSound('cock', true, 1.0);
  // Hammer pull tension followed by the crisp lock
  setTimeout(() => vibrateGamepad('rumble', { duration: 80, weak: 0.3, strong: 0.0 }), 50);
  setTimeout(() => vibrateGamepad('click', { duration: 30, weak: 0.8, strong: 0.6 }), 280);
};

export const playEmptyClick = () => {
  playSound('click', true, 1.0);
};

export const playTapSound = () => {
  playUIClick('primary');
};

export const playItemSound = () => {
  playUIClick('secondary');
};

export const playUIHover = (intensity: number = 0.5) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // Very subtle, short, soft low-pass filtered click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.03);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05 * intensity * globalMasterVolume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    
    osc.start(now);
    osc.stop(now + 0.05);

    setTimeout(() => {
      try { osc.disconnect(); gain.disconnect(); } catch(e){}
    }, 100);
  } catch (e) {}
};

export const playUIClick = (type: 'primary' | 'secondary' | 'back' | 'toggle' = 'primary') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'primary') {
      // Crisp, tactile click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15 * globalMasterVolume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    } else if (type === 'secondary') {
      // Deeper, softer thud
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.06);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12 * globalMasterVolume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    } else if (type === 'back') {
      // Lower pitched, descending click
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.connect(gain);
      osc.disconnect();
      osc.connect(filter);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1 * globalMasterVolume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    } else if (type === 'toggle') {
      // Double click effect
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1 * globalMasterVolume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      
      // Add second click
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(800, now + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(1000, now + 0.09);
      gain2.gain.setValueAtTime(0, now + 0.05);
      gain2.gain.linearRampToValueAtTime(0.12 * globalMasterVolume, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.1);
      
      setTimeout(() => {
        try { osc2.disconnect(); gain2.disconnect(); } catch(e){}
      }, 150);
    }
    
    osc.start(now);
    osc.stop(now + 0.1);

    setTimeout(() => {
      try { osc.disconnect(); gain.disconnect(); } catch(e){}
    }, 150);
  } catch (e) {}
};

export const playUISliderTick = (normalizedValue: number) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // Pitch goes up as slider goes right (normalizedValue 0.0 -> 1.0)
    const baseFreq = 400 + (normalizedValue * 400); 
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.03);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05 * globalMasterVolume, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    
    osc.start(now);
    osc.stop(now + 0.05);

    setTimeout(() => {
      try { osc.disconnect(); gain.disconnect(); } catch(e){}
    }, 100);
  } catch (e) {}
};

export const playPurchaseSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // Cash register / purchase satisfying sound (ch-ching)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.linearRampToValueAtTime(1200, now + 0.1);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2 * globalMasterVolume, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, now + 0.1);
    osc2.frequency.linearRampToValueAtTime(1800, now + 0.2);
    gain2.gain.setValueAtTime(0, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.2 * globalMasterVolume, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.16);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.26);
    
    setTimeout(() => { 
      try { 
        osc1.disconnect(); gain1.disconnect(); 
        osc2.disconnect(); gain2.disconnect(); 
      } catch(e){} 
    }, 300);
  } catch (e) {}
};

export const playBloodSplatter = () => {
  const s = getControllerSettings();
  if (s.bloodEffectsEnabled === false) return;
  playSound('splatter', true, 0.9);
};

export const playPliersSound = () => {
  playSound('pliers', true, 1.0);
};

// Web Audio API Synthesizers for beautiful custom sounds!
const getAudioContext = (): AudioContext | null => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!(window as any)._gameAudioCtx) {
    (window as any)._gameAudioCtx = new AudioContextClass();
  }
  const ctx = (window as any)._gameAudioCtx as AudioContext;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
};

let heartbeatPlaying = false;
let heartbeatInterval: number | null = null;

const synthHeartbeat = () => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        
        // Thump 1
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.8 * globalMasterVolume, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.2);
        vibrateGamepad('rumble', { duration: 150, weak: 0.6, strong: 0.15 });

        // Thump 2
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(65, now + 0.25);
        osc2.frequency.exponentialRampToValueAtTime(25, now + 0.35);
        gain2.gain.setValueAtTime(0, now + 0.23);
        gain2.gain.linearRampToValueAtTime(1.0 * globalMasterVolume, now + 0.27);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc2.start(now + 0.25);
        osc2.stop(now + 0.55);
        setTimeout(() => vibrateGamepad('rumble', { duration: 250, weak: 0.8, strong: 0.25 }), 250);
        
        setTimeout(() => {
          try { osc.disconnect(); gain.disconnect(); osc2.disconnect(); gain2.disconnect(); } catch(e){}
        }, 700);
    } catch(e) {}
};

export const setHeartbeatStatus = (active: boolean) => {
  if (active && !heartbeatPlaying) {
    heartbeatPlaying = true;
    synthHeartbeat();
    heartbeatInterval = window.setInterval(() => {
      if (heartbeatPlaying) synthHeartbeat();
    }, 1200);
  } else if (!active && heartbeatPlaying) {
    heartbeatPlaying = false;
    if (heartbeatInterval !== null) {
      window.clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  }
};

export const playHeartbeat = () => {
  // We don't trigger one-offs anymore, we use setHeartbeatStatus for smooth looping
};

export const playBulletLoad = () => {
  playSound('load', true, 0.6);
};

export const playSyringeCap = () => {
  playSound('syringeCap', true, 0.85);
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // 1. Textured plastic-on-needle sheath friction slide
    const slideSize = Math.floor(ctx.sampleRate * 0.12);
    const slideBuf = ctx.createBuffer(1, slideSize, ctx.sampleRate);
    const sd = slideBuf.getChannelData(0);
    for (let i = 0; i < slideSize; i++) sd[i] = (Math.random() * 2 - 1) * (1 - i / slideSize);
    const slide = ctx.createBufferSource();
    slide.buffer = slideBuf;
    const slideFilter = ctx.createBiquadFilter();
    slideFilter.type = 'bandpass';
    slideFilter.frequency.setValueAtTime(3200, now);
    slideFilter.frequency.exponentialRampToValueAtTime(1400, now + 0.1);
    slideFilter.Q.value = 3.0;
    const slideGain = ctx.createGain();
    slideGain.gain.setValueAtTime(0.45 * globalMasterVolume, now);
    slideGain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);
    slide.connect(slideFilter);
    slideFilter.connect(slideGain);
    slideGain.connect(ctx.destination);
    slide.start(now);
    slide.stop(now + 0.12);

    // 2. Tactile rubber vacuum suction release pop ("POP-TINK")
    const popTime = now + 0.04;
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(380, popTime);
    popOsc.frequency.exponentialRampToValueAtTime(80, popTime + 0.05);
    popGain.gain.setValueAtTime(0.7 * globalMasterVolume, popTime);
    popGain.gain.exponentialRampToValueAtTime(0.01, popTime + 0.06);
    popOsc.connect(popGain);
    popGain.connect(ctx.destination);
    popOsc.start(popTime);
    popOsc.stop(popTime + 0.07);

    // 3. Delicate surgical stainless steel needle tip ring
    const ringOsc = ctx.createOscillator();
    const ringGain = ctx.createGain();
    ringOsc.type = 'triangle';
    ringOsc.frequency.setValueAtTime(4200, popTime);
    ringOsc.frequency.exponentialRampToValueAtTime(2800, popTime + 0.12);
    ringGain.gain.setValueAtTime(0.3 * globalMasterVolume, popTime);
    ringGain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.13);
    ringOsc.connect(ringGain);
    ringGain.connect(ctx.destination);
    ringOsc.start(popTime);
    ringOsc.stop(popTime + 0.14);

    setTimeout(() => {
      try {
        slide.disconnect(); slideFilter.disconnect(); slideGain.disconnect();
        popOsc.disconnect(); popGain.disconnect();
        ringOsc.disconnect(); ringGain.disconnect();
      } catch (err) {}
    }, 250);
  } catch (e) {
    console.warn("Synth cap sound failed:", e);
  }
};

export const playRazorSlice = () => {
  playBloodSplatter();
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Agonizing rusty steel blade scraping against coarse flesh and bone
    const bufferSize = Math.floor(ctx.sampleRate * 0.32);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Jagged gritty noise with friction modulation
      data[i] = (Math.random() * 2 - 1) * (0.8 + 0.2 * Math.sin(i * 0.15));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(5800, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.28);
    filter.Q.value = 6.5;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.95 * globalMasterVolume, now + 0.03);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.32);

    // 2. High-frequency agonizing steel scream & metal vibration
    const ring1 = ctx.createOscillator();
    const ring2 = ctx.createOscillator();
    const ringGain = ctx.createGain();
    ring1.type = 'sawtooth';
    ring2.type = 'triangle';
    ring1.frequency.setValueAtTime(3900, now);
    ring1.frequency.exponentialRampToValueAtTime(800, now + 0.24);
    ring2.frequency.setValueAtTime(4150, now);
    ring2.frequency.exponentialRampToValueAtTime(950, now + 0.24);

    ringGain.gain.setValueAtTime(0.45 * globalMasterVolume, now);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    ring1.connect(ringGain);
    ring2.connect(ringGain);
    ringGain.connect(ctx.destination);
    ring1.start(now);
    ring2.start(now);
    ring1.stop(now + 0.28);
    ring2.stop(now + 0.28);

    // 3. Deep visceral flesh separation thud & arterial blood squelch
    const cut = ctx.createOscillator();
    const cutGain = ctx.createGain();
    cut.type = 'sine';
    cut.frequency.setValueAtTime(240, now + 0.02);
    cut.frequency.linearRampToValueAtTime(35, now + 0.28);
    cutGain.gain.setValueAtTime(0, now);
    cutGain.gain.linearRampToValueAtTime(1.1 * globalMasterVolume, now + 0.05);
    cutGain.gain.exponentialRampToValueAtTime(0.01, now + 0.34);
    cut.connect(cutGain);
    cutGain.connect(ctx.destination);
    cut.start(now + 0.02);
    cut.stop(now + 0.36);

    setTimeout(() => {
      try {
        noise.disconnect(); filter.disconnect(); noiseGain.disconnect();
        ring1.disconnect(); ring2.disconnect(); ringGain.disconnect();
        cut.disconnect(); cutGain.disconnect();
      } catch (e) {}
    }, 450);
  } catch (e) {
    console.warn("Razor slice sound failed:", e);
  }
};

export const playMirrorInspect = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const masterVol = globalMasterVolume;

    // Dynamic variation for organic realism on every inspection
    const pitchVar = 0.95 + Math.random() * 0.10;
    const sparkleSeed = Math.random();

    // 1. Tactile brushed brass handle lift & felt friction scrape
    const bufSize = Math.floor(ctx.sampleRate * 0.32);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.09));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800 * pitchVar, now);
    filter.frequency.exponentialRampToValueAtTime(650 * pitchVar, now + 0.28);
    filter.Q.value = 3.8;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.38 * masterVol, now + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.32);

    // 2. Dynamic Optical Light Catch & Prismatic Lens Sweep
    // A sweeping resonant filter that opens as the mirror catches the light angle
    const sweepBufSize = Math.floor(ctx.sampleRate * 0.45);
    const sweepBuf = ctx.createBuffer(1, sweepBufSize, ctx.sampleRate);
    const sd = sweepBuf.getChannelData(0);
    for (let i = 0; i < sweepBufSize; i++) {
      const env = Math.sin((i / sweepBufSize) * Math.PI);
      sd[i] = (Math.random() * 2 - 1) * Math.pow(env, 2);
    }
    const sweepNoise = ctx.createBufferSource();
    sweepNoise.buffer = sweepBuf;
    const sweepFilter = ctx.createBiquadFilter();
    sweepFilter.type = 'bandpass';
    sweepFilter.frequency.setValueAtTime(2200 * pitchVar, now + 0.04);
    sweepFilter.frequency.exponentialRampToValueAtTime(5400 * pitchVar, now + 0.22);
    sweepFilter.frequency.exponentialRampToValueAtTime(3200 * pitchVar, now + 0.45);
    sweepFilter.Q.value = 7.5;
    const sweepGain = ctx.createGain();
    sweepGain.gain.setValueAtTime(0, now + 0.04);
    sweepGain.gain.linearRampToValueAtTime(0.28 * masterVol, now + 0.20);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.46);
    sweepNoise.connect(sweepFilter);
    sweepFilter.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    sweepNoise.start(now + 0.04);
    sweepNoise.stop(now + 0.48);

    // 3. Multi-Harmonic Crystalline Glass Bell Ring (Pristine optical glint)
    const glassHarmonics = [
      { freq: 3136 * pitchVar, gain: 0.32, decay: 0.65 }, // High G7
      { freq: 4186 * pitchVar, gain: 0.24, decay: 0.50 }, // C8
      { freq: 5587 * pitchVar, gain: 0.18, decay: 0.38 }, // F8
      { freq: 7040 * pitchVar, gain: 0.12, decay: 0.25 }, // A8
    ];

    glassHarmonics.forEach((h, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(h.freq, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(h.freq * 0.985, now + 0.06 + h.decay);

      g.gain.setValueAtTime(0, now + 0.06);
      g.gain.linearRampToValueAtTime(h.gain * masterVol, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0008, now + 0.06 + h.decay);

      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + 0.06);
      osc.stop(now + 0.06 + h.decay + 0.05);
    });

    // 4. Sparkling Micro-Granule Cascade (Cascading photonic specular sparkles)
    const sparkleCount = 5;
    for (let s = 0; s < sparkleCount; s++) {
      const sparkleDelay = 0.08 + s * 0.045 + (Math.random() * 0.015);
      const sparkleFreq = (4400 + s * 750 + sparkleSeed * 400) * pitchVar;
      const spOsc = ctx.createOscillator();
      const spGain = ctx.createGain();
      spOsc.type = 'sine';
      spOsc.frequency.setValueAtTime(sparkleFreq, now + sparkleDelay);
      spOsc.frequency.exponentialRampToValueAtTime(sparkleFreq * 1.12, now + sparkleDelay + 0.08);

      spGain.gain.setValueAtTime(0, now + sparkleDelay);
      spGain.gain.linearRampToValueAtTime((0.15 - s * 0.02) * masterVol, now + sparkleDelay + 0.008);
      spGain.gain.exponentialRampToValueAtTime(0.0005, now + sparkleDelay + 0.09);

      spOsc.connect(spGain);
      spGain.connect(ctx.destination);
      spOsc.start(now + sparkleDelay);
      spOsc.stop(now + sparkleDelay + 0.1);
    }

    // 5. Eerie Chamber Cavity Resonance (Dark internal cylinder revelation hum)
    const hum = ctx.createOscillator();
    const humGain = ctx.createGain();
    const humLfo = ctx.createOscillator();
    const humLfoGain = ctx.createGain();
    humLfo.type = 'sine';
    humLfo.frequency.value = 5.2; // Shimmering vibrato
    humLfoGain.gain.value = 14;
    humLfo.connect(hum.frequency);

    hum.type = 'sine';
    hum.frequency.setValueAtTime(520 * pitchVar, now + 0.05);
    hum.frequency.exponentialRampToValueAtTime(360 * pitchVar, now + 0.75);

    humGain.gain.setValueAtTime(0, now + 0.05);
    humGain.gain.linearRampToValueAtTime(0.32 * masterVol, now + 0.18);
    humGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    hum.connect(humGain);
    humGain.connect(ctx.destination);
    humLfo.start(now + 0.05);
    hum.start(now + 0.05);
    hum.stop(now + 0.9);
    humLfo.stop(now + 0.9);

  } catch (e) {
    console.warn("Mirror inspect sound failed:", e);
  }
};

export const playWhiskeyDrink = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Bottle glass lift / wooden table friction slide
    const slideSize = Math.floor(ctx.sampleRate * 0.2);
    const slideBuf = ctx.createBuffer(1, slideSize, ctx.sampleRate);
    const sData = slideBuf.getChannelData(0);
    for (let i = 0; i < slideSize; i++) {
      sData[i] = (Math.random() * 2 - 1) * (1 - i / slideSize);
    }
    const slide = ctx.createBufferSource();
    slide.buffer = slideBuf;
    const slideFilter = ctx.createBiquadFilter();
    slideFilter.type = 'bandpass';
    slideFilter.frequency.setValueAtTime(450, now);
    slideFilter.Q.value = 2.0;
    const slideGain = ctx.createGain();
    slideGain.gain.setValueAtTime(0.35 * globalMasterVolume, now);
    slideGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    slide.connect(slideFilter);
    slideFilter.connect(slideGain);
    slideGain.connect(ctx.destination);
    slide.start(now);
    slide.stop(now + 0.2);

    // 2. Cork friction squeak
    const corkSqueak = ctx.createOscillator();
    const corkSqueakGain = ctx.createGain();
    corkSqueak.type = 'triangle';
    corkSqueak.frequency.setValueAtTime(320, now + 0.1);
    corkSqueak.frequency.exponentialRampToValueAtTime(680, now + 0.22);
    corkSqueakGain.gain.setValueAtTime(0, now + 0.1);
    corkSqueakGain.gain.linearRampToValueAtTime(0.28 * globalMasterVolume, now + 0.16);
    corkSqueakGain.gain.exponentialRampToValueAtTime(0.01, now + 0.23);
    corkSqueak.connect(corkSqueakGain);
    corkSqueakGain.connect(ctx.destination);
    corkSqueak.start(now + 0.1);
    corkSqueak.stop(now + 0.24);

    // 3. Deep vacuum cork pop ("THWUMP-POP")
    const popTime = now + 0.24;
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(180, popTime);
    popOsc.frequency.exponentialRampToValueAtTime(35, popTime + 0.14);
    popGain.gain.setValueAtTime(0, popTime);
    popGain.gain.linearRampToValueAtTime(0.95 * globalMasterVolume, popTime + 0.01);
    popGain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.16);
    popOsc.connect(popGain);
    popGain.connect(ctx.destination);
    popOsc.start(popTime);
    popOsc.stop(popTime + 0.18);

    // Pop high-frequency cavity burst
    const popNoiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
    const pnData = popNoiseBuf.getChannelData(0);
    for (let i = 0; i < pnData.length; i++) pnData[i] = Math.random() * 2 - 1;
    const popNoise = ctx.createBufferSource();
    popNoise.buffer = popNoiseBuf;
    const popNFilter = ctx.createBiquadFilter();
    popNFilter.type = 'bandpass';
    popNFilter.frequency.value = 1100;
    popNFilter.Q.value = 3.0;
    const popNGain = ctx.createGain();
    popNGain.gain.setValueAtTime(0.6 * globalMasterVolume, popTime);
    popNGain.gain.exponentialRampToValueAtTime(0.01, popTime + 0.07);
    popNoise.connect(popNFilter);
    popNFilter.connect(popNGain);
    popNGain.connect(ctx.destination);
    popNoise.start(popTime);
    popNoise.stop(popTime + 0.08);

    // 4. Staggered visceral liquid glugs / pouring bubbles
    const glugTimes = [popTime + 0.22, popTime + 0.45, popTime + 0.68, popTime + 0.92];
    const glugFreqs = [440, 390, 480, 360];

    glugTimes.forEach((gTime, idx) => {
      const gOsc = ctx.createOscillator();
      const gGain = ctx.createGain();
      gOsc.type = 'sine';
      gOsc.frequency.setValueAtTime(glugFreqs[idx], gTime);
      gOsc.frequency.exponentialRampToValueAtTime(glugFreqs[idx] * 0.65, gTime + 0.12);
      gGain.gain.setValueAtTime(0, gTime);
      gGain.gain.linearRampToValueAtTime(0.4 * globalMasterVolume, gTime + 0.02);
      gGain.gain.exponentialRampToValueAtTime(0.001, gTime + 0.14);
      gOsc.connect(gGain);
      gGain.connect(ctx.destination);
      gOsc.start(gTime);
      gOsc.stop(gTime + 0.15);

      // Bubble splash noise
      const gNBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.1), ctx.sampleRate);
      const gnd = gNBuf.getChannelData(0);
      for (let i = 0; i < gnd.length; i++) gnd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
      const gNSource = ctx.createBufferSource();
      gNSource.buffer = gNBuf;
      const gNFilter = ctx.createBiquadFilter();
      gNFilter.type = 'lowpass';
      gNFilter.frequency.value = 1400;
      const gNGain = ctx.createGain();
      gNGain.gain.setValueAtTime(0.2 * globalMasterVolume, gTime);
      gNGain.gain.exponentialRampToValueAtTime(0.001, gTime + 0.09);
      gNSource.connect(gNFilter);
      gNFilter.connect(gNGain);
      gNGain.connect(ctx.destination);
      gNSource.start(gTime);
      gNSource.stop(gTime + 0.1);
    });

    // 5. Heavy visceral swallowing gulp & burning ethanol throat sigh
    const gulpTime = popTime + 1.15;
    const gulpOsc = ctx.createOscillator();
    const gulpGain = ctx.createGain();
    gulpOsc.type = 'sine';
    gulpOsc.frequency.setValueAtTime(190, gulpTime);
    gulpOsc.frequency.exponentialRampToValueAtTime(55, gulpTime + 0.25);
    gulpGain.gain.setValueAtTime(0, gulpTime);
    gulpGain.gain.linearRampToValueAtTime(0.7 * globalMasterVolume, gulpTime + 0.04);
    gulpGain.gain.exponentialRampToValueAtTime(0.01, gulpTime + 0.28);
    gulpOsc.connect(gulpGain);
    gulpGain.connect(ctx.destination);
    gulpOsc.start(gulpTime);
    gulpOsc.stop(gulpTime + 0.3);

    // Warm ethanol throat exhale/gasp
    const gaspTime = gulpTime + 0.22;
    const gaspBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.6), ctx.sampleRate);
    const gd = gaspBuf.getChannelData(0);
    for (let i = 0; i < gd.length; i++) gd[i] = Math.random() * 2 - 1;
    const gasp = ctx.createBufferSource();
    gasp.buffer = gaspBuf;
    const gaspFilter = ctx.createBiquadFilter();
    gaspFilter.type = 'lowpass';
    gaspFilter.frequency.setValueAtTime(550, gaspTime);
    gaspFilter.frequency.linearRampToValueAtTime(250, gaspTime + 0.55);
    const gaspGain = ctx.createGain();
    gaspGain.gain.setValueAtTime(0, gaspTime);
    gaspGain.gain.linearRampToValueAtTime(0.35 * globalMasterVolume, gaspTime + 0.1);
    gaspGain.gain.exponentialRampToValueAtTime(0.001, gaspTime + 0.58);
    gasp.connect(gaspFilter);
    gaspFilter.connect(gaspGain);
    gaspGain.connect(ctx.destination);
    gasp.start(gaspTime);
    gasp.stop(gaspTime + 0.6);

  } catch (e) {
    console.warn("Whiskey drink sound failed:", e);
  }
};

export const playTourniquetTighten = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Heavy canvas/elastic strap stretching friction
    const strapSize = Math.floor(ctx.sampleRate * 0.5);
    const strapBuf = ctx.createBuffer(1, strapSize, ctx.sampleRate);
    const sd = strapBuf.getChannelData(0);
    for (let i = 0; i < strapSize; i++) {
      sd[i] = (Math.random() * 2 - 1) * (0.5 + 0.5 * Math.sin(i * 0.08));
    }
    const strap = ctx.createBufferSource();
    strap.buffer = strapBuf;
    const strapFilter = ctx.createBiquadFilter();
    strapFilter.type = 'bandpass';
    strapFilter.frequency.setValueAtTime(600, now);
    strapFilter.frequency.exponentialRampToValueAtTime(2200, now + 0.45);
    strapFilter.Q.value = 3.5;
    const strapGain = ctx.createGain();
    strapGain.gain.setValueAtTime(0, now);
    strapGain.gain.linearRampToValueAtTime(0.7 * globalMasterVolume, now + 0.15);
    strapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.48);
    strap.connect(strapFilter);
    strapFilter.connect(strapGain);
    strapGain.connect(ctx.destination);
    strap.start(now);
    strap.stop(now + 0.5);

    // 2. High-tension ratcheting clamp clicks (3 progressive mechanical tooth clicks)
    const clickTimes = [now + 0.12, now + 0.26, now + 0.40];
    const clickFreqs = [1100, 1350, 1650];

    clickTimes.forEach((cTime, idx) => {
      const cOsc = ctx.createOscillator();
      const cGain = ctx.createGain();
      cOsc.type = 'triangle';
      cOsc.frequency.setValueAtTime(clickFreqs[idx], cTime);
      cOsc.frequency.exponentialRampToValueAtTime(250, cTime + 0.04);
      cGain.gain.setValueAtTime(0, cTime);
      cGain.gain.linearRampToValueAtTime(0.55 * globalMasterVolume, cTime + 0.005);
      cGain.gain.exponentialRampToValueAtTime(0.001, cTime + 0.05);
      cOsc.connect(cGain);
      cGain.connect(ctx.destination);
      cOsc.start(cTime);
      cOsc.stop(cTime + 0.06);
    });

    // 3. Bone-crushing vascular compression sub-thump & tension snap
    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(100, now + 0.42);
    thump.frequency.exponentialRampToValueAtTime(28, now + 0.7);
    thumpGain.gain.setValueAtTime(0, now + 0.42);
    thumpGain.gain.linearRampToValueAtTime(0.85 * globalMasterVolume, now + 0.45);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    thump.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    thump.start(now + 0.42);
    thump.stop(now + 0.8);

  } catch (e) {
    console.warn("Tourniquet sound failed:", e);
  }
};

export const playPentagramChant = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Abyssal sub-bass demonic drone with 3.5Hz beating infrasound pulse
    const drone1 = ctx.createOscillator();
    const drone2 = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone1.type = 'sawtooth';
    drone2.type = 'sawtooth';
    drone1.frequency.setValueAtTime(38, now);
    drone2.frequency.setValueAtTime(41.5, now);

    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.setValueAtTime(120, now);
    lowFilter.frequency.linearRampToValueAtTime(240, now + 0.8);
    lowFilter.frequency.exponentialRampToValueAtTime(60, now + 1.8);

    droneGain.gain.setValueAtTime(0, now);
    droneGain.gain.linearRampToValueAtTime(0.8 * globalMasterVolume, now + 0.3);
    droneGain.gain.exponentialRampToValueAtTime(0.001, now + 1.85);

    drone1.connect(lowFilter);
    drone2.connect(lowFilter);
    lowFilter.connect(droneGain);
    droneGain.connect(ctx.destination);
    drone1.start(now);
    drone2.start(now);
    drone1.stop(now + 1.9);
    drone2.stop(now + 1.9);

    // 2. Dissonant spectral chorus screech (FM synthesis demonic overtones)
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const chorusGain = ctx.createGain();

    carrier.type = 'triangle';
    carrier.frequency.setValueAtTime(666, now + 0.15);
    carrier.frequency.exponentialRampToValueAtTime(333, now + 1.4);

    modulator.type = 'sawtooth';
    modulator.frequency.setValueAtTime(133, now + 0.15);
    modulator.frequency.linearRampToValueAtTime(88, now + 1.4);

    modGain.gain.setValueAtTime(450, now + 0.15);
    modGain.gain.linearRampToValueAtTime(800, now + 0.8);
    modGain.gain.exponentialRampToValueAtTime(10, now + 1.4);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    chorusGain.gain.setValueAtTime(0, now + 0.15);
    chorusGain.gain.linearRampToValueAtTime(0.45 * globalMasterVolume, now + 0.4);
    chorusGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    carrier.connect(chorusGain);
    chorusGain.connect(ctx.destination);
    modulator.start(now + 0.15);
    carrier.start(now + 0.15);
    modulator.stop(now + 1.55);
    carrier.stop(now + 1.55);

    // 3. Swirling blood vortex and hellish soul-swap rush
    const vSize = Math.floor(ctx.sampleRate * 1.5);
    const vBuf = ctx.createBuffer(1, vSize, ctx.sampleRate);
    const vd = vBuf.getChannelData(0);
    for (let i = 0; i < vSize; i++) {
      vd[i] = (Math.random() * 2 - 1);
    }
    const vortex = ctx.createBufferSource();
    vortex.buffer = vBuf;
    const vFilter = ctx.createBiquadFilter();
    vFilter.type = 'bandpass';
    vFilter.frequency.setValueAtTime(250, now + 0.2);
    vFilter.frequency.exponentialRampToValueAtTime(1800, now + 0.9);
    vFilter.frequency.exponentialRampToValueAtTime(300, now + 1.6);
    vFilter.Q.value = 6.0;

    const vGain = ctx.createGain();
    vGain.gain.setValueAtTime(0, now + 0.2);
    vGain.gain.linearRampToValueAtTime(0.65 * globalMasterVolume, now + 0.6);
    vGain.gain.exponentialRampToValueAtTime(0.001, now + 1.7);

    vortex.connect(vFilter);
    vFilter.connect(vGain);
    vGain.connect(ctx.destination);
    vortex.start(now + 0.2);
    vortex.stop(now + 1.75);

  } catch (e) {
    console.warn("Pentagram chant sound failed:", e);
  }
};

export const playDefibrillatorShock = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. High-voltage capacitor charging whine (180Hz -> 4800Hz exponential charge)
    const chargeOsc = ctx.createOscillator();
    const chargeGain = ctx.createGain();
    chargeOsc.type = 'sawtooth';
    chargeOsc.frequency.setValueAtTime(180, now);
    chargeOsc.frequency.exponentialRampToValueAtTime(4600, now + 0.82);

    const chargeFilter = ctx.createBiquadFilter();
    chargeFilter.type = 'lowpass';
    chargeFilter.frequency.setValueAtTime(800, now);
    chargeFilter.frequency.exponentialRampToValueAtTime(6000, now + 0.82);

    chargeGain.gain.setValueAtTime(0.05 * globalMasterVolume, now);
    chargeGain.gain.exponentialRampToValueAtTime(0.65 * globalMasterVolume, now + 0.8);
    chargeGain.gain.linearRampToValueAtTime(0.001, now + 0.84);

    chargeOsc.connect(chargeFilter);
    chargeFilter.connect(chargeGain);
    chargeGain.connect(ctx.destination);
    chargeOsc.start(now);
    chargeOsc.stop(now + 0.85);

    // 2. Heavy mechanical solenoid / relay trip CLACK at 0.84s
    const relayTime = now + 0.84;
    const relay = ctx.createOscillator();
    const relayGain = ctx.createGain();
    relay.type = 'triangle';
    relay.frequency.setValueAtTime(2200, relayTime);
    relay.frequency.exponentialRampToValueAtTime(200, relayTime + 0.03);
    relayGain.gain.setValueAtTime(0.8 * globalMasterVolume, relayTime);
    relayGain.gain.exponentialRampToValueAtTime(0.01, relayTime + 0.04);
    relay.connect(relayGain);
    relayGain.connect(ctx.destination);
    relay.start(relayTime);
    relay.stop(relayTime + 0.05);

    // 3. Massive 1000V electrical arc discharge explosive punch ("CRACK-BOOM")
    const zapTime = relayTime + 0.02;

    // Explosive sub-bass chest thump
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(130, zapTime);
    sub.frequency.exponentialRampToValueAtTime(24, zapTime + 0.4);
    subGain.gain.setValueAtTime(1.2 * globalMasterVolume, zapTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, zapTime + 0.45);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(zapTime);
    sub.stop(zapTime + 0.5);

    // 60Hz buzzing mains hum arc
    const hum = ctx.createOscillator();
    const humGain = ctx.createGain();
    hum.type = 'sawtooth';
    hum.frequency.setValueAtTime(60, zapTime);
    humGain.gain.setValueAtTime(0.9 * globalMasterVolume, zapTime);
    humGain.gain.exponentialRampToValueAtTime(0.01, zapTime + 0.22);
    hum.connect(humGain);
    humGain.connect(ctx.destination);
    hum.start(zapTime);
    hum.stop(zapTime + 0.25);

    // High energy electric spark explosion / plasma crackle
    const sparkSize = Math.floor(ctx.sampleRate * 0.4);
    const sparkBuf = ctx.createBuffer(1, sparkSize, ctx.sampleRate);
    const spd = sparkBuf.getChannelData(0);
    for (let i = 0; i < sparkSize; i++) {
      spd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
    }
    const spark = ctx.createBufferSource();
    spark.buffer = sparkBuf;
    const sparkFilter = ctx.createBiquadFilter();
    sparkFilter.type = 'highpass';
    sparkFilter.frequency.value = 1800;
    const sparkGain = ctx.createGain();
    sparkGain.gain.setValueAtTime(1.0 * globalMasterVolume, zapTime);
    sparkGain.gain.exponentialRampToValueAtTime(0.001, zapTime + 0.35);
    spark.connect(sparkFilter);
    sparkFilter.connect(sparkGain);
    sparkGain.connect(ctx.destination);
    spark.start(zapTime);
    spark.stop(zapTime + 0.38);

  } catch (e) {
    console.warn("Defibrillator sound failed:", e);
  }
};

export const playMedkitOpen = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Heavy industrial steel latches snapping open ("CLINK-CLACK")
    const latchTimes = [now, now + 0.08];
    const latchFreqs = [2800, 2200];
    latchTimes.forEach((lTime, idx) => {
      const lOsc = ctx.createOscillator();
      const lGain = ctx.createGain();
      lOsc.type = 'triangle';
      lOsc.frequency.setValueAtTime(latchFreqs[idx], lTime);
      lOsc.frequency.exponentialRampToValueAtTime(450, lTime + 0.05);
      lGain.gain.setValueAtTime(0.65 * globalMasterVolume, lTime);
      lGain.gain.exponentialRampToValueAtTime(0.01, lTime + 0.06);
      lOsc.connect(lGain);
      lGain.connect(ctx.destination);
      lOsc.start(lTime);
      lOsc.stop(lTime + 0.07);
    });

    // 2. Heavy metal lid hinge swing / creak
    const hingeSize = Math.floor(ctx.sampleRate * 0.3);
    const hingeBuf = ctx.createBuffer(1, hingeSize, ctx.sampleRate);
    const hd = hingeBuf.getChannelData(0);
    for (let i = 0; i < hingeSize; i++) hd[i] = (Math.random() * 2 - 1) * (1 - i / hingeSize);
    const hinge = ctx.createBufferSource();
    hinge.buffer = hingeBuf;
    const hingeFilter = ctx.createBiquadFilter();
    hingeFilter.type = 'bandpass';
    hingeFilter.frequency.setValueAtTime(800, now + 0.12);
    hingeFilter.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
    hingeFilter.Q.value = 4.0;
    const hingeGain = ctx.createGain();
    hingeGain.gain.setValueAtTime(0.4 * globalMasterVolume, now + 0.12);
    hingeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
    hinge.connect(hingeFilter);
    hingeFilter.connect(hingeGain);
    hingeGain.connect(ctx.destination);
    hinge.start(now + 0.12);
    hinge.stop(now + 0.4);

    // 3. Crinkling sterile foil blister pack / gauze tearing
    const tearTime = now + 0.35;
    const tearSize = Math.floor(ctx.sampleRate * 0.35);
    const tearBuf = ctx.createBuffer(1, tearSize, ctx.sampleRate);
    const td = tearBuf.getChannelData(0);
    for (let i = 0; i < tearSize; i++) {
      td[i] = (Math.random() > 0.7 ? (Math.random() * 2 - 1) : 0);
    }
    const tear = ctx.createBufferSource();
    tear.buffer = tearBuf;
    const tearFilter = ctx.createBiquadFilter();
    tearFilter.type = 'highpass';
    tearFilter.frequency.value = 3200;
    const tearGain = ctx.createGain();
    tearGain.gain.setValueAtTime(0, tearTime);
    tearGain.gain.linearRampToValueAtTime(0.55 * globalMasterVolume, tearTime + 0.05);
    tearGain.gain.exponentialRampToValueAtTime(0.01, tearTime + 0.32);
    tear.connect(tearFilter);
    tearFilter.connect(tearGain);
    tearGain.connect(ctx.destination);
    tear.start(tearTime);
    tear.stop(tearTime + 0.35);

    // 4. Pressurized antiseptic aerosol mist hiss
    const mistTime = now + 0.65;
    const mistSize = Math.floor(ctx.sampleRate * 0.45);
    const mistBuf = ctx.createBuffer(1, mistSize, ctx.sampleRate);
    const md = mistBuf.getChannelData(0);
    for (let i = 0; i < mistSize; i++) md[i] = Math.random() * 2 - 1;
    const mist = ctx.createBufferSource();
    mist.buffer = mistBuf;
    const mistFilter = ctx.createBiquadFilter();
    mistFilter.type = 'bandpass';
    mistFilter.frequency.setValueAtTime(4500, mistTime);
    mistFilter.Q.value = 2.0;
    const mistGain = ctx.createGain();
    mistGain.gain.setValueAtTime(0, mistTime);
    mistGain.gain.linearRampToValueAtTime(0.4 * globalMasterVolume, mistTime + 0.06);
    mistGain.gain.exponentialRampToValueAtTime(0.001, mistTime + 0.42);
    mist.connect(mistFilter);
    mistFilter.connect(mistGain);
    mistGain.connect(ctx.destination);
    mist.start(mistTime);
    mist.stop(mistTime + 0.45);

    // 5. Calming physiological adrenaline stabilization tone
    const healTime = now + 0.85;
    const chord = [440, 554.37, 659.25]; // A major soothing triad
    chord.forEach(freq => {
      const hOsc = ctx.createOscillator();
      const hGain = ctx.createGain();
      hOsc.type = 'sine';
      hOsc.frequency.setValueAtTime(freq, healTime);
      hGain.gain.setValueAtTime(0, healTime);
      hGain.gain.linearRampToValueAtTime(0.12 * globalMasterVolume, healTime + 0.15);
      hGain.gain.exponentialRampToValueAtTime(0.001, healTime + 0.8);
      hOsc.connect(hGain);
      hGain.connect(ctx.destination);
      hOsc.start(healTime);
      hOsc.stop(healTime + 0.85);
    });

  } catch (e) {
    console.warn("Medkit sound failed:", e);
  }
};

export const playScalpelCut = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const masterVol = globalMasterVolume;

    // 1. Surgical Carbon Steel Blade Draw & Placement Ping
    const glint = ctx.createOscillator();
    const glintGain = ctx.createGain();
    glint.type = 'triangle';
    glint.frequency.setValueAtTime(4600, now);
    glint.frequency.exponentialRampToValueAtTime(2800, now + 0.12);
    glintGain.gain.setValueAtTime(0, now);
    glintGain.gain.linearRampToValueAtTime(0.40 * masterVol, now + 0.015);
    glintGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    glint.connect(glintGain);
    glintGain.connect(ctx.destination);
    glint.start(now);
    glint.stop(now + 0.18);

    // Initial metallic contact "tick" on gun barrel
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(2200, now + 0.08);
    clickOsc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
    clickGain.gain.setValueAtTime(0, now + 0.08);
    clickGain.gain.linearRampToValueAtTime(0.35 * masterVol, now + 0.085);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now + 0.08);
    clickOsc.stop(now + 0.14);

    // 2. High-Tension Surgical Blade Metal Sawing & Grinding Strokes (4 abrasive sawing passes)
    const strokeTimes = [0.15, 0.42, 0.70, 0.98];
    strokeTimes.forEach((st, idx) => {
      const strokeStart = now + st;
      const strokeDur = 0.22;
      const strokeBufSize = Math.floor(ctx.sampleRate * strokeDur);
      const strokeBuf = ctx.createBuffer(1, strokeBufSize, ctx.sampleRate);
      const sData = strokeBuf.getChannelData(0);
      for (let i = 0; i < strokeBufSize; i++) {
        const progress = i / strokeBufSize;
        const envelope = Math.sin(progress * Math.PI);
        // Abrasive metal tooth grinding noise with high friction micro-shatter
        sData[i] = (Math.random() * 2 - 1) * Math.pow(envelope, 1.4) * (0.7 + 0.3 * Math.sin(i * 0.15));
      }

      const sNoise = ctx.createBufferSource();
      sNoise.buffer = strokeBuf;
      const sFilter = ctx.createBiquadFilter();
      sFilter.type = 'bandpass';
      const baseFreq = 3400 + idx * 450;
      sFilter.frequency.setValueAtTime(baseFreq, strokeStart);
      sFilter.frequency.exponentialRampToValueAtTime(baseFreq + 1600, strokeStart + strokeDur * 0.5);
      sFilter.frequency.exponentialRampToValueAtTime(baseFreq - 400, strokeStart + strokeDur);
      sFilter.Q.value = 8.5;

      const sGain = ctx.createGain();
      sGain.gain.setValueAtTime(0, strokeStart);
      sGain.gain.linearRampToValueAtTime((0.55 + idx * 0.08) * masterVol, strokeStart + strokeDur * 0.35);
      sGain.gain.exponentialRampToValueAtTime(0.001, strokeStart + strokeDur);

      sNoise.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(ctx.destination);
      sNoise.start(strokeStart);
      sNoise.stop(strokeStart + strokeDur + 0.02);

      // High-frequency hot metal shaving screech overtone
      const screech = ctx.createOscillator();
      const screechGain = ctx.createGain();
      screech.type = 'sawtooth';
      screech.frequency.setValueAtTime(1800 + idx * 300, strokeStart);
      screech.frequency.exponentialRampToValueAtTime(3200 + idx * 400, strokeStart + strokeDur * 0.5);
      screech.frequency.exponentialRampToValueAtTime(2100, strokeStart + strokeDur);

      const screechFilter = ctx.createBiquadFilter();
      screechFilter.type = 'highpass';
      screechFilter.frequency.value = 1600;

      screechGain.gain.setValueAtTime(0, strokeStart);
      screechGain.gain.linearRampToValueAtTime(0.18 * masterVol, strokeStart + strokeDur * 0.2);
      screechGain.gain.exponentialRampToValueAtTime(0.001, strokeStart + strokeDur);

      screech.connect(screechFilter);
      screechFilter.connect(screechGain);
      screechGain.connect(ctx.destination);
      screech.start(strokeStart);
      screech.stop(strokeStart + strokeDur + 0.02);
    });

    // 3. Heavy Metal Fracture Snap & Barrel Shear (At cut apex t=1.28s)
    const snapTime = now + 1.28;
    
    // Snap crack impulse
    const snapBufSize = Math.floor(ctx.sampleRate * 0.08);
    const snapBuf = ctx.createBuffer(1, snapBufSize, ctx.sampleRate);
    const snapData = snapBuf.getChannelData(0);
    for (let i = 0; i < snapBufSize; i++) {
      snapData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
    }
    const snapNoise = ctx.createBufferSource();
    snapNoise.buffer = snapBuf;
    const snapFilter = ctx.createBiquadFilter();
    snapFilter.type = 'highpass';
    snapFilter.frequency.value = 2200;
    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(0.85 * masterVol, snapTime);
    snapGain.gain.exponentialRampToValueAtTime(0.001, snapTime + 0.07);
    snapNoise.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapNoise.start(snapTime);
    snapNoise.stop(snapTime + 0.08);

    // Hardened gun steel fracture ring
    const shearRing = ctx.createOscillator();
    const shearGain = ctx.createGain();
    shearRing.type = 'triangle';
    shearRing.frequency.setValueAtTime(1920, snapTime);
    shearRing.frequency.exponentialRampToValueAtTime(840, snapTime + 0.45);
    shearGain.gain.setValueAtTime(0, snapTime);
    shearGain.gain.linearRampToValueAtTime(0.65 * masterVol, snapTime + 0.005);
    shearGain.gain.exponentialRampToValueAtTime(0.001, snapTime + 0.50);
    shearRing.connect(shearGain);
    shearGain.connect(ctx.destination);
    shearRing.start(snapTime);
    shearRing.stop(snapTime + 0.55);

    // 4. Severed Steel Barrel Piece Bouncing on Wooden Table
    // Staggered physical table clatter impacts
    const bounces = [
      { delay: 1.44, freq: 1420, woodFreq: 140, gain: 0.55, decay: 0.22 }, // Heavy initial drop
      { delay: 1.62, freq: 1880, woodFreq: 190, gain: 0.32, decay: 0.16 }, // 1st bounce
      { delay: 1.76, freq: 2350, woodFreq: 240, gain: 0.18, decay: 0.10 }, // 2nd bounce
      { delay: 1.86, freq: 2800, woodFreq: 280, gain: 0.09, decay: 0.06 }, // Settling roll tap
    ];

    bounces.forEach((b) => {
      const bTime = now + b.delay;
      
      // Steel ring ping
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      bOsc.type = 'sine';
      bOsc.frequency.setValueAtTime(b.freq, bTime);
      bOsc.frequency.exponentialRampToValueAtTime(b.freq * 0.95, bTime + b.decay);
      bGain.gain.setValueAtTime(0, bTime);
      bGain.gain.linearRampToValueAtTime(b.gain * masterVol, bTime + 0.003);
      bGain.gain.exponentialRampToValueAtTime(0.001, bTime + b.decay);
      bOsc.connect(bGain);
      bGain.connect(ctx.destination);
      bOsc.start(bTime);
      bOsc.stop(bTime + b.decay + 0.02);

      // Wooden table body thud
      const wOsc = ctx.createOscillator();
      const wGain = ctx.createGain();
      wOsc.type = 'triangle';
      wOsc.frequency.setValueAtTime(b.woodFreq, bTime);
      wOsc.frequency.exponentialRampToValueAtTime(45, bTime + b.decay * 0.7);
      wGain.gain.setValueAtTime(0, bTime);
      wGain.gain.linearRampToValueAtTime(b.gain * 0.65 * masterVol, bTime + 0.004);
      wGain.gain.exponentialRampToValueAtTime(0.001, bTime + b.decay * 0.8);
      wOsc.connect(wGain);
      wGain.connect(ctx.destination);
      wOsc.start(bTime);
      wOsc.stop(bTime + b.decay + 0.02);
    });

  } catch (e) {
    console.warn("Scalpel cut audio failed:", e);
  }
};

export const playCigaretteLighting = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Zippo Lighter Brass Cap Flip "CLINK" with metallic ring
    const flipOsc = ctx.createOscillator();
    const flipGain = ctx.createGain();
    flipOsc.type = 'triangle';
    flipOsc.frequency.setValueAtTime(3400, now);
    flipOsc.frequency.exponentialRampToValueAtTime(1600, now + 0.06);
    flipGain.gain.setValueAtTime(0.75 * globalMasterVolume, now);
    flipGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    flipOsc.connect(flipGain);
    flipGain.connect(ctx.destination);
    flipOsc.start(now);
    flipOsc.stop(now + 0.09);

    // 2. Serrated steel flint wheel strike friction scrapes
    const strikeTime = now + 0.16;
    const strikeSize = Math.floor(ctx.sampleRate * 0.18);
    const strikeBuf = ctx.createBuffer(1, strikeSize, ctx.sampleRate);
    const sd = strikeBuf.getChannelData(0);
    for (let i = 0; i < strikeSize; i++) {
      sd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / strikeSize, 0.8) * (Math.random() > 0.3 ? 1 : 0);
    }
    const spark = ctx.createBufferSource();
    spark.buffer = strikeBuf;
    const sparkFilter = ctx.createBiquadFilter();
    sparkFilter.type = 'bandpass';
    sparkFilter.frequency.setValueAtTime(4800, strikeTime);
    sparkFilter.Q.value = 4.5;
    const sparkGain = ctx.createGain();
    sparkGain.gain.setValueAtTime(0.95 * globalMasterVolume, strikeTime);
    sparkGain.gain.exponentialRampToValueAtTime(0.01, strikeTime + 0.15);
    spark.connect(sparkFilter);
    sparkFilter.connect(sparkGain);
    sparkGain.connect(ctx.destination);
    spark.start(strikeTime);
    spark.stop(strikeTime + 0.18);

    // 3. Fluid ignition whoosh & warm turbulent flame
    const flameTime = strikeTime + 0.07;
    const flameBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.85), ctx.sampleRate);
    const fd = flameBuf.getChannelData(0);
    for (let i = 0; i < fd.length; i++) fd[i] = Math.random() * 2 - 1;
    const flame = ctx.createBufferSource();
    flame.buffer = flameBuf;
    const flameFilter = ctx.createBiquadFilter();
    flameFilter.type = 'lowpass';
    flameFilter.frequency.setValueAtTime(1400, flameTime);
    flameFilter.frequency.linearRampToValueAtTime(550, flameTime + 0.8);
    const flameGain = ctx.createGain();
    flameGain.gain.setValueAtTime(0, flameTime);
    flameGain.gain.linearRampToValueAtTime(0.6 * globalMasterVolume, flameTime + 0.06);
    flameGain.gain.exponentialRampToValueAtTime(0.01, flameTime + 0.82);
    flame.connect(flameFilter);
    flameFilter.connect(flameGain);
    flameGain.connect(ctx.destination);
    flame.start(flameTime);
    flame.stop(flameTime + 0.85);

    // 4. Dry cured tobacco crackling sizzle & deep inhalation draw
    const sizzleTime = flameTime + 0.18;
    const sizzleBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.95), ctx.sampleRate);
    const szd = sizzleBuf.getChannelData(0);
    for (let i = 0; i < szd.length; i++) {
      szd[i] = (Math.random() > 0.84 ? (Math.random() * 2 - 1) : 0);
    }
    const sizzle = ctx.createBufferSource();
    sizzle.buffer = sizzleBuf;
    const sizzleFilter = ctx.createBiquadFilter();
    sizzleFilter.type = 'highpass';
    sizzleFilter.frequency.value = 3400;
    const sizzleGain = ctx.createGain();
    sizzleGain.gain.setValueAtTime(0, sizzleTime);
    sizzleGain.gain.linearRampToValueAtTime(0.5 * globalMasterVolume, sizzleTime + 0.22);
    sizzleGain.gain.exponentialRampToValueAtTime(0.01, sizzleTime + 0.9);
    sizzle.connect(sizzleFilter);
    sizzleFilter.connect(sizzleGain);
    sizzleGain.connect(ctx.destination);
    sizzle.start(sizzleTime);
    sizzle.stop(sizzleTime + 0.95);

  } catch (e) {
    console.warn("Cigarette lighting sound failed:", e);
  }
};

export const playSmokeExhale = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Multi-phase warm pulmonary exhalation noise
    const bufferSize = Math.floor(ctx.sampleRate * 1.35);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const exhale = ctx.createBufferSource();
    exhale.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, now);
    filter.frequency.linearRampToValueAtTime(920, now + 0.55);
    filter.frequency.linearRampToValueAtTime(260, now + 1.25);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.42 * globalMasterVolume, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    exhale.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    exhale.start(now);
    exhale.stop(now + 1.35);
  } catch (e) {
    console.warn("Smoke exhale sound failed:", e);
  }
};

export const playSyringeSlam = () => {
  playSound('syringeSlam', true, 1.0);
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // 1. Aerodynamic downward stab whoosh
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.16);
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.7 * globalMasterVolume, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.17);
    osc.start(now);
    osc.stop(now + 0.18);

    // 2. Visceral sternum impact flesh thud & bone shock
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.type = 'sine';
    thud.frequency.setValueAtTime(120, now + 0.07);
    thud.frequency.linearRampToValueAtTime(22, now + 0.24);
    thudGain.gain.setValueAtTime(0, now);
    thudGain.gain.setValueAtTime(1.1 * globalMasterVolume, now + 0.07);
    thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    thud.start(now + 0.07);
    thud.stop(now + 0.32);

    // 3. High-pressure liquid epinephrine vascular hydraulic squirt & friction squeak
    const squirt = ctx.createOscillator();
    const squirtGain = ctx.createGain();
    squirt.connect(squirtGain);
    squirtGain.connect(ctx.destination);
    squirt.type = 'triangle';
    squirt.frequency.setValueAtTime(1200, now + 0.11);
    squirt.frequency.exponentialRampToValueAtTime(2600, now + 0.36);
    squirtGain.gain.setValueAtTime(0, now);
    squirtGain.gain.setValueAtTime(0.4 * globalMasterVolume, now + 0.11);
    squirtGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    squirt.start(now + 0.11);
    squirt.stop(now + 0.42);

    setTimeout(() => {
      try {
        osc.disconnect(); gain.disconnect();
        thud.disconnect(); thudGain.disconnect();
        squirt.disconnect(); squirtGain.disconnect();
      } catch (err) {}
    }, 500);
  } catch (e) {
    console.warn("Synth slam sound failed:", e);
  }
};

export const playThumpSound = () => {
  playSound('thump', true, 1.0);
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Deep seismic body collapse / floor thud frequency sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(105, now);
    osc.frequency.exponentialRampToValueAtTime(16, now + 0.5);
    gain.gain.setValueAtTime(1.15 * globalMasterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.52);
    osc.start(now);
    osc.stop(now + 0.55);

    // 2. High-frequency wood table / floorboard rattling shock
    const board = ctx.createOscillator();
    const boardGain = ctx.createGain();
    board.connect(boardGain);
    boardGain.connect(ctx.destination);
    board.type = 'triangle';
    board.frequency.setValueAtTime(210, now);
    board.frequency.linearRampToValueAtTime(38, now + 0.15);
    boardGain.gain.setValueAtTime(0.5 * globalMasterVolume, now);
    boardGain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
    board.start(now);
    board.stop(now + 0.18);

    // 3. Secondary subtle dust / cloth flutter decay
    const dustSize = Math.floor(ctx.sampleRate * 0.25);
    const dustBuf = ctx.createBuffer(1, dustSize, ctx.sampleRate);
    const dd = dustBuf.getChannelData(0);
    for (let i = 0; i < dustSize; i++) dd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
    const dust = ctx.createBufferSource();
    dust.buffer = dustBuf;
    const dustFilter = ctx.createBiquadFilter();
    dustFilter.type = 'lowpass';
    dustFilter.frequency.value = 600;
    const dustGain = ctx.createGain();
    dustGain.gain.setValueAtTime(0.3 * globalMasterVolume, now + 0.05);
    dustGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    dust.connect(dustFilter);
    dustFilter.connect(dustGain);
    dustGain.connect(ctx.destination);
    dust.start(now + 0.05);
    dust.stop(now + 0.3);

    setTimeout(() => {
      try {
        osc.disconnect(); gain.disconnect();
        board.disconnect(); boardGain.disconnect();
        dust.disconnect(); dustFilter.disconnect(); dustGain.disconnect();
      } catch (err) {}
    }, 600);
  } catch (e) {
    console.warn("Synth thump sound failed:", e);
  }
};



export const playGlassBreakSound = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    // High frequency noise burst for the glass shattering
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      // Create noisy, jagged wave representing glass shards
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 6000;
    bandpass.Q.value = 0.5;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 3000;
    
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(1.5 * globalMasterVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    noiseSource.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Also add a low thump for the bottle body hitting the ground
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);
    
    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0.8 * globalMasterVolume, ctx.currentTime);
    thumpGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);

    noiseSource.start(ctx.currentTime);
  } catch (e) {
    console.error('Failed to play glass break sound', e);
  }
};
