import { NextRequest, NextResponse } from 'next/server'

type Service = 'gemini' | 'huggingface' | 'pexels'

export async function POST(request: NextRequest) {
  try {
    const { service, apiKey } = await request.json() as { service?: Service; apiKey?: string }

    if (!apiKey?.trim()) {
      return NextResponse.json({ success: false, error: 'Enter an API key before testing it.' }, { status: 400 })
    }

    let result: { success: boolean; error?: string }
    switch (service) {
      case 'gemini':
        result = await testGeminiConnection(apiKey.trim())
        break
      case 'huggingface':
        result = await testHuggingFaceConnection(apiKey.trim())
        break
      case 'pexels':
        result = await testPexelsConnection(apiKey.trim())
        break
      default:
        return NextResponse.json({ success: false, error: 'Unknown service.' }, { status: 400 })
    }

    return NextResponse.json(result, { status: result.success ? 200 : 422 })
  } catch (error) {
    console.error('API connection test failed:', error)
    return NextResponse.json({ success: false, error: 'The connection test could not be completed. Please try again.' }, { status: 500 })
  }
}

async function testGeminiConnection(apiKey: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with OK.' }] }] }),
    },
  )

  if (response.ok) return { success: true }
  return { success: false, error: await providerError(response, 'Gemini') }
}

async function testHuggingFaceConnection(apiKey: string) {
  // This identity endpoint validates the token without triggering a model inference job.
  // The previous Stable Diffusion request could fail because the model was unavailable,
  // loading, gated, or deprecated even where the token itself was valid.
  const response = await fetch('https://huggingface.co/api/whoami-v2', {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
  })

  if (response.ok) return { success: true }
  return { success: false, error: await providerError(response, 'Hugging Face') }
}

async function testPexelsConnection(apiKey: string) {
  const response = await fetch('https://api.pexels.com/v1/search?query=technology&per_page=1', {
    headers: { Authorization: apiKey },
    cache: 'no-store',
  })

  if (response.ok) return { success: true }
  return { success: false, error: await providerError(response, 'Pexels') }
}

async function providerError(response: Response, provider: string) {
  const fallback = `${provider} rejected this key (HTTP ${response.status}).`
  try {
    const body = await response.json() as { error?: { message?: string } | string; message?: string }
    const detail = typeof body.error === 'string' ? body.error : body.error?.message || body.message
    return detail ? `${provider}: ${detail}` : fallback
  } catch {
    return fallback
  }
}
