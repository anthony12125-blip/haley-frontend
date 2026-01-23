'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Users, Briefcase, GitBranch, Activity, Plus,
  Search, Filter, MoreVertical, Phone, Mail, Building2,
  DollarSign, Calendar, CheckCircle2, Circle, Trash2,
  Edit2, X, ChevronRight, TrendingUp, Clock, User
} from 'lucide-react';

interface CRMProps {
  onBack: () => void;
}

type Tab = 'dashboard' | 'contacts' | 'deals' | 'pipelines' | 'activities';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  status: string;
  deal_count: number;
  activity_count: number;
  created_at: string;
  updated_at: string;
}

interface Deal {
  id: string;
  name: string;
  contact_id?: string;
  stage: string;
  value: number;
  currency: string;
  probability: number;
  expected_close_date?: string;
  created_at: string;
}

interface Pipeline {
  id: string;
  name: string;
  type: string;
  stages: { name: string; order: number; probability: number; color?: string }[];
  deal_count: number;
  is_default: boolean;
}

interface ActivityItem {
  id: string;
  type: string;
  subject: string;
  description?: string;
  contact_id?: string;
  deal_id?: string;
  completed: boolean;
  due_date?: string;
  created_at: string;
}

interface DashboardData {
  contacts: { total: number };
  deals: { total: number; open: number; won: number; pipeline_value: number; won_value: number };
  activities: { pending: number };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Get user ID from localStorage or generate one
const getUserId = () => {
  if (typeof window === 'undefined') return 'anonymous';
  let userId = localStorage.getItem('haley_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('haley_user_id', userId);
  }
  return userId;
};

export default function CRM({ onBack }: CRMProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'contact' | 'deal' | 'pipeline' | 'activity'>('contact');

  const userId = getUserId();

  // Fetch functions
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/crm/dashboard/${userId}`);
      const data = await res.json();
      if (data.success) {
        setDashboard(data.dashboard);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard:', e);
    }
  }, [userId]);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/crm/contacts/${userId}?limit=50`);
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts || []);
      }
    } catch (e) {
      console.error('Failed to fetch contacts:', e);
    }
  }, [userId]);

  const fetchDeals = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/crm/deals/${userId}?limit=50`);
      const data = await res.json();
      if (data.success) {
        setDeals(data.deals || []);
      }
    } catch (e) {
      console.error('Failed to fetch deals:', e);
    }
  }, [userId]);

  const fetchPipelines = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/crm/pipelines/${userId}?limit=20`);
      const data = await res.json();
      if (data.success) {
        setPipelines(data.pipelines || []);
      }
    } catch (e) {
      console.error('Failed to fetch pipelines:', e);
    }
  }, [userId]);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/crm/activities/${userId}?limit=50`);
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities || []);
      }
    } catch (e) {
      console.error('Failed to fetch activities:', e);
    }
  }, [userId]);

  // Load data on mount and tab change
  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        if (activeTab === 'dashboard') {
          await fetchDashboard();
        } else if (activeTab === 'contacts') {
          await fetchContacts();
        } else if (activeTab === 'deals') {
          await fetchDeals();
        } else if (activeTab === 'pipelines') {
          await fetchPipelines();
        } else if (activeTab === 'activities') {
          await fetchActivities();
        }
      } catch (e) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, fetchDashboard, fetchContacts, fetchDeals, fetchPipelines, fetchActivities]);

  // Create handlers
  const handleCreateContact = async (data: any) => {
    try {
      const res = await fetch(`${API_BASE}/crm/contacts?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        setShowCreateModal(false);
        fetchContacts();
        fetchDashboard();
      } else {
        setError(result.error || 'Failed to create contact');
      }
    } catch (e) {
      setError('Failed to create contact');
    }
  };

  const handleCreateDeal = async (data: any) => {
    try {
      const res = await fetch(`${API_BASE}/crm/deals?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        setShowCreateModal(false);
        fetchDeals();
        fetchDashboard();
      } else {
        setError(result.error || 'Failed to create deal');
      }
    } catch (e) {
      setError('Failed to create deal');
    }
  };

  const handleCreateActivity = async (data: any) => {
    try {
      const res = await fetch(`${API_BASE}/crm/activities?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        setShowCreateModal(false);
        fetchActivities();
        fetchDashboard();
      } else {
        setError(result.error || 'Failed to create activity');
      }
    } catch (e) {
      setError('Failed to create activity');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Delete this contact?')) return;
    try {
      await fetch(`${API_BASE}/crm/contacts/${userId}/${contactId}`, { method: 'DELETE' });
      fetchContacts();
      fetchDashboard();
    } catch (e) {
      setError('Failed to delete contact');
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Delete this deal?')) return;
    try {
      await fetch(`${API_BASE}/crm/deals/${userId}/${dealId}`, { method: 'DELETE' });
      fetchDeals();
      fetchDashboard();
    } catch (e) {
      setError('Failed to delete deal');
    }
  };

  const handleToggleActivity = async (activity: ActivityItem) => {
    try {
      await fetch(`${API_BASE}/crm/activities/${userId}/${activity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !activity.completed }),
      });
      fetchActivities();
      fetchDashboard();
    } catch (e) {
      setError('Failed to update activity');
    }
  };

  // Filter data by search
  const filteredContacts = contacts.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email || ''} ${c.company || ''}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredDeals = deals.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <TrendingUp size={18} /> },
    { id: 'contacts', label: 'Contacts', icon: <Users size={18} /> },
    { id: 'deals', label: 'Deals', icon: <Briefcase size={18} /> },
    { id: 'pipelines', label: 'Pipelines', icon: <GitBranch size={18} /> },
    { id: 'activities', label: 'Activities', icon: <Activity size={18} /> },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      lead: 'bg-blue-500/20 text-blue-400',
      customer: 'bg-purple-500/20 text-purple-400',
      inactive: 'bg-panel-light text-text-secondary',
      churned: 'bg-red-500/20 text-red-400',
    };
    return colors[status] || 'bg-panel-light text-text-secondary';
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      prospecting: 'bg-panel-light text-text-secondary',
      qualification: 'bg-blue-500/20 text-blue-400',
      proposal: 'bg-purple-500/20 text-purple-400',
      negotiation: 'bg-amber-500/20 text-amber-400',
      closed_won: 'bg-green-500/20 text-green-400',
      closed_lost: 'bg-red-500/20 text-red-400',
    };
    return colors[stage] || 'bg-panel-light text-text-secondary';
  };

  const formatCurrency = (value: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
            <h1 className="text-xl font-bold">CRM</h1>
            <p className="text-sm text-text-secondary">Manage your relationships</p>
          </div>
        </div>

        <button
          onClick={() => {
            setCreateType(activeTab === 'contacts' ? 'contact' : activeTab === 'deals' ? 'deal' : 'activity');
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          <span>New {activeTab === 'contacts' ? 'Contact' : activeTab === 'deals' ? 'Deal' : 'Activity'}</span>
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 p-2 border-b border-border overflow-x-auto">
        {tabs.map(tab => (
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
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search bar (for contacts and deals) */}
      {(activeTab === 'contacts' || activeTab === 'deals') && (
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-panel-dark rounded-lg border border-border focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/20 text-red-400 rounded-lg flex items-center gap-2">
          <X size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Dashboard */}
            {activeTab === 'dashboard' && dashboard && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 bg-panel-dark rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Users size={20} className="text-blue-400" />
                    </div>
                    <span className="text-text-secondary">Total Contacts</span>
                  </div>
                  <p className="text-3xl font-bold">{dashboard.contacts.total}</p>
                </div>

                <div className="p-6 bg-panel-dark rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Briefcase size={20} className="text-green-400" />
                    </div>
                    <span className="text-text-secondary">Open Deals</span>
                  </div>
                  <p className="text-3xl font-bold">{dashboard.deals.open}</p>
                  <p className="text-sm text-text-secondary mt-1">
                    {formatCurrency(dashboard.deals.pipeline_value)} in pipeline
                  </p>
                </div>

                <div className="p-6 bg-panel-dark rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <DollarSign size={20} className="text-purple-400" />
                    </div>
                    <span className="text-text-secondary">Won Deals</span>
                  </div>
                  <p className="text-3xl font-bold">{dashboard.deals.won}</p>
                  <p className="text-sm text-text-secondary mt-1">
                    {formatCurrency(dashboard.deals.won_value)} closed
                  </p>
                </div>

                <div className="p-6 bg-panel-dark rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <Activity size={20} className="text-amber-400" />
                    </div>
                    <span className="text-text-secondary">Pending Tasks</span>
                  </div>
                  <p className="text-3xl font-bold">{dashboard.activities.pending}</p>
                </div>
              </div>
            )}

            {/* Contacts */}
            {activeTab === 'contacts' && (
              <div className="space-y-2">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-12 text-text-secondary">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No contacts yet</p>
                    <button
                      onClick={() => {
                        setCreateType('contact');
                        setShowCreateModal(true);
                      }}
                      className="mt-4 text-primary hover:underline"
                    >
                      Add your first contact
                    </button>
                  </div>
                ) : (
                  filteredContacts.map(contact => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-4 bg-panel-dark rounded-xl border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                          <User size={20} className="text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {contact.first_name} {contact.last_name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-text-secondary">
                            {contact.email && (
                              <span className="flex items-center gap-1">
                                <Mail size={14} />
                                {contact.email}
                              </span>
                            )}
                            {contact.company && (
                              <span className="flex items-center gap-1">
                                <Building2 size={14} />
                                {contact.company}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(contact.status)}`}>
                          {contact.status}
                        </span>
                        <span className="text-sm text-text-secondary">
                          {contact.deal_count} deals
                        </span>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-text-secondary hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Deals */}
            {activeTab === 'deals' && (
              <div className="space-y-2">
                {filteredDeals.length === 0 ? (
                  <div className="text-center py-12 text-text-secondary">
                    <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No deals yet</p>
                    <button
                      onClick={() => {
                        setCreateType('deal');
                        setShowCreateModal(true);
                      }}
                      className="mt-4 text-primary hover:underline"
                    >
                      Create your first deal
                    </button>
                  </div>
                ) : (
                  filteredDeals.map(deal => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between p-4 bg-panel-dark rounded-xl border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                          <DollarSign size={20} className="text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-medium">{deal.name}</h3>
                          <p className="text-sm text-text-secondary">
                            {formatCurrency(deal.value, deal.currency)} - {deal.probability}% probability
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStageColor(deal.stage)}`}>
                          {deal.stage.replace('_', ' ')}
                        </span>
                        {deal.expected_close_date && (
                          <span className="text-sm text-text-secondary flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(deal.expected_close_date).toLocaleDateString()}
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteDeal(deal.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-text-secondary hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Pipelines */}
            {activeTab === 'pipelines' && (
              <div className="space-y-4">
                {pipelines.length === 0 ? (
                  <div className="text-center py-12 text-text-secondary">
                    <GitBranch size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No pipelines yet</p>
                  </div>
                ) : (
                  pipelines.map(pipeline => (
                    <div
                      key={pipeline.id}
                      className="p-4 bg-panel-dark rounded-xl border border-border"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium flex items-center gap-2">
                            {pipeline.name}
                            {pipeline.is_default && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            {pipeline.deal_count} deals - {pipeline.type}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {pipeline.stages.map((stage, idx) => (
                          <div
                            key={idx}
                            className="flex-shrink-0 px-3 py-2 bg-panel-light rounded-lg text-sm"
                            style={{ borderLeft: `3px solid ${stage.color || '#6B7280'}` }}
                          >
                            <span>{stage.name}</span>
                            <span className="text-text-secondary ml-2">{stage.probability}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Activities */}
            {activeTab === 'activities' && (
              <div className="space-y-2">
                {activities.length === 0 ? (
                  <div className="text-center py-12 text-text-secondary">
                    <Activity size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No activities yet</p>
                    <button
                      onClick={() => {
                        setCreateType('activity');
                        setShowCreateModal(true);
                      }}
                      className="mt-4 text-primary hover:underline"
                    >
                      Log your first activity
                    </button>
                  </div>
                ) : (
                  activities.map(activity => (
                    <div
                      key={activity.id}
                      className={`flex items-center justify-between p-4 bg-panel-dark rounded-xl border border-border hover:border-primary/50 transition-colors ${
                        activity.completed ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleToggleActivity(activity)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            activity.completed
                              ? 'bg-green-500 border-green-500'
                              : 'border-muted-foreground hover:border-primary'
                          }`}
                        >
                          {activity.completed && <CheckCircle2 size={14} className="text-white" />}
                        </button>
                        <div>
                          <h3 className={`font-medium ${activity.completed ? 'line-through' : ''}`}>
                            {activity.subject}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-text-secondary">
                            <span className="capitalize">{activity.type}</span>
                            {activity.due_date && (
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {new Date(activity.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateModal
          type={createType}
          onClose={() => setShowCreateModal(false)}
          onCreateContact={handleCreateContact}
          onCreateDeal={handleCreateDeal}
          onCreateActivity={handleCreateActivity}
          contacts={contacts}
        />
      )}
    </div>
  );
}

// Create Modal Component
function CreateModal({
  type,
  onClose,
  onCreateContact,
  onCreateDeal,
  onCreateActivity,
  contacts,
}: {
  type: 'contact' | 'deal' | 'pipeline' | 'activity';
  onClose: () => void;
  onCreateContact: (data: any) => void;
  onCreateDeal: (data: any) => void;
  onCreateActivity: (data: any) => void;
  contacts: Contact[];
}) {
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'contact') {
      onCreateContact(formData);
    } else if (type === 'deal') {
      onCreateDeal(formData);
    } else if (type === 'activity') {
      onCreateActivity(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-panel-dark rounded-xl border border-border p-6 mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold capitalize">New {type}</h2>
          <button onClick={onClose} className="p-2 hover:bg-panel-light rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'contact' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-panel-dark rounded-lg border border-border focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-panel-dark rounded-lg border border-border focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-panel-dark rounded-lg border border-border focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Company</label>
                <input
                  type="text"
                  value={formData.company || ''}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 bg-panel-dark rounded-lg border border-border focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Status</label>
                <select
                  value={formData.status || 'lead'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-panel-dark rounded-lg border border-border focus:border-primary focus:outline-none"
                >
                  <option value="lead">Lead</option>
                  <option value="active">Active</option>
                  <option value="customer">Customer</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </>
          )}

          {type === 'deal' && (
            <>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Deal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-panel-dark rounded-lg border border-border focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Value ($)</label>
                <input
                  type="number"
                  value={formData.value || ''}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-panel-dark rounded-lg border border-border focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Stage</label>
                <select
                  value={formData.stage || 'prospecting'}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  className="w-full px-3 py-2 bg-panel-dark rounded-lg border border-border focus:border-primary focus:outline-none"
                >
                  <option value="prospecting">Prospecting</option>
                  <option value="qualification">Qualification</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed_won">Closed Won</option>
                  <option value="closed_lost">Closed Lost</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Contact</label>
                <select
                  value={formData.contact_id || ''}
                  onChange={(e) => setFormData({ ...formData, contact_id: e.target.value || undefined })}
                  className="w-full px-3 py-2 bg-panel-dark rounded-lg border border-border focus:border-primary focus:outline-none"
                >
                  <option value="">No contact</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {type === 'activity' && (
            <>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={formData.subject || ''}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-panel-dark rounded-lg border border-border focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Type</label>
                <select
                  value={formData.type || 'task'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-panel-dark rounded-lg border border-border focus:border-primary focus:outline-none"
                >
                  <option value="task">Task</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="note">Note</option>
                  <option value="follow_up">Follow Up</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-panel-dark rounded-lg border border-border focus:border-primary focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date || ''}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 bg-panel-dark rounded-lg border border-border focus:border-primary focus:outline-none"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-panel-light transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
