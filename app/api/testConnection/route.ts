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
        const geminiResult = await testGeminiConnection(apiKey)
        success = geminiResult.success
        error = geminiResult.error
        break
      case 'huggingface':
        success = await testHuggingFaceConnection(apiKey)
        if (!success) error = 'Failed to connect to Hugging Face API'
        break
      case 'pexels':
        success = await testPexelsConnection(apiKey)
        if (!success) error = 'Failed to connect to Pexels API'
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

async function testGeminiConnection(apiKey: string): Promise<{success: boolean, error: string}> {
  // List of Gemini models to try in order of preference
  const modelsToTry = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-pro'
  ]

  let lastError = ''

  for (const model of modelsToTry) {
    try {
      console.log(`Testing Gemini model: ${model}`)
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hello, this is a test message. Please respond with "Test successful".'
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 50
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Check if the response contains the expected structure
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
          console.log(`Successfully connected using model: ${model}`)
          return { success: true, error: '' }
        }
      } else {
        const errorText = await response.text()
        console.log(`Model ${model} failed with status ${response.status}: ${errorText}`)
        
        // Store the error from the first (preferred) model
        if (model === modelsToTry[0]) {
          if (response.status === 400) {
            lastError = 'Invalid API key or request format'
          } else if (response.status === 403) {
            lastError = 'API key does not have permission or quota exceeded'
          } else if (response.status === 404) {
            lastError = 'Model not available for this API key'
          } else {
            lastError = `API error: ${response.status} ${response.statusText}`
          }
        }
      }
    } catch (error) {
      console.log(`Network error testing model ${model}:`, error)
      if (model === modelsToTry[0]) {
        lastError = 'Network error or invalid API key'
      }
    }
  }

  // If we get here, none of the models worked
  return { 
    success: false, 
    error: lastError || 'No compatible Gemini models available for this API key'
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

