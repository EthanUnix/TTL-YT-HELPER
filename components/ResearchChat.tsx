'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

export default function ResearchChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: 'Welcome to TheTechLounge Research Chat. Ask Gemini to explore a topic, stress-test an argument, outline a video, or explain a technical idea.',
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = async () => {
    const question = inputMessage.trim()
    if (!question || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: question,
      isUser: true,
      timestamp: new Date(),
    }

    const history = messages
      .filter((message) => message.id !== 'welcome')
      .map((message) => ({ role: message.isUser ? 'user' as const : 'model' as const, content: message.content }))

    setMessages((previous) => [...previous, userMessage])
    setInputMessage('')
    setError(null)
    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')

      const response = await fetch('/api/researchChat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: question, history }),
      })

      const result = await response.json() as { answer?: string; error?: string }
      const answer = result.answer
      if (!response.ok || !answer) throw new Error(result.error || 'Gemini did not return an answer.')

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          content: answer,
          isUser: false,
          timestamp: new Date(),
        },
      ])
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Research chat could not be completed.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  return (
    <div className="min-h-screen p-5 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Gemini-powered workspace</p>
          <h1 className="gradient-text text-3xl font-bold">Research Chat</h1>
          <p className="mt-2 text-sm text-gray-400">Your saved Gemini key is used only through the server-side research endpoint.</p>
        </div>

        <div className="glass flex h-[calc(100vh-220px)] min-h-[520px] flex-col overflow-hidden rounded-xl">
          <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[80%] ${message.isUser ? 'bg-blue-500 text-white' : 'border border-white/5 bg-gray-800/70 text-gray-200'}`}>
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                  <p className={`mt-2 text-[11px] ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/5 bg-gray-800/70 px-4 py-3 text-sm text-gray-300">Gemini is researching…</div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-800 p-4 sm:p-6">
            {error && <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
            <div className="flex items-end gap-3">
              <textarea
                value={inputMessage}
                onChange={(event) => setInputMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Gemini to research a topic…"
                className="min-h-[76px] flex-1 resize-none rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-400 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                rows={3}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                className="btn-primary rounded-lg px-5 py-3 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Working…' : 'Send'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">Press Enter to send. Use Shift + Enter for a new line.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
