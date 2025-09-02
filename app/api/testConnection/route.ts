import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { service, apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API key is required' })
    }

    let success = false
    let error = ''

    switch (service) {
      case 'gemini':
        success = await testGeminiConnection(apiKey)
        break
      case 'huggingface':
        success = await testHuggingFaceConnection(apiKey)
        break
      case 'pexels':
        success = await testPexelsConnection(apiKey)
        break
      default:
        error = 'Unknown service'
    }

    return NextResponse.json({ success, error })
  } catch (error) {
    console.error('Error testing connection:', error)
    return NextResponse.json({ success: false, error: 'Connection test failed' })
  }
}

async function testGeminiConnection(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello, this is a test.'
          }]
        }]
      })
    })

    return response.ok
  } catch (error) {
    console.error('Gemini connection test failed:', error)
    return false
  }
}

async function testHuggingFaceConnection(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: 'test image'
      })
    })

    return response.ok || response.status === 503 // 503 means model is loading, which is still a valid API key
  } catch (error) {
    console.error('Hugging Face connection test failed:', error)
    return false
  }
}

async function testPexelsConnection(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.pexels.com/v1/search?query=test&per_page=1', {
      headers: {
        'Authorization': apiKey
      }
    })

    return response.ok
  } catch (error) {
    console.error('Pexels connection test failed:', error)
    return false
  }
}

