'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface ApiKeys {
  gemini: string
  huggingface: string
  pexels: string
}

export default function Settings() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    gemini: '',
    huggingface: '',
    pexels: ''
  })
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({})

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data && !error) {
        setApiKeys({
          gemini: data.gemini_key || '',
          huggingface: data.huggingface_key || '',
          pexels: data.pexels_key || ''
        })
      }
    } catch (error) {
      console.error('Error loading API keys:', error)
    }
  }

  const saveApiKeys = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: user.id,
          gemini_key: apiKeys.gemini,
          huggingface_key: apiKeys.huggingface,
          pexels_key: apiKeys.pexels,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      alert('API keys saved successfully!')
    } catch (error) {
      console.error('Error saving API keys:', error)
      alert('Failed to save API keys. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async (service: string) => {
    setTestResults(prev => ({ ...prev, [service]: null }))
    
    try {
      const response = await fetch('/api/testConnection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service,
          apiKey: apiKeys[service as keyof ApiKeys]
        }),
      })

      const result = await response.json()
      setTestResults(prev => ({ ...prev, [service]: result.success }))
    } catch (error) {
      console.error(`Error testing ${service} connection:`, error)
      setTestResults(prev => ({ ...prev, [service]: false }))
    }
  }

  const apiServices = [
    {
      key: 'gemini',
      label: 'Google Gemini',
      description: 'For AI script generation and content creation',
      placeholder: 'Enter your Google Gemini API key...'
    },
    {
      key: 'huggingface',
      label: 'Hugging Face',
      description: 'For AI image generation',
      placeholder: 'Enter your Hugging Face API key...'
    },
    {
      key: 'pexels',
      label: 'Pexels',
      description: 'For stock video and image downloads',
      placeholder: 'Enter your Pexels API key...'
    }
  ]

  return (
    <div className="p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 gradient-text">Settings</h1>
        
        <div className="glass rounded-xl p-8">
          <h2 className="text-xl font-semibold mb-6 text-white">API Configuration</h2>
          <p className="text-gray-400 mb-8">
            Configure your API keys to enable content generation features. All keys are encrypted and stored securely.
          </p>

          <div className="space-y-6">
            {apiServices.map((service) => (
              <div key={service.key} className="border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{service.label}</h3>
                    <p className="text-sm text-gray-400">{service.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {testResults[service.key] === true && (
                      <span className="text-green-400 text-sm">✓ Connected</span>
                    )}
                    {testResults[service.key] === false && (
                      <span className="text-red-400 text-sm">✗ Failed</span>
                    )}
                    <button
                      onClick={() => testConnection(service.key)}
                      className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                    >
                      Test
                    </button>
                  </div>
                </div>
                
                <input
                  type="password"
                  value={apiKeys[service.key as keyof ApiKeys]}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, [service.key]: e.target.value }))}
                  placeholder={service.placeholder}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={saveApiKeys}
              disabled={loading}
              className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save API Keys'}
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Getting API Keys</h3>
            <div className="space-y-4 text-sm text-gray-400">
              <div>
                <strong className="text-white">Google Gemini:</strong> Visit{' '}
                <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  Google AI Studio
                </a>{' '}
                to create your API key.
              </div>
              <div>
                <strong className="text-white">Hugging Face:</strong> Go to{' '}
                <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  Hugging Face Settings
                </a>{' '}
                to generate an access token.
              </div>
              <div>
                <strong className="text-white">Pexels:</strong> Sign up at{' '}
                <a href="https://www.pexels.com/api/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  Pexels API
                </a>{' '}
                to get your free API key.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

