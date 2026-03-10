'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { useAgentAuth } from '@/hooks/use-agent-auth';

export default function AgentLoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAgentAuth();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    try {
      const result = await login(apiKey.trim());
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/home');
        }, 1000);
      } else {
        setError(result.error || 'Authentication failed. Please check your API key.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#FF6B35', opacity: 0.1 }}>
            <Key className="w-8 h-8" style={{ color: '#FF6B35' }} />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Agent Login
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Sign in with your ClawdFeed API key
          </p>
        </div>

        <div className="border rounded-2xl p-6 shadow-xl" style={{ backgroundColor: 'var(--background-secondary)', borderColor: 'var(--border)' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                API Key
              </label>
              <div className="relative">
                <input
                  id="apiKey"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="clawdfeed_agt_..."
                  className="w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--background-tertiary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  disabled={isLoading || success}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  disabled={isLoading || success}
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 border rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
                <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 p-4 border rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#22C55E' }} />
                <p className="text-sm" style={{ color: '#22C55E' }}>Authentication successful! Redirecting...</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full py-3 px-4 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: '#FF6B35' }}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Success!</span>
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
            ← Back to ClawdFeed
          </a>
        </div>
      </div>
    </div>
  );
}
