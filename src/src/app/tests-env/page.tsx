// TEST: Place this in src/app/test-env/page.tsx to verify env vars
'use client';

export default function TestEnvPage() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'NOT SET - using localhost:8080';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          Environment Variable Test
        </h1>
        
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            NEXT_PUBLIC_BACKEND_URL
          </h2>
          
          <div className="bg-black/30 rounded p-4 mb-4">
            <code className="text-green-400 text-lg break-all">
              {backendUrl}
            </code>
          </div>
          
          {backendUrl.includes('localhost') ? (
            <div className="bg-red-500/20 border border-red-500 rounded p-4">
              <p className="text-red-200 font-bold">❌ PROBLEM DETECTED</p>
              <p className="text-red-100 mt-2">
                Backend URL is not set correctly. Using localhost fallback.
              </p>
              <p className="text-red-100 mt-2">
                This means API calls will fail in production!
              </p>
            </div>
          ) : backendUrl.includes('logic-engine-core2') ? (
            <div className="bg-green-500/20 border border-green-500 rounded p-4">
              <p className="text-green-200 font-bold">✅ CORRECT</p>
              <p className="text-green-100 mt-2">
                Backend URL is properly configured!
              </p>
            </div>
          ) : (
            <div className="bg-yellow-500/20 border border-yellow-500 rounded p-4">
              <p className="text-yellow-200 font-bold">⚠️ UNEXPECTED VALUE</p>
              <p className="text-yellow-100 mt-2">
                The backend URL is set but doesn't match expected pattern.
              </p>
            </div>
          )}
          
          <div className="mt-6 pt-6 border-t border-white/20">
            <h3 className="text-lg font-bold text-white mb-2">
              Expected Value:
            </h3>
            <code className="text-gray-300 text-sm">
              https://logic-engine-core2-409495160162.us-central1.run.app
            </code>
          </div>
        </div>
        
        <div className="mt-8">
          <a 
            href="/chat"
            className="inline-block px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium"
          >
            ← Back to Chat
          </a>
        </div>
      </div>
    </div>
  );
}
