'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import Sidebar from '@/components/Sidebar'
import VideoGenerator from '@/components/VideoGenerator'
import ResearchChat from '@/components/ResearchChat'
import Settings from '@/components/Settings'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('video-generator')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/'
        return
      }
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          window.location.href = '/'
        } else {
          setUser(session.user)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'video-generator':
        return <VideoGenerator />
      case 'research-chat':
        return <ResearchChat />
      case 'settings':
        return <Settings />
      default:
        return <VideoGenerator />
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        user={user}
      />
      <main className="flex-1 pt-16 lg:pt-0 lg:ml-64">
        <div className="min-h-screen">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

