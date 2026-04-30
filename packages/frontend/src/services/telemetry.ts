/**
 * Best-effort frontend telemetry. Sends a fire-and-forget POST to /api/telemetry.
 * Failures are swallowed — telemetry must never break the page.
 *
 * Events are whitelisted server-side (see aicn.routes/telemetry-event-allowlist).
 */

type TelemetryDetails = Record<string, unknown>

const ENDPOINT = '/api/telemetry'

export function track(event: string, details?: TelemetryDetails): void {
  try {
    const body = JSON.stringify({ event, details: details ?? null })

    // Prefer sendBeacon: survives page navigation/unload.
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' })
      const ok = navigator.sendBeacon(ENDPOINT, blob)
      if (ok) return
    }

    // Fallback: regular fetch, fire-and-forget.
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => { /* swallow */ })
  } catch {
    // Never throw from telemetry.
  }
}
