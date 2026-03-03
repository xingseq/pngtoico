/**
 * PNG to ICO - Main App
 */

import { useState, useEffect } from 'react'
import { Image, Download, RefreshCw, CheckCircle, AlertCircle, Ruler } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="sticky top-0 z-50 glass-effect border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Image className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg gradient-text">PNG to ICO</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Image Converter</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
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