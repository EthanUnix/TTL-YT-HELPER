import { NextRequest, NextResponse } from 'next/server'

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

interface NewsAPIResponse {
  status: string
  totalResults: number
  articles: NewsArticle[]
}

export async function POST(request: NextRequest) {
  try {
    const { topic = 'artificial intelligence', category = 'technology', days = 1 } = await request.json()

    // Calculate date range
    const toDate = new Date()
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    const fromDateStr = fromDate.toISOString().split('T')[0]
    const toDateStr = toDate.toISOString().split('T')[0]

    // Try multiple news sources
    const newsResults = await Promise.allSettled([
      fetchNewsAPI(topic, fromDateStr, toDateStr),
      fetchTheNewsAPI(topic, category),
      fetchGNewsAPI(topic)
    ])

    let allArticles: NewsArticle[] = []
    let successfulSources = 0

    // Combine results from all successful sources
    newsResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allArticles = [...allArticles, ...result.value]
        successfulSources++
        console.log(`Source ${index + 1} returned ${result.value.length} articles`)
      } else if (result.status === 'rejected') {
        console.error(`Source ${index + 1} failed:`, result.reason)
      }
    })

    // Remove duplicates based on title similarity
    const uniqueArticles = removeDuplicateArticles(allArticles)

    // Sort by publication date (newest first)
    uniqueArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    // Limit to top 20 articles
    const topArticles = uniqueArticles.slice(0, 20)

    return NextResponse.json({
      success: true,
      totalResults: topArticles.length,
      sourcesUsed: successfulSources,
      articles: topArticles,
      searchParams: {
        topic,
        category,
        days,
        dateRange: `${fromDateStr} to ${toDateStr}`
      }
    })

  } catch (error) {
    console.error('Error gathering news:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to gather news articles',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// NewsAPI.org implementation
async function fetchNewsAPI(topic: string, fromDate: string, toDate: string): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) {
    throw new Error('NEWS_API_KEY not configured')
  }

  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&from=${fromDate}&to=${toDate}&sortBy=popularity&language=en&apiKey=${apiKey}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`NewsAPI failed: ${response.status} ${response.statusText}`)
  }

  const data: NewsAPIResponse = await response.json()
  return data.articles || []
}

// TheNewsAPI implementation (free tier)
async function fetchTheNewsAPI(topic: string, category: string): Promise<NewsArticle[]> {
  const apiKey = process.env.THE_NEWS_API_KEY
  if (!apiKey) {
    console.log('THE_NEWS_API_KEY not configured, skipping')
    return []
  }

  const url = `https://api.thenewsapi.com/v1/news/all?api_token=${apiKey}&search=${encodeURIComponent(topic)}&categories=${category}&language=en&limit=10`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`TheNewsAPI failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  // Convert to NewsAPI format
  return (data.data || []).map((article: any) => ({
    title: article.title,
    description: article.description,
    url: article.url,
    urlToImage: article.image_url,
    publishedAt: article.published_at,
    source: { name: article.source },
    content: article.snippet || article.description
  }))
}

// GNews API implementation (free tier)
async function fetchGNewsAPI(topic: string): Promise<NewsArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY
  if (!apiKey) {
    console.log('GNEWS_API_KEY not configured, skipping')
    return []
  }

  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&lang=en&country=us&max=10&apikey=${apiKey}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`GNews failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  // Convert to NewsAPI format
  return (data.articles || []).map((article: any) => ({
    title: article.title,
    description: article.description,
    url: article.url,
    urlToImage: article.image,
    publishedAt: article.publishedAt,
    source: { name: article.source.name },
    content: article.content
  }))
}

// Remove duplicate articles based on title similarity
function removeDuplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const unique: NewsArticle[] = []
  const seenTitles = new Set<string>()

  for (const article of articles) {
    const normalizedTitle = article.title.toLowerCase().replace(/[^\w\s]/g, '').trim()
    
    // Check if we've seen a very similar title
    let isDuplicate = false
    for (const seenTitle of seenTitles) {
      if (calculateSimilarity(normalizedTitle, seenTitle) > 0.8) {
        isDuplicate = true
        break
      }
    }

    if (!isDuplicate) {
      unique.push(article)
      seenTitles.add(normalizedTitle)
    }
  }

  return unique
}

// Simple string similarity calculation
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(' ')
  const words2 = str2.split(' ')
  const allWords = new Set([...words1, ...words2])
  
  let commonWords = 0
  for (const word of allWords) {
    if (words1.includes(word) && words2.includes(word)) {
      commonWords++
    }
  }
  
  return commonWords / allWords.size
}

