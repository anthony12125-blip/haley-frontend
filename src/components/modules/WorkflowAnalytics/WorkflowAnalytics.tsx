'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Play, Pause, BarChart3, TrendingUp, TrendingDown, Clock,
  Shield, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, XCircle,
  Activity, Zap, Bot, RefreshCw, Download, Filter, Calendar, ChevronDown,
  ChevronRight, Eye, EyeOff, Beaker, FlaskConical, Gauge, Target, Award,
  ThumbsUp, ThumbsDown, HelpCircle, X, FileText, Workflow, Layers,
} from 'lucide-react';
import { components, layout, cx } from '@/styles/module-theme';

// ============================================================================
// TYPES
// ============================================================================

interface WorkflowAnalyticsProps {
  onBack: () => void;
  workflowId?: string; // Optional - if provided, shows single workflow; otherwise shows all
}

type VerificationLevel = 'none' | 'basic' | 'standard' | 'strict' | 'maximum';
type DriftSeverity = 'minor' | 'moderate' | 'severe' | 'critical';
type SimulationStatus = 'idle' | 'running' | 'completed' | 'failed';

interface LogicEngineLog {
  id: string;
  timestamp: string;
  workflowId: string;
  workflowName: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  verificationLevel: VerificationLevel;
  action: 'validate' | 'execute' | 'correct' | 'escalate' | 'block';
  inputHash: string;
  outputHash: string;
  driftDetected: boolean;
  driftSeverity?: DriftSeverity;
  driftDetails?: string;
  correctionApplied: boolean;
  correctionMethod?: string;
  llmsUsed?: string[];
  executionTimeMs: number;
  tokensConsumed?: number;
  success: boolean;
  errorMessage?: string;
}

interface WorkflowHealth {
  workflowId: string;
  workflowName: string;
  totalExecutions: number;
  successRate: number;
  driftRate: number;
  avgCorrectionTime: number;
  lastExecution: string;
  recommendation: 'keep_in_logic_engine' | 'reduce_verification' | 'ready_for_independence' | 'needs_attention';
  recommendationReason: string;
  verificationBreakdown: Record<VerificationLevel, number>;
  driftTrend: 'improving' | 'stable' | 'worsening';
}

interface SimulationResult {
  nodeId: string;
  nodeName: string;
  predictedDriftRisk: number; // 0-100
  vulnerabilities: string[];
  suggestedVerificationLevel: VerificationLevel;
  estimatedExecutionTime: number;
  wouldTriggerCorrection: boolean;
}

interface SimulationRun {
  id: string;
  timestamp: string;
  workflowId: string;
  workflowName: string;
  status: SimulationStatus;
  results: SimulationResult[];
  overallRisk: number;
  recommendation: string;
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const generateMockLogs = (count: number): LogicEngineLog[] => {
  const workflows = [
    { id: 'wf-1', name: 'Lead Capture Pipeline' },
    { id: 'wf-2', name: 'Content Generation Flow' },
    { id: 'wf-3', name: 'Customer Onboarding' },
    { id: 'wf-4', name: 'Data Sync Automation' },
  ];
  const nodes = [
    { id: 'n-1', name: 'Form Webhook', type: 'webhook' },
    { id: 'n-2', name: 'AI Enrichment', type: 'llm' },
    { id: 'n-3', name: 'CRM Update', type: 'action' },
    { id: 'n-4', name: 'Email Notification', type: 'output' },
    { id: 'n-5', name: 'Data Transform', type: 'transform' },
    { id: 'n-6', name: 'Condition Check', type: 'condition' },
  ];
  const levels: VerificationLevel[] = ['none', 'basic', 'standard', 'strict', 'maximum'];
  const actions: LogicEngineLog['action'][] = ['validate', 'execute', 'correct', 'escalate', 'block'];
  const severities: DriftSeverity[] = ['minor', 'moderate', 'severe', 'critical'];

  const logs: LogicEngineLog[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const wf = workflows[Math.floor(Math.random() * workflows.length)];
    const node = nodes[Math.floor(Math.random() * nodes.length)];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const driftDetected = Math.random() < (level === 'none' ? 0.3 : level === 'basic' ? 0.15 : 0.05);
    const action = driftDetected ? (Math.random() < 0.8 ? 'correct' : 'escalate') : (Math.random() < 0.9 ? 'execute' : 'validate');

    logs.push({
      id: `log-${i}`,
      timestamp: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      workflowId: wf.id,
      workflowName: wf.name,
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      verificationLevel: level,
      action,
      inputHash: Math.random().toString(36).substring(2, 10),
      outputHash: Math.random().toString(36).substring(2, 10),
      driftDetected,
      driftSeverity: driftDetected ? severities[Math.floor(Math.random() * severities.length)] : undefined,
      driftDetails: driftDetected ? 'Output deviated from expected schema by 12.3%' : undefined,
      correctionApplied: driftDetected && Math.random() < 0.9,
      correctionMethod: driftDetected ? (Math.random() < 0.7 ? 'Logic Engine auto-correction' : 'Multi-LLM consensus') : undefined,
      llmsUsed: level === 'strict' ? ['claude', 'gpt', 'gemini'] : level === 'maximum' ? ['claude', 'gpt', 'gemini', 'mistral', 'perplexity', 'grok', 'llama'] : undefined,
      executionTimeMs: Math.floor(100 + Math.random() * 2000),
      tokensConsumed: node.type === 'llm' ? Math.floor(500 + Math.random() * 3000) : undefined,
      success: Math.random() < 0.95,
      errorMessage: Math.random() < 0.05 ? 'Timeout waiting for external API' : undefined,
    });
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const calculateWorkflowHealth = (logs: LogicEngineLog[]): WorkflowHealth[] => {
  const byWorkflow = new Map<string, LogicEngineLog[]>();
  logs.forEach(log => {
    const existing = byWorkflow.get(log.workflowId) || [];
    existing.push(log);
    byWorkflow.set(log.workflowId, existing);
  });

  const healths: WorkflowHealth[] = [];

  byWorkflow.forEach((wfLogs, workflowId) => {
    const totalExecutions = wfLogs.length;
    const successCount = wfLogs.filter(l => l.success).length;
    const driftCount = wfLogs.filter(l => l.driftDetected).length;
    const correctionTimes = wfLogs.filter(l => l.correctionApplied).map(l => l.executionTimeMs);
    const avgCorrectionTime = correctionTimes.length > 0 ? correctionTimes.reduce((a, b) => a + b, 0) / correctionTimes.length : 0;

    const successRate = (successCount / totalExecutions) * 100;
    const driftRate = (driftCount / totalExecutions) * 100;

    const verificationBreakdown: Record<VerificationLevel, number> = { none: 0, basic: 0, standard: 0, strict: 0, maximum: 0 };
    wfLogs.forEach(l => verificationBreakdown[l.verificationLevel]++);

    // Trend analysis (simplified)
    const recentLogs = wfLogs.slice(0, Math.ceil(wfLogs.length / 3));
    const olderLogs = wfLogs.slice(Math.ceil(wfLogs.length / 3));
    const recentDriftRate = recentLogs.filter(l => l.driftDetected).length / recentLogs.length;
    const olderDriftRate = olderLogs.length > 0 ? olderLogs.filter(l => l.driftDetected).length / olderLogs.length : recentDriftRate;
    const driftTrend: 'improving' | 'stable' | 'worsening' =
      recentDriftRate < olderDriftRate - 0.05 ? 'improving' :
      recentDriftRate > olderDriftRate + 0.05 ? 'worsening' : 'stable';

    // Recommendation logic
    let recommendation: WorkflowHealth['recommendation'];
    let recommendationReason: string;

    if (driftRate < 2 && successRate > 98 && driftTrend !== 'worsening') {
      recommendation = 'ready_for_independence';
      recommendationReason = 'This workflow has proven stable with minimal drift. Consider reducing verification level or removing from Logic Engine entirely.';
    } else if (driftRate < 5 && successRate > 95) {
      recommendation = 'reduce_verification';
      recommendationReason = 'Workflow is performing well. You may be able to reduce verification level on stable nodes to improve speed.';
    } else if (driftRate > 15 || successRate < 90) {
      recommendation = 'needs_attention';
      recommendationReason = 'High drift rate or low success rate detected. Review node configurations and consider increasing verification.';
    } else {
      recommendation = 'keep_in_logic_engine';
      recommendationReason = 'Current performance is acceptable. Continue monitoring for trends before making changes.';
    }

    healths.push({
      workflowId,
      workflowName: wfLogs[0]?.workflowName || 'Unknown',
      totalExecutions,
      successRate,
      driftRate,
      avgCorrectionTime,
      lastExecution: wfLogs[0]?.timestamp || new Date().toISOString(),
      recommendation,
      recommendationReason,
      verificationBreakdown,
      driftTrend,
    });
  });

  return healths;
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute z-50 px-2 py-1 text-xs bg-panel-light border border-border rounded shadow-lg bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap max-w-xs text-center">
          {content}
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
}> = ({ label, value, subValue, icon, trend, trendValue, color = 'text-primary' }) => (
  <div className="p-4 bg-panel-medium border border-border rounded-xl">
    <div className="flex items-start justify-between mb-2">
      <span className={`p-2 rounded-lg bg-panel-light ${color}`}>{icon}</span>
      {trend && (
        <div className={cx('flex items-center gap-1 text-xs', trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-text-secondary')}>
          {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : null}
          {trendValue}
        </div>
      )}
    </div>
    <p className="text-2xl font-bold text-text-primary">{value}</p>
    <p className="text-xs text-text-secondary">{label}</p>
    {subValue && <p className="text-xs text-text-secondary mt-1">{subValue}</p>}
  </div>
);

const VerificationBadge: React.FC<{ level: VerificationLevel }> = ({ level }) => {
  const cfg: Record<VerificationLevel, { color: string; bg: string; label: string }> = {
    none: { color: 'text-text-secondary', bg: 'bg-panel-light', label: 'None' },
    basic: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Basic' },
    standard: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Standard' },
    strict: { color: 'text-purple-400', bg: 'bg-purple-500/10', label: '3 LLMs' },
    maximum: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: '7 Justices' },
  };
  const c = cfg[level];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${c.bg} ${c.color}`}>{c.label}</span>;
};

const SeverityBadge: React.FC<{ severity: DriftSeverity }> = ({ severity }) => {
  const cfg: Record<DriftSeverity, { color: string; bg: string }> = {
    minor: { color: 'text-blue-400', bg: 'bg-blue-500/10' },
    moderate: { color: 'text-amber-400', bg: 'bg-amber-500/10' },
    severe: { color: 'text-orange-400', bg: 'bg-orange-500/10' },
    critical: { color: 'text-red-400', bg: 'bg-red-500/10' },
  };
  const c = cfg[severity];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs capitalize ${c.bg} ${c.color}`}>{severity}</span>;
};

const ActionBadge: React.FC<{ action: LogicEngineLog['action'] }> = ({ action }) => {
  const cfg: Record<LogicEngineLog['action'], { color: string; bg: string; icon: any }> = {
    validate: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Shield },
    execute: { color: 'text-green-400', bg: 'bg-green-500/10', icon: Play },
    correct: { color: 'text-purple-400', bg: 'bg-purple-500/10', icon: RefreshCw },
    escalate: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: ShieldAlert },
    block: { color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
  };
  const c = cfg[action];
  const Icon = c.icon;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs capitalize ${c.bg} ${c.color}`}><Icon size={10} />{action}</span>;
};

const RecommendationCard: React.FC<{ health: WorkflowHealth }> = ({ health }) => {
  const cfg: Record<WorkflowHealth['recommendation'], { color: string; bg: string; border: string; icon: any; title: string }> = {
    ready_for_independence: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: Award, title: 'Ready for Independence' },
    reduce_verification: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: TrendingDown, title: 'Consider Reducing Verification' },
    keep_in_logic_engine: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Shield, title: 'Keep in Logic Engine' },
    needs_attention: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertTriangle, title: 'Needs Attention' },
  };
  const c = cfg[health.recommendation];
  const Icon = c.icon;

  return (
    <div className={`p-4 rounded-xl ${c.bg} border ${c.border}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${c.bg}`}>
          <Icon size={20} className={c.color} />
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold ${c.color}`}>{c.title}</h4>
          <p className="text-sm text-text-secondary mt-1">{health.recommendationReason}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
            <span>Drift Rate: <strong className={health.driftRate > 10 ? 'text-red-400' : health.driftRate > 5 ? 'text-amber-400' : 'text-green-400'}>{health.driftRate.toFixed(1)}%</strong></span>
            <span>Success: <strong className={health.successRate > 95 ? 'text-green-400' : health.successRate > 90 ? 'text-amber-400' : 'text-red-400'}>{health.successRate.toFixed(1)}%</strong></span>
            <span className="flex items-center gap-1">
              Trend:
              {health.driftTrend === 'improving' && <TrendingDown size={12} className="text-green-400" />}
              {health.driftTrend === 'worsening' && <TrendingUp size={12} className="text-red-400" />}
              {health.driftTrend === 'stable' && <span className="text-text-secondary">—</span>}
              <span className={health.driftTrend === 'improving' ? 'text-green-400' : health.driftTrend === 'worsening' ? 'text-red-400' : ''}>{health.driftTrend}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WorkflowAnalytics({ onBack, workflowId }: WorkflowAnalyticsProps) {
  // State
  const [logs, setLogs] = useState<LogicEngineLog[]>([]);
  const [healthData, setHealthData] = useState<WorkflowHealth[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'simulation'>('overview');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(workflowId || null);
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [logFilter, setLogFilter] = useState<{ action?: string; level?: string; driftOnly?: boolean }>({});
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>('idle');
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [simulationWorkflow, setSimulationWorkflow] = useState<string | null>(null);

  // Load mock data
  useEffect(() => {
    const mockLogs = generateMockLogs(200);
    setLogs(mockLogs);
    setHealthData(calculateWorkflowHealth(mockLogs));
  }, []);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    let filtered = [...logs];

    // Date range filter
    const now = Date.now();
    const ranges: Record<string, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity,
    };
    if (dateRange !== 'all') {
      filtered = filtered.filter(l => now - new Date(l.timestamp).getTime() < ranges[dateRange]);
    }

    // Workflow filter
    if (selectedWorkflow) {
      filtered = filtered.filter(l => l.workflowId === selectedWorkflow);
    }

    // Action filter
    if (logFilter.action) {
      filtered = filtered.filter(l => l.action === logFilter.action);
    }

    // Level filter
    if (logFilter.level) {
      filtered = filtered.filter(l => l.verificationLevel === logFilter.level);
    }

    // Drift only filter
    if (logFilter.driftOnly) {
      filtered = filtered.filter(l => l.driftDetected);
    }

    return filtered;
  }, [logs, dateRange, selectedWorkflow, logFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const driftCount = filteredLogs.filter(l => l.driftDetected).length;
    const correctedCount = filteredLogs.filter(l => l.correctionApplied).length;
    const successCount = filteredLogs.filter(l => l.success).length;
    const avgExecTime = filteredLogs.length > 0 ? filteredLogs.reduce((a, b) => a + b.executionTimeMs, 0) / filteredLogs.length : 0;
    const tokensUsed = filteredLogs.reduce((a, b) => a + (b.tokensConsumed || 0), 0);

    return {
      total,
      driftRate: total > 0 ? (driftCount / total) * 100 : 0,
      correctionRate: driftCount > 0 ? (correctedCount / driftCount) * 100 : 0,
      successRate: total > 0 ? (successCount / total) * 100 : 0,
      avgExecTime,
      tokensUsed,
    };
  }, [filteredLogs]);

  // Simulation
  const runSimulation = useCallback(async (wfId: string) => {
    setSimulationStatus('running');
    setSimulationWorkflow(wfId);
    setSimulationResults([]);

    // Simulate analysis
    await new Promise(r => setTimeout(r, 1500));

    const mockResults: SimulationResult[] = [
      { nodeId: 'n-1', nodeName: 'Form Webhook', predictedDriftRisk: 5, vulnerabilities: [], suggestedVerificationLevel: 'basic', estimatedExecutionTime: 120, wouldTriggerCorrection: false },
      { nodeId: 'n-2', nodeName: 'AI Enrichment', predictedDriftRisk: 35, vulnerabilities: ['LLM output variability', 'Schema flexibility'], suggestedVerificationLevel: 'standard', estimatedExecutionTime: 850, wouldTriggerCorrection: true },
      { nodeId: 'n-3', nodeName: 'CRM Update', predictedDriftRisk: 8, vulnerabilities: ['API rate limits'], suggestedVerificationLevel: 'basic', estimatedExecutionTime: 200, wouldTriggerCorrection: false },
      { nodeId: 'n-4', nodeName: 'Email Notification', predictedDriftRisk: 3, vulnerabilities: [], suggestedVerificationLevel: 'none', estimatedExecutionTime: 150, wouldTriggerCorrection: false },
    ];

    setSimulationResults(mockResults);
    setSimulationStatus('completed');
  }, []);

  const exportLogs = useCallback(() => {
    const csv = [
      ['Timestamp', 'Workflow', 'Node', 'Action', 'Verification', 'Drift', 'Severity', 'Corrected', 'Time (ms)', 'Success'].join(','),
      ...filteredLogs.map(l => [
        l.timestamp,
        l.workflowName,
        l.nodeName,
        l.action,
        l.verificationLevel,
        l.driftDetected ? 'Yes' : 'No',
        l.driftSeverity || '-',
        l.correctionApplied ? 'Yes' : 'No',
        l.executionTimeMs,
        l.success ? 'Yes' : 'No',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `logic-engine-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }, [filteredLogs]);

  const uniqueWorkflows = useMemo(() => {
    const map = new Map<string, string>();
    logs.forEach(l => map.set(l.workflowId, l.workflowName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [logs]);

  // ============================================================================
  // RENDER - OVERVIEW TAB
  // ============================================================================

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Executions" value={stats.total} icon={<Activity size={18} />} color="text-blue-400" />
        <StatCard label="Drift Rate" value={`${stats.driftRate.toFixed(1)}%`} icon={<AlertTriangle size={18} />} color={stats.driftRate > 10 ? 'text-red-400' : stats.driftRate > 5 ? 'text-amber-400' : 'text-green-400'} trend={stats.driftRate > 10 ? 'down' : 'up'} trendValue={stats.driftRate > 10 ? 'High' : 'Good'} />
        <StatCard label="Correction Rate" value={`${stats.correctionRate.toFixed(1)}%`} icon={<RefreshCw size={18} />} color="text-purple-400" />
        <StatCard label="Success Rate" value={`${stats.successRate.toFixed(1)}%`} icon={<CheckCircle size={18} />} color={stats.successRate > 95 ? 'text-green-400' : 'text-amber-400'} />
        <StatCard label="Avg Exec Time" value={`${stats.avgExecTime.toFixed(0)}ms`} icon={<Clock size={18} />} color="text-cyan-400" />
        <StatCard label="Tokens Used" value={stats.tokensUsed.toLocaleString()} icon={<Bot size={18} />} color="text-indigo-400" />
      </div>

      {/* Workflow Health Cards */}
      <div>
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Gauge size={18} />
          Workflow Health & Recommendations
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {healthData.map(health => (
            <div key={health.workflowId} className="p-4 bg-panel-medium border border-border rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-text-primary">{health.workflowName}</h4>
                  <p className="text-xs text-text-secondary">{health.totalExecutions} executions • Last: {new Date(health.lastExecution).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => { setSimulationWorkflow(health.workflowId); setActiveTab('simulation'); }}
                  className="px-3 py-1.5 bg-purple-500/20 text-purple-400 text-xs rounded-lg flex items-center gap-1.5 hover:bg-purple-500/30"
                >
                  <FlaskConical size={12} />
                  Test
                </button>
              </div>
              <RecommendationCard health={health} />
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-text-secondary mb-2">Verification Usage</p>
                <div className="flex gap-1">
                  {(['none', 'basic', 'standard', 'strict', 'maximum'] as VerificationLevel[]).map(level => {
                    const count = health.verificationBreakdown[level];
                    const pct = health.totalExecutions > 0 ? (count / health.totalExecutions) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <Tooltip key={level} content={`${level}: ${count} (${pct.toFixed(1)}%)`}>
                        <div
                          className={cx(
                            'h-2 rounded-full',
                            level === 'none' && 'bg-gray-500',
                            level === 'basic' && 'bg-blue-500',
                            level === 'standard' && 'bg-green-500',
                            level === 'strict' && 'bg-purple-500',
                            level === 'maximum' && 'bg-amber-500',
                          )}
                          style={{ width: `${pct}%`, minWidth: pct > 0 ? '8px' : 0 }}
                        />
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER - LOGS TAB
  // ============================================================================

  const renderLogs = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-panel-medium border border-border rounded-xl">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-text-secondary" />
          <span className="text-sm text-text-secondary">Filters:</span>
        </div>

        <select
          value={selectedWorkflow || ''}
          onChange={(e) => setSelectedWorkflow(e.target.value || null)}
          className="px-3 py-1.5 bg-panel-dark border border-border rounded-lg text-sm"
        >
          <option value="">All Workflows</option>
          {uniqueWorkflows.map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
        </select>

        <select
          value={logFilter.action || ''}
          onChange={(e) => setLogFilter(f => ({ ...f, action: e.target.value || undefined }))}
          className="px-3 py-1.5 bg-panel-dark border border-border rounded-lg text-sm"
        >
          <option value="">All Actions</option>
          <option value="validate">Validate</option>
          <option value="execute">Execute</option>
          <option value="correct">Correct</option>
          <option value="escalate">Escalate</option>
          <option value="block">Block</option>
        </select>

        <select
          value={logFilter.level || ''}
          onChange={(e) => setLogFilter(f => ({ ...f, level: e.target.value || undefined }))}
          className="px-3 py-1.5 bg-panel-dark border border-border rounded-lg text-sm"
        >
          <option value="">All Levels</option>
          <option value="none">None</option>
          <option value="basic">Basic</option>
          <option value="standard">Standard</option>
          <option value="strict">Strict (3 LLMs)</option>
          <option value="maximum">Maximum (7 Justices)</option>
        </select>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={logFilter.driftOnly || false}
            onChange={(e) => setLogFilter(f => ({ ...f, driftOnly: e.target.checked }))}
            className="rounded border-border"
          />
          <span className="text-text-secondary">Drift only</span>
        </label>

        <div className="flex-1" />

        <button
          onClick={exportLogs}
          className="px-3 py-1.5 bg-panel-light rounded-lg text-sm flex items-center gap-1.5 hover:bg-panel-dark"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Logs List */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="p-3 bg-panel-medium border-b border-border flex items-center justify-between">
          <span className="text-sm text-text-secondary">{filteredLogs.length} log entries</span>
          <div className="flex items-center gap-2">
            {(['24h', '7d', '30d', 'all'] as const).map(r => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={cx('px-2 py-1 text-xs rounded', dateRange === r ? 'bg-primary text-white' : 'bg-panel-light text-text-secondary')}
              >
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              <FileText size={32} className="mx-auto mb-2 opacity-50" />
              <p>No logs match your filters</p>
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="border-b border-border/50 last:border-b-0">
                <div
                  className="p-3 flex items-center gap-3 hover:bg-panel-light/50 cursor-pointer"
                  onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                >
                  <span className="text-xs text-text-secondary w-32 shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-text-primary w-40 truncate shrink-0">{log.workflowName}</span>
                  <span className="text-sm text-text-secondary w-32 truncate shrink-0">{log.nodeName}</span>
                  <ActionBadge action={log.action} />
                  <VerificationBadge level={log.verificationLevel} />
                  {log.driftDetected && <SeverityBadge severity={log.driftSeverity!} />}
                  {log.correctionApplied && <span className="text-xs text-purple-400">✓ Corrected</span>}
                  <span className="text-xs text-text-secondary">{log.executionTimeMs}ms</span>
                  <div className="flex-1" />
                  {log.success ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />}
                  {expandedLogId === log.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>

                <AnimatePresence>
                  {expandedLogId === log.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-panel-dark/50 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="text-text-secondary mb-1">Input Hash</p>
                          <p className="font-mono text-text-primary">{log.inputHash}</p>
                        </div>
                        <div>
                          <p className="text-text-secondary mb-1">Output Hash</p>
                          <p className="font-mono text-text-primary">{log.outputHash}</p>
                        </div>
                        {log.driftDetails && (
                          <div className="col-span-2">
                            <p className="text-text-secondary mb-1">Drift Details</p>
                            <p className="text-amber-400">{log.driftDetails}</p>
                          </div>
                        )}
                        {log.correctionMethod && (
                          <div>
                            <p className="text-text-secondary mb-1">Correction Method</p>
                            <p className="text-purple-400">{log.correctionMethod}</p>
                          </div>
                        )}
                        {log.llmsUsed && (
                          <div>
                            <p className="text-text-secondary mb-1">LLMs Used</p>
                            <p className="text-text-primary">{log.llmsUsed.join(', ')}</p>
                          </div>
                        )}
                        {log.tokensConsumed && (
                          <div>
                            <p className="text-text-secondary mb-1">Tokens</p>
                            <p className="text-text-primary">{log.tokensConsumed.toLocaleString()}</p>
                          </div>
                        )}
                        {log.errorMessage && (
                          <div className="col-span-2">
                            <p className="text-text-secondary mb-1">Error</p>
                            <p className="text-red-400">{log.errorMessage}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER - SIMULATION TAB
  // ============================================================================

  const renderSimulation = () => (
    <div className="space-y-6">
      {/* Simulation Header */}
      <div className="p-6 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <FlaskConical size={28} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text-primary mb-1">Simulation Mode</h2>
            <p className="text-sm text-text-secondary mb-4">
              Test your workflow against the Logic Engine without executing it. See predicted drift risks,
              identify vulnerabilities, and optimize verification levels before going live.
            </p>
            <div className="flex items-center gap-3">
              <select
                value={simulationWorkflow || ''}
                onChange={(e) => setSimulationWorkflow(e.target.value || null)}
                className="px-4 py-2 bg-panel-dark border border-border rounded-lg"
              >
                <option value="">Select a workflow to test...</option>
                {uniqueWorkflows.map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
              </select>
              <button
                onClick={() => simulationWorkflow && runSimulation(simulationWorkflow)}
                disabled={!simulationWorkflow || simulationStatus === 'running'}
                className={cx(
                  'px-4 py-2 rounded-lg flex items-center gap-2 font-medium',
                  simulationWorkflow ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-panel-light text-text-secondary cursor-not-allowed'
                )}
              >
                {simulationStatus === 'running' ? (
                  <><RefreshCw size={16} className="animate-spin" />Analyzing...</>
                ) : (
                  <><Beaker size={16} />Run Simulation</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Results */}
      {simulationStatus === 'completed' && simulationResults.length > 0 && (
        <div className="space-y-4">
          {/* Overall Risk */}
          <div className="p-4 bg-panel-medium border border-border rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Target size={18} />
                Overall Risk Assessment
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">Overall Risk:</span>
                <span className={cx(
                  'text-2xl font-bold',
                  simulationResults.reduce((a, b) => a + b.predictedDriftRisk, 0) / simulationResults.length < 20 ? 'text-green-400' :
                  simulationResults.reduce((a, b) => a + b.predictedDriftRisk, 0) / simulationResults.length < 40 ? 'text-amber-400' : 'text-red-400'
                )}>
                  {(simulationResults.reduce((a, b) => a + b.predictedDriftRisk, 0) / simulationResults.length).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="h-3 bg-panel-dark rounded-full overflow-hidden">
              <div
                className={cx(
                  'h-full rounded-full transition-all',
                  simulationResults.reduce((a, b) => a + b.predictedDriftRisk, 0) / simulationResults.length < 20 ? 'bg-green-500' :
                  simulationResults.reduce((a, b) => a + b.predictedDriftRisk, 0) / simulationResults.length < 40 ? 'bg-amber-500' : 'bg-red-500'
                )}
                style={{ width: `${simulationResults.reduce((a, b) => a + b.predictedDriftRisk, 0) / simulationResults.length}%` }}
              />
            </div>
          </div>

          {/* Node-by-Node Results */}
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="p-3 bg-panel-medium border-b border-border">
              <h3 className="font-semibold text-text-primary">Node-by-Node Analysis</h3>
            </div>
            <div className="divide-y divide-border/50">
              {simulationResults.map(result => (
                <div key={result.nodeId} className="p-4 hover:bg-panel-light/50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-text-primary">{result.nodeName}</h4>
                      <p className="text-xs text-text-secondary">Est. execution: {result.estimatedExecutionTime}ms</p>
                    </div>
                    <div className="text-right">
                      <div className={cx(
                        'text-lg font-bold',
                        result.predictedDriftRisk < 15 ? 'text-green-400' :
                        result.predictedDriftRisk < 35 ? 'text-amber-400' : 'text-red-400'
                      )}>
                        {result.predictedDriftRisk}% risk
                      </div>
                      {result.wouldTriggerCorrection && (
                        <span className="text-xs text-purple-400">Would trigger correction</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Suggested Level</p>
                      <VerificationBadge level={result.suggestedVerificationLevel} />
                    </div>
                    {result.vulnerabilities.length > 0 && (
                      <div className="flex-1">
                        <p className="text-xs text-text-secondary mb-1">Vulnerabilities</p>
                        <div className="flex flex-wrap gap-1">
                          {result.vulnerabilities.map((v, i) => (
                            <span key={i} className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs rounded-full">{v}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <ThumbsUp size={20} className="text-green-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-400">Simulation Complete</h4>
                <p className="text-sm text-text-secondary mt-1">
                  Based on the analysis, this workflow should perform reliably with the suggested verification levels.
                  {simulationResults.filter(r => r.wouldTriggerCorrection).length > 0 && (
                    <span className="text-amber-400"> Note: {simulationResults.filter(r => r.wouldTriggerCorrection).length} node(s) may trigger drift correction during execution.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {simulationStatus === 'idle' && (
        <div className="p-12 text-center">
          <Beaker size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Simulation Results</h3>
          <p className="text-text-secondary">Select a workflow and run simulation to see predicted drift risks and recommendations.</p>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="flex flex-col h-full bg-panel-dark">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-panel-medium/50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-panel-light rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              Workflow Analytics
            </h1>
            <p className="text-xs text-text-secondary">Logic Engine usage logs & drift analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip content="Learn when to reduce verification or achieve independence">
            <button className="p-2 hover:bg-panel-light rounded-lg text-text-secondary">
              <HelpCircle size={18} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-panel-medium/30">
        {([
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'logs', label: 'Execution Logs', icon: FileText },
          { id: 'simulation', label: 'Test Mode', icon: FlaskConical },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab.id ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-panel-light'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'logs' && renderLogs()}
        {activeTab === 'simulation' && renderSimulation()}
      </div>
    </div>
  );
}
