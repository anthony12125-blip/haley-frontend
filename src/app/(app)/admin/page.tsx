'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { fetchAdminUsers, fetchAdminStats, fetchAdminUserDetail } from '@/lib/haleyApi';
import {
  Shield, Users, BarChart3, ArrowLeft, Loader2, DollarSign,
  Activity, ChevronRight, X, Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminUser {
  user_id: string;
  balance: number;
  total_spent: number;
  last_updated?: string;
  created_at?: string;
}

interface AdminStats {
  total_revenue: number;
  total_api_calls: number;
  total_users: number;
  total_input_tokens: number;
  total_output_tokens: number;
  usage_by_provider: Record<string, { calls: number; cost: number; input_tokens: number; output_tokens: number }>;
}

interface UserDetail {
  user_id: string;
  balance: { balance: number; total_spent: number };
  usage_history: Array<{
    id: string;
    provider: string;
    model?: string;
    input_tokens: number;
    output_tokens: number;
    cost: number;
    timestamp: string;
  }>;
  usage_count: number;
}

// Hardcoded admin UIDs - add your Firebase UIDs here
const ADMIN_UIDS = [
  // Add admin Firebase UIDs
];

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [usersData, statsData] = await Promise.all([
          fetchAdminUsers(),
          fetchAdminStats(),
        ]);
        setUsers(usersData.users || []);
        setStats(statsData);
      } catch (err) {
        console.error('[Admin] Load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUserClick = async (userId: string) => {
    setDetailLoading(true);
    try {
      const data = await fetchAdminUserDetail(userId);
      setSelectedUser(data);
    } catch (err) {
      console.error('[Admin] User detail error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const providerColor = (p: string) => {
    const colors: Record<string, string> = {
      gemini: 'text-green-400', claude: 'text-amber-400', gpt: 'text-emerald-400',
      perplexity: 'text-purple-400', grok: 'text-red-400', mistral: 'text-orange-400',
      llama: 'text-blue-400', haley: 'text-primary',
    };
    return colors[p.toLowerCase()] || 'text-secondary';
  };

  const formatDate = (ts?: string) => {
    if (!ts) return '-';
    try {
      return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/')} className="p-2 rounded-lg hover:bg-panel-light transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield size={28} className="text-primary" /> Admin Dashboard
            </h1>
            <p className="text-sm text-secondary mt-1">Platform stats and user management</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<DollarSign size={20} />}
              label="Total Revenue"
              value={`$${stats.total_revenue.toFixed(2)}`}
            />
            <StatCard
              icon={<Activity size={20} />}
              label="Total API Calls"
              value={stats.total_api_calls.toLocaleString()}
            />
            <StatCard
              icon={<Users size={20} />}
              label="Total Users"
              value={String(stats.total_users)}
            />
            <StatCard
              icon={<BarChart3 size={20} />}
              label="Total Tokens"
              value={(stats.total_input_tokens + stats.total_output_tokens).toLocaleString()}
            />
          </div>
        )}

        {/* Usage by Provider */}
        {stats?.usage_by_provider && Object.keys(stats.usage_by_provider).length > 0 && (
          <div className="glass-strong rounded-xl border border-border p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Usage by Provider</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(stats.usage_by_provider)
                .sort(([, a], [, b]) => b.calls - a.calls)
                .map(([provider, data]) => (
                  <div key={provider} className="p-4 rounded-lg bg-panel-light/50 border border-border">
                    <div className={`font-semibold capitalize mb-2 ${providerColor(provider)}`}>
                      {provider}
                    </div>
                    <div className="text-2xl font-bold">{data.calls}</div>
                    <div className="text-xs text-secondary">calls</div>
                    <div className="mt-2 text-sm text-secondary">
                      ${data.cost.toFixed(4)} spent
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="glass-strong rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users size={18} className="text-primary" /> All Users
          </h2>
          {users.length === 0 ? (
            <p className="text-center py-8 text-secondary">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-secondary border-b border-border">
                    <th className="pb-3 pr-4">User ID</th>
                    <th className="pb-3 pr-4 text-right">Balance</th>
                    <th className="pb-3 pr-4 text-right">Total Spent</th>
                    <th className="pb-3 pr-4">Last Active</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.user_id}
                      onClick={() => handleUserClick(u.user_id)}
                      className="border-b border-border/50 hover:bg-panel-light/30 cursor-pointer"
                    >
                      <td className="py-3 pr-4 font-mono text-xs">{u.user_id.slice(0, 20)}...</td>
                      <td className="py-3 pr-4 text-right font-medium text-primary">
                        ${(u.balance || 0).toFixed(2)}
                      </td>
                      <td className="py-3 pr-4 text-right">${(u.total_spent || 0).toFixed(2)}</td>
                      <td className="py-3 pr-4 text-secondary">{formatDate(u.last_updated)}</td>
                      <td className="py-3 text-right">
                        <ChevronRight size={16} className="text-secondary" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {(selectedUser || detailLoading) && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !detailLoading) setSelectedUser(null); }}
        >
          <div className="glass-strong rounded-xl border border-border max-w-2xl w-full p-6 relative max-h-[85vh] overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={28} className="animate-spin text-primary" />
              </div>
            ) : selectedUser && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold">User Detail</h2>
                  <button onClick={() => setSelectedUser(null)} className="p-2 rounded-lg hover:bg-panel-light transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-panel-light/50 border border-border">
                    <div className="text-sm text-secondary">Balance</div>
                    <div className="text-2xl font-bold text-primary">
                      ${(selectedUser.balance?.balance || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-panel-light/50 border border-border">
                    <div className="text-sm text-secondary">Total Spent</div>
                    <div className="text-2xl font-bold">
                      ${(selectedUser.balance?.total_spent || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mb-3 font-mono text-xs text-secondary break-all">
                  UID: {selectedUser.user_id}
                </div>

                <h3 className="font-semibold mb-3">Recent Usage ({selectedUser.usage_count} records)</h3>
                {selectedUser.usage_history.length === 0 ? (
                  <p className="text-center py-6 text-secondary">No usage records</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-secondary border-b border-border">
                          <th className="pb-2 pr-3">Date</th>
                          <th className="pb-2 pr-3">Provider</th>
                          <th className="pb-2 pr-3 text-right">Tokens</th>
                          <th className="pb-2 text-right">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.usage_history.slice(0, 25).map((row) => (
                          <tr key={row.id} className="border-b border-border/50">
                            <td className="py-2 pr-3 whitespace-nowrap text-xs">{formatDate(row.timestamp)}</td>
                            <td className={`py-2 pr-3 capitalize ${providerColor(row.provider)}`}>{row.provider}</td>
                            <td className="py-2 pr-3 text-right">{(row.input_tokens + row.output_tokens).toLocaleString()}</td>
                            <td className="py-2 text-right">${row.cost.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-strong rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 text-secondary mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
