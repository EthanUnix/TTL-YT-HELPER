'use client'

import { useState } from 'react'

interface GenerationResult {
  titles: string[]
  script: string
  editingGuide: string
  visualAssets: string[]
  downloadUrls: {
    script: string
    voiceover: string
    visuals: string
  }
}

export default function VideoGenerator() {
  const [topic, setTopic] = useState('')
  const [format, setFormat] = useState('Daily Download')
  const [voice, setVoice] = useState('male_voice')
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState('')
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [activeTab, setActiveTab] = useState('script')

  const generateContent = async () => {
    if (!topic.trim()) return

    setIsGenerating(true)
    setResult(null)
    setCurrentStep('Initializing...')

    try {
      const response = await fetch('/api/generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          format,
          voice,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      const data = await response.json()
      setResult(data)
      setActiveTab('script')
    } catch (error) {
      console.error('Error generating content:', error)
      alert('Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
      setCurrentStep('')
    }
  }

  const steps = [
    'Generating Script...',
    'Creating Titles...',
    'Synthesizing Voiceover...',
    'Downloading B-roll Videos...',
    'Generating AI Images...',
    'Packaging Assets...',
    'Finalizing...'
  ]

  return (
    <div className="p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 gradient-text">Video Generator</h1>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <div className="glass rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6 text-white">Configuration Panel</h2>
              
              <div className="space-y-4">
                {/* Topic Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Video Topic or News Headline
                  </label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter your video topic or news headline..."
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Video Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Daily Download">Daily Download</option>
                    <option value="Big Question">Big Question</option>
                  </select>
                </div>

                {/* Voice Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Narrator Voice
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={voice}
                      onChange={(e) => setVoice(e.target.value)}
                      className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="male_voice">Male Voice</option>
                      <option value="female_voice">Female Voice</option>
                    </select>
                    <button className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                      Preview
                    </button>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateContent}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full btn-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Generate Content Package'}
                </button>
              </div>
            </div>
          </div>

          {/* Studio Output */}
          <div className="space-y-6">
            <div className="glass rounded-xl p-6 min-h-[600px]">
              <h2 className="text-xl font-semibold mb-6 text-white">Studio Output</h2>
              
              {isGenerating && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="animate-pulse text-blue-400 text-lg mb-4">
                      {currentStep || 'Processing...'}
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <div className={`w-4 h-4 rounded-full ${index < 3 ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
                        <span className={index < 3 ? 'text-white' : 'text-gray-400'}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result && !isGenerating && (
                <div>
                  {/* Tabs */}
                  <div className="flex space-x-1 mb-6 bg-gray-800/50 p-1 rounded-lg">
                    {[
                      { id: 'script', label: 'Script' },
                      { id: 'editing', label: 'Editing Guide' },
                      { id: 'assets', label: 'Visual Assets' },
                      { id: 'downloads', label: 'Downloads' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="space-y-4">
                    {activeTab === 'script' && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">Generated Titles</h3>
                          <div className="space-y-2">
                            {result.titles.map((title, index) => (
                              <div key={index} className="p-3 bg-gray-800/50 rounded-lg">
                                <span className="text-gray-300">{title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">Script</h3>
                          <div className="p-4 bg-gray-800/50 rounded-lg max-h-96 overflow-y-auto">
                            <pre className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                              {result.script}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'editing' && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Editing Guide</h3>
                        <div className="p-4 bg-gray-800/50 rounded-lg max-h-96 overflow-y-auto">
                          <pre className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                            {result.editingGuide}
                          </pre>
                        </div>
                      </div>
                    )}

                    {activeTab === 'assets' && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Visual Assets</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {result.visualAssets.map((asset, index) => (
                            <div key={index} className="p-4 bg-gray-800/50 rounded-lg">
                              <div className="w-full h-32 bg-gray-700 rounded-lg mb-2 flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p className="text-sm text-gray-400">{asset}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'downloads' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white mb-3">Downloads</h3>
                        <div className="space-y-3">
                          <a
                            href={result.downloadUrls.script}
                            download
                            className="block w-full p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div>
                                <div className="font-semibold text-white">Download Script (.txt)</div>
                                <div className="text-sm text-gray-400">Complete video script</div>
                              </div>
                            </div>
                          </a>
                          
                          <a
                            href={result.downloadUrls.voiceover}
                            download
                            className="block w-full p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                              </svg>
                              <div>
                                <div className="font-semibold text-white">Download Voiceover (.mp3)</div>
                                <div className="text-sm text-gray-400">AI-generated narration</div>
                              </div>
                            </div>
                          </a>
                          
                          <a
                            href={result.downloadUrls.visuals}
                            download
                            className="block w-full p-4 bg-green-500/20 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <div>
                                <div className="font-semibold text-white">Download All Visuals (.zip)</div>
                                <div className="text-sm text-gray-400">B-roll videos and AI images</div>
                              </div>
                            </div>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!result && !isGenerating && (
                <div className="flex items-center justify-center h-96 text-gray-400">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg">Enter a topic and generate your content package</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

