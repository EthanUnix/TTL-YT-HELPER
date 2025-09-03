import { NextRequest, NextResponse } from 'next/server'

interface ImageAsset {
  id: string
  url: string
  downloadUrl: string
  thumbnailUrl: string
  description: string
  tags: string[]
  source: string
  photographer?: string
  width: number
  height: number
}

interface VideoAsset {
  id: string
  url: string
  downloadUrl: string
  thumbnailUrl: string
  description: string
  tags: string[]
  source: string
  duration: number
  width: number
  height: number
}

// Interfaces for Pexels API
interface PexelsPhoto {
  id: number;
  url: string;
  src: {
    large: string;
    medium: string;
  };
  alt: string;
  photographer: string;
  width: number;
  height: number;
}

interface PexelsImageResponse {
  photos: PexelsPhoto[];
}

interface PexelsVideoFile {
  link: string;
}

interface PexelsVideo {
  id: number;
  url: string;
  image: string;
  user: { name: string };
  duration: number;
  width: number;
  height: number;
  video_files: PexelsVideoFile[];
}

interface PexelsVideoResponse {
  videos: PexelsVideo[];
}

// Interfaces for Unsplash API
interface UnsplashUser {
  name: string;
}

interface UnsplashPhoto {
  id: string;
  links: { html: string };
  urls: { regular: string; small: string };
  alt_description: string;
  description: string;
  user: UnsplashUser;
  tags: { title: string }[];
  width: number;
  height: number;
}

interface UnsplashImageResponse {
  results: UnsplashPhoto[];
}

// Interfaces for Pixabay API
interface PixabayPhoto {
  id: number;
  pageURL: string;
  largeImageURL: string;
  webformatURL: string;
  tags: string;
  user: string;
  imageWidth: number;
  imageHeight: number;
}

interface PixabayImageResponse {
  hits: PixabayPhoto[];
}

export async function POST(request: NextRequest) {
  try {
    const { 
      keywords = [], 
      imageCount = 10, 
      videoCount = 5,
      orientation = 'all' // 'landscape', 'portrait', 'square', 'all'
    } = await request.json()

    if (!keywords || keywords.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Keywords are required'
      }, { status: 400 })
    }

    // Gather assets from multiple sources
    const [imageResults, videoResults] = await Promise.allSettled([
      gatherImages(keywords, imageCount, orientation),
      gatherVideos(keywords, videoCount)
    ])

    const images = imageResults.status === 'fulfilled' ? imageResults.value : []
    const videos = videoResults.status === 'fulfilled' ? videoResults.value : []

    return NextResponse.json({
      success: true,
      totalImages: images.length,
      totalVideos: videos.length,
      images,
      videos,
      searchParams: {
        keywords,
        imageCount,
        videoCount,
        orientation
      }
    })

  } catch (error) {
    console.error('Error gathering assets:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to gather visual assets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function gatherImages(keywords: string[], count: number, orientation: string): Promise<ImageAsset[]> {
  const allImages: ImageAsset[] = []
  
  // Try multiple image sources
  const sources = [
    () => fetchPexelsImages(keywords, Math.ceil(count / 3), orientation),
    () => fetchUnsplashImages(keywords, Math.ceil(count / 3), orientation),
    () => fetchPixabayImages(keywords, Math.ceil(count / 3), orientation)
  ]

  for (const fetchSource of sources) {
    try {
      const images = await fetchSource()
      allImages.push(...images)
    } catch (error) {
      console.error('Image source failed:', error)
    }
  }

  // Remove duplicates and limit results
  const uniqueImages = removeDuplicateImages(allImages)
  return uniqueImages.slice(0, count)
}

async function gatherVideos(keywords: string[], count: number): Promise<VideoAsset[]> {
  const allVideos: VideoAsset[] = []
  
  // Try multiple video sources
  const sources = [
    () => fetchPexelsVideos(keywords, count)
  ]

  for (const fetchSource of sources) {
    try {
      const videos = await fetchSource()
      allVideos.push(...videos)
    } catch (error) {
      console.error('Video source failed:', error)
    }
  }

  return allVideos.slice(0, count)
}

// Pexels Images API
async function fetchPexelsImages(keywords: string[], count: number, orientation: string): Promise<ImageAsset[]> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) {
    console.log('PEXELS_API_KEY not configured, skipping Pexels images')
    return []
  }

  const query = keywords.join(' ')
  const orientationParam = orientation !== 'all' ? `&orientation=${orientation}` : ''
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}${orientationParam}`

  const response = await fetch(url, {
    headers: {
      'Authorization': apiKey
    }
  })

  if (!response.ok) {
    throw new Error(`Pexels Images API failed: ${response.status}`)
  }

  const data: PexelsImageResponse = await response.json()
  
  return (data.photos || []).map((photo: PexelsPhoto) => ({
    id: `pexels-img-${photo.id}`,
    url: photo.url,
    downloadUrl: photo.src.large,
    thumbnailUrl: photo.src.medium,
    description: photo.alt || `Image by ${photo.photographer}`,
    tags: keywords,
    source: 'Pexels',
    photographer: photo.photographer,
    width: photo.width,
    height: photo.height
  }))
}

// Unsplash Images API
async function fetchUnsplashImages(keywords: string[], count: number, orientation: string): Promise<ImageAsset[]> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY
  if (!apiKey) {
    console.log('UNSPLASH_ACCESS_KEY not configured, skipping Unsplash images')
    return []
  }

  const query = keywords.join(' ')
  const orientationParam = orientation !== 'all' ? `&orientation=${orientation}` : ''
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}${orientationParam}`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Client-ID ${apiKey}`
    }
  })

  if (!response.ok) {
    throw new Error(`Unsplash API failed: ${response.status}`)
  }

  const data: UnsplashImageResponse = await response.json()
  
  return (data.results || []).map((photo: UnsplashPhoto) => ({
    id: `unsplash-img-${photo.id}`,
    url: photo.links.html,
    downloadUrl: photo.urls.regular,
    thumbnailUrl: photo.urls.small,
    description: photo.alt_description || photo.description || `Photo by ${photo.user.name}`,
    tags: photo.tags?.map((tag: { title: string }) => tag.title) || keywords,
    source: 'Unsplash',
    photographer: photo.user.name,
    width: photo.width,
    height: photo.height
  }))
}

// Pixabay Images API
async function fetchPixabayImages(keywords: string[], count: number, orientation: string): Promise<ImageAsset[]> {
  const apiKey = process.env.PIXABAY_API_KEY
  if (!apiKey) {
    console.log('PIXABAY_API_KEY not configured, skipping Pixabay images')
    return []
  }

  const query = keywords.join(' ')
  const orientationParam = orientation !== 'all' ? `&orientation=${orientation}` : ''
  const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&per_page=${count}${orientationParam}&safesearch=true`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Pixabay API failed: ${response.status}`)
  }

  const data: PixabayImageResponse = await response.json()
  
  return (data.hits || []).map((photo: PixabayPhoto) => ({
    id: `pixabay-img-${photo.id}`,
    url: photo.pageURL,
    downloadUrl: photo.largeImageURL,
    thumbnailUrl: photo.webformatURL,
    description: photo.tags || keywords.join(', '),
    tags: photo.tags?.split(', ') || keywords,
    source: 'Pixabay',
    photographer: photo.user,
    width: photo.imageWidth,
    height: photo.imageHeight
  }))
}

// Pexels Videos API
async function fetchPexelsVideos(keywords: string[], count: number): Promise<VideoAsset[]> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) {
    console.log('PEXELS_API_KEY not configured, skipping Pexels videos')
    return []
  }

  const query = keywords.join(' ')
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${count}`

  const response = await fetch(url, {
    headers: {
      'Authorization': apiKey
    }
  })

  if (!response.ok) {
    throw new Error(`Pexels Videos API failed: ${response.status}`)
  }

  const data: PexelsVideoResponse = await response.json()
  
  return (data.videos || []).map((video: PexelsVideo) => ({
    id: `pexels-vid-${video.id}`,
    url: video.url,
    downloadUrl: video.video_files[0]?.link || '',
    thumbnailUrl: video.image,
    description: `Video by ${video.user?.name || 'Unknown'}`,
    tags: keywords,
    source: 'Pexels',
    duration: video.duration || 0,
    width: video.width,
    height: video.height
  }))
}

// Remove duplicate images based on URL similarity
function removeDuplicateImages(images: ImageAsset[]): ImageAsset[] {
  const unique: ImageAsset[] = []
  const seenUrls = new Set<string>()

  for (const image of images) {
    const urlKey = image.downloadUrl.split('?')[0] // Remove query params for comparison
    if (!seenUrls.has(urlKey)) {
      unique.push(image)
      seenUrls.add(urlKey)
    }
  }

  return unique
}
