import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'

// Sarvam AI (Bulbul v3) text-to-speech proxy. The API key stays on the server
// (SARVAM_API_KEY, deliberately not VITE_-prefixed) so it never ships in the bundle.
const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech'
const SARVAM_LANGUAGES = new Set(['bn-IN', 'en-IN', 'gu-IN', 'hi-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'od-IN', 'pa-IN', 'ta-IN', 'te-IN'])

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function sarvamTtsPlugin(env: Record<string, string>): Plugin {
  const apiKey = env.SARVAM_API_KEY
  const speaker = env.SARVAM_SPEAKER || 'priya'

  const handler: Connect.NextHandleFunction = async (req, res) => {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
    if (!apiKey) return sendJson(res, 503, { error: 'SARVAM_API_KEY is not configured' })

    let text: string, languageCode: string
    try {
      ;({ text, languageCode } = JSON.parse(await readBody(req)))
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON' })
    }
    if (!text || typeof text !== 'string' || text.length > 2500) return sendJson(res, 400, { error: 'text must be 1-2500 characters' })
    if (!SARVAM_LANGUAGES.has(languageCode)) return sendJson(res, 400, { error: `Unsupported language: ${languageCode}` })

    try {
      const upstream = await fetch(SARVAM_TTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-subscription-key': apiKey },
        body: JSON.stringify({
          text,
          language_code: languageCode,
          model: 'bulbul:v3',
          speaker,
          pace: 1.1,
          speech_sample_rate: 24000,
          output_audio_codec: 'mp3',
        }),
      })
      const payload = (await upstream.json().catch(() => ({}))) as { audios?: string[] }
      if (!upstream.ok) {
        console.warn('[Sarvam TTS]', upstream.status, payload)
        return sendJson(res, upstream.status, { error: 'Sarvam TTS request failed' })
      }
      sendJson(res, 200, { audios: payload.audios ?? [], mime: 'audio/mpeg' })
    } catch (e) {
      console.warn('[Sarvam TTS] network error', e)
      sendJson(res, 502, { error: 'Could not reach Sarvam TTS' })
    }
  }

  return {
    name: 'sarvam-tts-proxy',
    configureServer(server) {
      server.middlewares.use('/api/tts', handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/tts', handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), sarvamTtsPlugin(env)],
  }
})
