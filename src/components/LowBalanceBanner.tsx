'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, Plus } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { fetchBalance } from '@/lib/haleyApi';
import { useRouter } from 'next/navigation';

export default function LowBalanceBanner() {
  const { user } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const check = async () => {
      try {
        const data = await fetchBalance(user.uid);
        setBalance(data.balance ?? null);
      } catch {
        // Silent fail - don't show banner if billing is unreachable
      }
    };

    check();
    const interval = setInterval(check, 60000); // Re-check every 60s
    return () => clearInterval(interval);
  }, [user?.uid]);

  // Don't show if: no balance data, balance is fine, or user dismissed
  if (balance === null || balance >= 1.0 || dismissed || !user) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] px-4 py-2 bg-yellow-600/90 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <AlertTriangle size={16} />
          <span>Low balance: ${balance.toFixed(2)} remaining.</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/billing')}
            className="flex items-center gap-1 px-3 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
          >
            <Plus size={14} /> Add Credits
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-white/20 text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
