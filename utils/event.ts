export function randomId(): string {
  try {
    // @ts-ignore
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      // @ts-ignore
      return crypto.randomUUID()
    }
  } catch (e) {
    // ignore
  }

  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

export function buildEnvelope(eventName: string, properties: Record<string, any>, opts: { batchId?: string; traceId?: string; spanId?: string; anonymousId?: string; contextToken?: string } = {}) {
  const now = new Date().toISOString()
  const envelope = {
    envelope_schema_version: 1,
    batch_id: opts.batchId ?? randomId(),
    event_id: randomId(),
    event_name: eventName,
    event_time: now,
    trace_id: opts.traceId ?? randomId().slice(0, 16),
    span_id: opts.spanId ?? randomId().slice(0, 8),
    parent_span_id: null,
    anonymous_id: opts.anonymousId ?? '',
    context_token: opts.contextToken ?? '',
    commit_sha: process.env.NEXT_PUBLIC_COMMIT_SHA ?? process.env.COMMIT_SHA ?? 'dev',
    properties,
  }

  return envelope
}

export async function postEnvelope(envelope: any) {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(envelope),
  })

  return res
}
