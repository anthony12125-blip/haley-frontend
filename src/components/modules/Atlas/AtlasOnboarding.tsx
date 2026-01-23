'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Check, Building2, Target, BarChart3,
  Lightbulb, Rocket, Plus, Trash2, Upload, FileSpreadsheet,
  DollarSign, Users, TrendingUp, AlertCircle, Sparkles, X
} from 'lucide-react';

interface AtlasOnboardingProps {
  onComplete: () => void;
  businessId: string;
}

interface BusinessInfo {
  name: string;
  industry: string;
  yearsInBusiness: string;
  avgCustomerValue: string;
  profitMargin: number | null;
  profitMarginUnknown: boolean;
}

interface MarketingInfo {
  runningAds: boolean | null;
  platforms: string[];
  monthlySpend: string;
  conversionTracking: string[];
  conversionDefinition: string;
}

interface GoalsInfo {
  primaryGoal: string;
  targetCac: string;
  targetRoas: string;
  monthlyCustomerGoal: string;
  maxBudget: string;
}

interface CampaignEntry {
  id: string;
  name: string;
  platform: string;
  spend: string;
  clicks: string;
  conversions: string;
}

interface OnboardingData {
  business: BusinessInfo;
  marketing: MarketingInfo;
  goals: GoalsInfo;
  campaigns: CampaignEntry[];
  campaignImportMethod: 'manual' | 'csv' | 'skip' | null;
  currentStep: number;
}

const STORAGE_KEY = 'atlas_onboarding_progress';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const INDUSTRIES = [
  { value: 'home_services', label: 'Home Services (Plumbing, HVAC, etc.)' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'legal', label: 'Legal' },
  { value: 'restaurant', label: 'Restaurant / Food' },
  { value: 'retail', label: 'Retail / E-commerce' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'saas', label: 'SaaS / Tech' },
  { value: 'education', label: 'Education' },
  { value: 'fitness', label: 'Fitness / Wellness' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'other', label: 'Other' },
];

const YEARS_OPTIONS = [
  { value: 'less_than_1', label: 'Less than 1 year' },
  { value: '1_3', label: '1-3 years' },
  { value: '3_5', label: '3-5 years' },
  { value: '5_plus', label: '5+ years' },
];

const PLATFORMS = [
  { value: 'google', label: 'Google Ads' },
  { value: 'meta', label: 'Facebook / Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
];

const SPEND_RANGES = [
  { value: 'none', label: 'Not yet' },
  { value: 'under_500', label: 'Under $500' },
  { value: '500_2000', label: '$500 - $2,000' },
  { value: '2000_5000', label: '$2,000 - $5,000' },
  { value: '5000_10000', label: '$5,000 - $10,000' },
  { value: '10000_plus', label: '$10,000+' },
];

const TRACKING_METHODS = [
  { value: 'phone', label: 'Phone calls' },
  { value: 'forms', label: 'Form submissions' },
  { value: 'ecommerce', label: 'E-commerce sales' },
  { value: 'appointments', label: 'Appointments booked' },
  { value: 'unsure', label: "I'm not sure" },
];

const PRIMARY_GOALS = [
  { value: 'more_leads', label: 'Get more leads' },
  { value: 'reduce_costs', label: 'Reduce ad costs' },
  { value: 'scale', label: "Scale what's working" },
  { value: 'figure_out', label: 'Figure out what works' },
  { value: 'all', label: 'All of the above' },
];

const INDUSTRY_BENCHMARKS: Record<string, { minCac: number; maxCac: number }> = {
  home_services: { minCac: 30, maxCac: 80 },
  healthcare: { minCac: 50, maxCac: 150 },
  legal: { minCac: 100, maxCac: 300 },
  restaurant: { minCac: 10, maxCac: 30 },
  retail: { minCac: 15, maxCac: 50 },
  real_estate: { minCac: 50, maxCac: 200 },
  professional_services: { minCac: 40, maxCac: 120 },
  saas: { minCac: 100, maxCac: 500 },
  education: { minCac: 30, maxCac: 100 },
  fitness: { minCac: 20, maxCac: 60 },
  automotive: { minCac: 50, maxCac: 150 },
  other: { minCac: 30, maxCac: 100 },
};

const CAMPAIGN_PLATFORMS = [
  'Google Ads',
  'Meta Ads',
  'TikTok Ads',
  'LinkedIn Ads',
  'YouTube Ads',
  'Microsoft Ads',
  'Other',
];

const initialBusinessInfo: BusinessInfo = {
  name: '',
  industry: '',
  yearsInBusiness: '',
  avgCustomerValue: '',
  profitMargin: 40,
  profitMarginUnknown: false,
};

const initialMarketingInfo: MarketingInfo = {
  runningAds: null,
  platforms: [],
  monthlySpend: '',
  conversionTracking: [],
  conversionDefinition: '',
};

const initialGoalsInfo: GoalsInfo = {
  primaryGoal: '',
  targetCac: '',
  targetRoas: '',
  monthlyCustomerGoal: '',
  maxBudget: '',
};

export default function AtlasOnboarding({ onComplete, businessId }: AtlasOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [business, setBusiness] = useState<BusinessInfo>(initialBusinessInfo);
  const [marketing, setMarketing] = useState<MarketingInfo>(initialMarketingInfo);
  const [goals, setGoals] = useState<GoalsInfo>(initialGoalsInfo);
  const [campaigns, setCampaigns] = useState<CampaignEntry[]>([]);
  const [campaignImportMethod, setCampaignImportMethod] = useState<'manual' | 'csv' | 'skip' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CSV Import state
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvColumns, setCsvColumns] = useState<{ header: string; index: number }[]>([]);
  const [columnMapping, setColumnMapping] = useState<{
    name: number | null;
    platform: number | null;
    spend: number | null;
    clicks: number | null;
    conversions: number | null;
  }>({ name: null, platform: null, spend: null, clicks: null, conversions: null });

  const totalSteps = 5;

  // Load saved progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: OnboardingData = JSON.parse(saved);
        setBusiness(data.business || initialBusinessInfo);
        setMarketing(data.marketing || initialMarketingInfo);
        setGoals(data.goals || initialGoalsInfo);
        setCampaigns(data.campaigns || []);
        setCampaignImportMethod(data.campaignImportMethod);
        setCurrentStep(data.currentStep || 1);
      } catch (e) {
        console.error('Error loading saved progress:', e);
      }
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = useCallback(() => {
    const data: OnboardingData = {
      business,
      marketing,
      goals,
      campaigns,
      campaignImportMethod,
      currentStep,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [business, marketing, goals, campaigns, campaignImportMethod, currentStep]);

  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

  // Calculate suggested CAC based on customer value and margin
  const suggestedCac = useCallback(() => {
    const customerValue = parseFloat(business.avgCustomerValue) || 0;
    const margin = business.profitMarginUnknown ? 30 : (business.profitMargin || 30);
    // Suggest CAC as 30% of profit (conservative)
    return Math.round(customerValue * (margin / 100) * 0.3);
  }, [business.avgCustomerValue, business.profitMargin, business.profitMarginUnknown]);

  // Calculate suggested ROAS based on margin
  const suggestedRoas = useCallback(() => {
    const margin = business.profitMarginUnknown ? 30 : (business.profitMargin || 30);
    // Need ROAS of at least 1/margin to break even, suggest 50% above that
    const breakeven = 100 / margin;
    return Math.max(2, Math.round(breakeven * 1.5 * 10) / 10);
  }, [business.profitMargin, business.profitMarginUnknown]);

  // Calculate budget warning
  const budgetWarning = useCallback(() => {
    const targetCac = parseFloat(goals.targetCac) || 0;
    const monthlyGoal = parseInt(goals.monthlyCustomerGoal) || 0;
    const maxBudget = parseFloat(goals.maxBudget) || 0;

    if (targetCac > 0 && monthlyGoal > 0 && maxBudget > 0) {
      const requiredBudget = targetCac * monthlyGoal;
      if (maxBudget < requiredBudget) {
        return `To get ${monthlyGoal} customers at $${targetCac} CAC, you'd need at least $${requiredBudget.toLocaleString()}/month`;
      }
    }
    return null;
  }, [goals.targetCac, goals.monthlyCustomerGoal, goals.maxBudget]);

  // Industry benchmark hint
  const industryBenchmark = useCallback(() => {
    if (!business.industry) return null;
    const benchmark = INDUSTRY_BENCHMARKS[business.industry];
    if (!benchmark) return null;
    const industryLabel = INDUSTRIES.find(i => i.value === business.industry)?.label || business.industry;
    return `Most ${industryLabel} businesses see $${benchmark.minCac}-$${benchmark.maxCac} CAC on Google Ads`;
  }, [business.industry]);

  // Validate CAC against customer value
  const cacWarning = useCallback(() => {
    const customerValue = parseFloat(business.avgCustomerValue) || 0;
    const margin = business.profitMarginUnknown ? 30 : (business.profitMargin || 30);
    const targetCac = parseFloat(goals.targetCac) || 0;
    const maxProfitableCac = customerValue * (margin / 100);

    if (targetCac > 0 && targetCac > maxProfitableCac) {
      return `Your CAC ($${targetCac}) exceeds your profit per customer ($${Math.round(maxProfitableCac)}). You'd lose money on each sale.`;
    }
    return null;
  }, [business.avgCustomerValue, business.profitMargin, business.profitMarginUnknown, goals.targetCac]);

  const addCampaign = () => {
    setCampaigns(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      platform: 'Google Ads',
      spend: '',
      clicks: '',
      conversions: '',
    }]);
  };

  const updateCampaign = (id: string, field: keyof CampaignEntry, value: string) => {
    setCampaigns(prev => prev.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const removeCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const getCampaignCac = (campaign: CampaignEntry) => {
    const spend = parseFloat(campaign.spend) || 0;
    const conversions = parseInt(campaign.conversions) || 0;
    if (conversions > 0) {
      return Math.round(spend / conversions);
    }
    return null;
  };

  // Handle CSV upload
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const parsed = lines.map(line => {
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

        // Auto-detect mappings
        const autoMapping = { name: null as number | null, platform: null as number | null, spend: null as number | null, clicks: null as number | null, conversions: null as number | null };
        headers.forEach((h, i) => {
          const lower = h.toLowerCase();
          if (lower.includes('name') || lower.includes('campaign')) autoMapping.name = i;
          if (lower.includes('platform') || lower.includes('source') || lower.includes('channel')) autoMapping.platform = i;
          if (lower.includes('spend') || lower.includes('cost') || lower.includes('budget')) autoMapping.spend = i;
          if (lower.includes('click')) autoMapping.clicks = i;
          if (lower.includes('conversion') || lower.includes('conv')) autoMapping.conversions = i;
        });
        setColumnMapping(autoMapping);
        setShowCsvModal(true);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const importCsvCampaigns = () => {
    if (columnMapping.name === null) return;

    const imported = csvData.slice(1).map((row, idx) => ({
      id: `csv_${Date.now()}_${idx}`,
      name: columnMapping.name !== null ? row[columnMapping.name] : '',
      platform: columnMapping.platform !== null ? row[columnMapping.platform] : 'Other',
      spend: columnMapping.spend !== null ? row[columnMapping.spend] : '',
      clicks: columnMapping.clicks !== null ? row[columnMapping.clicks] : '',
      conversions: columnMapping.conversions !== null ? row[columnMapping.conversions] : '',
    })).filter(c => c.name);

    setCampaigns(imported);
    setShowCsvModal(false);
    setCsvData([]);
    setCsvColumns([]);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return business.name && business.industry && business.yearsInBusiness && business.avgCustomerValue;
      case 2:
        return marketing.runningAds !== null && marketing.conversionDefinition;
      case 3:
        return goals.primaryGoal && goals.targetCac && goals.monthlyCustomerGoal && goals.maxBudget;
      case 4:
        return campaignImportMethod !== null;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Save business configuration
      await fetch(`${API_BASE}/atlas/${businessId}/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: business.name,
          industry: business.industry,
          years_in_business: business.yearsInBusiness,
          avg_customer_value: parseFloat(business.avgCustomerValue) || 0,
          profit_margin: business.profitMarginUnknown ? null : business.profitMargin,
          running_ads: marketing.runningAds,
          ad_platforms: marketing.platforms,
          monthly_spend_range: marketing.monthlySpend,
          conversion_tracking: marketing.conversionTracking,
          conversion_definition: marketing.conversionDefinition,
          primary_goal: goals.primaryGoal,
        }),
      });

      // 2. Save goals
      await fetch(`${API_BASE}/atlas/${businessId}/goals`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_cac: parseFloat(goals.targetCac) || null,
          min_roas: parseFloat(goals.targetRoas) || null,
          conversion_goal: parseInt(goals.monthlyCustomerGoal) || null,
          budget_cap: parseFloat(goals.maxBudget) || null,
        }),
      });

      // 3. Save campaigns if any
      if (campaigns.length > 0) {
        const campaignsToSave = campaigns
          .filter(c => c.name && c.spend)
          .map(c => {
            const spend = parseFloat(c.spend) || 0;
            const conversions = parseInt(c.conversions) || 0;
            const revenue = 0; // Will be calculated later or user can update
            return {
              name: c.name,
              platform: c.platform,
              spend,
              conversions,
              revenue,
              cac: conversions > 0 ? spend / conversions : 0,
              roas: 0,
            };
          });

        if (campaignsToSave.length > 0) {
          await fetch(`${API_BASE}/atlas/${businessId}/campaigns/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaigns: campaignsToSave }),
          });
        }
      }

      // 4. Run initial analysis if we have campaigns
      if (campaigns.length > 0) {
        await fetch(`${API_BASE}/atlas/${businessId}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goals: {
              targetCac: parseFloat(goals.targetCac) || null,
              minRoas: parseFloat(goals.targetRoas) || null,
              conversionGoal: parseInt(goals.monthlyCustomerGoal) || null,
              budgetCap: parseFloat(goals.maxBudget) || null,
            },
          }),
        });
      }

      // Clear saved progress
      localStorage.removeItem(STORAGE_KEY);

      // Complete onboarding
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

  const steps = [
    { number: 1, title: 'Your Business', icon: Building2 },
    { number: 2, title: 'Marketing Today', icon: BarChart3 },
    { number: 3, title: 'Your Goals', icon: Target },
    { number: 4, title: 'Campaigns', icon: Lightbulb },
    { number: 5, title: 'Launch', icon: Rocket },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 bg-panel-dark">
      {/* Header */}
      <header className="p-6 border-b border-border">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🗺️</span>
            <div>
              <h1 className="text-2xl font-bold">Welcome to Atlas</h1>
              <p className="text-text-secondary">Let's set up your marketing optimization in just a few minutes</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex items-center flex-1">
                <button
                  onClick={() => step.number < currentStep && goToStep(step.number)}
                  disabled={step.number > currentStep}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    currentStep === step.number
                      ? 'bg-primary text-primary-foreground'
                      : step.number < currentStep
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 cursor-pointer'
                      : 'bg-panel-dark text-text-secondary cursor-not-allowed'
                  }`}
                >
                  {step.number < currentStep ? (
                    <Check size={16} />
                  ) : (
                    <step.icon size={16} />
                  )}
                  <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                  <span className="text-sm font-medium sm:hidden">{step.number}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    step.number < currentStep ? 'bg-green-500/50' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Your Business */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold mb-1">Tell us about your business</h2>
                  <p className="text-text-secondary">This helps us tailor recommendations to your industry</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">What's your business name?</label>
                    <input
                      type="text"
                      value={business.name}
                      onChange={(e) => setBusiness(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Acme Plumbing"
                      className="w-full px-4 py-3 bg-panel-dark border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">What industry are you in?</label>
                    <select
                      value={business.industry}
                      onChange={(e) => setBusiness(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-4 py-3 bg-panel-dark border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Select your industry</option>
                      {INDUSTRIES.map(ind => (
                        <option key={ind.value} value={ind.value}>{ind.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">How long have you been in business?</label>
                    <div className="grid grid-cols-2 gap-3">
                      {YEARS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setBusiness(prev => ({ ...prev, yearsInBusiness: opt.value }))}
                          className={`px-4 py-3 rounded-xl border transition-colors ${
                            business.yearsInBusiness === opt.value
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-panel-dark border-border hover:border-primary/50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      What's your average customer value?
                    </label>
                    <p className="text-sm text-text-secondary mb-2">How much does a typical customer spend with you?</p>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                      <input
                        type="number"
                        value={business.avgCustomerValue}
                        onChange={(e) => setBusiness(prev => ({ ...prev, avgCustomerValue: e.target.value }))}
                        placeholder="500"
                        className="w-full pl-8 pr-4 py-3 bg-panel-dark border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">What's your profit margin?</label>
                    {!business.profitMarginUnknown ? (
                      <div className="space-y-3">
                        <input
                          type="range"
                          min="10"
                          max="80"
                          value={business.profitMargin || 40}
                          onChange={(e) => setBusiness(prev => ({ ...prev, profitMargin: parseInt(e.target.value) }))}
                          className="w-full accent-primary"
                        />
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">10%</span>
                          <span className="font-semibold text-lg">{business.profitMargin}%</span>
                          <span className="text-text-secondary">80%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-panel-light rounded-xl text-center text-text-secondary">
                        We'll use industry averages (~30%)
                      </div>
                    )}
                    <button
                      onClick={() => setBusiness(prev => ({ ...prev, profitMarginUnknown: !prev.profitMarginUnknown }))}
                      className="mt-2 text-sm text-primary hover:underline"
                    >
                      {business.profitMarginUnknown ? "I know my margin" : "I don't know my margin"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Your Marketing Today */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold mb-1">Your marketing today</h2>
                  <p className="text-text-secondary">Help us understand your current setup</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Are you currently running paid ads?</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setMarketing(prev => ({ ...prev, runningAds: true }))}
                        className={`flex-1 px-4 py-3 rounded-xl border transition-colors ${
                          marketing.runningAds === true
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-panel-dark border-border hover:border-primary/50'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setMarketing(prev => ({ ...prev, runningAds: false, platforms: [] }))}
                        className={`flex-1 px-4 py-3 rounded-xl border transition-colors ${
                          marketing.runningAds === false
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-panel-dark border-border hover:border-primary/50'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {marketing.runningAds && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Which platforms are you using?</label>
                        <div className="flex flex-wrap gap-2">
                          {PLATFORMS.map(p => (
                            <button
                              key={p.value}
                              onClick={() => {
                                setMarketing(prev => ({
                                  ...prev,
                                  platforms: prev.platforms.includes(p.value)
                                    ? prev.platforms.filter(x => x !== p.value)
                                    : [...prev.platforms, p.value]
                                }));
                              }}
                              className={`px-4 py-2 rounded-lg border transition-colors ${
                                marketing.platforms.includes(p.value)
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-panel-dark border-border hover:border-primary/50'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">How much are you spending per month?</label>
                        <select
                          value={marketing.monthlySpend}
                          onChange={(e) => setMarketing(prev => ({ ...prev, monthlySpend: e.target.value }))}
                          className="w-full px-4 py-3 bg-panel-dark border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="">Select a range</option>
                          {SPEND_RANGES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">How are you tracking conversions today?</label>
                    <div className="flex flex-wrap gap-2">
                      {TRACKING_METHODS.map(m => (
                        <button
                          key={m.value}
                          onClick={() => {
                            setMarketing(prev => ({
                              ...prev,
                              conversionTracking: prev.conversionTracking.includes(m.value)
                                ? prev.conversionTracking.filter(x => x !== m.value)
                                : [...prev.conversionTracking, m.value]
                            }));
                          }}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            marketing.conversionTracking.includes(m.value)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-panel-dark border-border hover:border-primary/50'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">What does a "conversion" mean for your business?</label>
                    <input
                      type="text"
                      value={marketing.conversionDefinition}
                      onChange={(e) => setMarketing(prev => ({ ...prev, conversionDefinition: e.target.value }))}
                      placeholder="e.g., A booked appointment, A quote request, A purchase"
                      className="w-full px-4 py-3 bg-panel-dark border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Your Goals */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold mb-1">Set your goals</h2>
                  <p className="text-text-secondary">These targets will drive Atlas's recommendations</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">What's your #1 marketing goal?</label>
                    <div className="space-y-2">
                      {PRIMARY_GOALS.map(g => (
                        <button
                          key={g.value}
                          onClick={() => setGoals(prev => ({ ...prev, primaryGoal: g.value }))}
                          className={`w-full px-4 py-3 rounded-xl border text-left transition-colors ${
                            goals.primaryGoal === g.value
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-panel-dark border-border hover:border-primary/50'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      How much can you afford to pay to acquire a customer?
                    </label>
                    {business.avgCustomerValue && !business.profitMarginUnknown && (
                      <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-2">
                        <Sparkles size={18} className="text-blue-400 mt-0.5" />
                        <p className="text-sm text-blue-400">
                          Based on your ${business.avgCustomerValue} customer value and {business.profitMargin}% margin,
                          we suggest <strong>${suggestedCac()}</strong> as a target CAC
                        </p>
                      </div>
                    )}
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                      <input
                        type="number"
                        value={goals.targetCac}
                        onChange={(e) => setGoals(prev => ({ ...prev, targetCac: e.target.value }))}
                        placeholder={suggestedCac().toString()}
                        className="w-full pl-8 pr-4 py-3 bg-panel-dark border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    {!goals.targetCac && suggestedCac() > 0 && (
                      <button
                        onClick={() => setGoals(prev => ({ ...prev, targetCac: suggestedCac().toString() }))}
                        className="mt-2 text-sm text-primary hover:underline"
                      >
                        Use suggested: ${suggestedCac()}
                      </button>
                    )}
                    {cacWarning() && (
                      <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                        <AlertCircle size={16} className="text-red-400 mt-0.5" />
                        <p className="text-sm text-red-400">{cacWarning()}</p>
                      </div>
                    )}
                    {industryBenchmark() && !cacWarning() && (
                      <p className="mt-2 text-sm text-text-secondary">{industryBenchmark()}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">What ROAS would make you happy?</label>
                    {!business.profitMarginUnknown && (
                      <p className="text-sm text-text-secondary mb-2">
                        With your margin, you need at least {(100 / (business.profitMargin || 30)).toFixed(1)}x to break even
                      </p>
                    )}
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={goals.targetRoas}
                        onChange={(e) => setGoals(prev => ({ ...prev, targetRoas: e.target.value }))}
                        placeholder={suggestedRoas().toString()}
                        className="w-full px-4 py-3 bg-panel-dark border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">x return</span>
                    </div>
                    {!goals.targetRoas && (
                      <button
                        onClick={() => setGoals(prev => ({ ...prev, targetRoas: suggestedRoas().toString() }))}
                        className="mt-2 text-sm text-primary hover:underline"
                      >
                        Use suggested: {suggestedRoas()}x
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      How many new customers do you want per month?
                    </label>
                    <input
                      type="number"
                      value={goals.monthlyCustomerGoal}
                      onChange={(e) => setGoals(prev => ({ ...prev, monthlyCustomerGoal: e.target.value }))}
                      placeholder="50"
                      className="w-full px-4 py-3 bg-panel-dark border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      What's your maximum monthly ad budget?
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                      <input
                        type="number"
                        value={goals.maxBudget}
                        onChange={(e) => setGoals(prev => ({ ...prev, maxBudget: e.target.value }))}
                        placeholder="5000"
                        className="w-full pl-8 pr-4 py-3 bg-panel-dark border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    {budgetWarning() && (
                      <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
                        <AlertCircle size={16} className="text-yellow-400 mt-0.5" />
                        <p className="text-sm text-yellow-400">{budgetWarning()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Current Campaigns */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold mb-1">Your current campaigns (optional)</h2>
                  <p className="text-text-secondary">Import your campaign data so Atlas can analyze it right away</p>
                </div>

                {campaignImportMethod === null ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => { setCampaignImportMethod('manual'); addCampaign(); }}
                      className="w-full p-4 bg-panel-dark border border-border rounded-xl hover:border-primary/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <Plus size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">I'll enter manually</p>
                          <p className="text-sm text-text-secondary">Add 1-3 campaigns with basic stats</p>
                        </div>
                      </div>
                    </button>

                    <label className="block w-full p-4 bg-panel-dark border border-border rounded-xl hover:border-primary/50 transition-colors text-left cursor-pointer">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => { setCampaignImportMethod('csv'); handleCsvUpload(e); }}
                        className="hidden"
                      />
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Upload size={20} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">I'll upload a CSV</p>
                          <p className="text-sm text-text-secondary">Import from Google Ads, Meta, etc.</p>
                        </div>
                      </div>
                    </label>

                    <button
                      onClick={() => setCampaignImportMethod('skip')}
                      className="w-full p-4 bg-panel-dark border border-border rounded-xl hover:border-primary/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-panel-light rounded-lg">
                          <ArrowRight size={20} className="text-text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium">Skip for now</p>
                          <p className="text-sm text-text-secondary">I'll add campaigns later</p>
                        </div>
                      </div>
                    </button>
                  </div>
                ) : campaignImportMethod === 'manual' ? (
                  <div className="space-y-4">
                    {campaigns.map((campaign, idx) => (
                      <div key={campaign.id} className="p-4 bg-panel-dark border border-border rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Campaign {idx + 1}</h3>
                          {campaigns.length > 1 && (
                            <button
                              onClick={() => removeCampaign(campaign.id)}
                              className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-sm text-text-secondary mb-1">Campaign name</label>
                            <input
                              type="text"
                              value={campaign.name}
                              onChange={(e) => updateCampaign(campaign.id, 'name', e.target.value)}
                              placeholder="Summer Sale"
                              className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm text-text-secondary mb-1">Platform</label>
                            <select
                              value={campaign.platform}
                              onChange={(e) => updateCampaign(campaign.id, 'platform', e.target.value)}
                              className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                              {CAMPAIGN_PLATFORMS.map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-text-secondary mb-1">Spend (30 days)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">$</span>
                              <input
                                type="number"
                                value={campaign.spend}
                                onChange={(e) => updateCampaign(campaign.id, 'spend', e.target.value)}
                                placeholder="1000"
                                className="w-full pl-7 pr-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm text-text-secondary mb-1">Clicks</label>
                            <input
                              type="number"
                              value={campaign.clicks}
                              onChange={(e) => updateCampaign(campaign.id, 'clicks', e.target.value)}
                              placeholder="500"
                              className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-text-secondary mb-1">Conversions</label>
                            <input
                              type="number"
                              value={campaign.conversions}
                              onChange={(e) => updateCampaign(campaign.id, 'conversions', e.target.value)}
                              placeholder="20"
                              className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                          </div>
                        </div>

                        {getCampaignCac(campaign) && (
                          <div className="p-3 bg-panel-light rounded-lg flex items-center gap-2">
                            <DollarSign size={16} className="text-green-400" />
                            <span className="text-sm">
                              That's <strong className="text-green-400">${getCampaignCac(campaign)}</strong> per customer
                              {parseFloat(goals.targetCac) > 0 && getCampaignCac(campaign)! > parseFloat(goals.targetCac) && (
                                <span className="text-yellow-400 ml-1">(above your ${goals.targetCac} target)</span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}

                    {campaigns.length < 5 && (
                      <button
                        onClick={addCampaign}
                        className="w-full p-3 border border-dashed border-border rounded-xl hover:border-primary/50 transition-colors flex items-center justify-center gap-2 text-text-secondary"
                      >
                        <Plus size={18} /> Add another campaign
                      </button>
                    )}

                    <button
                      onClick={() => { setCampaignImportMethod(null); setCampaigns([]); }}
                      className="text-sm text-text-secondary hover:text-text-primary"
                    >
                      ← Back to import options
                    </button>
                  </div>
                ) : campaignImportMethod === 'csv' ? (
                  <div className="space-y-4">
                    {campaigns.length > 0 ? (
                      <>
                        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                          <Check size={20} className="text-green-400" />
                          <span className="text-green-400">{campaigns.length} campaigns imported</span>
                        </div>

                        <div className="bg-panel-dark border border-border rounded-xl overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-panel-light">
                              <tr>
                                <th className="text-left p-3">Name</th>
                                <th className="text-left p-3">Platform</th>
                                <th className="text-right p-3">Spend</th>
                                <th className="text-right p-3">Conv.</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {campaigns.slice(0, 5).map(c => (
                                <tr key={c.id}>
                                  <td className="p-3">{c.name}</td>
                                  <td className="p-3 text-text-secondary">{c.platform}</td>
                                  <td className="p-3 text-right">${c.spend || '0'}</td>
                                  <td className="p-3 text-right">{c.conversions || '0'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {campaigns.length > 5 && (
                            <p className="p-3 text-sm text-text-secondary text-center border-t border-border">
                              +{campaigns.length - 5} more campaigns
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => { setCampaignImportMethod(null); setCampaigns([]); }}
                          className="text-sm text-text-secondary hover:text-text-primary"
                        >
                          ← Back to import options
                        </button>
                      </>
                    ) : (
                      <label className="block w-full p-8 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors text-center cursor-pointer">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCsvUpload}
                          className="hidden"
                        />
                        <Upload size={32} className="mx-auto mb-3 text-text-secondary" />
                        <p className="font-medium">Click to upload CSV</p>
                        <p className="text-sm text-text-secondary mt-1">or drag and drop</p>
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="p-8 bg-panel-dark border border-border rounded-xl text-center">
                    <Check size={32} className="mx-auto mb-3 text-green-400" />
                    <p className="font-medium">No problem!</p>
                    <p className="text-text-secondary">You can add campaigns anytime from the dashboard</p>
                    <button
                      onClick={() => setCampaignImportMethod(null)}
                      className="mt-4 text-sm text-primary hover:underline"
                    >
                      Actually, I want to add some now
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 5: Review & Launch */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold mb-1">Ready to launch!</h2>
                  <p className="text-text-secondary">Review your setup and let's get started</p>
                </div>

                <div className="bg-panel-dark border border-border rounded-xl overflow-hidden">
                  {/* Business */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-text-secondary" />
                        <span className="font-medium">Business</span>
                      </div>
                      <button
                        onClick={() => goToStep(1)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-lg">{business.name}</p>
                    <p className="text-sm text-text-secondary">
                      {INDUSTRIES.find(i => i.value === business.industry)?.label} •
                      {' '}Customer value: {formatCurrency(parseFloat(business.avgCustomerValue) || 0)} •
                      {' '}Margin: {business.profitMarginUnknown ? '~30%' : `${business.profitMargin}%`}
                    </p>
                  </div>

                  {/* Marketing */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 size={16} className="text-text-secondary" />
                        <span className="font-medium">Marketing</span>
                      </div>
                      <button
                        onClick={() => goToStep(2)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-sm text-text-secondary">
                      {marketing.runningAds ? `Running ads on ${marketing.platforms.length} platform${marketing.platforms.length !== 1 ? 's' : ''}` : 'Not running ads yet'} •
                      {' '}Conversion: {marketing.conversionDefinition || 'Not specified'}
                    </p>
                  </div>

                  {/* Goals */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target size={16} className="text-text-secondary" />
                        <span className="font-medium">Goals</span>
                      </div>
                      <button
                        onClick={() => goToStep(3)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-text-secondary">Target CAC</p>
                        <p className="font-semibold">{formatCurrency(parseFloat(goals.targetCac) || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Target ROAS</p>
                        <p className="font-semibold">{goals.targetRoas || '—'}x</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Monthly Goal</p>
                        <p className="font-semibold">{goals.monthlyCustomerGoal || '—'} customers</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Budget Cap</p>
                        <p className="font-semibold">{formatCurrency(parseFloat(goals.maxBudget) || 0)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Campaigns */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Lightbulb size={16} className="text-text-secondary" />
                        <span className="font-medium">Campaigns</span>
                      </div>
                      <button
                        onClick={() => goToStep(4)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-sm text-text-secondary">
                      {campaigns.length > 0
                        ? `${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''} imported`
                        : 'No campaigns imported yet'}
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
                    <AlertCircle size={18} className="text-red-400" />
                    <p className="text-red-400">{error}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-6 border-t border-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={18} /> Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Rocket size={18} /> Looks good, let's go!
                </>
              )}
            </button>
          )}
        </div>
      </footer>

      {/* CSV Import Modal */}
      <AnimatePresence>
        {showCsvModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCsvModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-panel-dark border border-border rounded-xl w-full max-w-2xl overflow-hidden max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <FileSpreadsheet size={20} /> Map CSV Columns
                </h2>
                <button
                  onClick={() => setShowCsvModal(false)}
                  className="p-2 hover:bg-panel-light rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <p className="text-sm text-text-secondary">
                  Map your columns to the right fields. Only Campaign Name is required.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {['name', 'platform', 'spend', 'clicks', 'conversions'].map((field) => (
                    <div key={field}>
                      <label className="block text-sm text-text-secondary mb-1 capitalize">
                        {field === 'name' ? 'Campaign Name *' : field}
                      </label>
                      <select
                        value={(columnMapping as Record<string, number | null>)[field] ?? ''}
                        onChange={(e) => setColumnMapping(prev => ({
                          ...prev,
                          [field]: e.target.value ? parseInt(e.target.value) : null
                        }))}
                        className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="">Select column</option>
                        {csvColumns.map(col => (
                          <option key={col.index} value={col.index}>{col.header}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {csvData.length > 1 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Preview</h3>
                    <div className="bg-panel-dark rounded-lg border border-border overflow-x-auto text-sm">
                      <table className="w-full">
                        <thead className="bg-panel-light">
                          <tr>
                            <th className="text-left p-2">Name</th>
                            <th className="text-left p-2">Platform</th>
                            <th className="text-right p-2">Spend</th>
                            <th className="text-right p-2">Clicks</th>
                            <th className="text-right p-2">Conv.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {csvData.slice(1, 4).map((row, idx) => (
                            <tr key={idx}>
                              <td className="p-2">{columnMapping.name !== null ? row[columnMapping.name] : '—'}</td>
                              <td className="p-2 text-text-secondary">{columnMapping.platform !== null ? row[columnMapping.platform] : '—'}</td>
                              <td className="p-2 text-right">{columnMapping.spend !== null ? `$${row[columnMapping.spend]}` : '—'}</td>
                              <td className="p-2 text-right">{columnMapping.clicks !== null ? row[columnMapping.clicks] : '—'}</td>
                              <td className="p-2 text-right">{columnMapping.conversions !== null ? row[columnMapping.conversions] : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-text-secondary mt-2">{csvData.length - 1} rows total</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-border flex justify-end gap-3">
                <button
                  onClick={() => setShowCsvModal(false)}
                  className="px-4 py-2 text-text-secondary hover:bg-panel-light rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={importCsvCampaigns}
                  disabled={columnMapping.name === null}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Check size={16} /> Import {csvData.length - 1} Campaigns
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
