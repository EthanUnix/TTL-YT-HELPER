import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import archiver from 'archiver'
import { Readable } from 'stream'

export async function POST(request: NextRequest) {
  try {
    const { topic, format, voice } = await request.json()

    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user API keys from database
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: apiKeysData, error: keysError } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (keysError || !apiKeysData) {
      return NextResponse.json({ error: 'API keys not configured' }, { status: 400 })
    }

    // Step 1: Generate content using Gemini
    const geminiResponse = await generateWithGemini(topic, format, apiKeysData.gemini_key)
    
    // Step 2: Generate voiceover
    const voiceoverBuffer = await generateVoiceover(geminiResponse.script, voice)
    
    // Step 3: Download B-roll videos from Pexels
    const brollVideos = await downloadBrollVideos(geminiResponse.brollKeywords, apiKeysData.pexels_key)
    
    // Step 4: Generate AI images using Hugging Face
    const aiImages = await generateAIImages(geminiResponse.imageConcepts, apiKeysData.huggingface_key)
    
    // Step 5: Create zip archive of all visual assets
    const visualsZip = await createVisualsZip([...brollVideos, ...aiImages])
    
    // Step 6: Upload files to Supabase Storage
    const scriptUrl = await uploadToStorage(`script_${Date.now()}.txt`, geminiResponse.script, 'text/plain')
    const voiceoverUrl = await uploadToStorage(`voiceover_${Date.now()}.mp3`, voiceoverBuffer, 'audio/mpeg')
    const visualsUrl = await uploadToStorage(`visuals_${Date.now()}.zip`, visualsZip, 'application/zip')

    // Return response
    return NextResponse.json({
      titles: geminiResponse.titles,
      script: geminiResponse.script,
      editingGuide: geminiResponse.editingGuide,
      visualAssets: [...geminiResponse.brollKeywords, ...geminiResponse.imageConcepts],
      downloadUrls: {
        script: scriptUrl,
        voiceover: voiceoverUrl,
        visuals: visualsUrl
      }
    })

  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateWithGemini(topic: string, format: string, apiKey: string) {
  // Master Gemini prompt from the specification
  const prompt = `Act as the lead scriptwriter and creative director for 'TheTechLounge', a sophisticated YouTube channel. Your task is to generate a complete, production-ready content package for a video.

**Topic:** ${topic}

First, you MUST internalize and strictly adhere to these two documents:
---
**DOCUMENT 1: The "TTL Voice" Constitution**
**Tone:** Calm, authoritative, insightful, curious, respectful. Avoid hype.
**Perspective:** Focus on the 'why it matters' and 'second-order effects'.
**Vocabulary:** Use precise technical terms but always explain them simply.
**Structure:** Hook, Context, Core Argument, and a thought-provoking Conclusion.
**Identity:** You are TheTechLounge, a curator of technological understanding.
---
**DOCUMENT 2: Style Exemplars**
Professional, engaging, and informative content that balances technical depth with accessibility.
---

Based on the topic and the strict stylistic guidelines, generate the following in a structured format. Use "###" as a separator for each section.

### TITLES
(Provide 5 catchy, intelligent video titles here)

### SCRIPT
(Generate a full, compelling video script of approximately 1500 words here)

### BROLL_KEYWORDS
(Provide a comma-separated list of 15-20 generic visual concepts from the script for a stock footage API. Example: abstract data visualization, close up of a computer motherboard, person looking thoughtfully at a screen, futuristic city skyline at night)

### IMAGE_CONCEPTS
(Provide a comma-separated list of 10 simple, descriptive concepts for AI-generated images. These are creative directions, not final prompts. The backend will add technical details.

**Format Example:**
A glowing blue abstract neural network inside a glass human head against a dark background,
A massive library of floating books made of light with servers in the background,
A robot hand and a human hand about to touch in the style of Michelangelo with circuits visible under the skin,
A single illuminated data stream flowing through a dark, abstract digital space)

### EDITING_GUIDE
(Generate a detailed, timestamped editing guide. Calculate timestamps based on an average narration speed of 150 words per minute. For each key paragraph or sentence in the script, provide a cue and a specific visual asset suggestion. Use placeholders like \`[BROLL: keyword]\` and \`[IMAGE: concept summary]\` that directly correspond to the assets generated in the previous steps.

**Format Example:**
[00:00] - [Intro Music Fades In] ==> VISUAL: Show channel logo animation.
[00:05] - "In the sprawling digital landscape of the 21st century..." ==> VISUAL: Start with [BROLL: futuristic city skyline at night].
[00:15] - "...and as the data flows through these complex systems..." ==> VISUAL: Cross-dissolve to [IMAGE: glowing blue abstract neural network] with a slow pan and zoom effect.
[00:28] - "The core of this revolution is the neural network, a concept modeled after the human brain." ==> VISUAL: Show [BROLL: animated brain synapses firing] overlaid with a subtle circuit board texture.
[00:40] - "But what does this mean for the future of creativity?" ==> VISUAL: Show [IMAGE: a robot hand and a human hand about to touch] and hold on the shot for dramatic effect.
...continue for the entire script.)`

  try {
    // Simulate Gemini API call (replace with actual implementation)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    })

    if (!response.ok) {
      throw new Error('Gemini API request failed')
    }

    const data = await response.json()
    const generatedText = data.candidates[0].content.parts[0].text

    // Parse the structured response
    const sections = generatedText.split('###')
    const titles = sections[1]?.replace('TITLES', '').trim().split('\n').filter(Boolean) || []
    const script = sections[2]?.replace('SCRIPT', '').trim() || ''
    const brollKeywords = sections[3]?.replace('BROLL_KEYWORDS', '').trim().split(',').map((k: string) => k.trim()) || []


    const imageConcepts = sections[4]?.replace('IMAGE_CONCEPTS', '').trim().split(',').map((c: string) => c.trim()) || []

    const editingGuide = sections[5]?.replace('EDITING_GUIDE', '').trim() || ''

    return {
      titles,
      script,
      brollKeywords,
      imageConcepts,
      editingGuide
    }
  } catch (error) {
    // Fallback mock data for development
    return {
      titles: [
        "The Future of AI: What You Need to Know",
        "Breaking Down the Latest Tech Revolution",
        "How AI is Changing Everything",
        "The Technology That Will Define Tomorrow",
        "Understanding the AI Revolution"
      ],
      script: `Welcome to TheTechLounge, where we explore the technologies shaping our future.

Today, we're diving deep into ${topic}, a development that's not just changing how we work, but fundamentally altering the fabric of our digital society.

In the sprawling landscape of modern technology, few developments have captured our collective imagination quite like this. But beyond the headlines and the hype, what does this really mean for you, for me, and for the future we're building together?

Let's start with the basics. ${topic} represents a convergence of multiple technological streams that have been developing independently for decades. It's the culmination of advances in computing power, algorithmic sophistication, and our growing understanding of complex systems.

But here's what makes this particularly fascinating: the second-order effects. While everyone is focused on the immediate applications, the real transformation is happening in the spaces between technologies, in the unexpected connections and emergent behaviors that arise when these systems interact.

Consider the implications for creativity, for human agency, for the very nature of work itself. We're not just talking about automation replacing manual labor – we're looking at a fundamental shift in how value is created and distributed in our economy.

The question isn't whether this technology will change everything – it's how we adapt to ensure that change serves humanity's best interests. And that's a conversation we all need to be part of.

Thank you for joining me on this exploration. What aspects of this topic are you most curious about? Let me know in the comments below, and I'll see you in the next video.`,
      brollKeywords: [
        "abstract data visualization",
        "close up of computer motherboard",
        "person looking thoughtfully at screen",
        "futuristic city skyline at night",
        "hands typing on keyboard",
        "server room with blinking lights",
        "digital network connections",
        "artificial intelligence concept",
        "technology innovation lab",
        "modern office workspace"
      ],
      imageConcepts: [
        "A glowing blue abstract neural network inside a glass human head against a dark background",
        "A massive library of floating books made of light with servers in the background",
        "A robot hand and a human hand about to touch in the style of Michelangelo with circuits visible under the skin",
        "A single illuminated data stream flowing through a dark, abstract digital space",
        "A futuristic cityscape with holographic data flowing between buildings"
      ],
      editingGuide: `[00:00] - [Intro Music Fades In] ==> VISUAL: Show channel logo animation.
[00:05] - "Welcome to TheTechLounge..." ==> VISUAL: Start with [BROLL: futuristic city skyline at night].
[00:15] - "Today, we're diving deep into..." ==> VISUAL: Cross-dissolve to [IMAGE: glowing blue abstract neural network].
[00:30] - "In the sprawling landscape..." ==> VISUAL: Show [BROLL: abstract data visualization].
[00:45] - "Let's start with the basics..." ==> VISUAL: [BROLL: close up of computer motherboard].
[01:00] - "But here's what makes this particularly fascinating..." ==> VISUAL: [IMAGE: massive library of floating books].
[01:15] - "Consider the implications for creativity..." ==> VISUAL: [IMAGE: robot hand and human hand about to touch].
[01:30] - "The question isn't whether..." ==> VISUAL: [BROLL: person looking thoughtfully at screen].
[01:45] - "Thank you for joining me..." ==> VISUAL: Return to presenter with subtle background.`
    }
  }
}

async function generateVoiceover(script: string, voice: string): Promise<Buffer> {
  // Simulate voiceover generation (replace with actual TTS implementation)
  // For now, return a small buffer representing an audio file
  return Buffer.from('mock-audio-data')
}

async function downloadBrollVideos(keywords: string[], apiKey: string): Promise<Buffer[]> {
  // Simulate Pexels API calls to download B-roll videos
  // For now, return mock video buffers
  return keywords.slice(0, 5).map(() => Buffer.from('mock-video-data'))
}

async function generateAIImages(concepts: string[], apiKey: string): Promise<Buffer[]> {
  // Simulate Hugging Face API calls to generate AI images
  // For now, return mock image buffers
  return concepts.slice(0, 5).map(() => Buffer.from('mock-image-data'))
}

async function createVisualsZip(assets: Buffer[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Buffer[] = []

    archive.on('data', (chunk) => chunks.push(chunk))
    archive.on('end', () => resolve(Buffer.concat(chunks)))
    archive.on('error', reject)

    // Add mock files to the archive
    assets.forEach((asset, index) => {
      archive.append(Readable.from(asset), { name: `asset_${index + 1}.${index < 5 ? 'mp4' : 'png'}` })
    })

    archive.finalize()
  })
}

async function uploadToStorage(filename: string, data: Buffer | string, contentType: string): Promise<string> {
  try {
    const { data: uploadData, error } = await supabase.storage
      .from('content-assets')
      .upload(filename, data, {
        contentType,
        upsert: true
      })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('content-assets')
      .getPublicUrl(filename)

    return urlData.publicUrl
  } catch (error) {
    console.error('Error uploading to storage:', error)
    // Return a mock URL for development
    return `https://mock-storage.com/${filename}`
  }
}

