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
}

export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  const isFlagged = result.status === 'flagged'

  return (
    <div className="mt-6">
      <div
        className={`
          p-6 rounded-lg border-2
          ${isFlagged 
            ? 'bg-red-50 border-red-200' 
            : 'bg-green-50 border-green-200'
          }
        `}
      >
        <div className="flex items-center gap-3 mb-4">
          {isFlagged ? (
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ) : (
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          
          <div>
            <h2
              className={`text-xl font-bold ${
                isFlagged ? 'text-red-700' : 'text-green-700'
              }`}
            >
              {isFlagged ? 'Potential Copyright Match' : 'No Copyright Issues'}
            </h2>
            <p className="text-sm text-gray-600">
              Processing time: {result.processingTime.toFixed(2)}s
            </p>
          </div>
        </div>

        {result.matches.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-700 mb-2">Matches Found:</h3>
            <ul className="space-y-2">
              {result.matches.map((match, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded border border-gray-200"
                >
                  <span className="text-gray-700 font-medium">
                    {match.filename}
                  </span>
                  <span
                    className={`
                      px-3 py-1 rounded-full text-sm font-medium
                      ${isFlagged 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-yellow-100 text-yellow-700'
                      }
                    `}
                  >
                    {match.similarity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.matches.length === 0 && (
          <p className="text-gray-600">
            No similar content found in the database.
          </p>
        )}
      </div>
    </div>
  )
}
