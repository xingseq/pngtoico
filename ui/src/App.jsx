/**
 * PNG to ICO - Main App
 */

import { useState, useEffect } from 'react'
import { Image, Download, RefreshCw, CheckCircle, AlertCircle, Ruler, Settings } from 'lucide-react'

export default function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // ICO analysis states
  const [selectedIcoFile, setSelectedIcoFile] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisError, setAnalysisError] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  // Size selection states
  const [selectedSizes, setSelectedSizes] = useState([256, 48, 32, 16])
  const [showSizeSettings, setShowSizeSettings] = useState(false)

  const sizeOptions = [256, 128, 96, 64, 48, 32, 24, 16]

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setDarkMode(mq.matches)
    const handler = (e) => setDarkMode(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setResult(null)
      setError(null)
      const reader = new FileReader()
      reader.onload = (ev) => setPreview(ev.target?.result)
      reader.readAsDataURL(file)
    }
  }

  const handleConvert = async () => {
    if (!selectedFile) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      // Add sizes parameter if custom sizes are selected
      if (selectedSizes.length > 0) {
        formData.append('sizes', selectedSizes.join(','))
      }
      
      const res = await fetch('/api/convert', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Convert failed')
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setResult({ url, filename: selectedFile.name.replace(/\.png$/i, '.ico') })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result.url
    a.download = result.filename
    a.click()
  }

  // ICO analysis handlers
  const handleIcoFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedIcoFile(file)
      setAnalysisResult(null)
      setAnalysisError(null)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedIcoFile) return
    setAnalyzing(true)
    setAnalysisError(null)
    setAnalysisResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedIcoFile)
      
      const res = await fetch('/api/analyze-ico', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Analysis failed')
      }
      
      const data = await res.json()
      setAnalysisResult(data)
    } catch (err) {
      setAnalysisError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const toggleSize = (size) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter(s => s !== size))
    } else {
      setSelectedSizes([...selectedSizes, size].sort((a, b) => b - a))
    }
  }

  const selectPreset = (presetName) => {
    switch (presetName) {
      case 'standard':
        setSelectedSizes([256, 48, 32, 16])
        break
      case 'highres':
        setSelectedSizes([256, 128, 64, 32])
        break
      case 'minimal':
        setSelectedSizes([256, 32])
        break
      case 'all':
        setSelectedSizes([256, 128, 96, 64, 48, 32, 24, 16])
        break
      default:
        break
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="sticky top-0 z-50 glass-effect border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Image className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg gradient-text">PNG to ICO</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Image Converter</p>
            </div>
          </div>
          <button
            onClick={() => setShowSizeSettings(!showSizeSettings)}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Sizes</span>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Size Settings Panel */}
        {showSizeSettings && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Icon Size Settings</h2>
            
            {/* Preset Buttons */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Quick Presets:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => selectPreset('standard')}
                  className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm"
                >
                  Standard (256, 48, 32, 16)
                </button>
                <button
                  onClick={() => selectPreset('highres')}
                  className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm"
                >
                  High-Res (256, 128, 64, 32)
                </button>
                <button
                  onClick={() => selectPreset('minimal')}
                  className="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm"
                >
                  Minimal (256, 32)
                </button>
                <button
                  onClick={() => selectPreset('all')}
                  className="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-sm"
                >
                  All Sizes
                </button>
              </div>
            </div>
            
            {/* Size Selection */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Select sizes (click to toggle):</p>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map(size => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`px-4 py-3 rounded-lg border flex-1 min-w-[80px] text-center transition-all ${selectedSizes.includes(size)
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white border-transparent shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-bold text-lg">{size}</div>
                    <div className="text-xs opacity-80">× {size}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selected sizes: {selectedSizes.sort((a, b) => b - a).join(', ')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Note: 256×256 is automatically included for best quality scaling.
              </p>
            </div>
          </div>
        )}

        {/* PNG to ICO Conversion Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">PNG to ICO Conversion</h2>
          
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select PNG File
            </label>
            <input
              type="file"
              accept=".png,image/png"
              onChange={handleFileChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700 dark:file:bg-indigo-900/30 dark:file:text-indigo-400"
            />
          </div>

          {/* Preview */}
          {preview && (
            <div className="flex justify-center">
              <img src={preview} alt="Preview" className="max-w-48 max-h-48 rounded-lg shadow-md" />
            </div>
          )}

          {/* Selected Sizes Preview */}
          {selectedFile && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Will generate icon with sizes:</p>
              <div className="flex flex-wrap gap-2">
                {selectedSizes.sort((a, b) => b - a).map(size => (
                  <span key={size} className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">
                    {size}×{size}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            disabled={!selectedFile || loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> Converting...</>
            ) : (
              <><Image className="w-5 h-5" /> Convert to ICO</>
            )}
          </button>

          {/* Result */}
          {result && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Conversion successful!</span>
              </div>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ICO Analysis Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">ICO File Analysis</h2>
          
          {/* ICO File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select ICO File
            </label>
            <input
              type="file"
              accept=".ico,image/x-icon"
              onChange={handleIcoFileChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-400"
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={!selectedIcoFile || analyzing}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> Analyzing...</>
            ) : (
              <><Ruler className="w-5 h-5" /> Analyze ICO File</>
            )}
          </button>

          {/* Analysis Result */}
          {analysisResult && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Analysis successful!</span>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p><span className="font-medium">File:</span> {analysisResult.filename}</p>
                <p><span className="font-medium">Number of images:</span> {analysisResult.numImages}</p>
                <p className="font-medium mt-2">Supported sizes:</p>
                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {analysisResult.sizes.map((size, index) => (
                    <li key={index} className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                      <span className="font-medium">{size.width} × {size.height}</span> pixels
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Analysis Error */}
          {analysisError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{analysisError}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}