'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, Target,
  BarChart3, PieChart, Zap, AlertTriangle, CheckCircle,
  RefreshCw, Plus, Activity, Layers, X, Upload, FileSpreadsheet,
  Settings, Trash2, Edit2, Save, Check, AlertCircle, Wand2
} from 'lucide-react';
import AtlasOnboarding from './AtlasOnboarding';

interface AtlasProps {
  onBack: () => void;
}

type Tab = 'overview' | 'channels' | 'budget' | 'directives' | 'campaigns';

interface ChannelScore {
  channel: string;
  score: number;
  cac: number;
  roas: number;
  conversions: number;
  spend: number;
  recommendation: string;
  trend: 'up' | 'down' | 'stable';
}

interface Directive {
  campaign_id: string;
  campaign_name: string;
  action: 'kill' | 'scale' | 'hold' | 'test';
  reason: string;
  confidence: number;
  impact: string;
}

interface BudgetAllocation {
  channel: string;
  current_spend: number;
  recommended_spend: number;
  delta: number;
  delta_pct: number;
}

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  spend: number;
  conversions: number;
  revenue: number;
  cac: number;
  roas: number;
}

interface Goals {
  targetCac: number | null;
  minRoas: number | null;
  conversionGoal: number | null;
  budgetCap: number | null;
}

interface AnalysisResult {
  channels: ChannelScore[];
  directives: Directive[];
  budget: BudgetAllocation[];
  summary: {
    total_spend: number;
    total_conversions: number;
    avg_cac: number;
    avg_roas: number;
  };
}

interface CsvColumn {
  header: string;
  index: number;
}

interface ColumnMapping {
  name: number | null;
  platform: number | null;
  spend: number | null;
  conversions: number | null;
  revenue: number | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const PLATFORMS = [
  'Google Ads',
  'Meta Ads',
  'TikTok Ads',
  'LinkedIn Ads',
  'Twitter Ads',
  'Snapchat Ads',
  'Pinterest Ads',
  'Microsoft Ads',
  'Amazon Ads',
  'Other',
];

const getUserId = () => {
  if (typeof window === 'undefined') return 'anonymous';
  let userId = localStorage.getItem('haley_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('haley_user_id', userId);
  }
  return userId;
};

export default function Atlas({ onBack }: AtlasProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Goals state
  const [goals, setGoals] = useState<Goals>({
    targetCac: null,
    minRoas: null,
    conversionGoal: null,
    budgetCap: null,
  });
  const [goalsEditing, setGoalsEditing] = useState(false);
  const [goalsDraft, setGoalsDraft] = useState<Goals>(goals);

  // Add Campaign Modal
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    platform: 'Google Ads',
    spend: '',
    conversions: '',
    revenue: '',
  });

  // CSV Import
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvColumns, setCsvColumns] = useState<CsvColumn[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    name: null,
    platform: null,
    spend: null,
    conversions: null,
    revenue: null,
  });
  const [importPreview, setImportPreview] = useState<Partial<Campaign>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Budget editing
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState<BudgetAllocation[]>([]);

  const businessId = getUserId();

  // Check if goals are configured
  const hasGoals = goals.targetCac !== null || goals.minRoas !== null ||
                   goals.conversionGoal !== null || goals.budgetCap !== null;

  // Fetch goals
  const fetchGoals = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/atlas/${businessId}/goals`);
      if (response.ok) {
        const data = await response.json();
        setGoals({
          targetCac: data.target_cac ?? null,
          minRoas: data.min_roas ?? null,
          conversionGoal: data.conversion_goal ?? null,
          budgetCap: data.budget_cap ?? null,
        });
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
    }
  }, [businessId]);

  // Save goals
  const saveGoals = async () => {
    try {
      const response = await fetch(`${API_BASE}/atlas/${businessId}/goals`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_cac: goalsDraft.targetCac,
          min_roas: goalsDraft.minRoas,
          conversion_goal: goalsDraft.conversionGoal,
          budget_cap: goalsDraft.budgetCap,
        }),
      });
      if (!response.ok) throw new Error('Failed to save goals');
      setGoals(goalsDraft);
      setGoalsEditing(false);
      setSuccess('Goals saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goals');
    }
  };

  // Fetch analysis data
  const fetchAnalysis = useCallback(async () => {
    if (campaigns.length === 0) {
      setError('Add campaigns before running analysis');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/atlas/${businessId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals }),
      });
      if (!response.ok) throw new Error('Failed to run analysis');
      const data = await response.json();
      setAnalysis(data);
      setSuccess('Analysis complete!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [businessId, campaigns.length, goals]);

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/atlas/${businessId}/campaigns`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
  }, [businessId]);

  // Add campaign
  const addCampaign = async () => {
    if (!campaignForm.name || !campaignForm.spend || !campaignForm.conversions) {
      setError('Please fill in required fields');
      return;
    }

    const spend = parseFloat(campaignForm.spend);
    const conversions = parseInt(campaignForm.conversions);
    const revenue = campaignForm.revenue ? parseFloat(campaignForm.revenue) : 0;

    try {
      const response = await fetch(`${API_BASE}/atlas/${businessId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignForm.name,
          platform: campaignForm.platform,
          spend,
          conversions,
          revenue,
          cac: conversions > 0 ? spend / conversions : 0,
          roas: spend > 0 && revenue > 0 ? revenue / spend : 0,
        }),
      });
      if (!response.ok) throw new Error('Failed to add campaign');
      const newCampaign = await response.json();
      setCampaigns(prev => [...prev, newCampaign]);
      setShowAddCampaign(false);
      setCampaignForm({ name: '', platform: 'Google Ads', spend: '', conversions: '', revenue: '' });
      setSuccess('Campaign added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add campaign');
    }
  };

  // Delete campaign
  const deleteCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`${API_BASE}/atlas/${businessId}/campaigns/${campaignId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete campaign');
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      setSuccess('Campaign deleted');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete campaign');
    }
  };

  // Handle CSV file upload
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const parsed = lines.map(line => {
        // Handle quoted values with commas
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      });

      if (parsed.length > 0) {
        const headers = parsed[0];
        setCsvColumns(headers.map((h, i) => ({ header: h, index: i })));
        setCsvData(parsed);

        // Auto-detect column mappings
        const autoMapping: ColumnMapping = { name: null, platform: null, spend: null, conversions: null, revenue: null };
        headers.forEach((h, i) => {
          const lower = h.toLowerCase();
          if (lower.includes('name') || lower.includes('campaign')) autoMapping.name = i;
          if (lower.includes('platform') || lower.includes('source') || lower.includes('channel')) autoMapping.platform = i;
          if (lower.includes('spend') || lower.includes('cost') || lower.includes('budget')) autoMapping.spend = i;
          if (lower.includes('conversion') || lower.includes('conv')) autoMapping.conversions = i;
          if (lower.includes('revenue') || lower.includes('value') || lower.includes('sales')) autoMapping.revenue = i;
        });
        setColumnMapping(autoMapping);
        setShowCsvImport(true);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Generate import preview
  useEffect(() => {
    if (csvData.length > 1 && columnMapping.name !== null) {
      const preview = csvData.slice(1, 6).map(row => ({
        name: columnMapping.name !== null ? row[columnMapping.name] : '',
        platform: columnMapping.platform !== null ? row[columnMapping.platform] : 'Other',
        spend: columnMapping.spend !== null ? parseFloat(row[columnMapping.spend]) || 0 : 0,
        conversions: columnMapping.conversions !== null ? parseInt(row[columnMapping.conversions]) || 0 : 0,
        revenue: columnMapping.revenue !== null ? parseFloat(row[columnMapping.revenue]) || 0 : 0,
      }));
      setImportPreview(preview);
    }
  }, [csvData, columnMapping]);

  // Import CSV campaigns
  const importCsvCampaigns = async () => {
    if (columnMapping.name === null) {
      setError('Campaign Name column is required');
      return;
    }

    const campaignsToImport = csvData.slice(1).map(row => {
      const spend = columnMapping.spend !== null ? parseFloat(row[columnMapping.spend]) || 0 : 0;
      const conversions = columnMapping.conversions !== null ? parseInt(row[columnMapping.conversions]) || 0 : 0;
      const revenue = columnMapping.revenue !== null ? parseFloat(row[columnMapping.revenue]) || 0 : 0;

      return {
        name: columnMapping.name !== null ? row[columnMapping.name] : '',
        platform: columnMapping.platform !== null ? row[columnMapping.platform] : 'Other',
        spend,
        conversions,
        revenue,
        cac: conversions > 0 ? spend / conversions : 0,
        roas: spend > 0 && revenue > 0 ? revenue / spend : 0,
      };
    }).filter(c => c.name);

    try {
      const response = await fetch(`${API_BASE}/atlas/${businessId}/campaigns/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaigns: campaignsToImport }),
      });
      if (!response.ok) throw new Error('Failed to import campaigns');
      const data = await response.json();
      setCampaigns(prev => [...prev, ...(data.campaigns || [])]);
      setShowCsvImport(false);
      setCsvData([]);
      setCsvColumns([]);
      setColumnMapping({ name: null, platform: null, spend: null, conversions: null, revenue: null });
      setSuccess(`Imported ${campaignsToImport.length} campaigns`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import campaigns');
    }
  };

  // Apply budget recommendations
  const applyBudgetRecommendations = async () => {
    if (!analysis?.budget) return;

    try {
      const response = await fetch(`${API_BASE}/atlas/${businessId}/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocations: editingBudget ? budgetDraft : analysis.budget,
        }),
      });
      if (!response.ok) throw new Error('Failed to apply budget changes');
      setEditingBudget(false);
      setSuccess('Budget allocations updated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply budget changes');
    }
  };

  // Check if onboarding is needed
  const checkOnboardingNeeded = useCallback(async () => {
    try {
      // Check if business has been configured with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const configResponse = await fetch(`${API_BASE}/atlas/${businessId}/config`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const hasConfig = configResponse.ok;

      // If no config exists, show onboarding
      if (!hasConfig) {
        setShowOnboarding(true);
        setInitialLoadComplete(true);
        return;
      }

      // Config exists, don't show onboarding
      setShowOnboarding(false);
      setInitialLoadComplete(true);
    } catch (err) {
      // On error (including timeout), default to showing onboarding
      console.error('Error checking onboarding status:', err);
      setShowOnboarding(true);
      setInitialLoadComplete(true);
    }
  }, [businessId]);

  useEffect(() => {
    checkOnboardingNeeded();
  }, [checkOnboardingNeeded]);

  useEffect(() => {
    if (showOnboarding === false) {
      fetchCampaigns();
      fetchGoals();
    }
  }, [showOnboarding, fetchCampaigns, fetchGoals]);

  useEffect(() => {
    if (analysis?.budget) {
      setBudgetDraft([...analysis.budget]);
    }
  }, [analysis?.budget]);

  // Handle onboarding completion
  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    fetchCampaigns();
    fetchGoals();
  }, [fetchCampaigns, fetchGoals]);

  // Re-run onboarding / setup wizard
  const startSetupWizard = () => {
    // Clear the atlas_onboarding_progress from localStorage to start fresh
    localStorage.removeItem('atlas_onboarding_progress');
    setShowOnboarding(true);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={18} /> },
    { id: 'campaigns', label: 'Campaigns', icon: <Activity size={18} /> },
    { id: 'channels', label: 'Channels', icon: <Layers size={18} /> },
    { id: 'directives', label: 'Directives', icon: <Zap size={18} /> },
    { id: 'budget', label: 'Budget', icon: <DollarSign size={18} /> },
  ];

  const getActionColor = (action: string) => {
    switch (action) {
      case 'kill': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'scale': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'hold': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'test': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-text-secondary bg-panel-light border-border';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'kill': return <AlertTriangle size={16} />;
      case 'scale': return <TrendingUp size={16} />;
      case 'hold': return <CheckCircle size={16} />;
      case 'test': return <Target size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Show loading while checking onboarding status
  if (!initialLoadComplete) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-panel-dark items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-text-secondary">Loading Atlas...</p>
      </div>
    );
  }

  // Show onboarding if needed
  if (showOnboarding) {
    return <AtlasOnboarding businessId={businessId} onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-panel-dark">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-panel-light transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">🗺️</span> Atlas
            </h1>
            <p className="text-sm text-text-secondary">Marketing Optimization Agent</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startSetupWizard}
            className="flex items-center gap-2 px-3 py-2 text-text-secondary hover:bg-panel-light rounded-lg transition-colors"
            title="Re-run setup wizard"
          >
            <Wand2 size={16} />
            <span className="hidden sm:inline">Setup</span>
          </button>
          <button
            onClick={fetchAnalysis}
            disabled={loading || campaigns.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </header>

      {/* Notifications */}
      <AnimatePresence>
        {(error || success) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 ${
              error
                ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                : 'bg-green-500/20 border border-green-500/50 text-green-400'
            }`}
          >
            {error ? <AlertCircle size={18} /> : <Check size={18} />}
            <span className="flex-1">{error || success}</span>
            <button onClick={() => { setError(null); setSuccess(null); }}>
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 p-2 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-panel-light text-text-secondary'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'campaigns' && campaigns.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-panel-dark/20 rounded-full">
                {campaigns.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Goals Configuration */}
            <div className="bg-panel-dark rounded-xl border border-border">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Target size={18} /> Marketing Goals
                </h2>
                {!goalsEditing ? (
                  <button
                    onClick={() => { setGoalsDraft(goals); setGoalsEditing(true); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-panel-light hover:bg-panel-lighter rounded-lg transition-colors"
                  >
                    <Edit2 size={14} /> {hasGoals ? 'Edit' : 'Set Goals'}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setGoalsEditing(false)}
                      className="px-3 py-1.5 text-sm text-text-secondary hover:bg-panel-light rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveGoals}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Save size={14} /> Save
                    </button>
                  </div>
                )}
              </div>

              {goalsEditing ? (
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Target CAC</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                      <input
                        type="number"
                        value={goalsDraft.targetCac ?? ''}
                        onChange={(e) => setGoalsDraft(prev => ({ ...prev, targetCac: e.target.value ? parseFloat(e.target.value) : null }))}
                        placeholder="50"
                        className="w-full pl-7 pr-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Min ROAS</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={goalsDraft.minRoas ?? ''}
                        onChange={(e) => setGoalsDraft(prev => ({ ...prev, minRoas: e.target.value ? parseFloat(e.target.value) : null }))}
                        placeholder="3.0"
                        className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">x</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Monthly Conversions Goal</label>
                    <input
                      type="number"
                      value={goalsDraft.conversionGoal ?? ''}
                      onChange={(e) => setGoalsDraft(prev => ({ ...prev, conversionGoal: e.target.value ? parseInt(e.target.value) : null }))}
                      placeholder="100"
                      className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Budget Cap</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                      <input
                        type="number"
                        value={goalsDraft.budgetCap ?? ''}
                        onChange={(e) => setGoalsDraft(prev => ({ ...prev, budgetCap: e.target.value ? parseFloat(e.target.value) : null }))}
                        placeholder="10000"
                        className="w-full pl-7 pr-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                </div>
              ) : hasGoals ? (
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-text-secondary">Target CAC</p>
                    <p className="text-lg font-semibold">{goals.targetCac ? formatCurrency(goals.targetCac) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Min ROAS</p>
                    <p className="text-lg font-semibold">{goals.minRoas ? `${goals.minRoas}x` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Conversion Goal</p>
                    <p className="text-lg font-semibold">{goals.conversionGoal ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Budget Cap</p>
                    <p className="text-lg font-semibold">{goals.budgetCap ? formatCurrency(goals.budgetCap) : '—'}</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-text-secondary">
                  <Settings size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Set your marketing goals to get personalized recommendations</p>
                </div>
              )}
            </div>

            {/* Empty state when no campaigns */}
            {campaigns.length === 0 ? (
              <div className="bg-panel-dark rounded-xl border border-border p-12 text-center">
                <Activity size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Campaigns Yet</h3>
                <p className="text-text-secondary mb-6 max-w-md mx-auto">
                  Add your campaign data to start getting AI-powered kill/scale/hold recommendations and budget optimization.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowAddCampaign(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus size={18} /> Add Campaign
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-panel-light hover:bg-panel-lighter rounded-lg transition-colors"
                  >
                    <Upload size={18} /> Import CSV
                  </button>
                </div>
              </div>
            ) : !analysis ? (
              /* Has campaigns but no analysis */
              <div className="bg-panel-dark rounded-xl border border-border p-12 text-center">
                <BarChart3 size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
                <p className="text-text-secondary mb-6 max-w-md mx-auto">
                  You have {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} loaded.
                  Click "Run Analysis" to get kill/scale/hold directives and budget recommendations.
                </p>
                <button
                  onClick={fetchAnalysis}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mx-auto"
                >
                  <Zap size={18} />
                  {loading ? 'Analyzing...' : 'Run Analysis Now'}
                </button>
              </div>
            ) : (
              /* Analysis results */
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-panel-dark rounded-xl border border-border">
                    <p className="text-sm text-text-secondary mb-1">Total Spend</p>
                    <p className="text-2xl font-bold">{formatCurrency(analysis.summary.total_spend)}</p>
                    {goals.budgetCap && (
                      <p className={`text-xs mt-1 ${analysis.summary.total_spend > goals.budgetCap ? 'text-red-400' : 'text-green-400'}`}>
                        {analysis.summary.total_spend <= goals.budgetCap ? 'Under' : 'Over'} budget cap
                      </p>
                    )}
                  </div>
                  <div className="p-4 bg-panel-dark rounded-xl border border-border">
                    <p className="text-sm text-text-secondary mb-1">Conversions</p>
                    <p className="text-2xl font-bold">{analysis.summary.total_conversions}</p>
                    {goals.conversionGoal && (
                      <p className={`text-xs mt-1 ${analysis.summary.total_conversions >= goals.conversionGoal ? 'text-green-400' : 'text-yellow-400'}`}>
                        {((analysis.summary.total_conversions / goals.conversionGoal) * 100).toFixed(0)}% of goal
                      </p>
                    )}
                  </div>
                  <div className="p-4 bg-panel-dark rounded-xl border border-border">
                    <p className="text-sm text-text-secondary mb-1">Avg CAC</p>
                    <p className="text-2xl font-bold">{formatCurrency(analysis.summary.avg_cac)}</p>
                    {goals.targetCac && (
                      <p className={`text-xs mt-1 ${analysis.summary.avg_cac <= goals.targetCac ? 'text-green-400' : 'text-red-400'}`}>
                        Target: {formatCurrency(goals.targetCac)}
                      </p>
                    )}
                  </div>
                  <div className="p-4 bg-panel-dark rounded-xl border border-border">
                    <p className="text-sm text-text-secondary mb-1">Avg ROAS</p>
                    <p className="text-2xl font-bold">{analysis.summary.avg_roas.toFixed(2)}x</p>
                    {goals.minRoas && (
                      <p className={`text-xs mt-1 ${analysis.summary.avg_roas >= goals.minRoas ? 'text-green-400' : 'text-red-400'}`}>
                        Min: {goals.minRoas}x
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Directives */}
                {analysis.directives && analysis.directives.length > 0 && (
                  <div className="bg-panel-dark rounded-xl border border-border">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <h2 className="font-semibold flex items-center gap-2">
                        <Zap size={18} /> Quick Actions
                      </h2>
                      <button
                        onClick={() => setActiveTab('directives')}
                        className="text-sm text-primary hover:underline"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="divide-y divide-border">
                      {analysis.directives.slice(0, 3).map((directive, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`p-2 rounded-lg border ${getActionColor(directive.action)}`}>
                              {getActionIcon(directive.action)}
                            </span>
                            <div>
                              <p className="font-medium">{directive.campaign_name}</p>
                              <p className="text-sm text-text-secondary">{directive.reason}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase border ${getActionColor(directive.action)}`}>
                            {directive.action}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddCampaign(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus size={18} /> Add Campaign
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-panel-light hover:bg-panel-lighter rounded-lg transition-colors"
              >
                <Upload size={18} /> Import CSV
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
              />
            </div>

            {campaigns.length > 0 ? (
              <div className="bg-panel-dark rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-panel-light">
                    <tr>
                      <th className="text-left p-4">Campaign</th>
                      <th className="text-left p-4">Platform</th>
                      <th className="text-right p-4">Spend</th>
                      <th className="text-right p-4">Conv.</th>
                      <th className="text-right p-4">CAC</th>
                      <th className="text-right p-4">ROAS</th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-panel-light/50">
                        <td className="p-4">
                          <p className="font-medium">{campaign.name}</p>
                        </td>
                        <td className="p-4 text-text-secondary">{campaign.platform}</td>
                        <td className="p-4 text-right">{formatCurrency(campaign.spend)}</td>
                        <td className="p-4 text-right">{campaign.conversions}</td>
                        <td className="p-4 text-right">
                          <span className={goals.targetCac && campaign.cac > goals.targetCac ? 'text-red-400' : ''}>
                            {formatCurrency(campaign.cac)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className={goals.minRoas && campaign.roas < goals.minRoas ? 'text-red-400' : ''}>
                            {campaign.roas.toFixed(2)}x
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => deleteCampaign(campaign.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-text-secondary bg-panel-dark rounded-xl border border-border">
                <Activity size={48} className="mx-auto mb-4 opacity-50" />
                <p className="mb-2">No campaigns yet</p>
                <p className="text-sm">Add campaigns manually or import a CSV file to get started</p>
              </div>
            )}
          </div>
        )}

        {/* Channels Tab */}
        {activeTab === 'channels' && (
          <div className="space-y-4">
            {analysis?.channels && analysis.channels.length > 0 ? (
              analysis.channels.map((channel, idx) => (
                <div key={idx} className="p-4 bg-panel-dark rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">{channel.channel}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        channel.score >= 70 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        channel.score >= 40 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        Score: {channel.score}
                      </span>
                      {channel.trend === 'up' && <TrendingUp size={18} className="text-green-400" />}
                      {channel.trend === 'down' && <TrendingDown size={18} className="text-red-400" />}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-text-secondary">Spend</p>
                      <p className="font-semibold">{formatCurrency(channel.spend)}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary">Conversions</p>
                      <p className="font-semibold">{channel.conversions}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary">CAC</p>
                      <p className="font-semibold">{formatCurrency(channel.cac)}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary">ROAS</p>
                      <p className="font-semibold">{channel.roas.toFixed(2)}x</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-text-secondary">{channel.recommendation}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-text-secondary bg-panel-dark rounded-xl border border-border">
                <Layers size={48} className="mx-auto mb-4 opacity-50" />
                <p className="mb-2">No channel data yet</p>
                <p className="text-sm">Add campaigns and run analysis to see channel performance scores</p>
              </div>
            )}
          </div>
        )}

        {/* Directives Tab */}
        {activeTab === 'directives' && (
          <div className="space-y-4">
            {analysis?.directives && analysis.directives.length > 0 ? (
              <>
                {/* Summary badges */}
                <div className="flex gap-4 mb-6">
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <AlertTriangle size={18} className="text-red-400" />
                    <span className="font-semibold text-red-400">
                      {analysis.directives.filter(d => d.action === 'kill').length} KILL
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <TrendingUp size={18} className="text-green-400" />
                    <span className="font-semibold text-green-400">
                      {analysis.directives.filter(d => d.action === 'scale').length} SCALE
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <CheckCircle size={18} className="text-yellow-400" />
                    <span className="font-semibold text-yellow-400">
                      {analysis.directives.filter(d => d.action === 'hold').length} HOLD
                    </span>
                  </div>
                </div>

                {analysis.directives.map((directive, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 bg-panel-dark rounded-xl border border-border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className={`p-3 rounded-lg border ${getActionColor(directive.action)}`}>
                          {getActionIcon(directive.action)}
                        </span>
                        <div>
                          <p className="font-semibold text-lg">{directive.campaign_name}</p>
                          <p className="text-text-secondary mt-1">{directive.reason}</p>
                          <p className="text-sm text-text-secondary mt-2">
                            <strong>Projected Impact:</strong> {directive.impact}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-4 py-2 rounded-lg text-sm font-bold uppercase border ${getActionColor(directive.action)}`}>
                          {directive.action}
                        </span>
                        <p className="text-sm text-text-secondary mt-2">
                          {(directive.confidence * 100).toFixed(0)}% confidence
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            ) : (
              <div className="text-center py-12 text-text-secondary bg-panel-dark rounded-xl border border-border">
                <Zap size={48} className="mx-auto mb-4 opacity-50" />
                <p className="mb-2">No directives yet</p>
                <p className="text-sm">Add campaigns and run analysis to get kill/scale/hold recommendations</p>
              </div>
            )}
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <div className="space-y-4">
            {analysis?.budget && analysis.budget.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold">Budget Reallocation</h2>
                  <div className="flex gap-2">
                    {editingBudget ? (
                      <>
                        <button
                          onClick={() => { setBudgetDraft([...analysis.budget]); setEditingBudget(false); }}
                          className="px-3 py-1.5 text-sm text-text-secondary hover:bg-panel-light rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={applyBudgetRecommendations}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          <Check size={14} /> Apply Changes
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingBudget(true)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-panel-light hover:bg-panel-lighter rounded-lg transition-colors"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          onClick={applyBudgetRecommendations}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Check size={14} /> Apply Recommendations
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-panel-dark rounded-xl border border-border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-panel-light">
                      <tr>
                        <th className="text-left p-4">Channel</th>
                        <th className="text-right p-4">Current</th>
                        <th className="text-right p-4">Recommended</th>
                        <th className="text-right p-4">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(editingBudget ? budgetDraft : analysis.budget).map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-4 font-medium">{item.channel}</td>
                          <td className="p-4 text-right">
                            {editingBudget ? (
                              <input
                                type="number"
                                value={budgetDraft[idx]?.current_spend || 0}
                                onChange={(e) => {
                                  const newDraft = [...budgetDraft];
                                  newDraft[idx] = {
                                    ...newDraft[idx],
                                    current_spend: parseFloat(e.target.value) || 0,
                                  };
                                  setBudgetDraft(newDraft);
                                }}
                                className="w-24 px-2 py-1 text-right bg-panel-dark border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                            ) : (
                              formatCurrency(item.current_spend)
                            )}
                          </td>
                          <td className="p-4 text-right">{formatCurrency(item.recommended_spend)}</td>
                          <td className={`p-4 text-right font-semibold ${
                            item.delta > 0 ? 'text-green-400' : item.delta < 0 ? 'text-red-400' : ''
                          }`}>
                            {formatPercent(item.delta_pct)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-panel-light rounded-xl border border-border">
                  <h3 className="font-medium mb-2">Summary</h3>
                  <p className="text-sm text-text-secondary">
                    Total current spend: {formatCurrency(analysis.budget.reduce((sum, b) => sum + b.current_spend, 0))}
                    {' → '}
                    Recommended: {formatCurrency(analysis.budget.reduce((sum, b) => sum + b.recommended_spend, 0))}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-text-secondary bg-panel-dark rounded-xl border border-border">
                <PieChart size={48} className="mx-auto mb-4 opacity-50" />
                <p className="mb-2">No budget recommendations yet</p>
                <p className="text-sm">Add campaigns and run analysis to see budget optimization suggestions</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Campaign Modal */}
      <AnimatePresence>
        {showAddCampaign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddCampaign(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-panel-dark border border-border rounded-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-lg">Add Campaign</h2>
                <button
                  onClick={() => setShowAddCampaign(false)}
                  className="p-2 hover:bg-panel-light rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Campaign Name *</label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Summer Sale 2024"
                    className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Platform</label>
                  <select
                    value={campaignForm.platform}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, platform: e.target.value }))}
                    className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {PLATFORMS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Spend *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                      <input
                        type="number"
                        value={campaignForm.spend}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, spend: e.target.value }))}
                        placeholder="5000"
                        className="w-full pl-7 pr-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Conversions *</label>
                    <input
                      type="number"
                      value={campaignForm.conversions}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, conversions: e.target.value }))}
                      placeholder="50"
                      className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Revenue (optional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                    <input
                      type="number"
                      value={campaignForm.revenue}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, revenue: e.target.value }))}
                      placeholder="15000"
                      className="w-full pl-7 pr-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <p className="text-xs text-text-secondary mt-1">Used to calculate ROAS</p>
                </div>
              </div>
              <div className="p-4 border-t border-border flex justify-end gap-3">
                <button
                  onClick={() => setShowAddCampaign(false)}
                  className="px-4 py-2 text-text-secondary hover:bg-panel-light rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addCampaign}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus size={16} /> Add Campaign
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSV Import Modal */}
      <AnimatePresence>
        {showCsvImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCsvImport(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-panel-dark border border-border rounded-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <FileSpreadsheet size={20} /> Import CSV
                </h2>
                <button
                  onClick={() => setShowCsvImport(false)}
                  className="p-2 hover:bg-panel-light rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <p className="text-sm text-text-secondary">
                  Map your CSV columns to campaign fields. Only Campaign Name is required.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Campaign Name *</label>
                    <select
                      value={columnMapping.name ?? ''}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, name: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Select column</option>
                      {csvColumns.map(col => (
                        <option key={col.index} value={col.index}>{col.header}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Platform</label>
                    <select
                      value={columnMapping.platform ?? ''}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, platform: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Select column</option>
                      {csvColumns.map(col => (
                        <option key={col.index} value={col.index}>{col.header}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Spend</label>
                    <select
                      value={columnMapping.spend ?? ''}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, spend: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Select column</option>
                      {csvColumns.map(col => (
                        <option key={col.index} value={col.index}>{col.header}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Conversions</label>
                    <select
                      value={columnMapping.conversions ?? ''}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, conversions: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Select column</option>
                      {csvColumns.map(col => (
                        <option key={col.index} value={col.index}>{col.header}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Revenue</label>
                    <select
                      value={columnMapping.revenue ?? ''}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, revenue: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Select column</option>
                      {csvColumns.map(col => (
                        <option key={col.index} value={col.index}>{col.header}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preview */}
                {importPreview.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Preview (first 5 rows)</h3>
                    <div className="bg-panel-dark rounded-lg border border-border overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-panel-light">
                          <tr>
                            <th className="text-left p-2">Name</th>
                            <th className="text-left p-2">Platform</th>
                            <th className="text-right p-2">Spend</th>
                            <th className="text-right p-2">Conv.</th>
                            <th className="text-right p-2">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {importPreview.map((row, idx) => (
                            <tr key={idx}>
                              <td className="p-2">{row.name || '—'}</td>
                              <td className="p-2 text-text-secondary">{row.platform || '—'}</td>
                              <td className="p-2 text-right">{row.spend ? formatCurrency(row.spend) : '—'}</td>
                              <td className="p-2 text-right">{row.conversions ?? '—'}</td>
                              <td className="p-2 text-right">{row.revenue ? formatCurrency(row.revenue) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-text-secondary mt-2">
                      {csvData.length - 1} total rows to import
                    </p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-border flex justify-end gap-3">
                <button
                  onClick={() => setShowCsvImport(false)}
                  className="px-4 py-2 text-text-secondary hover:bg-panel-light rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={importCsvCampaigns}
                  disabled={columnMapping.name === null}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Upload size={16} /> Import {csvData.length - 1} Campaigns
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
