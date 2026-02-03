'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/authContext';
import { fetchBalance, fetchUsageHistory, createCheckout } from '@/lib/haleyApi';
import {
  Coins, Plus, ArrowLeft, Loader2, Calendar, TrendingDown,
  Zap, Sparkles, Crown, X, Info, ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const TOKEN_PACKAGES = [
  { id: 'starter', price: 10, tokens: 10000, label: 'Popular' },
  { id: 'standard', price: 20, tokens: 20000, label: null },
  { id: 'value', price: 50, tokens: 50000, label: 'Best Value' },
];

function getPackageIcon(id: string) {
  switch (id) {
    case 'starter': return <Zap size={24} />;
    case 'standard': return <Sparkles size={24} />;
    case 'value': return <Crown size={24} />;
    default: return <Coins size={24} />;
  }
}

interface UsageRecord {
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

type DateRange = '7d' | '30d' | '90d' | 'all';

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState<{ balance: number; total_spent: number } | null>(null);
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageLoading, setUsageLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.uid || '';
  const userEmail = user?.email || '';

  const loadBalance = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await fetchBalance(userId);
      setBalance(data);
    } catch (err) {
      console.error('[Billing] Balance fetch error:', err);
    }
  }, [userId]);

  const loadUsage = useCallback(async () => {
    if (!userId) return;
    setUsageLoading(true);
    try {
      let startDate: string | undefined;
      const now = new Date();
      if (dateRange === '7d') {
        startDate = new Date(now.getTime() - 7 * 86400000).toISOString();
      } else if (dateRange === '30d') {
        startDate = new Date(now.getTime() - 30 * 86400000).toISOString();
      } else if (dateRange === '90d') {
        startDate = new Date(now.getTime() - 90 * 86400000).toISOString();
      }
      const data = await fetchUsageHistory(userId, startDate, undefined, 200);
      setUsage(data.usage || []);
    } catch (err) {
      console.error('[Billing] Usage fetch error:', err);
    } finally {
      setUsageLoading(false);
    }
  }, [userId, dateRange]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadBalance();
      setLoading(false);
    };
    init();
  }, [loadBalance]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const handleBuy = async (packageId: string) => {
    if (!userEmail) { setError('Email required for checkout'); return; }
    setCheckoutLoading(true);
    setError(null);
    try {
      const data = await createCheckout(userId, userEmail, packageId);
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Checkout failed');
      }
    } catch {
      setError('Network error - please try again');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatDate = (ts: string) => {
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
      llama: 'text-blue-400', haley: 'text-primary',
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
          <button onClick={() => router.push('/')} className="p-2 rounded-lg hover:bg-panel-light transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Coins size={28} className="text-primary" /> Billing
            </h1>
            <p className="text-sm text-secondary mt-1">Manage your balance and view usage</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="glass-strong rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-sm text-secondary mb-1">Current Balance</div>
              <div className="text-4xl font-bold text-primary">
                ${(balance?.balance || 0).toFixed(2)}
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-secondary">
                <TrendingDown size={14} />
                Total spent: ${(balance?.total_spent || 0).toFixed(2)}
              </div>
            </div>
            <button
              onClick={() => setShowBuyModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus size={18} /> Add Credits
            </button>
          </div>
        </div>

        {/* Usage History */}
        <div className="glass-strong rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar size={18} className="text-primary" /> Usage History
            </h2>
            <div className="flex gap-1 bg-panel-light rounded-lg p-1">
              {(['7d', '30d', '90d', 'all'] as DateRange[]).map(r => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    dateRange === r ? 'bg-primary text-white' : 'text-secondary hover:text-text-primary'
                  }`}
                >
                  {r === 'all' ? 'All' : r}
                </button>
              ))}
            </div>
          </div>

          {usageLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : usage.length === 0 ? (
            <div className="text-center py-12 text-secondary">
              <Coins size={40} className="mx-auto mb-3 opacity-30" />
              <p>No usage records for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-secondary border-b border-border">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Provider</th>
                    <th className="pb-3 pr-4">Model</th>
                    <th className="pb-3 pr-4 text-right">Tokens</th>
                    <th className="pb-3 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.map((row) => (
                    <tr key={row.id} className="border-b border-border/50 hover:bg-panel-light/30">
                      <td className="py-3 pr-4 whitespace-nowrap">{formatDate(row.timestamp)}</td>
                      <td className={`py-3 pr-4 font-medium capitalize ${providerColor(row.provider)}`}>
                        {row.provider}
                      </td>
                      <td className="py-3 pr-4 text-secondary">{row.model || '-'}</td>
                      <td className="py-3 pr-4 text-right whitespace-nowrap">
                        {(row.input_tokens + row.output_tokens).toLocaleString()}
                      </td>
                      <td className="py-3 text-right whitespace-nowrap font-medium">
                        ${row.cost.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Buy Credits Modal */}
      {showBuyModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowBuyModal(false)}
        >
          <div className="glass-strong rounded-xl border border-border max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Coins size={24} className="text-primary" /> Add Credits
              </h2>
              <button onClick={() => setShowBuyModal(false)} className="p-2 rounded-lg hover:bg-panel-light transition-colors">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <div className="space-y-3 mb-6">
              {TOKEN_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handleBuy(pkg.id)}
                  disabled={checkoutLoading}
                  className="w-full p-4 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-panel-light transition-all text-left relative disabled:opacity-50"
                >
                  {pkg.label && (
                    <span className="absolute -top-2 right-3 px-2 py-0.5 text-xs font-bold bg-primary text-white rounded-full">
                      {pkg.label}
                    </span>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-panel-medium text-secondary">
                      {getPackageIcon(pkg.id)}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-bold">${pkg.price}</div>
                      <div className="text-sm text-secondary">{pkg.tokens.toLocaleString()} tokens</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {checkoutLoading && (
              <div className="flex items-center justify-center gap-2 py-3 text-primary">
                <Loader2 size={18} className="animate-spin" /> Redirecting to Stripe...
              </div>
            )}

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-secondary text-center">Secure checkout powered by Stripe. Credits never expire.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
