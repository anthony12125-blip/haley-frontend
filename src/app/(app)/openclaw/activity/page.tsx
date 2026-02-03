'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/authContext';
import { fetchUsageHistory } from '@/lib/haleyApi';
import {
  ArrowLeft, Loader2, Radio, MessageCircle, Hash,
  Send as SendIcon, Smartphone, RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ActivityRecord {
  id: string;
  provider: string;
  model?: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  endpoint?: string;
  timestamp: string;
  balance_after: number;
}

const CHANNEL_META: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  telegram: { name: 'Telegram', icon: <SendIcon size={14} />, color: 'text-blue-400' },
  discord: { name: 'Discord', icon: <Hash size={14} />, color: 'text-indigo-400' },
  slack: { name: 'Slack', icon: <MessageCircle size={14} />, color: 'text-green-400' },
  whatsapp: { name: 'WhatsApp', icon: <Smartphone size={14} />, color: 'text-emerald-400' },
};

function getChannelFromEndpoint(endpoint?: string): string | null {
  if (!endpoint) return null;
  const match = endpoint.match(/openclaw\/(\w+)/);
  return match ? match[1] : null;
}

export default function OpenClawActivityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = user?.uid || '';

  const loadActivity = useCallback(async (showRefresh = false) => {
    if (!userId) return;
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Fetch recent usage, then filter to only openclaw/* endpoints
      const data = await fetchUsageHistory(userId, undefined, undefined, 500);
      const openclawActivity = (data.usage || []).filter(
        (r: ActivityRecord) => r.endpoint && r.endpoint.startsWith('openclaw/')
      );
      setActivity(openclawActivity);
    } catch (err) {
      console.error('[OpenClaw Activity] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return ts; }
  };

  const providerColor = (p: string) => {
    const colors: Record<string, string> = {
      gemini: 'text-green-400', claude: 'text-amber-400', gpt: 'text-emerald-400',
      perplexity: 'text-purple-400', grok: 'text-red-400', mistral: 'text-orange-400',
      llama: 'text-blue-400',
    };
    return colors[p.toLowerCase()] || 'text-secondary';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/openclaw')} className="p-2 rounded-lg hover:bg-panel-light transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Radio size={28} className="text-primary" /> Channel Activity
            </h1>
            <p className="text-sm text-secondary mt-1">Recent messages across connected channels</p>
          </div>
          <button
            onClick={() => loadActivity(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        {activity.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {Object.entries(
              activity.reduce<Record<string, number>>((acc, r) => {
                const ch = getChannelFromEndpoint(r.endpoint) || 'other';
                acc[ch] = (acc[ch] || 0) + 1;
                return acc;
              }, {})
            ).map(([ch, count]) => {
              const meta = CHANNEL_META[ch];
              return (
                <div key={ch} className="glass-strong rounded-lg border border-border p-4">
                  <div className={`flex items-center gap-2 mb-1 ${meta?.color || 'text-secondary'}`}>
                    {meta?.icon || <Radio size={14} />}
                    <span className="text-sm font-medium capitalize">{meta?.name || ch}</span>
                  </div>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-secondary">messages</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Activity Feed */}
        <div className="glass-strong rounded-xl border border-border p-6">
          {activity.length === 0 ? (
            <div className="text-center py-16 text-secondary">
              <Radio size={40} className="mx-auto mb-3 opacity-30" />
              <p>No channel activity yet</p>
              <p className="text-xs mt-1">Messages from Telegram, Discord, and Slack will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((r) => {
                const ch = getChannelFromEndpoint(r.endpoint);
                const meta = ch ? CHANNEL_META[ch] : null;
                return (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-panel-light/30 border-b border-border/50">
                    <div className={`p-2 rounded-lg bg-panel-light ${meta?.color || 'text-secondary'}`}>
                      {meta?.icon || <Radio size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">{meta?.name || ch || 'Unknown'}</span>
                        <span className="text-xs text-secondary">&rarr;</span>
                        <span className={`text-sm capitalize ${providerColor(r.provider)}`}>{r.provider}</span>
                        {r.model && <span className="text-xs text-secondary">({r.model})</span>}
                      </div>
                      <div className="text-xs text-secondary mt-0.5">
                        {formatTime(r.timestamp)} &middot; {(r.input_tokens + r.output_tokens).toLocaleString()} tokens &middot; ${r.cost.toFixed(4)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
