'use client';

import { useState, useEffect } from 'react';
import { Coins, Plus, TrendingDown, Loader2, X } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

interface BalanceInfo {
  user_id: string;
  balance: number;
  total_spent: number;
  last_updated: string;
}

interface CreditPackage {
  id: string;
  amount: number;
  credits: number;
  name: string;
  popular: boolean;
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
  const [packages, setPackages] = useState<CreditPackage[]>([]);
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

  // Fetch packages when modal opens
  useEffect(() => {
    if (showBuyModal) {
      fetchPackages();
    }
  }, [showBuyModal]);

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/billing/packages`);
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      }
    } catch (err) {
      console.error('[TokenBalance] Packages fetch error:', err);
    }
  };

  const handleBuyCredits = async (packageId: string) => {
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
          <BuyCreditsModal
            packages={packages}
            loading={checkoutLoading}
            error={error}
            onBuy={handleBuyCredits}
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
          Add Credits
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
        <BuyCreditsModal
          packages={packages}
          loading={checkoutLoading}
          error={error}
          onBuy={handleBuyCredits}
          onClose={() => setShowBuyModal(false)}
        />
      )}
    </div>
  );
}

// Buy Credits Modal Component
function BuyCreditsModal({
  packages,
  loading,
  error,
  onBuy,
  onClose,
}: {
  packages: CreditPackage[];
  loading: boolean;
  error: string | null;
  onBuy: (packageId: string) => void;
  onClose: () => void;
}) {
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-strong rounded-xl border border-border max-w-md w-full p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Coins size={24} className="text-primary" />
            Buy Credits
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-panel-light transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          {packages.length === 0 ? (
            <div className="text-center py-8 text-secondary">
              <Loader2 size={24} className="animate-spin mx-auto mb-2" />
              <p>Loading packages...</p>
            </div>
          ) : (
            packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => onBuy(pkg.id)}
                disabled={loading}
                className={`w-full p-4 rounded-lg border transition-all text-left ${
                  pkg.popular
                    ? 'border-primary bg-primary/10 hover:bg-primary/20'
                    : 'border-border hover:border-primary hover:bg-panel-light'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{pkg.name}</div>
                    <div className="text-sm text-secondary">
                      ${(pkg.amount / 100).toFixed(2)} USD
                    </div>
                  </div>
                  {pkg.popular && (
                    <span className="px-2 py-1 text-xs font-semibold bg-primary text-white rounded-full">
                      Popular
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-secondary text-center">
            Secure checkout powered by Stripe. Credits never expire.
          </p>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
            <div className="flex items-center gap-2 text-white">
              <Loader2 size={20} className="animate-spin" />
              <span>Redirecting to checkout...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
