'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
  RefreshCw,
  BarChart3,
  Sparkles,
  Bug,
  Palette,
  MessageCircle,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { layout, components, colors, cx } from '@/styles/module-theme';
import { MODULE_REGISTRY } from '@/config/moduleRegistry';
import { useAuth } from '@/lib/authContext';

interface FeedbackAdminDashboardProps {
  onBack: () => void;
}

interface FeedbackItem {
  id: string;
  moduleId: string;
  moduleName: string;
  userId?: string;
  feedbackText: string;
  feedbackType: 'feature_request' | 'bug_report' | 'ui_suggestion' | 'general';
  locationHint?: string;
  timestamp: string;
  status: 'new' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'declined';
  upvotes: number;
  downvotes: number;
  score: number;
  adminNotes?: string;
  priority: number;
}

interface GlobalStats {
  totalFeedback: number;
  byModule: Record<string, number>;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  topModules: Array<{ module: string; count: number }>;
  recentActivity: number;
}

const FEEDBACK_TYPES = {
  feature_request: { label: 'Feature Request', icon: Sparkles, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  ui_suggestion: { label: 'UI Suggestion', icon: Palette, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  bug_report: { label: 'Bug Report', icon: Bug, color: 'text-red-400', bgColor: 'bg-red-500/10' },
  general: { label: 'General', icon: MessageCircle, color: 'text-zinc-400', bgColor: 'bg-zinc-500/10' },
};

const STATUS_CONFIG = {
  new: { label: 'New', color: 'text-amber-400', bgColor: 'bg-amber-500/10', icon: Circle },
  under_review: { label: 'Under Review', color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: Clock },
  planned: { label: 'Planned', color: 'text-purple-400', bgColor: 'bg-purple-500/10', icon: TrendingUp },
  in_progress: { label: 'In Progress', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', icon: Loader2 },
  completed: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-500/10', icon: CheckCircle2 },
  declined: { label: 'Declined', color: 'text-zinc-500', bgColor: 'bg-zinc-500/10', icon: AlertCircle },
};

const SORT_OPTIONS = [
  { id: 'score', label: 'Most Popular' },
  { id: 'upvotes', label: 'Most Upvotes' },
  { id: 'timestamp', label: 'Most Recent' },
  { id: 'priority', label: 'Highest Priority' },
];

export default function FeedbackAdminDashboard({ onBack }: FeedbackAdminDashboardProps) {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('score');
  const [showFilters, setShowFilters] = useState(false);

  // Selected feedback for detail view
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);

  // Admin guard - after all hooks
  const ADMIN_EMAIL = "anthony.guticoll82@gmail.com";
  if (user?.email !== ADMIN_EMAIL) {
    return <div className="p-8 text-center text-red-500 text-xl">Access denied</div>;
  }
  
  // Fetch feedback and stats
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      
      // Fetch feedback list
      const params = new URLSearchParams();
      if (selectedModule) params.append('module_id', selectedModule);
      if (selectedType) params.append('feedback_type', selectedType);
      if (selectedStatus) params.append('status', selectedStatus);
      params.append('sort_by', sortBy);
      params.append('limit', '100');
      
      const feedbackRes = await fetch(`${backendUrl}/feedback/list?${params}`);
      if (feedbackRes.ok) {
        const data = await feedbackRes.json();
        setFeedback(data.feedback || []);
      }
      
      // Fetch global stats
      const statsRes = await fetch(`${backendUrl}/feedback/stats`);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
      
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError('Failed to load feedback. Backend may be unavailable.');
      
      // Load from localStorage as fallback
      const stored = localStorage.getItem('haley_module_feedback');
      if (stored) {
        const localFeedback = JSON.parse(stored);
        setFeedback(localFeedback.map((f: any, i: number) => ({
          ...f,
          id: f.id || `local_${i}`,
          status: f.status || 'new',
          upvotes: f.upvotes || 0,
          downvotes: f.downvotes || 0,
          score: f.score || 0,
          priority: f.priority || 0,
        })));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [selectedModule, selectedType, selectedStatus, sortBy]);
  
  // Filter feedback locally
  const filteredFeedback = useMemo(() => {
    let result = feedback;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => 
        f.feedbackText.toLowerCase().includes(query) ||
        f.moduleName.toLowerCase().includes(query) ||
        f.locationHint?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [feedback, searchQuery]);
  
  // Get unique modules from feedback
  const moduleOptions = useMemo(() => {
    const modules = new Set(feedback.map(f => f.moduleId));
    return Array.from(modules).map(id => ({
      id,
      name: MODULE_REGISTRY[id]?.name || id,
    }));
  }, [feedback]);
  
  // Update feedback status
  const updateFeedbackStatus = async (feedbackId: string, status: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const res = await fetch(`${backendUrl}/feedback/${feedbackId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (res.ok) {
        // Update local state
        setFeedback(prev => prev.map(f => 
          f.id === feedbackId ? { ...f, status: status as FeedbackItem['status'] } : f
        ));
        if (selectedFeedback?.id === feedbackId) {
          setSelectedFeedback(prev => prev ? { ...prev, status: status as FeedbackItem['status'] } : null);
        }
      }
    } catch (err) {
      console.error('Error updating feedback:', err);
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };
  
  return (
    <div className={layout.module}>
      {/* Header */}
      <div className="border-b border-border bg-panel-dark/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={components.button.ghost}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-text-primary">Module Feedback</h1>
              <p className="text-sm text-text-secondary">
                {stats?.totalFeedback || 0} total suggestions • {stats?.recentActivity || 0} this week
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cx(
                components.button.ghost,
                showFilters && 'bg-primary/20 text-primary'
              )}
            >
              <Filter size={18} />
            </button>
            <button
              onClick={fetchData}
              className={components.button.ghost}
              disabled={isLoading}
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        
        {/* Filter Bar */}
        {showFilters && (
          <div className="px-4 md:px-6 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search feedback..."
                className={cx(components.input.sm, 'pl-9')}
              />
            </div>
            
            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-2">
              {/* Module Filter */}
              <select
                value={selectedModule || ''}
                onChange={(e) => setSelectedModule(e.target.value || null)}
                className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm text-text-primary"
              >
                <option value="">All Modules</option>
                {moduleOptions.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              
              {/* Type Filter */}
              <select
                value={selectedType || ''}
                onChange={(e) => setSelectedType(e.target.value || null)}
                className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm text-text-primary"
              >
                <option value="">All Types</option>
                {Object.entries(FEEDBACK_TYPES).map(([id, config]) => (
                  <option key={id} value={id}>{config.label}</option>
                ))}
              </select>
              
              {/* Status Filter */}
              <select
                value={selectedStatus || ''}
                onChange={(e) => setSelectedStatus(e.target.value || null)}
                className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm text-text-primary"
              >
                <option value="">All Status</option>
                {Object.entries(STATUS_CONFIG).map(([id, config]) => (
                  <option key={id} value={id}>{config.label}</option>
                ))}
              </select>
              
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-sm text-text-primary"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : error && feedback.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <AlertCircle size={48} className="text-amber-400 mb-4" />
            <p className="text-text-secondary">{error}</p>
            <button
              onClick={fetchData}
              className={cx(components.button.secondary, 'mt-4')}
            >
              <RefreshCw size={16} className="mr-2" />
              Try Again
            </button>
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <MessageSquare size={48} className="text-text-secondary/30 mb-4" />
            <p className="text-text-secondary">No feedback found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-primary text-sm mt-2 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredFeedback.map((item) => {
              const typeConfig = FEEDBACK_TYPES[item.feedbackType];
              const statusConfig = STATUS_CONFIG[item.status];
              const TypeIcon = typeConfig.icon;
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={item.id}
                  className="p-4 md:p-6 hover:bg-panel-light/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedFeedback(item)}
                >
                  <div className="flex gap-4">
                    {/* Vote Column */}
                    <div className="flex flex-col items-center gap-1 min-w-[48px]">
                      <button className="p-1.5 rounded hover:bg-panel-light text-text-secondary hover:text-green-400 transition-colors">
                        <ThumbsUp size={16} />
                      </button>
                      <span className={cx(
                        'text-sm font-medium',
                        item.score > 0 ? 'text-green-400' : item.score < 0 ? 'text-red-400' : 'text-text-secondary'
                      )}>
                        {item.score}
                      </span>
                      <button className="p-1.5 rounded hover:bg-panel-light text-text-secondary hover:text-red-400 transition-colors">
                        <ThumbsDown size={16} />
                      </button>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={cx(
                          'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                          typeConfig.bgColor,
                          typeConfig.color
                        )}>
                          <TypeIcon size={12} />
                          {typeConfig.label}
                        </span>
                        <span className={cx(
                          'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                          statusConfig.bgColor,
                          statusConfig.color
                        )}>
                          <StatusIcon size={12} className={item.status === 'in_progress' ? 'animate-spin' : ''} />
                          {statusConfig.label}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {MODULE_REGISTRY[item.moduleId]?.emoji} {item.moduleName}
                        </span>
                        <span className="text-xs text-text-secondary/50">
                          • {formatTime(item.timestamp)}
                        </span>
                      </div>
                      
                      {/* Feedback Text */}
                      <p className="text-text-primary line-clamp-2">
                        {item.feedbackText}
                      </p>
                      
                      {/* Location Hint */}
                      {item.locationHint && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-text-secondary">
                          <MapPin size={12} />
                          <span>{item.locationHint}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Priority Indicator */}
                    {item.priority > 0 && (
                      <div className="flex items-center">
                        <div className={cx(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                          item.priority >= 4 ? 'bg-red-500/20 text-red-400' :
                          item.priority >= 3 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        )}>
                          P{item.priority}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Detail Modal */}
      {selectedFeedback && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setSelectedFeedback(null)}
        >
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedFeedback(null)}
          />
          
          <div className="relative w-full sm:max-w-lg bg-panel-dark border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className={cx(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  FEEDBACK_TYPES[selectedFeedback.feedbackType].bgColor
                )}>
                  {(() => {
                    const Icon = FEEDBACK_TYPES[selectedFeedback.feedbackType].icon;
                    return <Icon size={18} className={FEEDBACK_TYPES[selectedFeedback.feedbackType].color} />;
                  })()}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{selectedFeedback.moduleName}</h3>
                  <p className="text-xs text-text-secondary">
                    {formatTime(selectedFeedback.timestamp)} • {selectedFeedback.upvotes} upvotes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="p-2 rounded-lg hover:bg-panel-light text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* Feedback Text */}
              <div className="bg-panel-medium rounded-xl p-4">
                <p className="text-text-primary whitespace-pre-wrap">
                  {selectedFeedback.feedbackText}
                </p>
              </div>
              
              {/* Location Hint */}
              {selectedFeedback.locationHint && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <MapPin size={14} />
                  <span>Location: {selectedFeedback.locationHint}</span>
                </div>
              )}
              
              {/* Status Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Update Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={status}
                        onClick={() => updateFeedbackStatus(selectedFeedback.id, status)}
                        className={cx(
                          'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                          selectedFeedback.status === status
                            ? `${config.bgColor} ${config.color} ring-2 ring-current/30`
                            : 'bg-panel-medium text-text-secondary hover:bg-panel-light'
                        )}
                      >
                        <Icon size={12} className={status === 'in_progress' && selectedFeedback.status === status ? 'animate-spin' : ''} />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Metadata */}
              <div className="text-xs text-text-secondary space-y-1">
                <p>Module ID: <code className="bg-panel-medium px-1.5 py-0.5 rounded">{selectedFeedback.moduleId}</code></p>
                <p>Feedback ID: <code className="bg-panel-medium px-1.5 py-0.5 rounded">{selectedFeedback.id}</code></p>
                {selectedFeedback.userId && (
                  <p>User ID: <code className="bg-panel-medium px-1.5 py-0.5 rounded">{selectedFeedback.userId}</code></p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
