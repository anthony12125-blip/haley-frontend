'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Scale, FileText, Users, Calendar, Search,
  ChevronRight, CheckCircle, Circle, Clock, AlertTriangle,
  Upload, Download, Plus, X, Gavel, MapPin, Shield,
  Eye, EyeOff, ChevronDown, ChevronUp, Filter, RefreshCw,
  FileQuestion, Briefcase, Target, Zap, BookOpen, UserCheck,
  Building, Phone, Mail, Globe, AlertCircle, Info, Lock
} from 'lucide-react';

interface LegalWorkflowProps {
  onBack: () => void;
}

// Types
interface Delta {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'awaiting_input' | 'completed' | 'skipped';
  required: boolean;
  multi_llm_verify: boolean;
  has_questions?: boolean;
}

interface Phase {
  id: string;
  name: string;
  progress: number;
  deltas: Delta[];
  is_current?: boolean;
}

interface Case {
  id: string;
  title: string;
  case_type: string;
  status: string;
  progress: number;
  created_at: string;
  pending_delta?: string;
}

interface Party {
  id: string;
  name: string;
  role: string;
  organization?: string;
}

interface Document {
  id: string;
  filename: string;
  category: string;
  summary: string;
  date_added: string;
  tags: string[];
}

interface Deadline {
  id: string;
  name: string;
  due_date: string;
  status: string;
}

interface Conflict {
  party1_id: string;
  party2_id: string;
  relationship_type: string;
  risk_level: string;
}

type Tab = 'overview' | 'deltas' | 'discovery' | 'documents' | 'analysis' | 'counsel';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const CASE_TYPES = [
  { id: 'civil', name: 'Civil', icon: Scale },
  { id: 'criminal', name: 'Criminal', icon: Gavel },
  { id: 'family', name: 'Family', icon: Users },
  { id: 'employment', name: 'Employment', icon: Briefcase },
  { id: 'personal_injury', name: 'Personal Injury', icon: AlertTriangle },
  { id: 'contract', name: 'Contract', icon: FileText },
  { id: 'property', name: 'Property', icon: Building },
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

// Delta Status Badge Component
function DeltaStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    completed: { color: 'text-green-400 bg-green-400/10', icon: <CheckCircle size={14} />, label: 'Complete' },
    in_progress: { color: 'text-blue-400 bg-blue-400/10', icon: <Clock size={14} />, label: 'In Progress' },
    awaiting_input: { color: 'text-amber-400 bg-amber-400/10', icon: <FileQuestion size={14} />, label: 'Awaiting Input' },
    pending: { color: 'text-gray-500 bg-gray-500/10', icon: <Circle size={14} />, label: 'Pending' },
    skipped: { color: 'text-gray-400 bg-gray-400/10', icon: <EyeOff size={14} />, label: 'Skipped' },
  };
  
  const { color, icon, label } = config[status] || config.pending;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {icon} {label}
    </span>
  );
}

// Progress Ring Component
function ProgressRing({ progress, size = 60, strokeWidth = 6 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-panel-light"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-primary transition-all duration-500"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

export default function LegalWorkflow({ onBack }: LegalWorkflowProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Case state
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [deltaMap, setDeltaMap] = useState<Phase[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  
  // UI state
  const [showNewCase, setShowNewCase] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['INTAKE']));
  const [selectedDelta, setSelectedDelta] = useState<Delta | null>(null);
  const [showDeltaModal, setShowDeltaModal] = useState(false);
  
  // Form state
  const [newCaseForm, setNewCaseForm] = useState({
    title: '',
    case_type: 'civil',
    state: '',
    county: '',
    court_type: 'state',
  });
  
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  
  const userId = getUserId();
  
  // Fetch cases on mount
  useEffect(() => {
    fetchCases();
  }, []);
  
  // Fetch delta map when case changes
  useEffect(() => {
    if (activeCase) {
      fetchDeltaMap();
      fetchDocuments();
      fetchDeadlines();
    }
  }, [activeCase?.id]);
  
  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/modules/legalworkflow/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_cases', params: { user_id: userId } }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.result?.cases) {
          setCases(data.result.cases);
        }
      }
    } catch (err) {
      console.error('Error fetching cases:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDeltaMap = async () => {
    if (!activeCase) return;
    
    try {
      const response = await fetch(`${API_BASE}/modules/legalworkflow/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_delta_map', params: { case_id: activeCase.id } }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.result?.delta_map) {
          setDeltaMap(data.result.delta_map);
        }
      }
    } catch (err) {
      console.error('Error fetching delta map:', err);
    }
  };
  
  const fetchDocuments = async () => {
    if (!activeCase) return;
    
    try {
      const response = await fetch(`${API_BASE}/modules/legalworkflow/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'summarize_documents', params: { case_id: activeCase.id } }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.result?.summaries) {
          setDocuments(data.result.summaries);
        }
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };
  
  const fetchDeadlines = async () => {
    if (!activeCase) return;
    
    try {
      const response = await fetch(`${API_BASE}/modules/legalworkflow/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_calendar_events', params: { case_id: activeCase.id } }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.result?.events) {
          setDeadlines(data.result.events);
        }
      }
    } catch (err) {
      console.error('Error fetching deadlines:', err);
    }
  };
  
  const createCase = async () => {
    if (!newCaseForm.title) {
      setError('Please enter a case title');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/modules/legalworkflow/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_case',
          params: {
            user_id: userId,
            title: newCaseForm.title,
            case_type: newCaseForm.case_type,
            jurisdiction: {
              state: newCaseForm.state,
              county: newCaseForm.county,
              court_type: newCaseForm.court_type,
            },
          },
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.result?.case_id) {
          setSuccess('Case created successfully');
          setShowNewCase(false);
          setNewCaseForm({ title: '', case_type: 'civil', state: '', county: '', court_type: 'state' });
          await fetchCases();
          // Select the new case
          setActiveCase({ id: data.result.case_id, title: newCaseForm.title, case_type: newCaseForm.case_type, status: 'active', progress: 0, created_at: new Date().toISOString() });
        }
      } else {
        setError('Failed to create case');
      }
    } catch (err) {
      setError('Failed to create case');
    } finally {
      setLoading(false);
    }
  };
  
  const advanceDelta = async (deltaId: string, data: Record<string, any> = {}) => {
    if (!activeCase) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/modules/legalworkflow/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'advance_delta',
          params: { case_id: activeCase.id, delta_id: deltaId, data },
        }),
      });
      
      if (response.ok) {
        setSuccess('Step completed');
        await fetchDeltaMap();
        setShowDeltaModal(false);
        setSelectedDelta(null);
      }
    } catch (err) {
      setError('Failed to advance');
    } finally {
      setLoading(false);
    }
  };
  
  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };
  
  const openDeltaModal = (delta: Delta) => {
    setSelectedDelta(delta);
    setShowDeltaModal(true);
  };
  
  // Calculate overall progress
  const overallProgress = deltaMap.length > 0
    ? (deltaMap.reduce((sum, phase) => sum + phase.progress, 0) / deltaMap.length) * 100
    : 0;
  
  // Find current delta
  const currentDelta = deltaMap
    .flatMap(p => p.deltas)
    .find(d => d.status === 'in_progress' || d.status === 'awaiting_input');

  return (
    <div className="flex flex-col h-full min-h-0 bg-panel-dark">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-panel-light rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Scale className="text-primary" size={24} />
              <div>
                <h1 className="font-semibold text-lg">Legal Workflow</h1>
                <p className="text-xs text-text-secondary">
                  {activeCase ? activeCase.title : 'Case Management System'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {activeCase && (
              <button
                onClick={() => setActiveCase(null)}
                className="px-3 py-1.5 text-sm text-text-secondary hover:bg-panel-light rounded-lg transition-colors"
              >
                All Cases
              </button>
            )}
            <button
              onClick={() => setShowNewCase(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={18} /> New Case
            </button>
          </div>
        </div>
        
        {/* Tabs - Only show when case is selected */}
        {activeCase && (
          <div className="flex gap-1 px-4 pb-2 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'deltas', label: 'Workflow', icon: Target },
              { id: 'discovery', label: 'Discovery', icon: Search },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'analysis', label: 'Analysis', icon: Shield },
              { id: 'counsel', label: 'Find Counsel', icon: UserCheck },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary/20 text-primary'
                    : 'text-text-secondary hover:bg-panel-light hover:text-text-primary'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Disclaimer Banner */}
      <div className="flex-shrink-0 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
        <div className="flex items-center gap-2 text-amber-400 text-xs">
          <AlertCircle size={14} />
          <span>
            <strong>Disclaimer:</strong> This tool provides organizational assistance only, not legal advice. 
            All documents should be reviewed by a qualified attorney before filing.
          </span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Error/Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400"
            >
              <AlertTriangle size={18} />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <X size={16} />
              </button>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400"
            >
              <CheckCircle size={18} />
              <span>{success}</span>
              <button onClick={() => setSuccess(null)} className="ml-auto">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Case List View */}
        {!activeCase ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Cases</h2>
            
            {cases.length === 0 ? (
              <div className="text-center py-12 bg-panel-medium rounded-xl border border-border">
                <Scale size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Cases Yet</h3>
                <p className="text-text-secondary mb-4">Create your first case to get started</p>
                <button
                  onClick={() => setShowNewCase(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                >
                  <Plus size={18} /> Create Case
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cases.map(caseItem => (
                  <motion.div
                    key={caseItem.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-panel-medium rounded-xl border border-border cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setActiveCase(caseItem)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{caseItem.title}</h3>
                        <p className="text-sm text-text-secondary capitalize">{caseItem.case_type.replace('_', ' ')}</p>
                      </div>
                      <ProgressRing progress={caseItem.progress * 100} size={48} strokeWidth={4} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span>Created {new Date(caseItem.created_at).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded-full ${
                        caseItem.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {caseItem.status}
                      </span>
                    </div>
                    {caseItem.pending_delta && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-amber-400 flex items-center gap-1">
                          <Clock size={12} /> Next: {caseItem.pending_delta}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Progress Overview */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-panel-medium rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-text-secondary">Overall Progress</span>
                      <Target size={20} className="text-primary" />
                    </div>
                    <div className="flex items-center gap-4">
                      <ProgressRing progress={overallProgress} size={80} strokeWidth={8} />
                      <div>
                        <p className="text-2xl font-bold">{Math.round(overallProgress)}%</p>
                        <p className="text-sm text-text-secondary">Complete</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-panel-medium rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-text-secondary">Current Step</span>
                      <Zap size={20} className="text-amber-400" />
                    </div>
                    {currentDelta ? (
                      <div>
                        <p className="font-medium">{currentDelta.name}</p>
                        <p className="text-sm text-text-secondary mt-1">{currentDelta.description}</p>
                        <button
                          onClick={() => openDeltaModal(currentDelta)}
                          className="mt-3 text-sm text-primary hover:underline"
                        >
                          Continue →
                        </button>
                      </div>
                    ) : (
                      <p className="text-text-secondary">No pending steps</p>
                    )}
                  </div>
                  
                  <div className="p-4 bg-panel-medium rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-text-secondary">Documents</span>
                      <FileText size={20} className="text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold">{documents.length}</p>
                    <p className="text-sm text-text-secondary">Indexed files</p>
                    <button
                      onClick={() => setActiveTab('documents')}
                      className="mt-3 text-sm text-primary hover:underline"
                    >
                      View all →
                    </button>
                  </div>
                </div>
                
                {/* Upcoming Deadlines */}
                <div className="p-4 bg-panel-medium rounded-xl border border-border">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-red-400" />
                    Upcoming Deadlines
                  </h3>
                  {deadlines.length === 0 ? (
                    <p className="text-text-secondary text-sm">No deadlines calculated yet</p>
                  ) : (
                    <div className="space-y-2">
                      {deadlines.slice(0, 5).map(deadline => (
                        <div key={deadline.id} className="flex items-center justify-between p-2 bg-panel-dark rounded-lg">
                          <span className="text-sm">{deadline.name}</span>
                          <span className="text-sm text-text-secondary">
                            {new Date(deadline.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Quick Actions */}
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    { label: 'Generate FOIA Request', icon: FileText, action: () => setActiveTab('discovery') },
                    { label: 'Upload Document', icon: Upload, action: () => setShowUpload(true) },
                    { label: 'Check Conflicts', icon: Shield, action: () => setActiveTab('analysis') },
                    { label: 'Find Counsel', icon: UserCheck, action: () => setActiveTab('counsel') },
                  ].map((action, idx) => (
                    <button
                      key={idx}
                      onClick={action.action}
                      className="p-4 bg-panel-medium rounded-xl border border-border hover:border-primary/50 transition-colors text-left"
                    >
                      <action.icon size={24} className="text-primary mb-2" />
                      <span className="text-sm font-medium">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Workflow/Deltas Tab */}
            {activeTab === 'deltas' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Workflow Progress</h2>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span>Expand All</span>
                    <button
                      onClick={() => setExpandedPhases(new Set(deltaMap.map(p => p.id)))}
                      className="p-1 hover:bg-panel-light rounded"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
                
                {deltaMap.map((phase, phaseIdx) => (
                  <div key={phase.id} className="bg-panel-medium rounded-xl border border-border overflow-hidden">
                    {/* Phase Header */}
                    <button
                      onClick={() => togglePhase(phase.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-panel-light/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          phase.progress === 1 ? 'bg-green-500/20 text-green-400' :
                          phase.is_current ? 'bg-primary/20 text-primary' :
                          'bg-panel-light text-text-secondary'
                        }`}>
                          {phase.progress === 1 ? <CheckCircle size={16} /> : phaseIdx + 1}
                        </div>
                        <div className="text-left">
                          <h3 className="font-medium">{phase.name}</h3>
                          <p className="text-xs text-text-secondary">{Math.round(phase.progress * 100)}% complete</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-panel-dark rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${phase.progress * 100}%` }}
                          />
                        </div>
                        {expandedPhases.has(phase.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </button>
                    
                    {/* Phase Deltas */}
                    <AnimatePresence>
                      {expandedPhases.has(phase.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border"
                        >
                          <div className="p-4 space-y-2">
                            {phase.deltas.map((delta, deltaIdx) => (
                              <div
                                key={delta.id}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                  delta.status === 'completed' ? 'bg-green-500/5' :
                                  delta.status === 'in_progress' ? 'bg-primary/10 border border-primary/30' :
                                  delta.status === 'pending' ? 'bg-panel-dark opacity-50' :
                                  'bg-panel-dark'
                                } ${delta.status === 'pending' ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-panel-light/50'}`}
                                onClick={() => delta.status !== 'pending' && openDeltaModal(delta)}
                              >
                                <div className="w-6 h-6 flex items-center justify-center">
                                  {delta.status === 'completed' ? (
                                    <CheckCircle size={18} className="text-green-400" />
                                  ) : delta.status === 'in_progress' ? (
                                    <Clock size={18} className="text-primary" />
                                  ) : (
                                    <Circle size={18} className="text-text-secondary" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm ${delta.status === 'pending' ? 'text-text-secondary' : ''}`}>
                                      {delta.name}
                                    </span>
                                    {delta.multi_llm_verify && (
                                      <span className="px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded">
                                        3-LLM Verify
                                      </span>
                                    )}
                                    {!delta.required && (
                                      <span className="px-1.5 py-0.5 text-[10px] bg-gray-500/20 text-gray-400 rounded">
                                        Optional
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-text-secondary mt-0.5">{delta.description}</p>
                                </div>
                                {delta.status !== 'pending' && (
                                  <ChevronRight size={18} className="text-text-secondary" />
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
            
            {/* Discovery Tab */}
            {activeTab === 'discovery' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Discovery Tools</h2>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { title: 'FOIA Request', description: 'Generate federal or state public records requests', icon: FileText, action: 'generate_foia' },
                    { title: 'Subpoena', description: 'Draft subpoenas for records or testimony', icon: Gavel, action: 'generate_subpoena' },
                    { title: 'Interrogatories', description: 'Generate written questions for opposing party', icon: FileQuestion, action: 'generate_interrogatories' },
                    { title: 'Motion', description: 'Draft motions for various purposes', icon: BookOpen, action: 'generate_motion' },
                  ].map((tool, idx) => (
                    <div key={idx} className="p-4 bg-panel-medium rounded-xl border border-border">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <tool.icon size={24} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{tool.title}</h3>
                          <p className="text-sm text-text-secondary mt-1">{tool.description}</p>
                          <button className="mt-3 text-sm text-primary hover:underline">
                            Generate →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Info Box */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Info size={20} className="text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-400">Multi-LLM Verification</h4>
                      <p className="text-sm text-text-secondary mt-1">
                        All generated documents are verified by three legal-focused AI models to ensure accuracy
                        and proper formatting for your jurisdiction. A consensus of at least 2 models is required.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Document Index</h2>
                  <button
                    onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                  >
                    <Upload size={18} /> Upload
                  </button>
                </div>
                
                {documents.length === 0 ? (
                  <div className="text-center py-12 bg-panel-medium rounded-xl border border-border">
                    <FileText size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Documents Yet</h3>
                    <p className="text-text-secondary mb-4">Upload documents to index them for this case</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map(doc => (
                      <div key={doc.id} className="p-4 bg-panel-medium rounded-xl border border-border flex items-center gap-4">
                        <FileText size={24} className="text-text-secondary" />
                        <div className="flex-1">
                          <h4 className="font-medium">{doc.filename}</h4>
                          <p className="text-sm text-text-secondary">{doc.summary}</p>
                          <div className="flex gap-2 mt-2">
                            {doc.tags?.map(tag => (
                              <span key={tag} className="px-2 py-0.5 text-xs bg-panel-light rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-text-secondary">
                          {new Date(doc.date_added).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Case Analysis</h2>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Conflict of Interest */}
                  <div className="p-4 bg-panel-medium rounded-xl border border-border">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <Shield size={18} className="text-red-400" />
                      Conflict of Interest Check
                    </h3>
                    <p className="text-sm text-text-secondary mb-4">
                      Scan for potential conflicts among judges, attorneys, and officers involved in your case.
                      Includes social media cross-referencing.
                    </p>
                    <button className="w-full py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                      Run Conflict Check
                    </button>
                  </div>
                  
                  {/* Opposition Analysis */}
                  <div className="p-4 bg-panel-medium rounded-xl border border-border">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <Eye size={18} className="text-amber-400" />
                      Opposition Analysis
                    </h3>
                    <p className="text-sm text-text-secondary mb-4">
                      Analyze opposing counsel's filings for errors, inconsistencies, and procedural issues
                      that can be leveraged.
                    </p>
                    <button className="w-full py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors">
                      Analyze Opposition
                    </button>
                  </div>
                </div>
                
                {/* Deadline Calculator */}
                <div className="p-4 bg-panel-medium rounded-xl border border-border">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-blue-400" />
                    Deadline Calculator
                  </h3>
                  <p className="text-sm text-text-secondary mb-4">
                    Calculate jurisdiction-specific deadlines for all applicable legal actions.
                  </p>
                  <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                    Calculate Deadlines
                  </button>
                </div>
              </div>
            )}
            
            {/* Find Counsel Tab */}
            {activeTab === 'counsel' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Find Legal Counsel</h2>
                
                <div className="p-4 bg-panel-medium rounded-xl border border-border">
                  <p className="text-sm text-text-secondary mb-4">
                    Search for attorneys based on expertise, experience, location, and price range.
                  </p>
                  
                  <div className="grid gap-4 md:grid-cols-2 mb-4">
                    <div>
                      <label className="block text-sm text-text-secondary mb-1">Area of Expertise</label>
                      <select className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg">
                        <option>Civil Litigation</option>
                        <option>Criminal Defense</option>
                        <option>Family Law</option>
                        <option>Personal Injury</option>
                        <option>Employment Law</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-1">Price Range</label>
                      <select className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg">
                        <option>Any</option>
                        <option>Budget-Friendly</option>
                        <option>Mid-Range</option>
                        <option>Premium</option>
                        <option>Contingency Only</option>
                      </select>
                    </div>
                  </div>
                  
                  <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Search Attorneys
                  </button>
                </div>
                
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Info size={20} className="text-amber-400 mt-0.5" />
                    <p className="text-sm text-text-secondary">
                      Attorney search results are provided for informational purposes only. 
                      HaleyOS does not receive compensation for referrals.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* New Case Modal */}
      <AnimatePresence>
        {showNewCase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewCase(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-panel-dark border border-border rounded-xl w-full max-w-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-lg">New Case</h2>
                <button onClick={() => setShowNewCase(false)} className="p-2 hover:bg-panel-light rounded-lg">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Case Title</label>
                  <input
                    type="text"
                    value={newCaseForm.title}
                    onChange={e => setNewCaseForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Smith v. Jones"
                    className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Case Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CASE_TYPES.slice(0, 6).map(type => (
                      <button
                        key={type.id}
                        onClick={() => setNewCaseForm(prev => ({ ...prev, case_type: type.id }))}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          newCaseForm.case_type === type.id
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-panel-medium border-border hover:border-primary/50'
                        }`}
                      >
                        <type.icon size={20} className="mx-auto mb-1" />
                        <span className="text-xs">{type.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">State</label>
                    <input
                      type="text"
                      value={newCaseForm.state}
                      onChange={e => setNewCaseForm(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="e.g., California"
                      className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">County</label>
                    <input
                      type="text"
                      value={newCaseForm.county}
                      onChange={e => setNewCaseForm(prev => ({ ...prev, county: e.target.value }))}
                      placeholder="e.g., Los Angeles"
                      className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Court Type</label>
                  <select
                    value={newCaseForm.court_type}
                    onChange={e => setNewCaseForm(prev => ({ ...prev, court_type: e.target.value }))}
                    className="w-full px-3 py-2 bg-panel-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="state">State Court</option>
                    <option value="federal">Federal Court</option>
                    <option value="municipal">Municipal Court</option>
                  </select>
                </div>
              </div>
              
              <div className="p-4 border-t border-border flex justify-end gap-3">
                <button
                  onClick={() => setShowNewCase(false)}
                  className="px-4 py-2 text-text-secondary hover:bg-panel-light rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={createCase}
                  disabled={loading || !newCaseForm.title}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
                  Create Case
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Delta Modal */}
      <AnimatePresence>
        {showDeltaModal && selectedDelta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeltaModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-panel-dark border border-border rounded-xl w-full max-w-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg">{selectedDelta.name}</h2>
                  <p className="text-sm text-text-secondary">{selectedDelta.description}</p>
                </div>
                <button onClick={() => setShowDeltaModal(false)} className="p-2 hover:bg-panel-light rounded-lg">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-4">
                <DeltaStatusBadge status={selectedDelta.status} />
                
                {selectedDelta.multi_llm_verify && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-400 flex items-center gap-2">
                      <Lock size={14} />
                      This step requires 3-LLM verification
                    </p>
                  </div>
                )}
                
                <div className="mt-4">
                  <p className="text-sm text-text-secondary mb-2">
                    {selectedDelta.status === 'completed' 
                      ? 'This step has been completed.'
                      : 'Complete this step to advance your case.'}
                  </p>
                </div>
              </div>
              
              <div className="p-4 border-t border-border flex justify-end gap-3">
                {!selectedDelta.required && selectedDelta.status !== 'completed' && (
                  <button
                    onClick={() => advanceDelta(selectedDelta.id)}
                    className="px-4 py-2 text-text-secondary hover:bg-panel-light rounded-lg"
                  >
                    Skip
                  </button>
                )}
                {selectedDelta.status !== 'completed' && (
                  <button
                    onClick={() => advanceDelta(selectedDelta.id, questionAnswers)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    Mark Complete
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
