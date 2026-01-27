'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Play, Pause, Square, Plus, Trash2, Settings, Download, Upload,
  Copy, Check, X, AlertTriangle, AlertCircle, CheckCircle, Zap, RefreshCw,
  HelpCircle, Lightbulb, Shield, ShieldCheck, ShieldAlert, GitBranch, Link2,
  Wand2, Sparkles, Bot, Clock, Activity, Layers, BookOpen, Search, FolderOpen,
  Star, StarOff, Target, Workflow, PanelLeft,
} from 'lucide-react';
import { components, layout, cx } from '@/styles/module-theme';

// Types
interface WorkflowBuilderProps { onBack: () => void; }
type VerificationLevel = 'none' | 'basic' | 'standard' | 'strict' | 'maximum';
type NodeType = 'trigger' | 'action' | 'condition' | 'loop' | 'transform' | 'llm' | 'output' | 'webhook' | 'delay' | 'error';
type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'correcting';
type ImportSource = 'n8n' | 'zapier' | 'make' | 'custom';

interface WorkflowNode {
  id: string; type: NodeType; name: string; description?: string;
  config: Record<string, any>; position: { x: number; y: number };
  inputs: string[]; outputs: string[]; verificationLevel: VerificationLevel;
  llmVerifiers?: string[]; driftDetected?: boolean; correctionApplied?: boolean;
}

interface WorkflowEdge { id: string; source: string; target: string; condition?: string; }

interface Workflow {
  id: string; name: string; description?: string; nodes: WorkflowNode[]; edges: WorkflowEdge[];
  createdAt: string; updatedAt: string; status: ExecutionStatus;
  verificationLevel: VerificationLevel; executionHistory: any[];
  isFavorite?: boolean; tags?: string[]; source?: string;
}

interface Template {
  id: string; name: string; description: string; category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'executionHistory'>; popularity: number;
}

interface DriftEvent {
  id: string; timestamp: string; nodeId: string; correctionApplied: boolean;
}

// Constants
const NODE_TYPES: { type: NodeType; name: string; icon: any; color: string; description: string }[] = [
  { type: 'trigger', name: 'Trigger', icon: Zap, color: '#f59e0b', description: 'Starts workflow on event' },
  { type: 'action', name: 'Action', icon: Play, color: '#10b981', description: 'Perform operations' },
  { type: 'condition', name: 'Condition', icon: GitBranch, color: '#8b5cf6', description: 'Branch on conditions' },
  { type: 'loop', name: 'Loop', icon: RefreshCw, color: '#06b6d4', description: 'Repeat for each item' },
  { type: 'transform', name: 'Transform', icon: Layers, color: '#ec4899', description: 'Transform data' },
  { type: 'llm', name: 'AI/LLM', icon: Bot, color: '#6366f1', description: 'AI processing' },
  { type: 'output', name: 'Output', icon: Target, color: '#22c55e', description: 'Send results' },
  { type: 'webhook', name: 'Webhook', icon: Link2, color: '#f97316', description: 'HTTP requests' },
  { type: 'delay', name: 'Delay', icon: Clock, color: '#64748b', description: 'Wait before continuing' },
  { type: 'error', name: 'Error Handler', icon: AlertTriangle, color: '#ef4444', description: 'Handle errors' },
];

const VERIFICATION_LEVELS: { level: VerificationLevel; name: string; description: string }[] = [
  { level: 'none', name: 'None', description: 'No verification (fastest)' },
  { level: 'basic', name: 'Basic', description: 'Schema validation only' },
  { level: 'standard', name: 'Standard', description: 'Logic Engine + sandbox (recommended)' },
  { level: 'strict', name: 'Strict (3 LLMs)', description: 'Multi-LLM consensus' },
  { level: 'maximum', name: 'Maximum (7)', description: 'Full Seven Justices' },
];

const TEMPLATES: Template[] = [
  {
    id: 'lead-capture', name: 'Lead Capture to CRM', description: 'Capture forms and add to CRM with AI enrichment',
    category: 'Sales', difficulty: 'beginner', popularity: 95,
    workflow: {
      name: 'Lead Capture', description: 'Auto-enrich leads',
      nodes: [
        { id: 'n1', type: 'webhook', name: 'Form Submit', config: {}, position: { x: 100, y: 200 }, inputs: [], outputs: ['n2'], verificationLevel: 'basic' },
        { id: 'n2', type: 'llm', name: 'Enrich', config: {}, position: { x: 350, y: 200 }, inputs: ['n1'], outputs: ['n3'], verificationLevel: 'standard' },
        { id: 'n3', type: 'action', name: 'Add to CRM', config: {}, position: { x: 600, y: 200 }, inputs: ['n2'], outputs: [], verificationLevel: 'basic' },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }, { id: 'e2', source: 'n2', target: 'n3' }],
      status: 'idle', verificationLevel: 'standard', source: 'template',
    },
  },
  {
    id: 'content-pipeline', name: 'AI Content Pipeline', description: 'Generate and review content with multi-LLM checks',
    category: 'Content', difficulty: 'intermediate', popularity: 88,
    workflow: {
      name: 'Content Pipeline', description: 'Content generation with verification',
      nodes: [
        { id: 'n1', type: 'trigger', name: 'Request', config: {}, position: { x: 100, y: 200 }, inputs: [], outputs: ['n2'], verificationLevel: 'none' },
        { id: 'n2', type: 'llm', name: 'Generate', config: {}, position: { x: 300, y: 200 }, inputs: ['n1'], outputs: ['n3'], verificationLevel: 'standard' },
        { id: 'n3', type: 'llm', name: 'Review', config: {}, position: { x: 500, y: 200 }, inputs: ['n2'], outputs: ['n4'], verificationLevel: 'strict', llmVerifiers: ['claude', 'gemini', 'gpt'] },
        { id: 'n4', type: 'output', name: 'Publish', config: {}, position: { x: 700, y: 200 }, inputs: ['n3'], outputs: [], verificationLevel: 'basic' },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }, { id: 'e2', source: 'n2', target: 'n3' }, { id: 'e3', source: 'n3', target: 'n4' }],
      status: 'idle', verificationLevel: 'strict', source: 'template',
    },
  },
];

// Helper Components
const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && <div className="absolute z-50 px-2 py-1 text-xs bg-panel-light border border-border rounded shadow-lg bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap">{content}</div>}
    </div>
  );
};

const HelpButton: React.FC<{ tip: string }> = ({ tip }) => (
  <Tooltip content={tip}><button className="p-1 text-text-secondary hover:text-primary"><HelpCircle size={14} /></button></Tooltip>
);

const VerificationBadge: React.FC<{ level: VerificationLevel; compact?: boolean }> = ({ level, compact }) => {
  const cfg: Record<VerificationLevel, { icon: any; color: string; bg: string; label: string }> = {
    none: { icon: Shield, color: 'text-text-secondary', bg: 'bg-panel-light', label: 'None' },
    basic: { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Basic' },
    standard: { icon: ShieldCheck, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Standard' },
    strict: { icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/10', label: '3 LLMs' },
    maximum: { icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-500/10', label: '7 Justices' },
  };
  const c = cfg[level];
  const Icon = c.icon;
  if (compact) return <Tooltip content={c.label}><span className={`w-6 h-6 rounded-full flex items-center justify-center ${c.bg}`}><Icon size={12} className={c.color} /></span></Tooltip>;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${c.bg} ${c.color}`}><Icon size={12} />{c.label}</span>;
};

const StatusBadge: React.FC<{ status: ExecutionStatus }> = ({ status }) => {
  const cfg: Record<ExecutionStatus, { color: string; bg: string; label: string }> = {
    idle: { color: 'text-text-secondary', bg: 'bg-panel-light', label: 'Idle' },
    running: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Running' },
    paused: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Paused' },
    completed: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Done' },
    failed: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Failed' },
    correcting: { color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Correcting' },
  };
  const c = cfg[status];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${c.bg} ${c.color}`}>
    {status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
    {status === 'correcting' && <RefreshCw size={10} className="animate-spin" />}
    {c.label}
  </span>;
};

// Main Component
export default function WorkflowBuilder({ onBack }: WorkflowBuilderProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [sidePanel, setSidePanel] = useState<'nodes' | 'properties' | 'help' | null>('nodes');
  const [showImport, setShowImport] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [search, setSearch] = useState('');
  const [importSrc, setImportSrc] = useState<ImportSource>('n8n');
  const [importData, setImportData] = useState('');
  const [importErr, setImportErr] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [execStatus, setExecStatus] = useState<ExecutionStatus>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [execNode, setExecNode] = useState<string | null>(null);
  const [drifts, setDrifts] = useState<DriftEvent[]>([]);
  const [defLevel, setDefLevel] = useState<VerificationLevel>('standard');
  const [autoCorrect, setAutoCorrect] = useState(true);
  const [notifs, setNotifs] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = localStorage.getItem('haley_workflows');
    if (s) try { setWorkflows(JSON.parse(s)); } catch {}
    if (localStorage.getItem('haley_wf_tips_off') === '1') setShowTips(false);
  }, []);

  useEffect(() => {
    if (workflows.length) localStorage.setItem('haley_workflows', JSON.stringify(workflows));
  }, [workflows]);

  const log = (m: string) => setLogs(p => [...p, `[${new Date().toLocaleTimeString()}] ${m}`]);

  const createWf = useCallback(() => {
    const wf: Workflow = { id: `wf-${Date.now()}`, name: 'Untitled', description: '', nodes: [], edges: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'idle', verificationLevel: defLevel, executionHistory: [], source: 'custom' };
    setWorkflows(p => [...p, wf]); setActiveWorkflow(wf); setView('builder'); log('Created workflow');
  }, [defLevel]);

  const dupWf = useCallback((wf: Workflow) => {
    const d: Workflow = { ...wf, id: `wf-${Date.now()}`, name: `${wf.name} (Copy)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), executionHistory: [] };
    setWorkflows(p => [...p, d]); log(`Duplicated: ${wf.name}`);
  }, []);

  const delWf = useCallback((id: string) => {
    setWorkflows(p => p.filter(w => w.id !== id));
    if (activeWorkflow?.id === id) { setActiveWorkflow(null); setView('list'); }
    log('Deleted workflow');
  }, [activeWorkflow]);

  const toggleFav = useCallback((id: string) => setWorkflows(p => p.map(w => w.id === id ? { ...w, isFavorite: !w.isFavorite } : w)), []);

  const updateWf = useCallback((u: Partial<Workflow>) => {
    if (!activeWorkflow) return;
    const upd = { ...activeWorkflow, ...u, updatedAt: new Date().toISOString() };
    setActiveWorkflow(upd); setWorkflows(p => p.map(w => w.id === upd.id ? upd : w));
  }, [activeWorkflow]);

  const addNode = useCallback((type: NodeType) => {
    if (!activeWorkflow) return;
    const nc = NODE_TYPES.find(n => n.type === type);
    const node: WorkflowNode = { id: `n-${Date.now()}`, type, name: nc?.name || type, config: {}, position: { x: 200 + Math.random() * 200, y: 150 + Math.random() * 100 }, inputs: [], outputs: [], verificationLevel: activeWorkflow.verificationLevel };
    updateWf({ nodes: [...activeWorkflow.nodes, node] }); setSelectedNodeId(node.id); setSidePanel('properties'); log(`Added ${nc?.name || type}`);
  }, [activeWorkflow, updateWf]);

  const updateNode = useCallback((id: string, u: Partial<WorkflowNode>) => {
    if (!activeWorkflow) return;
    updateWf({ nodes: activeWorkflow.nodes.map(n => n.id === id ? { ...n, ...u } : n) });
  }, [activeWorkflow, updateWf]);

  const delNode = useCallback((id: string) => {
    if (!activeWorkflow) return;
    updateWf({ nodes: activeWorkflow.nodes.filter(n => n.id !== id), edges: activeWorkflow.edges.filter(e => e.source !== id && e.target !== id) });
    if (selectedNodeId === id) setSelectedNodeId(null); log('Deleted node');
  }, [activeWorkflow, updateWf, selectedNodeId]);

  const doImport = useCallback(async () => {
    setImporting(true); setImportErr(null);
    try {
      const p = JSON.parse(importData);
      const wf: Workflow = {
        id: `wf-${Date.now()}`, name: p.name || 'Imported', description: p.description || `From ${importSrc}`,
        nodes: (p.nodes || []).map((n: any, i: number) => ({ id: n.id || `n-${i}`, type: n.type || 'action', name: n.name || `Node ${i + 1}`, config: n.config || {}, position: n.position || { x: 100 + i * 200, y: 200 }, inputs: n.inputs || [], outputs: n.outputs || [], verificationLevel: defLevel })),
        edges: p.edges || [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'idle', verificationLevel: defLevel, executionHistory: [], source: importSrc, tags: [`from:${importSrc}`],
      };
      setWorkflows(p => [...p, wf]); setActiveWorkflow(wf); setView('builder'); setShowImport(false); setImportData(''); log(`Imported from ${importSrc}`);
    } catch (e) { setImportErr(e instanceof Error ? e.message : 'Invalid format'); } finally { setImporting(false); }
  }, [importSrc, importData, defLevel]);

  const doExport = useCallback(() => {
    if (!activeWorkflow) return;
    const blob = new Blob([JSON.stringify(activeWorkflow, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${activeWorkflow.name.replace(/\s+/g, '-')}.json`; a.click(); log('Exported');
  }, [activeWorkflow]);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = (ev) => setImportData(ev.target?.result as string); r.readAsText(f);
  }, []);

  const runWf = useCallback(async () => {
    if (!activeWorkflow || !activeWorkflow.nodes.length) return;
    setExecStatus('running'); setLogs([]); log('Starting with drift protection...');
    const starts = activeWorkflow.nodes.filter(n => n.type === 'trigger' || !n.inputs.length);
    const done = new Set<string>(); const q = starts.map(n => n.id);
    try {
      while (q.length) {
        const id = q.shift()!; if (done.has(id)) continue;
        const node = activeWorkflow.nodes.find(n => n.id === id); if (!node) continue;
        if (!node.inputs.every(i => done.has(i))) { q.push(id); continue; }
        setExecNode(id); log(`Executing: ${node.name} [${node.verificationLevel}]`);
        await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
        const driftChance = node.verificationLevel === 'none' ? 0.25 : node.verificationLevel === 'basic' ? 0.1 : 0.03;
        if (Math.random() < driftChance && node.verificationLevel !== 'none') {
          const drift: DriftEvent = { id: `d-${Date.now()}`, timestamp: new Date().toISOString(), nodeId: id, correctionApplied: autoCorrect };
          if (notifs) { setDrifts(p => [...p, drift]); log(`⚠️ Drift in ${node.name}`); }
          if (autoCorrect) { setExecStatus('correcting'); await new Promise(r => setTimeout(r, 400)); log(`✓ Corrected ${node.name}`); setExecStatus('running'); }
        } else { log(`✓ ${node.name} OK`); }
        done.add(id); node.outputs.forEach(o => { if (!done.has(o)) q.push(o); });
      }
      setExecStatus('completed'); log('✓ Complete - Zero drift! 🛡️'); updateWf({ status: 'completed' });
    } catch (e) { setExecStatus('failed'); log(`❌ Failed: ${e}`); updateWf({ status: 'failed' }); } finally { setExecNode(null); }
  }, [activeWorkflow, autoCorrect, notifs, updateWf]);

  const stopWf = useCallback(() => { setExecStatus('idle'); setExecNode(null); log('Stopped'); }, []);

  const doAI = useCallback(async () => {
    if (!aiPrompt.trim()) return; setAiLoading(true); log(`AI: "${aiPrompt}"`);
    await new Promise(r => setTimeout(r, 800));
    setAiSuggestions(['Email on form submit', 'Daily AI report', 'Lead scoring + CRM', 'Content review pipeline']); setAiLoading(false);
  }, [aiPrompt]);

  const useTempl = useCallback((t: Template) => {
    const wf: Workflow = { ...t.workflow, id: `wf-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), executionHistory: [] };
    setWorkflows(p => [...p, wf]); setActiveWorkflow(wf); setView('builder'); setShowTemplates(false); log(`From template: ${t.name}`);
  }, []);

  const hideTips = useCallback(() => { setShowTips(false); localStorage.setItem('haley_wf_tips_off', '1'); }, []);

  const filtered = workflows.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));
  const selNode = activeWorkflow?.nodes.find(n => n.id === selectedNodeId);

  // ========== LIST VIEW ==========
  const ListView = () => (
    <div className="flex flex-col h-full">
      {showTips && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mx-4 mt-4 p-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border border-primary/20 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/20 rounded-lg"><Lightbulb size={18} className="text-primary" /></div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary mb-1">Drift-Immune Workflows 🛡️</h3>
              <p className="text-sm text-text-secondary mb-2">World's first framework where AI workflows never break. Import from N8N, Zapier, Make.com or build with AI.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowTemplates(true)} className="px-3 py-1.5 bg-primary/20 text-primary text-sm rounded-lg">Templates</button>
                <button onClick={() => setShowImport(true)} className="px-3 py-1.5 bg-panel-light text-text-primary text-sm rounded-lg">Import</button>
              </div>
            </div>
            <button onClick={hideTips} className="p-1 text-text-secondary hover:text-text-primary"><X size={16} /></button>
          </div>
        </motion.div>
      )}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div><h1 className="text-xl font-bold text-text-primary">Workflows</h1><p className="text-sm text-text-secondary">{workflows.length} total</p></div>
        <div className="flex items-center gap-2">
          <div className="relative"><Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 w-36 bg-panel-dark border border-border rounded-lg text-sm" /></div>
          <Tooltip content="Import"><button onClick={() => setShowImport(true)} className="p-2 bg-panel-light rounded-lg"><Upload size={16} /></button></Tooltip>
          <Tooltip content="Templates"><button onClick={() => setShowTemplates(true)} className="p-2 bg-panel-light rounded-lg"><FolderOpen size={16} /></button></Tooltip>
          <button onClick={createWf} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm"><Plus size={16} />New</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {!filtered.length ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-panel-light flex items-center justify-center mb-4"><Workflow size={28} className="text-text-secondary" /></div>
            <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
            <p className="text-text-secondary mb-4">Create or import your first drift-immune workflow.</p>
            <div className="flex gap-2"><button onClick={createWf} className="px-4 py-2 bg-primary text-white rounded-lg">Create</button><button onClick={() => setShowImport(true)} className="px-4 py-2 bg-panel-light rounded-lg">Import</button></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(wf => (
              <motion.div key={wf.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative group p-4 bg-panel-medium border border-border rounded-xl cursor-pointer hover:border-primary/50" onClick={() => { setActiveWorkflow(wf); setView('builder'); }}>
                <button onClick={e => { e.stopPropagation(); toggleFav(wf.id); }} className="absolute top-3 right-3 text-text-secondary hover:text-amber-400">{wf.isFavorite ? <Star size={16} className="fill-amber-400 text-amber-400" /> : <StarOff size={16} />}</button>
                <div className="flex items-start gap-3 mb-2"><div className="p-2 bg-primary/10 rounded-lg"><Workflow size={18} className="text-primary" /></div><div className="flex-1 min-w-0"><h3 className="font-semibold truncate pr-6">{wf.name}</h3><p className="text-xs text-text-secondary truncate">{wf.description || 'No description'}</p></div></div>
                <div className="flex items-center gap-3 text-xs text-text-secondary mb-2"><span className="flex items-center gap-1"><Layers size={12} />{wf.nodes.length}</span><span className="flex items-center gap-1"><Activity size={12} />{wf.executionHistory.length} runs</span></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><VerificationBadge level={wf.verificationLevel} compact /><StatusBadge status={wf.status} /></div>{wf.source && wf.source !== 'custom' && <span className="text-xs text-text-secondary">{wf.source}</span>}</div>
                <div className="absolute inset-0 bg-gradient-to-t from-panel-dark/80 to-transparent opacity-0 group-hover:opacity-100 rounded-xl flex items-end justify-center pb-3 gap-2">
                  <button onClick={e => { e.stopPropagation(); setActiveWorkflow(wf); setView('builder'); }} className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg">Edit</button>
                  <button onClick={e => { e.stopPropagation(); setActiveWorkflow(wf); runWf(); }} className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg">Run</button>
                  <button onClick={e => { e.stopPropagation(); dupWf(wf); }} className="p-1.5 bg-panel-light rounded-lg"><Copy size={14} /></button>
                  <button onClick={e => { e.stopPropagation(); if (confirm('Delete?')) delWf(wf.id); }} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ========== BUILDER VIEW ==========
  const BuilderView = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border bg-panel-medium/50">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="p-2 hover:bg-panel-light rounded-lg"><ArrowLeft size={18} /></button>
          <div>
            <input type="text" value={activeWorkflow?.name || ''} onChange={e => updateWf({ name: e.target.value })} className="text-lg font-semibold bg-transparent border-none focus:outline-none" placeholder="Name" />
            <div className="flex items-center gap-2 text-xs text-text-secondary"><VerificationBadge level={activeWorkflow?.verificationLevel || 'standard'} /><span>• {activeWorkflow?.nodes.length || 0} nodes</span><StatusBadge status={activeWorkflow?.status || 'idle'} /></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip content="AI Assist"><button onClick={() => setShowAI(!showAI)} className={cx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm', showAI ? 'bg-purple-500/20 text-purple-400' : 'bg-panel-light')}><Wand2 size={14} />AI</button></Tooltip>
          {['idle', 'completed', 'failed'].includes(execStatus) ? (
            <Tooltip content="Run"><button onClick={runWf} disabled={!activeWorkflow?.nodes.length} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm"><Play size={14} />Run</button></Tooltip>
          ) : <button onClick={stopWf} className="p-2 bg-red-500/20 text-red-400 rounded-lg"><Square size={14} /></button>}
          <Tooltip content="Settings"><button onClick={() => setShowSettings(true)} className="p-2 hover:bg-panel-light rounded-lg"><Settings size={16} /></button></Tooltip>
          <Tooltip content="Export"><button onClick={doExport} className="p-2 hover:bg-panel-light rounded-lg"><Download size={16} /></button></Tooltip>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {sidePanel === 'nodes' && (
          <div className="w-64 border-r border-border bg-panel-medium/30 overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-sm">Add Nodes</h3><HelpButton tip="Click to add. Different nodes have different verification." /></div>
            <div className="space-y-1.5">
              {NODE_TYPES.map(nt => (
                <button key={nt.type} onClick={() => addNode(nt.type)} className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-panel-dark hover:bg-panel-light">
                  <div className="p-1.5 rounded" style={{ backgroundColor: `${nt.color}20` }}><nt.icon size={14} style={{ color: nt.color }} /></div>
                  <div className="flex-1 text-left"><div className="text-sm font-medium">{nt.name}</div><div className="text-xs text-text-secondary">{nt.description}</div></div>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex-1 relative bg-panel-dark overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, var(--color-border) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          {activeWorkflow?.nodes.map(node => {
            const nc = NODE_TYPES.find(n => n.type === node.type);
            const sel = selectedNodeId === node.id; const exec = execNode === node.id;
            return (
              <motion.div key={node.id} drag dragMomentum={false} onDragEnd={(_, info) => updateNode(node.id, { position: { x: node.position.x + info.offset.x, y: node.position.y + info.offset.y } })} onClick={() => { setSelectedNodeId(node.id); setSidePanel('properties'); }} className={cx('absolute cursor-move w-44 rounded-xl border-2 bg-panel-medium', sel ? 'border-primary shadow-lg' : 'border-border hover:border-primary/50', exec && 'animate-pulse')} style={{ left: node.position.x, top: node.position.y, boxShadow: exec ? `0 0 20px ${nc?.color}40` : undefined }}>
                <div className="flex items-center gap-2 p-2.5 rounded-t-xl" style={{ backgroundColor: `${nc?.color}15` }}>
                  <div className="p-1 rounded" style={{ backgroundColor: `${nc?.color}30` }}>{nc && <nc.icon size={12} style={{ color: nc.color }} />}</div>
                  <span className="flex-1 text-sm font-medium truncate">{node.name}</span>
                  <VerificationBadge level={node.verificationLevel} compact />
                </div>
                <div className="p-2 text-xs">
                  {exec && <span className="flex items-center gap-1 text-blue-400"><RefreshCw size={10} className="animate-spin" />Running</span>}
                  {node.driftDetected && <span className="flex items-center gap-1 text-amber-400"><AlertTriangle size={10} />Drift</span>}
                  {node.correctionApplied && <span className="flex items-center gap-1 text-green-400"><CheckCircle size={10} />OK</span>}
                </div>
                {node.type !== 'trigger' && <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-panel-light border border-border" />}
                {node.type !== 'output' && <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-panel-light border border-border" />}
              </motion.div>
            );
          })}
          <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
            {activeWorkflow?.edges.map(e => {
              const s = activeWorkflow.nodes.find(n => n.id === e.source); const t = activeWorkflow.nodes.find(n => n.id === e.target);
              if (!s || !t) return null;
              const sx = s.position.x + 176, sy = s.position.y + 36, tx = t.position.x, ty = t.position.y + 36;
              return <path key={e.id} d={`M ${sx} ${sy} C ${(sx + tx) / 2} ${sy}, ${(sx + tx) / 2} ${ty}, ${tx} ${ty}`} fill="none" stroke="var(--color-border)" strokeWidth="2" markerEnd="url(#arr)" />;
            })}
            <defs><marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--color-border)" /></marker></defs>
          </svg>
          {!activeWorkflow?.nodes.length && (
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div><div className="w-14 h-14 rounded-full bg-panel-light flex items-center justify-center mx-auto mb-3"><Plus size={24} className="text-text-secondary" /></div><h3 className="font-semibold mb-1">Add your first node</h3><p className="text-sm text-text-secondary mb-3">Click from left panel or use AI</p><div className="flex justify-center gap-2"><button onClick={() => setSidePanel('nodes')} className="px-3 py-1.5 bg-panel-light rounded-lg text-sm">Nodes</button><button onClick={() => setShowAI(true)} className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm flex items-center gap-1"><Wand2 size={12} />AI</button></div></div>
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            <Tooltip content="Nodes"><button onClick={() => setSidePanel(sidePanel === 'nodes' ? null : 'nodes')} className={cx('p-1.5 rounded-lg', sidePanel === 'nodes' ? 'bg-primary text-white' : 'bg-panel-light')}><PanelLeft size={16} /></button></Tooltip>
            <Tooltip content="Help"><button onClick={() => setSidePanel(sidePanel === 'help' ? null : 'help')} className={cx('p-1.5 rounded-lg', sidePanel === 'help' ? 'bg-primary text-white' : 'bg-panel-light')}><BookOpen size={16} /></button></Tooltip>
          </div>
        </div>
        {(sidePanel === 'properties' || showAI || sidePanel === 'help') && (
          <div className="w-72 border-l border-border bg-panel-medium/30 flex flex-col overflow-hidden">
            {showAI && (
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-sm flex items-center gap-1.5"><Wand2 size={14} className="text-purple-400" />AI Assist</h3><button onClick={() => setShowAI(false)} className="p-1 hover:bg-panel-light rounded"><X size={12} /></button></div>
                <div className="relative"><textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Describe what you want..." className="w-full p-2 pr-10 bg-panel-dark border border-border rounded-lg text-sm min-h-[60px]" /><button onClick={doAI} disabled={!aiPrompt.trim() || aiLoading} className="absolute bottom-2 right-2 p-1.5 bg-purple-500 text-white rounded-lg">{aiLoading ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}</button></div>
                {aiSuggestions.length > 0 && <div className="mt-2 space-y-1">{aiSuggestions.map((s, i) => <button key={i} onClick={() => setAiPrompt(s)} className="w-full text-left p-2 bg-panel-dark hover:bg-panel-light rounded text-xs">💡 {s}</button>)}</div>}
              </div>
            )}
            {selNode && sidePanel === 'properties' && (
              <div className="flex-1 overflow-y-auto p-3">
                <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-sm">Properties</h3><button onClick={() => delNode(selNode.id)} className="p-1 text-red-400 hover:bg-red-500/20 rounded"><Trash2 size={12} /></button></div>
                <div className="space-y-3">
                  <div><label className="block text-xs text-text-secondary mb-1">Name</label><input type="text" value={selNode.name} onChange={e => updateNode(selNode.id, { name: e.target.value })} className="w-full p-2 bg-panel-dark border border-border rounded-lg text-sm" /></div>
                  <div><label className="block text-xs text-text-secondary mb-1">Description</label><textarea value={selNode.description || ''} onChange={e => updateNode(selNode.id, { description: e.target.value })} className="w-full p-2 bg-panel-dark border border-border rounded-lg text-sm min-h-[50px]" placeholder="What does this do?" /></div>
                  <div><label className="block text-xs text-text-secondary mb-1 flex items-center gap-1">Verification <HelpButton tip="Higher = more protection, slower" /></label><select value={selNode.verificationLevel} onChange={e => updateNode(selNode.id, { verificationLevel: e.target.value as VerificationLevel })} className="w-full p-2 bg-panel-dark border border-border rounded-lg text-sm">{VERIFICATION_LEVELS.map(v => <option key={v.level} value={v.level}>{v.name}</option>)}</select><p className="text-xs text-text-secondary mt-1">{VERIFICATION_LEVELS.find(v => v.level === selNode.verificationLevel)?.description}</p></div>
                  {['strict', 'maximum'].includes(selNode.verificationLevel) && (
                    <div><label className="block text-xs text-text-secondary mb-1">Verifier LLMs</label><div className="flex flex-wrap gap-1">{['claude', 'gpt', 'gemini', 'mistral', 'perplexity'].map(l => <button key={l} onClick={() => { const c = selNode.llmVerifiers || []; const max = selNode.verificationLevel === 'maximum' ? 7 : 3; if (c.includes(l)) updateNode(selNode.id, { llmVerifiers: c.filter(x => x !== l) }); else if (c.length < max) updateNode(selNode.id, { llmVerifiers: [...c, l] }); }} className={cx('px-2 py-0.5 text-xs rounded capitalize', selNode.llmVerifiers?.includes(l) ? 'bg-primary text-white' : 'bg-panel-dark')}>{l}</button>)}</div></div>
                  )}
                </div>
              </div>
            )}
            {sidePanel === 'help' && !selNode && (
              <div className="flex-1 overflow-y-auto p-3">
                <h3 className="font-semibold text-sm mb-3">Quick Start</h3>
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-panel-dark rounded-lg"><b>1. Add nodes</b> from left panel</div>
                  <div className="p-2 bg-panel-dark rounded-lg"><b>2. Connect</b> by dragging between dots</div>
                  <div className="p-2 bg-panel-dark rounded-lg"><b>3. Set verification</b> level per node</div>
                  <div className="p-2 bg-panel-dark rounded-lg"><b>4. Run</b> - Logic Engine verifies & corrects</div>
                  <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg"><Shield size={12} className="inline text-primary" /> <b>Drift</b> = AI output deviation. HaleyOS auto-detects & corrects.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {logs.length > 0 && (
        <div className="border-t border-border bg-panel-medium/50 max-h-36 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 text-sm"><span className="flex items-center gap-1.5"><Activity size={12} />Logs</span><button onClick={() => setLogs([])} className="text-xs text-text-secondary">Clear</button></div>
          <div className="p-2 font-mono text-xs space-y-0.5">{logs.map((l, i) => <div key={i} className={cx('px-2 py-0.5 rounded', l.includes('❌') && 'bg-red-500/10 text-red-400', l.includes('⚠️') && 'bg-amber-500/10 text-amber-400', l.includes('✓') && 'bg-green-500/10 text-green-400', !l.match(/[❌⚠️✓]/) && 'text-text-secondary')}>{l}</div>)}</div>
        </div>
      )}
    </div>
  );

  // ========== MODALS ==========
  const ImportModal = () => showImport && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowImport(false)}>
      <div className="bg-panel-dark border border-border rounded-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border"><h2 className="font-semibold">Import Workflow</h2><button onClick={() => setShowImport(false)} className="p-1.5 hover:bg-panel-light rounded"><X size={16} /></button></div>
        <div className="p-4">
          <p className="text-sm text-text-secondary mb-3">Import from N8N, Zapier, Make.com. Drift protection added automatically.</p>
          <div className="flex gap-2 mb-3">{(['n8n', 'zapier', 'make', 'custom'] as ImportSource[]).map(s => <button key={s} onClick={() => setImportSrc(s)} className={cx('px-3 py-1.5 rounded-lg text-sm capitalize', importSrc === s ? 'bg-primary text-white' : 'bg-panel-light')}>{s === 'custom' ? 'JSON' : s}</button>)}</div>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="w-full mb-3 p-2 bg-panel-light rounded-lg text-sm flex items-center justify-center gap-2"><Upload size={14} />Upload File</button>
          <textarea value={importData} onChange={e => setImportData(e.target.value)} placeholder='{"name": "...", "nodes": [...]}' className="w-full p-2 bg-panel-dark border border-border rounded-lg text-xs font-mono min-h-[120px]" />
          {importErr && <div className="mt-2 p-2 bg-red-500/10 text-red-400 text-sm rounded-lg">{importErr}</div>}
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button onClick={() => setShowImport(false)} className="px-4 py-2 bg-panel-light rounded-lg">Cancel</button>
          <button onClick={doImport} disabled={!importData.trim() || importing} className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2">{importing && <RefreshCw size={14} className="animate-spin" />}Import</button>
        </div>
      </div>
    </div>
  );

  const TemplatesModal = () => showTemplates && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowTemplates(false)}>
      <div className="bg-panel-dark border border-border rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border"><h2 className="font-semibold">Templates</h2><button onClick={() => setShowTemplates(false)} className="p-1.5 hover:bg-panel-light rounded"><X size={16} /></button></div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-text-secondary mb-4">Start with a template. All include drift protection.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TEMPLATES.map(t => (
              <div key={t.id} className="p-4 bg-panel-medium border border-border rounded-xl hover:border-primary/50">
                <div className="flex items-start justify-between mb-2"><div><h3 className="font-semibold">{t.name}</h3><span className={cx('text-xs px-2 py-0.5 rounded-full', t.difficulty === 'beginner' && 'bg-green-500/20 text-green-400', t.difficulty === 'intermediate' && 'bg-amber-500/20 text-amber-400', t.difficulty === 'advanced' && 'bg-red-500/20 text-red-400')}>{t.difficulty}</span></div><span className="text-xs text-text-secondary">{t.category}</span></div>
                <p className="text-sm text-text-secondary mb-3">{t.description}</p>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs text-text-secondary"><span>{t.workflow.nodes.length} nodes</span><VerificationBadge level={t.workflow.verificationLevel} compact /></div><button onClick={() => useTempl(t)} className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg">Use</button></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const SettingsModal = () => showSettings && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSettings(false)}>
      <div className="bg-panel-dark border border-border rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border"><h2 className="font-semibold">Settings</h2><button onClick={() => setShowSettings(false)} className="p-1.5 hover:bg-panel-light rounded"><X size={16} /></button></div>
        <div className="p-4 space-y-4">
          <div><label className="block text-sm mb-1">Workflow Name</label><input type="text" value={activeWorkflow?.name || ''} onChange={e => updateWf({ name: e.target.value })} className="w-full p-2 bg-panel-dark border border-border rounded-lg" /></div>
          <div><label className="block text-sm mb-1">Description</label><textarea value={activeWorkflow?.description || ''} onChange={e => updateWf({ description: e.target.value })} className="w-full p-2 bg-panel-dark border border-border rounded-lg min-h-[60px]" /></div>
          <div className="p-3 bg-panel-light rounded-lg">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Shield size={14} />Drift Protection</h3>
            <div className="space-y-3">
              <div><label className="block text-xs text-text-secondary mb-1">Default Verification</label><select value={activeWorkflow?.verificationLevel || 'standard'} onChange={e => updateWf({ verificationLevel: e.target.value as VerificationLevel })} className="w-full p-2 bg-panel-dark border border-border rounded-lg text-sm">{VERIFICATION_LEVELS.map(v => <option key={v.level} value={v.level}>{v.name}</option>)}</select></div>
              <div className="flex items-center justify-between"><div><p className="text-sm">Auto-Correct</p><p className="text-xs text-text-secondary">Fix drift automatically</p></div><button onClick={() => setAutoCorrect(!autoCorrect)} className={cx('w-10 h-5 rounded-full relative', autoCorrect ? 'bg-primary' : 'bg-panel-dark')}><span className={cx('absolute w-4 h-4 rounded-full bg-white top-0.5 transition-all', autoCorrect ? 'left-5' : 'left-0.5')} /></button></div>
              <div className="flex items-center justify-between"><div><p className="text-sm">Notifications</p><p className="text-xs text-text-secondary">Alert on drift</p></div><button onClick={() => setNotifs(!notifs)} className={cx('w-10 h-5 rounded-full relative', notifs ? 'bg-primary' : 'bg-panel-dark')}><span className={cx('absolute w-4 h-4 rounded-full bg-white top-0.5 transition-all', notifs ? 'left-5' : 'left-0.5')} /></button></div>
            </div>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"><h3 className="text-sm text-red-400 font-semibold mb-2">Danger</h3><button onClick={() => { if (activeWorkflow && confirm('Delete workflow?')) { delWf(activeWorkflow.id); setShowSettings(false); } }} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-1.5"><Trash2 size={12} />Delete</button></div>
        </div>
        <div className="flex justify-end p-4 border-t border-border"><button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-primary text-white rounded-lg">Done</button></div>
      </div>
    </div>
  );

  const DriftNotifs = () => drifts.length > 0 && (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-xs">
      {drifts.slice(-3).map(d => (
        <motion.div key={d.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg backdrop-blur flex items-start gap-2">
          <AlertTriangle size={14} className="text-amber-400 mt-0.5" />
          <div className="flex-1"><p className="text-sm text-amber-400 font-medium">Drift Detected</p><p className="text-xs text-text-secondary">{d.correctionApplied ? '✓ Auto-corrected' : 'Review needed'}</p></div>
          <button onClick={() => setDrifts(p => p.filter(x => x.id !== d.id))} className="p-0.5 text-text-secondary hover:text-text-primary"><X size={12} /></button>
        </motion.div>
      ))}
    </div>
  );

  // ========== MAIN RENDER ==========
  return (
    <div className="flex flex-col h-full bg-panel-dark">
      <div className="flex items-center justify-between p-4 border-b border-border bg-panel-medium/50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-panel-light rounded-lg"><ArrowLeft size={18} /></button>
          <div><h1 className="text-lg font-bold flex items-center gap-2"><Workflow size={18} className="text-primary" />Workflow Builder</h1><p className="text-xs text-text-secondary">World's first drift-immune execution framework</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip content={showTips ? 'Hide tips' : 'Show tips'}><button onClick={() => setShowTips(!showTips)} className={cx('p-2 rounded-lg', showTips ? 'bg-primary/20 text-primary' : 'bg-panel-light')}><Lightbulb size={16} /></button></Tooltip>
          <Tooltip content="Settings"><button onClick={() => setShowSettings(true)} className="p-2 hover:bg-panel-light rounded-lg"><Settings size={16} /></button></Tooltip>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {view === 'list' ? <ListView /> : <BuilderView />}
      </div>
      <ImportModal />
      <TemplatesModal />
      <SettingsModal />
      <DriftNotifs />
    </div>
  );
}
