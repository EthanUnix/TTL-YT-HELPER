'use client'

import { useState } from 'react'

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

interface AssetGatherResult {
  success: boolean
  totalImages: number
  totalVideos: number
  images: ImageAsset[]
  videos: VideoAsset[]
  searchParams: {
    keywords: string[]
    imageCount: number
    videoCount: number
    orientation: string
  }
}

export default function AssetGatherer() {
  const [loading, setLoading] = useState(false)
  const [assetData, setAssetData] = useState<AssetGatherResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [keywords, setKeywords] = useState('artificial intelligence, technology, future')
  const [imageCount, setImageCount] = useState(10)
  const [videoCount, setVideoCount] = useState(5)
  const [orientation, setOrientation] = useState('all')
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())

  const gatherAssets = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
      
      const response = await fetch('/api/gatherAssets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: keywordArray,
          imageCount,
          videoCount,
          orientation
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        setAssetData(result)
        setSelectedAssets(new Set())
      } else {
        setError(result.error || 'Failed to gather assets')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error gathering assets:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleAssetSelection = (assetId: string) => {
    const newSelected = new Set(selectedAssets)
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId)
    } else {
      newSelected.add(assetId)
    }
    setSelectedAssets(newSelected)
  }

  const downloadSelected = () => {
    if (!assetData) return
    
    const selectedImages = assetData.images.filter(img => selectedAssets.has(img.id))
    const selectedVideos = assetData.videos.filter(vid => selectedAssets.has(vid.id))
    
    // Open download URLs in new tabs
    const allAssets = [...selectedImages, ...selectedVideos]
    allAssets.forEach(asset => {
      window.open(asset.downloadUrl, '_blank')
    })
  }

  const selectAll = () => {
    if (!assetData) return
    
    const allIds = new Set([
      ...assetData.images.map(img => img.id),
      ...assetData.videos.map(vid => vid.id)
    ])
    setSelectedAssets(allIds)
  }

  const clearSelection = () => {
    setSelectedAssets(new Set())
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">Asset Gatherer</h1>
          <p className="text-gray-400">Collect images and videos for your content</p>
        </div>

        {/* Search Controls */}
        <div className="glass-strong rounded-xl p-4 sm:p-6 mb-6 slide-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Search Parameters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Keywords (comma-separated)</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g., artificial intelligence, technology, future"
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Images Count</label>
              <input
                type="number"
                value={imageCount}
                onChange={(e) => setImageCount(Number(e.target.value))}
                min="1"
                max="30"
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Videos Count</label>
              <input
                type="number"
                value={videoCount}
                onChange={(e) => setVideoCount(Number(e.target.value))}
                min="1"
                max="20"
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Orientation</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
                <option value="square">Square</option>
              </select>
            </div>
          </div>

          <button
            onClick={gatherAssets}
            disabled={loading}
            className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {loading ? 'Gathering Assets...' : 'Gather Assets'}
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
        {assetData && (
          <div className="space-y-6">
            {/* Summary and Controls */}
            <div className="glass-strong rounded-xl p-4 sm:p-6 slide-in-up">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-white">Asset Results</h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="btn-secondary px-3 py-1 text-xs"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="btn-ghost px-3 py-1 text-xs"
                  >
                    Clear
                  </button>
                  <button
                    onClick={downloadSelected}
                    disabled={selectedAssets.size === 0}
                    className="btn-primary px-3 py-1 text-xs disabled:opacity-50"
                  >
                    Download Selected ({selectedAssets.size})
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{assetData.totalImages}</div>
                  <div className="text-sm text-gray-400">Images</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{assetData.totalVideos}</div>
                  <div className="text-sm text-gray-400">Videos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{assetData.searchParams.keywords.length}</div>
                  <div className="text-sm text-gray-400">Keywords</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{selectedAssets.size}</div>
                  <div className="text-sm text-gray-400">Selected</div>
                </div>
              </div>
            </div>

            {/* Images Grid */}
            {assetData.images.length > 0 && (
              <div className="glass-strong rounded-xl p-4 sm:p-6 slide-in-up">
                <h3 className="text-lg font-semibold text-white mb-4">Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {assetData.images.map((image) => (
                    <div
                      key={image.id}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedAssets.has(image.id)
                          ? 'border-blue-500 ring-2 ring-blue-500/20'
                          : 'border-transparent hover:border-gray-600'
                      }`}
                      onClick={() => toggleAssetSelection(image.id)}
                    >
                      <img
                        src={image.thumbnailUrl}
                        alt={image.description}
                        className="w-full h-32 object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-white text-center p-2">
                          <div className="text-xs font-medium mb-1">{image.source}</div>
                          <div className="text-xs opacity-75">{image.width}×{image.height}</div>
                        </div>
                      </div>
                      {selectedAssets.has(image.id) && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Grid */}
            {assetData.videos.length > 0 && (
              <div className="glass-strong rounded-xl p-4 sm:p-6 slide-in-up">
                <h3 className="text-lg font-semibold text-white mb-4">Videos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assetData.videos.map((video) => (
                    <div
                      key={video.id}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedAssets.has(video.id)
                          ? 'border-blue-500 ring-2 ring-blue-500/20'
                          : 'border-transparent hover:border-gray-600'
                      }`}
                      onClick={() => toggleAssetSelection(video.id)}
                    >
                      <img
                        src={video.thumbnailUrl}
                        alt={video.description}
                        className="w-full h-40 object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-white text-center p-2">
                          <div className="text-xs font-medium mb-1">{video.source}</div>
                          <div className="text-xs opacity-75">{video.duration}s • {video.width}×{video.height}</div>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                        {video.duration}s
                      </div>
                      {selectedAssets.has(video.id) && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

