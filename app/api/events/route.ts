'use server'

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Support single envelope or batch { events: [...] }
    const events = Array.isArray(body) ? body : (body.events ?? (body.event_name ? [body] : []))

    if (!events || events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 })
    }

    // Basic validation: ensure required fields exist
    for (const ev of events) {
      if (!ev.event_name || !ev.event_id || !ev.event_time || !ev.properties) {
        return NextResponse.json({ error: 'Invalid envelope. Missing event_name/event_id/event_time/properties' }, { status: 400 })
      }
    }

    // Append to local events log for development (fallback publisher)
    const logPath = path.resolve(process.cwd(), 'events.log')
    const appendData = events.map((e: any) => JSON.stringify(e)).join('\n') + '\n'
    await fs.promises.appendFile(logPath, appendData, { encoding: 'utf8' })

    // In a real gateway, this is where you'd publish to RabbitMQ/Kafka/Redis

    return NextResponse.json({ accepted: true, count: events.length }, { status: 202 })
  } catch (err) {
    console.error('Event gateway error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
