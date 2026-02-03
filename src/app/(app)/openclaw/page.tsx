'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/authContext';
import { getDb } from '@/lib/firebaseClient';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { fetchOpenClawHealth, BACKEND_URL } from '@/lib/haleyApi';
import {
  ArrowLeft, Loader2, Check, X, ExternalLink, Plug, Unplug,
  MessageCircle, Hash, Radio, Send as SendIcon, Smartphone,
  Activity, Settings as SettingsIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChannelConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  connected: boolean;
  webhookUrl?: string;
  connectedAt?: string;
  description: string;
  setupSteps: string[];
}

const CHANNEL_DEFAULTS: Omit<ChannelConfig, 'connected' | 'webhookUrl' | 'connectedAt'>[] = [
  {
    id: 'telegram',
    name: 'Telegram',
    icon: <SendIcon size={24} />,
    color: 'text-blue-400',
    description: 'Connect your Telegram bot to route messages through Haley.',
    setupSteps: [
      'Create a bot with @BotFather on Telegram',
      'Copy the bot token',
      'Set the webhook URL in your bot settings',
      'Messages will route through Haley with billing',
    ],
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: <Hash size={24} />,
    color: 'text-indigo-400',
    description: 'Add Haley to your Discord server as an interaction bot.',
    setupSteps: [
      'Create an application at discord.com/developers',
      'Copy the public key and set the interactions URL',
      'Invite the bot to your server',
      'Slash commands will route through Haley with billing',
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: <MessageCircle size={24} />,
    color: 'text-green-400',
    description: 'Install Haley as a Slack app in your workspace.',
    setupSteps: [
      'Create a Slack app at api.slack.com/apps',
      'Enable Event Subscriptions with the webhook URL',
      'Install the app to your workspace',
      'Mention @Haley in any channel to get responses',
    ],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: <Smartphone size={24} />,
    color: 'text-emerald-400',
    description: 'Connect WhatsApp Business via OpenClaw gateway.',
    setupSteps: [
      'Set up OpenClaw gateway locally',
      'Scan the QR code with WhatsApp',
      'Messages route through the gateway to Haley',
      'Requires OpenClaw running on your device',
    ],
  },
];

export default function OpenClawPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [bridgeHealthy, setBridgeHealthy] = useState<boolean | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState<string | null>(null);
  const [webhookInput, setWebhookInput] = useState('');

  const userId = user?.uid || '';

  const loadChannels = useCallback(async () => {
    if (!userId) return;
    try {
      const db = getDb();
      const channelsRef = collection(db, `users/${userId}/openclaw_channels`);
      const snap = await getDocs(channelsRef);
      const connected: Record<string, { webhookUrl?: string; connectedAt?: string }> = {};
      snap.forEach((d) => {
        connected[d.id] = d.data() as any;
      });

      setChannels(
        CHANNEL_DEFAULTS.map((ch) => ({
          ...ch,
          connected: !!connected[ch.id],
          webhookUrl: connected[ch.id]?.webhookUrl,
          connectedAt: connected[ch.id]?.connectedAt,
        }))
      );
    } catch (err) {
      console.error('[OpenClaw] Load channels error:', err);
      setChannels(CHANNEL_DEFAULTS.map((ch) => ({ ...ch, connected: false })));
    }
  }, [userId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await fetchOpenClawHealth();
        setBridgeHealthy(true);
      } catch {
        setBridgeHealthy(false);
      }
      await loadChannels();
      setLoading(false);
    };
    init();
  }, [loadChannels]);

  const handleConnect = async (channelId: string) => {
    if (!userId) return;
    setConnectingId(channelId);
    try {
      const db = getDb();
      const webhookUrl = `${BACKEND_URL}/baby/webhook/${channelId}`;
      await setDoc(doc(db, `users/${userId}/openclaw_channels`, channelId), {
        connected: true,
        webhookUrl,
        connectedAt: new Date().toISOString(),
      });
      await loadChannels();
      setShowSetup(null);
    } catch (err) {
      console.error('[OpenClaw] Connect error:', err);
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = async (channelId: string) => {
    if (!userId) return;
    setConnectingId(channelId);
    try {
      const db = getDb();
      await deleteDoc(doc(db, `users/${userId}/openclaw_channels`, channelId));
      await loadChannels();
    } catch (err) {
      console.error('[OpenClaw] Disconnect error:', err);
    } finally {
      setConnectingId(null);
    }
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
          <button onClick={() => router.push('/')} className="p-2 rounded-lg hover:bg-panel-light transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Radio size={28} className="text-primary" /> OpenClaw Channels
            </h1>
            <p className="text-sm text-secondary mt-1">Connect messaging platforms to Haley</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/openclaw/activity')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors text-sm"
            >
              <Activity size={16} /> Activity
            </button>
            <button
              onClick={() => router.push('/openclaw/settings')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors text-sm"
            >
              <SettingsIcon size={16} /> Settings
            </button>
          </div>
        </div>

        {/* Bridge Status */}
        <div className={`glass-strong rounded-xl border p-4 mb-6 flex items-center gap-3 ${
          bridgeHealthy ? 'border-success/30' : bridgeHealthy === false ? 'border-error/30' : 'border-border'
        }`}>
          <div className={`w-3 h-3 rounded-full ${
            bridgeHealthy ? 'bg-success animate-pulse' : bridgeHealthy === false ? 'bg-error' : 'bg-secondary'
          }`} />
          <span className="text-sm">
            OpenClaw Bridge: {bridgeHealthy ? 'Connected' : bridgeHealthy === false ? 'Unreachable' : 'Checking...'}
          </span>
          <span className="text-xs text-secondary ml-auto">
            {BACKEND_URL}/baby/openclaw/health
          </span>
        </div>

        {/* Channel Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map((ch) => (
            <div key={ch.id} className="glass-strong rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-lg bg-panel-light ${ch.color}`}>
                  {ch.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg">{ch.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {ch.connected ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <Check size={12} /> Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-secondary">
                        <X size={12} /> Disconnected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-secondary mb-4">{ch.description}</p>

              {ch.connected && ch.webhookUrl && (
                <div className="mb-4 p-3 rounded-lg bg-panel-light/50 border border-border">
                  <div className="text-xs text-secondary mb-1">Webhook URL</div>
                  <code className="text-xs text-primary break-all">{ch.webhookUrl}</code>
                </div>
              )}

              <div className="flex gap-2">
                {ch.connected ? (
                  <button
                    onClick={() => handleDisconnect(ch.id)}
                    disabled={connectingId === ch.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-error/30 text-error hover:bg-error/10 transition-colors text-sm disabled:opacity-50"
                  >
                    {connectingId === ch.id ? <Loader2 size={14} className="animate-spin" /> : <Unplug size={14} />}
                    Disconnect
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowSetup(showSetup === ch.id ? null : ch.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors text-sm"
                    >
                      <Plug size={14} /> Connect
                    </button>
                  </>
                )}
              </div>

              {/* Setup Steps */}
              {showSetup === ch.id && !ch.connected && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-sm font-semibold mb-3">Setup Steps</div>
                  <ol className="space-y-2 mb-4">
                    {ch.setupSteps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-sm text-secondary">
                        <span className="w-5 h-5 rounded-full bg-panel-light flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  <button
                    onClick={() => handleConnect(ch.id)}
                    disabled={connectingId === ch.id}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors text-sm disabled:opacity-50"
                  >
                    {connectingId === ch.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    Mark as Connected
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
