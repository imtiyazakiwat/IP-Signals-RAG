'use client'

interface Match {
  filename: string
  similarity: string
}

interface UploadResult {
  status: 'flagged' | 'safe'
  matches: Match[]
  processingTime: number
}

interface ResultsDisplayProps {
  result: UploadResult
  uploadedFile: { name: string; preview: string } | null
}

export default function ResultsDisplay({ result, uploadedFile }: ResultsDisplayProps) {
  const isFlagged = result.status === 'flagged'
  const similarityValue = result.matches[0] 
    ? parseFloat(result.matches[0].similarity.replace('%', '')) 
    : 0

  return (
    <div className="mt-8 space-y-6">
      {/* Main result card */}
      <div className={`
        relative overflow-hidden rounded-2xl p-6
        ${isFlagged 
          ? 'bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/30' 
          : 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30'
        }
      `}>
        {/* Background glow */}
        <div className={`
          absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30
          ${isFlagged ? 'bg-red-500' : 'bg-emerald-500'}
        `} />

        <div className="relative flex items-start gap-4">
          {/* Status icon */}
          <div className={`
            flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center
            ${isFlagged 
              ? 'bg-red-500/20 text-red-400' 
              : 'bg-emerald-500/20 text-emerald-400'
            }
          `}>
            {isFlagged ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <div className="flex-1">
            <h2 className={`text-2xl font-bold ${isFlagged ? 'text-red-400' : 'text-emerald-400'}`}>
              {isFlagged ? 'Potential Copyright Match' : 'No Copyright Issues'}
            </h2>
            <p className="text-slate-400 mt-1">
              {isFlagged 
                ? 'This content appears similar to protected material in our database.'
                : 'This content does not match any protected material in our database.'
              }
            </p>
          </div>
        </div>

        {/* Similarity meter for flagged content */}
        {isFlagged && result.matches.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Similarity Score</span>
              <span className={`text-2xl font-bold ${
                similarityValue >= 90 ? 'text-red-400' : 
                similarityValue >= 85 ? 'text-orange-400' : 'text-yellow-400'
              }`}>
                {result.matches[0].similarity}
              </span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  similarityValue >= 90 ? 'bg-gradient-to-r from-red-500 to-red-400' : 
                  similarityValue >= 85 ? 'bg-gradient-to-r from-orange-500 to-orange-400' : 
                  'bg-gradient-to-r from-yellow-500 to-yellow-400'
                }`}
                style={{ width: `${similarityValue}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-slate-500">
              <span>0%</span>
              <span className="text-slate-400">Threshold: 85%</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </div>

      {/* Matches list */}
      {result.matches.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            Matched Content ({result.matches.length})
          </h3>
          {result.matches.map((match, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center text-purple-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{match.filename}</p>
                <p className="text-sm text-slate-500">Protected content</p>
              </div>
              <div className={`
                px-3 py-1.5 rounded-lg text-sm font-bold
                ${parseFloat(match.similarity) >= 90 
                  ? 'bg-red-500/20 text-red-400' 
                  : parseFloat(match.similarity) >= 85 
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }
              `}>
                {match.similarity}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Processing stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{result.processingTime.toFixed(2)}s</p>
              <p className="text-sm text-slate-500">Processing Time</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{result.matches.length}</p>
              <p className="text-sm text-slate-500">Matches Found</p>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded file info */}
      {uploadedFile && (
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          {uploadedFile.preview && (
            <img 
              src={uploadedFile.preview} 
              alt="Uploaded" 
              className="w-16 h-16 object-cover rounded-lg border border-white/20"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-500">Analyzed File</p>
            <p className="font-medium text-white truncate">{uploadedFile.name}</p>
          </div>
          <div className={`
            px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider
            ${isFlagged 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }
          `}>
            {result.status}
          </div>
        </div>
      )}
    </div>
  )
}
