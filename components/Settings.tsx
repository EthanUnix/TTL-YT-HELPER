'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface ApiKeys {
  gemini: string
  huggingface: string
  pexels: string
}

interface TestResult {
  status: 'idle' | 'testing' | 'success' | 'error'
  message?: string
}

export default function Settings() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    gemini: '',
    huggingface: '',
    pexels: ''
  })
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({
    gemini: { status: 'idle' },
    huggingface: { status: 'idle' },
    pexels: { status: 'idle' }
  })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

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
    setSaveStatus('saving')
    
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

      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Error saving API keys:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async (service: string) => {
    setTestResults(prev => ({ 
      ...prev, 
      [service]: { status: 'testing' }
    }))
    
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
      
      setTestResults(prev => ({ 
        ...prev, 
        [service]: { 
          status: result.success ? 'success' : 'error',
          message: result.error || (result.success ? 'Connection successful' : 'Connection failed')
        }
      }))
    } catch (error) {
      console.error(`Error testing ${service} connection:`, error)
      setTestResults(prev => ({ 
        ...prev, 
        [service]: { 
          status: 'error',
          message: 'Network error occurred'
        }
      }))
    }
  }

  const getStatusIcon = (result: TestResult) => {
    switch (result.status) {
      case 'testing':
        return (
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        )
      case 'success':
        return (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      default:
        return null
    }
  }

  const getStatusText = (result: TestResult) => {
    switch (result.status) {
      case 'testing':
        return 'Testing...'
      case 'success':
        return 'Connected'
      case 'error':
        return 'Failed'
      default:
        return ''
    }
  }

  const apiServices = [
    {
      key: 'gemini',
      label: 'Google Gemini',
      description: 'For AI script generation and content creation',
      placeholder: 'Enter your Google Gemini API key...',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      )
    },
    {
      key: 'huggingface',
      label: 'Hugging Face',
      description: 'For AI image generation',
      placeholder: 'Enter your Hugging Face API key...',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      )
    },
    {
      key: 'pexels',
      label: 'Pexels',
      description: 'For stock video and image downloads',
      placeholder: 'Enter your Pexels API key...',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zM4 19h16v2H4v-2zM20 3H4v10h16V3zM6 5h12v6H6V5z"/>
        </svg>
      )
    }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">Settings</h1>
          <p className="text-gray-400">Configure your API keys and preferences</p>
        </div>
        
        <div className="glass-strong rounded-xl p-4 sm:p-6 lg:p-8 slide-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white">API Configuration</h2>
              <p className="text-gray-400 text-sm">All keys are encrypted and stored securely</p>
            </div>
          </div>

          <div className="space-y-6">
            {apiServices.map((service, index) => (
              <div 
                key={service.key} 
                className="border border-gray-700 rounded-lg p-4 sm:p-6 hover:border-gray-600 transition-colors slide-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center text-gray-400">
                      {service.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-white">{service.label}</h3>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">{service.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {testResults[service.key].status !== 'idle' && (
                      <div className="flex items-center gap-2">
                        {getStatusIcon(testResults[service.key])}
                        <span className={`text-xs sm:text-sm ${
                          testResults[service.key].status === 'success' ? 'status-success' : 
                          testResults[service.key].status === 'error' ? 'status-error' : 
                          'text-blue-400'
                        }`}>
                          {getStatusText(testResults[service.key])}
                        </span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => testConnection(service.key)}
                      disabled={testResults[service.key].status === 'testing' || !apiKeys[service.key as keyof ApiKeys]}
                      className="btn-secondary px-3 py-1.5 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {testResults[service.key].status === 'testing' ? 'Testing...' : 'Test'}
                    </button>
                  </div>
                </div>
                
                <div className="relative">
                  <input
                    type="password"
                    value={apiKeys[service.key as keyof ApiKeys]}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, [service.key]: e.target.value }))}
                    placeholder={service.placeholder}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition-all"
                  />
                  {apiKeys[service.key as keyof ApiKeys] && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                  )}
                </div>
                
                {testResults[service.key].message && testResults[service.key].status === 'error' && (
                  <p className="text-red-400 text-xs mt-2">{testResults[service.key].message}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-2">
              {saveStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-400 text-sm scale-in">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved successfully!
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-400 text-sm scale-in">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Failed to save. Please try again.
                </div>
              )}
            </div>
            
            <button
              onClick={saveApiKeys}
              disabled={loading}
              className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {loading ? 'Saving...' : 'Save API Keys'}
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Getting API Keys
            </h3>
            <div className="grid gap-4 text-xs sm:text-sm text-gray-400">
              <div className="p-4 bg-gray-800/30 rounded-lg">
                <strong className="text-white">Google Gemini:</strong> Visit{' '}
                <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                  Google AI Studio
                </a>{' '}
                to create your API key.
              </div>
              <div className="p-4 bg-gray-800/30 rounded-lg">
                <strong className="text-white">Hugging Face:</strong> Go to{' '}
                <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                  Hugging Face Settings
                </a>{' '}
                to generate an access token.
              </div>
              <div className="p-4 bg-gray-800/30 rounded-lg">
                <strong className="text-white">Pexels:</strong> Sign up at{' '}
                <a href="https://www.pexels.com/api/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
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

