'use client'

import { useState } from 'react'
import FileUpload from '@/components/FileUpload'
import ResultsDisplay from '@/components/ResultsDisplay'

interface Match {
  filename: string
  similarity: string
}

interface UploadResult {
  status: 'flagged' | 'safe'
  matches: Match[]
  processingTime: number
}

export default function Home() {
  const [result, setResult] = useState<UploadResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; preview: string } | null>(null)

  const handleUpload = async (file: File) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedFile({ name: file.name, preview: e.target?.result as string })
      }
      reader.readAsDataURL(file)
    } else {
      setUploadedFile({ name: file.name, preview: '' })
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || 'Upload failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setUploadedFile(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 mb-6 shadow-lg shadow-purple-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Copyright <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Detector</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            AI-powered content analysis using RAG and vector embeddings to detect potential copyright infringement
          </p>
        </header>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">15</div>
            <div className="text-sm text-slate-400">Protected Assets</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">85%</div>
            <div className="text-sm text-slate-400">Match Threshold</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">768</div>
            <div className="text-sm text-slate-400">Vector Dimensions</div>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-8">
            <FileUpload 
              onUpload={handleUpload} 
              isLoading={isLoading} 
              onReset={handleReset}
              hasResult={!!result || !!error}
            />
            
            {/* Preview */}
            {uploadedFile && uploadedFile.preview && !result && !error && (
              <div className="mt-6 flex justify-center">
                <div className="relative">
                  <img 
                    src={uploadedFile.preview} 
                    alt="Preview" 
                    className="max-h-48 rounded-xl border border-white/20 shadow-lg"
                  />
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-white text-sm">Analyzing...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-red-400">Error</h3>
                    <p className="text-sm text-red-300/80">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {result && (
              <ResultsDisplay 
                result={result} 
                uploadedFile={uploadedFile}
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-white/5 border-t border-white/10">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Powered by Gemini AI + pgvector</span>
              <span>Supports: JPEG, PNG, WebP, AVIF, MP4</span>
            </div>
          </div>
        </div>

        {/* Tech stack */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {['Next.js', 'Express', 'PostgreSQL', 'pgvector', 'Gemini AI', 'Sharp', 'FFmpeg'].map((tech) => (
            <span 
              key={tech}
              className="px-3 py-1 text-xs font-medium text-slate-400 bg-white/5 rounded-full border border-white/10"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </main>
  )
}
