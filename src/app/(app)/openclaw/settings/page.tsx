'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/authContext';
import { getDb } from '@/lib/firebaseClient';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { BACKEND_URL } from '@/lib/haleyApi';
import {
  Loader2, Settings, Copy, Check, Trash2,
  AlertTriangle, Link2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChannelDoc {
  id: string;
  connected: boolean;
  webhookUrl?: string;
  connectedAt?: string;
}

export default function OpenClawSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [channels, setChannels] = useState<ChannelDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const userId = user?.uid || '';

  const loadChannels = useCallback(async () => {
    if (!userId) return;
    try {
      const db = getDb();
      const snap = await getDocs(collection(db, `users/${userId}/openclaw_channels`));
      const list: ChannelDoc[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ChannelDoc));
      setChannels(list);
    } catch (err) {
      console.error('[OpenClaw Settings] Load error:', err);
    }
  }, [userId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadChannels();
      setLoading(false);
    };
    init();
  }, [loadChannels]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDisconnect = async (channelId: string) => {
    if (!userId) return;
    setDisconnecting(channelId);
    try {
      const db = getDb();
      await deleteDoc(doc(db, `users/${userId}/openclaw_channels`, channelId));
      await loadChannels();
    } catch (err) {
      console.error('[OpenClaw Settings] Disconnect error:', err);
    } finally {
      setDisconnecting(null);
    }
  };

  const formatDate = (ts?: string) => {
    if (!ts) return '-';
    try {
      return new Date(ts).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return ts; }
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings size={28} className="text-primary" /> Channel Settings
            </h1>
            <p className="text-sm text-secondary mt-1">Manage webhooks and channel connections</p>
          </div>
        </div>

        {/* Webhook Base URL */}
        <div className="glass-strong rounded-xl border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Link2 size={18} className="text-primary" /> Webhook Base URL
          </h2>
          <p className="text-sm text-secondary mb-3">
            Point your channel webhooks to these URLs on your Haley backend:
          </p>
          <div className="space-y-2">
            {['telegram', 'discord', 'slack'].map((ch) => {
              const url = `${BACKEND_URL}/baby/webhook/${ch}`;
              return (
                <div key={ch} className="flex items-center gap-2 p-3 rounded-lg bg-panel-light/50 border border-border">
                  <span className="text-sm font-medium capitalize w-20">{ch}</span>
                  <code className="flex-1 text-xs text-primary break-all">{url}</code>
                  <button
                    onClick={() => handleCopy(url, ch)}
                    className="p-1.5 rounded hover:bg-panel-light transition-colors flex-shrink-0"
                    title="Copy URL"
                  >
                    {copiedId === ch ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Environment Variables Reference */}
        <div className="glass-strong rounded-xl border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Required Environment Variables</h2>
          <p className="text-sm text-secondary mb-3">
            Set these on your backend (Cloud Run) for each channel:
          </p>
          <div className="space-y-2 font-mono text-xs">
            <div className="p-2 rounded bg-panel-light/50 border border-border">
              <span className="text-amber-400">TELEGRAM_BOT_TOKEN</span>=<span className="text-secondary">your_telegram_bot_token</span>
            </div>
            <div className="p-2 rounded bg-panel-light/50 border border-border">
              <span className="text-amber-400">DISCORD_PUBLIC_KEY</span>=<span className="text-secondary">your_discord_app_public_key</span>
            </div>
            <div className="p-2 rounded bg-panel-light/50 border border-border">
              <span className="text-amber-400">SLACK_SIGNING_SECRET</span>=<span className="text-secondary">your_slack_signing_secret</span>
            </div>
            <div className="p-2 rounded bg-panel-light/50 border border-border">
              <span className="text-amber-400">SLACK_BOT_TOKEN</span>=<span className="text-secondary">xoxb-your-slack-bot-token</span>
            </div>
          </div>
        </div>

        {/* Connected Channels */}
        <div className="glass-strong rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Connected Channels</h2>
          {channels.length === 0 ? (
            <div className="text-center py-8 text-secondary">
              <AlertTriangle size={32} className="mx-auto mb-2 opacity-30" />
              <p>No channels connected</p>
              <button
                onClick={() => router.push('/openclaw')}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Connect a channel
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {channels.map((ch) => (
                <div key={ch.id} className="flex items-center gap-4 p-4 rounded-lg bg-panel-light/50 border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold capitalize">{ch.id}</div>
                    <div className="text-xs text-secondary mt-1">
                      Connected: {formatDate(ch.connectedAt)}
                    </div>
                    {ch.webhookUrl && (
                      <code className="text-xs text-primary break-all block mt-1">{ch.webhookUrl}</code>
                    )}
                  </div>
                  <button
                    onClick={() => handleDisconnect(ch.id)}
                    disabled={disconnecting === ch.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-error/30 text-error hover:bg-error/10 transition-colors text-sm disabled:opacity-50 flex-shrink-0"
                  >
                    {disconnecting === ch.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
