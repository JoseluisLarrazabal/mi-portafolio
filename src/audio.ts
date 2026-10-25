// Zero-asset WebAudio. The context is created lazily, only from a user gesture (the mute toggle).
let ctx: AudioContext | null = null
let master: GainNode | null = null
let pad: { oscs: OscillatorNode[]; lfo: OscillatorNode } | null = null
let wanted = false // sound is on; decides whether returning to the tab resumes the context
let noise: AudioBuffer | null = null

function ensure(): AudioContext | null {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) void ctx?.suspend()
      else if (wanted) void ctx?.resume()
    })
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function startAmbient() {
  wanted = true
  const c = ensure()
  if (!c || !master || pad) {
    if (c && master) master.gain.setTargetAtTime(0.5, c.currentTime, 0.8)
    return
  }
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 420
  const oscs = [110, 110.7].map((f, i) => {
    const o = c.createOscillator()
    o.type = i ? 'triangle' : 'sine'
    o.frequency.value = f
    o.connect(filter)
    o.start()
    return o
  })
  const lfo = c.createOscillator()
  const lfoGain = c.createGain()
  lfo.frequency.value = 0.07
  lfoGain.gain.value = 180
  lfo.connect(lfoGain).connect(filter.frequency)
  lfo.start()
  const level = c.createGain()
  level.gain.value = 0.16
  filter.connect(level).connect(master)
  pad = { oscs, lfo }
  master.gain.setTargetAtTime(0.5, c.currentTime, 0.8)
}

export function stopAmbient() {
  wanted = false
  if (!ctx || !master) return
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.3)
  // Fade is ~1s; tear the pad down afterwards so a later start rebuilds it.
  const old = pad
  pad = null
  if (old) {
    setTimeout(() => {
      ;[...old.oscs, old.lfo].forEach((o) => { try { o.stop() } catch { /* already stopped */ } })
      if (!wanted) void ctx?.suspend()
    }, 1200)
  }
}

export function whoosh() {
  const c = ensure()
  if (!c || !master) return
  if (!noise) {
    const len = Math.floor(c.sampleRate * 1.6)
    noise = c.createBuffer(1, len, c.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  }
  const src = c.createBufferSource()
  src.buffer = noise
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 1.2
  const t = c.currentTime
  bp.frequency.setValueAtTime(200, t)
  bp.frequency.exponentialRampToValueAtTime(2600, t + 0.9)
  bp.frequency.exponentialRampToValueAtTime(300, t + 1.6)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.5)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6)
  src.connect(bp).connect(g).connect(master)
  src.start(t)
  src.stop(t + 1.7)
}
