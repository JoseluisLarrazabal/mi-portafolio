// Non-three on purpose: the initial chunk must not pull in the 3D stack.
let cached: boolean | undefined

export function hasWebGL(): boolean {
  if (cached !== undefined) return cached
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    cached = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    cached = false
  }
  return cached
}

/** Called when the 3D scene fails or loses its context: the list view becomes the only mode. */
export function disableWebGL() {
  cached = false
}
