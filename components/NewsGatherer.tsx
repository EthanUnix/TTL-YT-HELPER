'use client'

import { useState } from 'react'

interface NewsArticle {
  title: string
  description: string
  url: string
  urlToImage: string | null
  publishedAt: string
  source: {
    name: string
  }
  content: string
}

interface NewsGatherResult {
  success: boolean
  totalResults: number
  sourcesUsed: number
  articles: NewsArticle[]
  searchParams: {
    topic: string
    category: string
    days: number
    dateRange: string
  }
}

export default function NewsGatherer() {
  const [loading, setLoading] = useState(false)
  const [newsData, setNewsData] = useState<NewsGatherResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [topic, setTopic] = useState('artificial intelligence')
  const [category, setCategory] = useState('technology')
  const [days, setDays] = useState(1)

  const gatherNews = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/gatherNews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          category,
          days
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        setNewsData(result)
      } else {
        setError(result.error || 'Failed to gather news')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error gathering news:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const generateContentIdeas = () => {
    if (!newsData?.articles) return []
    
    const ideas = [
      {
        type: 'Daily AI News',
        title: `AI News Roundup - ${new Date().toLocaleDateString()}`,
        description: `Cover the latest ${newsData.articles.length} AI developments`,
        articles: newsData.articles.slice(0, 5)
      },
      {
        type: 'Deep Dive',
        title: newsData.articles[0]?.title || 'Top AI Story Analysis',
        description: 'Detailed analysis of the biggest AI story today',
        articles: [newsData.articles[0]].filter(Boolean)
      },
      {
        type: 'Big Question',
        title: 'Is AI Moving Too Fast? What This Week\'s News Tells Us',
        description: 'Philosophical take on recent AI developments',
        articles: newsData.articles.slice(0, 3)
      }
    ]
    
    return ideas.filter(idea => idea.articles.length > 0)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">News Gatherer</h1>
          <p className="text-gray-400">Automatically gather and curate news for your content</p>
        </div>

        {/* Search Controls */}
        <div className="glass-strong rounded-xl p-4 sm:p-6 mb-6 slide-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Search Parameters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., artificial intelligence"
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="technology">Technology</option>
                <option value="business">Business</option>
                <option value="science">Science</option>
                <option value="general">General</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Days Back</label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>Today</option>
                <option value={2}>Last 2 days</option>
                <option value={3}>Last 3 days</option>
                <option value={7}>Last week</option>
              </select>
            </div>
          </div>

          <button
            onClick={gatherNews}
            disabled={loading}
            className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {loading ? 'Gathering News...' : 'Gather News'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 scale-in">
            <div className="flex items-center gap-2 text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-300 mt-1">{error}</p>
          </div>
        )}

        {/* Results */}
        {newsData && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="glass-strong rounded-xl p-4 sm:p-6 slide-in-up">
              <h3 className="text-lg font-semibold text-white mb-4">Search Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{newsData.totalResults}</div>
                  <div className="text-sm text-gray-400">Articles Found</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{newsData.sourcesUsed}</div>
                  <div className="text-sm text-gray-400">Sources Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{newsData.searchParams.days}</div>
                  <div className="text-sm text-gray-400">Days Searched</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{generateContentIdeas().length}</div>
                  <div className="text-sm text-gray-400">Content Ideas</div>
                </div>
              </div>
            </div>

            {/* Content Ideas */}
            <div className="glass-strong rounded-xl p-4 sm:p-6 slide-in-up">
              <h3 className="text-lg font-semibold text-white mb-4">Content Ideas</h3>
              <div className="grid gap-4">
                {generateContentIdeas().map((idea, index) => (
                  <div key={index} className="border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full mb-2">
                          {idea.type}
                        </span>
                        <h4 className="font-semibold text-white">{idea.title}</h4>
                        <p className="text-gray-400 text-sm">{idea.description}</p>
                      </div>
                      <button className="btn-secondary px-3 py-1 text-xs">
                        Generate
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Based on {idea.articles.length} article{idea.articles.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Articles List */}
            <div className="glass-strong rounded-xl p-4 sm:p-6 slide-in-up">
              <h3 className="text-lg font-semibold text-white mb-4">Latest Articles</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {newsData.articles.map((article, index) => (
                  <div key={index} className="border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
                    <div className="flex gap-4">
                      {article.urlToImage && (
                        <img
                          src={article.urlToImage}
                          alt={article.title}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                          {article.title}
                        </h4>
                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                          {article.description}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-blue-400">{article.source.name}</span>
                          <span className="text-gray-500">{formatDate(article.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

