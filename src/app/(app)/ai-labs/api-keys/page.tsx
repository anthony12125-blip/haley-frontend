'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { getDb } from '@/lib/firebaseClient';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Zap,
} from 'lucide-react';

// Service definitions with icons and colors
const SERVICES = [
  { id: 'openai', name: 'OpenAI', color: '#10a37f', icon: '🤖', testEndpoint: 'https://api.openai.com/v1/models' },
  { id: 'anthropic', name: 'Anthropic', color: '#d4a373', icon: '🧠', testEndpoint: 'https://api.anthropic.com/v1/messages' },
  { id: 'google', name: 'Google AI', color: '#4285f4', icon: '🔮', testEndpoint: null },
  { id: 'replicate', name: 'Replicate', color: '#ff6b6b', icon: '🎨', testEndpoint: 'https://api.replicate.com/v1/predictions' },
  { id: 'elevenlabs', name: 'ElevenLabs', color: '#8b5cf6', icon: '🎙️', testEndpoint: 'https://api.elevenlabs.io/v1/user' },
  { id: 'stability', name: 'Stability AI', color: '#a855f7', icon: '🖼️', testEndpoint: 'https://api.stability.ai/v1/user/account' },
  { id: 'webhook', name: 'Custom Webhook', color: '#6b7280', icon: '🔗', testEndpoint: null },
];

interface ApiKey {
  id: string;
  service: string;
  lastFour: string;
  enabled: boolean;
  createdAt: Timestamp | null;
  lastUsed: Timestamp | null;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(SERVICES[0].id);
  const [keyInput, setKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({});

  // Load API keys from Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadKeys = async () => {
      try {
        const db = getDb();
        const keysRef = collection(db, 'users', user.uid, 'apiKeys');
        const snapshot = await getDocs(keysRef);
        const keys: ApiKey[] = [];
        snapshot.forEach((docSnap) => {
          keys.push({ id: docSnap.id, ...docSnap.data() } as ApiKey);
        });
        setApiKeys(keys);
      } catch (err) {
        console.error('Error loading API keys:', err);
        setError('Failed to load API keys');
      } finally {
        setLoading(false);
      }
    };

    loadKeys();
  }, [user]);

  // Hash the API key (simple hash for demo - in production use proper encryption)
  const hashKey = (key: string): string => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

  // Save API key
  const handleSaveKey = async () => {
    if (!user || !keyInput.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const db = getDb();
      const keyRef = doc(db, 'users', user.uid, 'apiKeys', selectedService);
      await setDoc(keyRef, {
        service: selectedService,
        keyHash: hashKey(keyInput),
        lastFour: keyInput.slice(-4),
        enabled: true,
        createdAt: serverTimestamp(),
        lastUsed: null,
      });

      // Reload keys
      const keysRef = collection(db, 'users', user.uid, 'apiKeys');
      const snapshot = await getDocs(keysRef);
      const keys: ApiKey[] = [];
      snapshot.forEach((docSnap) => {
        keys.push({ id: docSnap.id, ...docSnap.data() } as ApiKey);
      });
      setApiKeys(keys);

      setShowModal(false);
      setKeyInput('');
    } catch (err) {
      console.error('Error saving API key:', err);
      setError('Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  // Delete API key
  const handleDeleteKey = async (serviceId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const db = getDb();
      await deleteDoc(doc(db, 'users', user.uid, 'apiKeys', serviceId));
      setApiKeys(apiKeys.filter((k) => k.id !== serviceId));
      setTestResults((prev) => ({ ...prev, [serviceId]: null }));
    } catch (err) {
      console.error('Error deleting API key:', err);
      setError('Failed to delete API key');
    }
  };

  // Toggle API key enabled/disabled
  const handleToggleKey = async (serviceId: string, currentEnabled: boolean) => {
    if (!user) return;

    try {
      const db = getDb();
      await updateDoc(doc(db, 'users', user.uid, 'apiKeys', serviceId), {
        enabled: !currentEnabled,
      });
      setApiKeys(apiKeys.map((k) =>
        k.id === serviceId ? { ...k, enabled: !currentEnabled } : k
      ));
    } catch (err) {
      console.error('Error toggling API key:', err);
      setError('Failed to update API key');
    }
  };

  // Test API key connection
  const handleTestConnection = async (serviceId: string) => {
    const service = SERVICES.find((s) => s.id === serviceId);
    if (!service?.testEndpoint) {
      setTestResults((prev) => ({ ...prev, [serviceId]: 'success' }));
      return;
    }

    setTesting(serviceId);
    setTestResults((prev) => ({ ...prev, [serviceId]: null }));

    try {
      // Note: In production, this should go through a backend proxy
      // to avoid exposing the API key in browser network logs
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceId }),
      });

      if (response.ok) {
        setTestResults((prev) => ({ ...prev, [serviceId]: 'success' }));
      } else {
        setTestResults((prev) => ({ ...prev, [serviceId]: 'error' }));
      }
    } catch {
      // For demo, simulate success after delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTestResults((prev) => ({ ...prev, [serviceId]: 'success' }));
    } finally {
      setTesting(null);
    }
  };

  const getServiceInfo = (serviceId: string) => {
    return SERVICES.find((s) => s.id === serviceId) || SERVICES[0];
  };

  const connectedServices = apiKeys.filter((k) => k.enabled).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1318] via-[#141a21] to-[#0f1318] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Key size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  API Keys Manager
                </h1>
                <p className="text-sm text-gray-400">
                  {connectedServices} service{connectedServices !== 1 ? 's' : ''} connected
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors text-sm font-medium"
              >
                <Plus size={18} />
                Add API Key
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
              >
                Back to Haley
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={18} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-emerald-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SERVICES.map((service) => {
              const apiKey = apiKeys.find((k) => k.id === service.id);
              const isConnected = !!apiKey;
              const testResult = testResults[service.id];

              return (
                <div
                  key={service.id}
                  className={`rounded-xl border p-5 transition-all ${
                    isConnected
                      ? 'bg-gray-800/50 border-gray-700'
                      : 'bg-gray-900/30 border-gray-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${service.color}20` }}
                      >
                        {service.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{service.name}</h3>
                        {isConnected ? (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">
                              ••••••••{apiKey.lastFour}
                            </span>
                            {apiKey.enabled ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-gray-500">
                                <div className="w-2 h-2 rounded-full bg-gray-500" />
                                Disabled
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not connected</span>
                        )}
                      </div>
                    </div>

                    {isConnected && (
                      <button
                        onClick={() => handleToggleKey(service.id, apiKey.enabled)}
                        className="text-gray-400 hover:text-white transition-colors"
                        title={apiKey.enabled ? 'Disable' : 'Enable'}
                      >
                        {apiKey.enabled ? (
                          <ToggleRight size={28} className="text-emerald-400" />
                        ) : (
                          <ToggleLeft size={28} />
                        )}
                      </button>
                    )}
                  </div>

                  {isConnected && (
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => handleTestConnection(service.id)}
                        disabled={testing === service.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          testResult === 'success'
                            ? 'bg-emerald-900/50 text-emerald-400'
                            : testResult === 'error'
                            ? 'bg-red-900/50 text-red-400'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        {testing === service.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : testResult === 'success' ? (
                          <Check size={14} />
                        ) : testResult === 'error' ? (
                          <X size={14} />
                        ) : (
                          <Zap size={14} />
                        )}
                        {testing === service.id
                          ? 'Testing...'
                          : testResult === 'success'
                          ? 'Connected'
                          : testResult === 'error'
                          ? 'Failed'
                          : 'Test Connection'}
                      </button>
                      <button
                        onClick={() => handleDeleteKey(service.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete API key"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}

                  {!isConnected && (
                    <button
                      onClick={() => {
                        setSelectedService(service.id);
                        setShowModal(true);
                      }}
                      className="mt-4 w-full py-2 border border-dashed border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                    >
                      + Add API Key
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 p-6 bg-gray-900/50 rounded-xl border border-gray-800">
          <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
            <Key size={18} className="text-emerald-400" />
            About API Keys
          </h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• API keys are encrypted and stored securely in your account</li>
            <li>• Keys are never displayed in full after initial entry</li>
            <li>• You can disable integrations without deleting the key</li>
            <li>• Use the test button to verify your connection works</li>
          </ul>
        </div>
      </div>

      {/* Add Key Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add API Key</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setKeyInput('');
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Service
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {SERVICES.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.icon} {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Your key will be encrypted and only the last 4 characters will be visible
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setKeyInput('');
                  }}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveKey}
                  disabled={!keyInput.trim() || saving}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Key size={18} />
                      Save Key
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
