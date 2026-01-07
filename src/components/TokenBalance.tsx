'use client';

import { useState, useEffect } from 'react';
import { Coins, Plus, TrendingDown, Loader2, X, Zap, Sparkles, Crown, Info } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// Static token packages
const TOKEN_PACKAGES = [
  { id: 'starter', price: 10, tokens: 10000, label: 'Popular' },
  { id: 'standard', price: 20, tokens: 20000, label: null },
  { id: 'value', price: 50, tokens: 50000, label: 'Best Value' },
];

// Provider costs for reference
const PROVIDER_COSTS = [
  { name: 'Gemini', tokens: 1, color: 'text-green-400' },
  { name: 'Llama', tokens: 3, color: 'text-blue-400' },
  { name: 'Perplexity', tokens: 5, color: 'text-purple-400' },
  { name: 'Mistral', tokens: 8, color: 'text-orange-400' },
  { name: 'Claude', tokens: 15, color: 'text-amber-400' },
  { name: 'GPT', tokens: 15, color: 'text-emerald-400' },
  { name: 'Grok', tokens: 15, color: 'text-red-400' },
];

interface BalanceInfo {
  user_id: string;
  balance: number;
  total_spent: number;
  last_updated: string;
}

interface TokenBalanceProps {
  userId: string;
  userEmail?: string;
  compact?: boolean;
  onBalanceChange?: (balance: number) => void;
}

export default function TokenBalance({ 
  userId, 
  userEmail,
  compact = false,
  onBalanceChange 
}: TokenBalanceProps) {
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch balance
  useEffect(() => {
    if (!userId) return;

    const fetchBalance = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/billing/balance/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setBalance(data);
          onBalanceChange?.(data.balance);
        }
      } catch (err) {
        console.error('[TokenBalance] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [userId, onBalanceChange]);

  const handleBuyTokens = async (packageId: string) => {
    if (!userEmail) {
      setError('Email required for checkout');
      return;
    }

    setCheckoutLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          user_email: userEmail,
          package_id: packageId,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        setError(data.error || 'Checkout failed');
      }
    } catch (err) {
      setError('Network error - please try again');
      console.error('[TokenBalance] Checkout error:', err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatBalance = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Compact view for sidebar
  if (compact) {
    return (
      <>
        <div 
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-panel-light/50 cursor-pointer hover:bg-panel-light transition-colors"
          onClick={() => setShowBuyModal(true)}
        >
          <Coins size={16} className="text-primary" />
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" />
                <span className="text-xs text-secondary">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-sm font-medium">
                  {formatBalance(balance?.balance || 0)}
                </div>
                <div className="text-xs text-secondary">Credits</div>
              </>
            )}
          </div>
          <Plus size={14} className="text-primary" />
        </div>

        {/* Buy Modal */}
        {showBuyModal && (
          <BuyTokensModal
            currentBalance={balance?.balance || 0}
            loading={checkoutLoading}
            error={error}
            onBuy={handleBuyTokens}
            onClose={() => setShowBuyModal(false)}
          />
        )}
      </>
    );
  }

  // Full view
  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coins size={20} className="text-primary" />
          <h3 className="font-semibold">Token Balance</h3>
        </div>
        <button
          onClick={() => setShowBuyModal(true)}
          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          Buy Tokens
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-3xl font-bold text-primary">
            {formatBalance(balance?.balance || 0)}
          </div>

          <div className="flex items-center gap-4 text-sm text-secondary">
            <div className="flex items-center gap-1">
              <TrendingDown size={14} />
              <span>Total spent: {formatBalance(balance?.total_spent || 0)}</span>
            </div>
          </div>

          {(balance?.balance || 0) < 1 && (
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
              <p className="text-sm text-warning">
                Low balance! Add credits to continue using AI features.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Buy Modal */}
      {showBuyModal && (
        <BuyTokensModal
          currentBalance={balance?.balance || 0}
          loading={checkoutLoading}
          error={error}
          onBuy={handleBuyTokens}
          onClose={() => setShowBuyModal(false)}
        />
      )}
    </div>
  );
}

// Helper function for package icons
function getPackageIcon(id: string) {
  switch (id) {
    case 'starter': return <Zap size={24} />;
    case 'standard': return <Sparkles size={24} />;
    case 'value': return <Crown size={24} />;
    default: return <Coins size={24} />;
  }
}

// Buy Tokens Modal Component
function BuyTokensModal({
  currentBalance,
  loading,
  error,
  onBuy,
  onClose,
}: {
  currentBalance: number;
  loading: boolean;
  error: string | null;
  onBuy: (packageId: string) => void;
  onClose: () => void;
}) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const formatTokens = (tokens: number) => tokens.toLocaleString();

  const handleBuy = () => {
    if (selectedPackage) {
      onBuy(selectedPackage);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-strong rounded-xl border border-border max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Coins size={24} className="text-primary" />
            Buy Tokens
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-panel-light transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Balance */}
        <div className="mb-6 p-4 rounded-lg bg-panel-light/50 border border-border">
          <div className="text-sm text-secondary mb-1">Current Balance</div>
          <div className="text-2xl font-bold text-primary">
            {formatTokens(currentBalance)} tokens
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Purchase Options */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-text-primary">Select a Package</h3>
          {TOKEN_PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              disabled={loading}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left relative ${
                selectedPackage === pkg.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-panel-light'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {pkg.label && (
                <span className="absolute -top-2 right-3 px-2 py-0.5 text-xs font-bold bg-primary text-white rounded-full">
                  {pkg.label}
                </span>
              )}
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  selectedPackage === pkg.id ? 'bg-primary/20 text-primary' : 'bg-panel-medium text-secondary'
                }`}>
                  {getPackageIcon(pkg.id)}
                </div>
                <div className="flex-1">
                  <div className="text-lg font-bold">${pkg.price}</div>
                  <div className="text-sm text-secondary">
                    {formatTokens(pkg.tokens)} tokens
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-secondary">
                    ${(pkg.price / pkg.tokens * 1000).toFixed(2)} per 1k
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Provider Costs */}
        <div className="mb-6 p-4 rounded-lg bg-panel-light/30 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-secondary" />
            <h3 className="text-sm font-semibold text-text-primary">Cost per Call</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {PROVIDER_COSTS.map((provider) => (
              <div key={provider.name} className="flex items-center justify-between py-1">
                <span className={provider.color}>{provider.name}</span>
                <span className="text-secondary">
                  {provider.tokens} {provider.tokens === 1 ? 'token' : 'tokens'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-secondary">
              Use Gemini for the most efficient token usage, or premium models for complex tasks.
            </p>
          </div>
        </div>

        {/* Buy Button */}
        <button
          onClick={handleBuy}
          disabled={!selectedPackage || loading}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            selectedPackage && !loading
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-panel-medium text-secondary cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Redirecting to checkout...
            </>
          ) : (
            <>
              <Coins size={20} />
              {selectedPackage
                ? `Buy ${formatTokens(TOKEN_PACKAGES.find(p => p.id === selectedPackage)?.tokens || 0)} Tokens`
                : 'Select a Package'}
            </>
          )}
        </button>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-secondary text-center">
            Secure checkout powered by Stripe. Credits never expire.
          </p>
        </div>
      </div>
    </div>
  );
}
