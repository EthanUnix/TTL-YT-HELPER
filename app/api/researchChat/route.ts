import { NextRequest, NextResponse } from 'next/server'
import { getUserApiKeys } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json() as {
      message?: string
      history?: Array<{ role: 'user' | 'model'; content: string }>
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Enter a question to start the research chat.' }, { status: 400 })
    }

    const { user, keys } = await getUserApiKeys(request)
    if (!user) return NextResponse.json({ error: 'Please sign in again to use research chat.' }, { status: 401 })
    if (!keys?.gemini_key) {
      return NextResponse.json({ error: 'Add and save a Google Gemini API key in Settings before using research chat.' }, { status: 400 })
    }

    const contents = [
      ...history.slice(-10).map((item) => ({
        role: item.role,
        parts: [{ text: item.content }],
      })),
      { role: 'user' as const, parts: [{ text: message.trim() }] },
    ]

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(keys.gemini_key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: 'You are TheTechLounge Research Assistant. Give accurate, clearly structured research support for YouTube creators. State uncertainty, distinguish fact from opinion, and suggest useful source types or follow-up questions where appropriate. Do not claim to have browsed the live web unless the user provides sources.',
            }],
          },
          contents,
          generationConfig: { temperature: 0.55, maxOutputTokens: 1200 },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini research request failed:', response.status, errorText)
      return NextResponse.json({ error: `Gemini rejected the request (HTTP ${response.status}). Verify the saved API key and its project access.` }, { status: 422 })
    }

    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    const answer = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim()

    if (!answer) return NextResponse.json({ error: 'Gemini returned no usable response. Please try again.' }, { status: 502 })
    return NextResponse.json({ answer })
  } catch (error) {
    console.error('Research chat request failed:', error)
    return NextResponse.json({ error: 'Research chat is temporarily unavailable. Please try again.' }, { status: 500 })
  }
}
