import { describe, expect, it } from 'vitest'

import { AxMemory } from '../mem/memory.js'

import {
  processFieldProcessors,
  processStreamingFieldProcessors,
} from './fieldProcessor.js'
import type { AxFieldValue, AxGenOut } from './program.js'

describe('Field Processor Functions', () => {
  it('processFieldProcessors should execute the processor and update memory', async () => {
    // Dummy synchronous processor: converts the value to uppercase.
    const dummyProcessor = {
      field: {
        name: 'testField',
        title: 'testField',
        type: { name: 'string' as const, isArray: false },
      },
      process: async (value: AxFieldValue) => {
        if (typeof value === 'string') {
          return value.toUpperCase()
        }
        return value
      },
    }

    const values: AxGenOut = { testField: 'hello world' }
    const mem = new AxMemory()
    const sessionId = 'session-sync'

    await processFieldProcessors([dummyProcessor], values, mem, sessionId)

    // The processor no longer updates the 'values' object directly.
    // Instead, we check that memory has been updated.
    const history = mem.history(sessionId)
    expect(history.length).toBe(1)

    // The message text is generated by addToMemory and will include the processed string.
    // We use toContain() to check that "HELLO WORLD" appears.
    const { chat, tags } = mem.getLast(sessionId) as {
      chat: { role: string; content: { type: string; text: string }[] }
      tags?: string[]
    }
    expect(tags).toContain('processor')
    expect(chat?.role).toBe('user')
    expect(chat?.content[0]?.text).toContain('HELLO WORLD')
  })

  it('processStreamingFieldProcessors should execute the processor and update memory without yielding any values', async () => {
    // Dummy streaming processor: appends a suffix.
    const dummyStreamingProcessor = {
      field: {
        name: 'streamField',
        title: 'streamField',
        type: { name: 'string' as const, isArray: false },
      },
      process: async (value: unknown) => {
        if (typeof value === 'string') {
          return value + ' updated'
        }
        return value
      },
    }

    const values: AxGenOut = { streamField: 'original' }
    const mem = new AxMemory()
    const sessionId = 'session-stream'
    // Create an extraction state with the current field set and start index 0.
    const xstate = {
      currField: dummyStreamingProcessor.field,
      s: 0,
      extractedFields: [],
      streamedIndex: {},
    }

    // Provide an initial content string.
    await processStreamingFieldProcessors(
      [dummyStreamingProcessor],
      'original',
      xstate,
      mem,
      values,
      sessionId,
      false
    )

    // Check that an assistant message is added into the session's history.
    const history = mem.history(sessionId)
    expect(history.length).toBe(1)

    const { chat, tags } = mem.getLast(sessionId) as {
      chat: { role: string; content: { type: string; text: string }[] }
      tags?: string[]
    }
    expect(tags).toContain('processor')
    expect(chat.role).toBe('user')
    expect(chat.content?.[0]?.text).toContain('original updated')
  })
})
