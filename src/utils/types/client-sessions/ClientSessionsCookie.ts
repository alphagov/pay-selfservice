export default interface ClientSessionsCookie {
  reset: () => void
  setDuration: (duration: number) => void
  destroy: (callback?: (err?: unknown) => void) => void
  regenerate?: unknown
  save?: unknown
  last_url?: string

  [key: string]: unknown
}
