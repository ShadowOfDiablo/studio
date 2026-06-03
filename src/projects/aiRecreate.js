import { defaultContent } from '../../../gradinko/src/content.js'

const OLLAMA_BASE = 'http://localhost:11434'

export async function checkOllama() {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 4000)
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return { available: false, models: [] }
    const data = await res.json()
    return {
      available: true,
      models: (data.models || []).map(m => m.name).sort()
    }
  } catch {
    clearTimeout(timer)
    return { available: false, models: [] }
  }
}

const SYSTEM_PROMPT =
  'You are a content migration assistant for Gradinko Studio, a Bulgarian website editor. ' +
  'The user will provide source content (HTML, plain text, or JSON from an existing website) ' +
  'and a target JSON schema. Your ONLY output must be a single valid JSON object that matches ' +
  'the schema exactly. No explanations, no markdown fences, no extra text — just the JSON.'

export async function generateContent({ model, sourceContent, schema, onChunk, signal }) {
  const schemaStr = JSON.stringify(schema ?? defaultContent, null, 2)
  const userMsg =
    `Target schema (with example values):\n${schemaStr}\n\n` +
    `Source content to migrate:\n${sourceContent}\n\n` +
    'Map the source content onto the schema. Preserve the schema structure exactly. ' +
    'Fill every field with relevant content from the source. Output ONLY the JSON object.'

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMsg }
      ],
      stream: true,
      format: 'json',
      options: { temperature: 0.2, num_predict: 4096 }
    }),
    signal
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Ollama грешка ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const raw = decoder.decode(value, { stream: true })
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue
      try {
        const obj = JSON.parse(line)
        const token = obj.message?.content || ''
        if (token) { full += token; onChunk?.(full) }
        if (obj.done) break
      } catch {}
    }
  }

  try {
    return JSON.parse(full)
  } catch {
    const m = full.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
    throw new Error('AI не върна валиден JSON. Опитайте с друг модел или проверете изходното съдържание.')
  }
}
