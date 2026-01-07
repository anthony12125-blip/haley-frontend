'use client';

import { useState } from 'react';
import { X, Coins, Sparkles, Zap, Crown, Info } from 'lucide-react';

interface BuyTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onPurchase?: (packageId: string) => void;
}

interface TokenPackage {
  id: string;
  price: number;
  tokens: number;
  label?: string;
}

interface ProviderCost {
  name: string;
  tokens: number;
  color: string;
}

const TOKEN_PACKAGES: TokenPackage[] = [
  { id: 'starter', price: 10, tokens: 10000, label: 'Popular' },
  { id: 'standard', price: 20, tokens: 20000 },
  { id: 'value', price: 50, tokens: 50000, label: 'Best Value' },
];

const PROVIDER_COSTS: ProviderCost[] = [
  { name: 'Gemini', tokens: 1, color: 'text-green-400' },
  { name: 'Llama', tokens: 3, color: 'text-blue-400' },
  { name: 'Perplexity', tokens: 5, color: 'text-purple-400' },
  { name: 'Mistral', tokens: 8, color: 'text-orange-400' },
  { name: 'Claude', tokens: 15, color: 'text-amber-400' },
  { name: 'GPT', tokens: 15, color: 'text-emerald-400' },
  { name: 'Grok', tokens: 15, color: 'text-red-400' },
];

export default function BuyTokensModal({
  isOpen,
  onClose,
  currentBalance,
  onPurchase,
}: BuyTokensModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setIsProcessing(true);

    // Stripe placeholder - will integrate with actual Stripe checkout
    console.log('[BuyTokensModal] Initiating purchase for package:', selectedPackage);

    if (onPurchase) {
      onPurchase(selectedPackage);
    } else {
      // Placeholder: show coming soon message
      setTimeout(() => {
        alert('Stripe checkout coming soon! Package: ' + selectedPackage);
        setIsProcessing(false);
      }, 1000);
    }
  };

  const formatTokens = (tokens: number) => {
    return tokens.toLocaleString();
  };

  const getPackageIcon = (id: string) => {
    switch (id) {
      case 'starter': return <Zap size={24} />;
      case 'standard': return <Sparkles size={24} />;
      case 'value': return <Crown size={24} />;
      default: return <Coins size={24} />;
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

        {/* Purchase Options */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-text-primary">Select a Package</h3>
          {TOKEN_PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left relative ${
                selectedPackage === pkg.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-panel-light'
              }`}
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
          onClick={handlePurchase}
          disabled={!selectedPackage || isProcessing}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            selectedPackage && !isProcessing
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-panel-medium text-secondary cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
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
