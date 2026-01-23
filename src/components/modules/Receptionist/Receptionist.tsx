'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { moduleTheme } from '../theme';
import {
  ReceptionistConfig,
  TeamMember,
  FAQEntry,
  Lead,
  LeadStatus,
  Industry,
  VoiceId,
  PingStrategy,
  SolicitorHandling,
  AfterHoursBehavior,
  BusinessHours,
  INDUSTRIES,
  VOICES,
  PING_STRATEGIES,
  SOLICITOR_OPTIONS,
  AFTER_HOURS_OPTIONS,
  TIMEZONES,
  DAYS_OF_WEEK,
} from './types';

interface ReceptionistProps {
  onBack: () => void;
}

type TabId = 'settings' | 'team' | 'call-handling' | 'hours' | 'faq' | 'phone' | 'leads';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'team',
    label: 'Team',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: 'call-handling',
    label: 'Call Handling',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  {
    id: 'hours',
    label: 'Business Hours',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'faq',
    label: 'FAQ',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'phone',
    label: 'Phone Number',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
];

const DEFAULT_CONFIG: ReceptionistConfig = {
  businessId: '',
  businessName: '',
  industry: 'custom',
  greetingScript: 'Thank you for calling {business_name}. How may I help you today?',
  voiceId: 'amy',
  teamMembers: [],
  classificationPatience: 30,
  pingTimeout: 15,
  pingStrategy: 'waterfall',
  ownerAcceptsLeads: true,
  solicitorHandling: 'polite_decline',
  businessHours: DAYS_OF_WEEK.map((day) => ({
    day,
    enabled: day !== 'saturday' && day !== 'sunday',
    startTime: '09:00',
    endTime: '17:00',
  })),
  timezone: 'America/New_York',
  afterHoursBehavior: 'voicemail_only',
  faqEntries: [],
};

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Receptionist({ onBack }: ReceptionistProps) {
  const [activeTab, setActiveTab] = useState<TabId>('settings');
  const [config, setConfig] = useState<ReceptionistConfig>(DEFAULT_CONFIG);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get business ID from localStorage or generate one
  const businessId = typeof window !== 'undefined'
    ? localStorage.getItem('receptionist_business_id') || `biz_${Date.now()}`
    : 'default';

  // Load configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  // Load leads when switching to leads tab
  useEffect(() => {
    if (activeTab === 'leads') {
      loadLeads();
    }
  }, [activeTab]);

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/receptionist/${businessId}/configure`);
      if (response.ok) {
        const data = await response.json();
        setConfig({ ...DEFAULT_CONFIG, ...data, businessId });
      } else if (response.status === 404) {
        // New business, use defaults
        setConfig({ ...DEFAULT_CONFIG, businessId });
      }
    } catch (e) {
      console.error('Failed to load configuration:', e);
      setConfig({ ...DEFAULT_CONFIG, businessId });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/receptionist/${businessId}/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (response.ok) {
        localStorage.setItem('receptionist_business_id', businessId);
        setSuccessMessage('Configuration saved successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (e) {
      setError('Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const loadLeads = async () => {
    try {
      const response = await fetch(`${API_BASE}/receptionist/${businessId}/leads`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      }
    } catch (e) {
      console.error('Failed to load leads:', e);
    }
  };

  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    try {
      const response = await fetch(`${API_BASE}/receptionist/${businessId}/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setLeads((prev) =>
          prev.map((lead) => (lead.id === leadId ? { ...lead, status } : lead))
        );
      }
    } catch (e) {
      console.error('Failed to update lead status:', e);
    }
  };

  const provisionNumber = async (areaCode: string) => {
    try {
      const response = await fetch(`${API_BASE}/receptionist/${businessId}/provision-number`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area_code: areaCode }),
      });
      if (response.ok) {
        const data = await response.json();
        setConfig((prev) => ({ ...prev, twilioNumber: data.phone_number }));
        setSuccessMessage(`New number provisioned: ${data.phone_number}`);
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        throw new Error('Failed to provision number');
      }
    } catch (e) {
      setError('Failed to provision phone number. Please try again.');
    }
  };

  const testVoice = async (voiceId: VoiceId) => {
    try {
      const text = config.greetingScript.replace('{business_name}', config.businessName || 'Your Business');
      const response = await fetch(`${API_BASE}/receptionist/test-voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_id: voiceId, text }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.audio_url) {
          const audio = new Audio(data.audio_url);
          audio.play();
        }
      }
    } catch (e) {
      console.error('Failed to test voice:', e);
    }
  };

  const updateConfig = <K extends keyof ReceptionistConfig>(
    key: K,
    value: ReceptionistConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-panel-dark">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-panel-dark">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-panel-light transition-colors"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <span className="text-2xl">📞</span>
              AI Receptionist
            </h1>
            <p className="text-sm text-text-secondary">
              Configure your AI phone receptionist
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 border-b border-border overflow-x-auto bg-panel-medium">
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-panel-light'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'settings' && (
              <SettingsTab
                key="settings"
                config={config}
                updateConfig={updateConfig}
                onTestVoice={testVoice}
              />
            )}
            {activeTab === 'team' && (
              <TeamTab
                key="team"
                teamMembers={config.teamMembers}
                onChange={(members) => updateConfig('teamMembers', members)}
              />
            )}
            {activeTab === 'call-handling' && (
              <CallHandlingTab
                key="call-handling"
                config={config}
                updateConfig={updateConfig}
              />
            )}
            {activeTab === 'hours' && (
              <BusinessHoursTab
                key="hours"
                businessHours={config.businessHours}
                timezone={config.timezone}
                afterHoursBehavior={config.afterHoursBehavior}
                onChange={(hours) => updateConfig('businessHours', hours)}
                onTimezoneChange={(tz) => updateConfig('timezone', tz)}
                onAfterHoursChange={(b) => updateConfig('afterHoursBehavior', b)}
              />
            )}
            {activeTab === 'faq' && (
              <FAQTab
                key="faq"
                faqEntries={config.faqEntries}
                onChange={(entries) => updateConfig('faqEntries', entries)}
              />
            )}
            {activeTab === 'phone' && (
              <PhoneTab
                key="phone"
                twilioNumber={config.twilioNumber}
                forwardingNumber={config.forwardingNumber}
                onProvisionNumber={provisionNumber}
                onForwardingChange={(num) => updateConfig('forwardingNumber', num)}
              />
            )}
            {activeTab === 'leads' && (
              <LeadsTab
                key="leads"
                leads={leads}
                onUpdateStatus={updateLeadStatus}
                onRefresh={loadLeads}
              />
            )}
          </AnimatePresence>

          {/* Save Button */}
          {activeTab !== 'leads' && (
            <div className="mt-8 flex items-center justify-between">
              <div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}
              </div>
              <button
                onClick={saveConfiguration}
                disabled={isSaving}
                className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Settings Tab Component
function SettingsTab({
  config,
  updateConfig,
  onTestVoice,
}: {
  config: ReceptionistConfig;
  updateConfig: <K extends keyof ReceptionistConfig>(key: K, value: ReceptionistConfig[K]) => void;
  onTestVoice: (voiceId: VoiceId) => void;
}) {
  const greetingPreview = config.greetingScript.replace(
    '{business_name}',
    config.businessName || 'Your Business'
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Business Name */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Business Name</label>
        <input
          type="text"
          value={config.businessName}
          onChange={(e) => updateConfig('businessName', e.target.value)}
          placeholder="Acme Services"
          className="w-full px-4 py-3 bg-panel-dark border border-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>

      {/* Industry */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Industry</label>
        <select
          value={config.industry}
          onChange={(e) => updateConfig('industry', e.target.value as Industry)}
          className="w-full px-4 py-3 bg-panel-dark border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        >
          {INDUSTRIES.map((ind) => (
            <option key={ind.value} value={ind.value} className="bg-panel-medium">
              {ind.label}
            </option>
          ))}
        </select>
      </div>

      {/* Greeting Script */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Greeting Script
          <span className="text-text-secondary ml-2 text-xs">Use {'{business_name}'} as placeholder</span>
        </label>
        <textarea
          value={config.greetingScript}
          onChange={(e) => updateConfig('greetingScript', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-panel-dark border border-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
        />
        <div className="mt-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-xs text-primary mb-1">Preview:</p>
          <p className="text-sm text-text-primary/80 italic">"{greetingPreview}"</p>
        </div>
      </div>

      {/* Voice Selection */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Voice</label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {VOICES.map((voice) => (
            <button
              key={voice.value}
              onClick={() => updateConfig('voiceId', voice.value)}
              className={`p-4 rounded-xl border text-left transition-all ${
                config.voiceId === voice.value
                  ? 'bg-primary/10 border-primary'
                  : 'bg-panel-medium border-border hover:border-border/80'
              }`}
            >
              <p className="font-medium text-text-primary">{voice.label}</p>
              <p className="text-xs text-text-secondary mt-1">{voice.description}</p>
            </button>
          ))}
        </div>
        <button
          onClick={() => onTestVoice(config.voiceId)}
          className="mt-3 px-4 py-2 bg-panel-light hover:bg-panel-medium rounded-lg text-sm text-text-secondary transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Test Voice
        </button>
      </div>
    </motion.div>
  );
}

// Team Tab Component
function TeamTab({
  teamMembers,
  onChange,
}: {
  teamMembers: TeamMember[];
  onChange: (members: TeamMember[]) => void;
}) {
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const addMember = () => {
    const newMember: TeamMember = {
      id: `member_${Date.now()}`,
      name: '',
      phone: '',
      role: '',
      priority: teamMembers.length + 1,
      acceptsLeads: true,
    };
    setEditingMember(newMember);
    setIsAddingNew(true);
  };

  const saveMember = (member: TeamMember) => {
    if (isAddingNew) {
      onChange([...teamMembers, member]);
    } else {
      onChange(teamMembers.map((m) => (m.id === member.id ? member : m)));
    }
    setEditingMember(null);
    setIsAddingNew(false);
  };

  const deleteMember = (id: string) => {
    onChange(teamMembers.filter((m) => m.id !== id));
  };

  const reorderMembers = (newOrder: TeamMember[]) => {
    const reordered = newOrder.map((m, i) => ({ ...m, priority: i + 1 }));
    onChange(reordered);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-text-primary">Team Members</h3>
          <p className="text-sm text-text-secondary">Drag to reorder call priority</p>
        </div>
        <button
          onClick={addMember}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Member
        </button>
      </div>

      {teamMembers.length === 0 ? (
        <div className="text-center py-12 bg-panel-medium rounded-xl border border-border">
          <svg className="w-12 h-12 mx-auto text-text-secondary/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-text-secondary">No team members yet</p>
          <p className="text-text-secondary/70 text-sm mt-1">Add team members to receive call transfers</p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={teamMembers}
          onReorder={reorderMembers}
          className="space-y-2"
        >
          {teamMembers.map((member) => (
            <Reorder.Item
              key={member.id}
              value={member}
              className="p-4 bg-panel-medium rounded-xl border border-border cursor-move"
            >
              <div className="flex items-center gap-4">
                <div className="text-text-secondary">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                  {member.priority}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{member.name || 'Unnamed'}</p>
                  <p className="text-sm text-text-secondary">
                    {member.role} • {member.phone}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={member.acceptsLeads}
                      onChange={(e) =>
                        onChange(
                          teamMembers.map((m) =>
                            m.id === member.id ? { ...m, acceptsLeads: e.target.checked } : m
                          )
                        )
                      }
                      className="w-4 h-4 rounded border-border bg-panel-dark text-primary focus:ring-primary/50"
                    />
                    <span className="text-sm text-text-secondary">Leads</span>
                  </label>
                  <button
                    onClick={() => {
                      setEditingMember(member);
                      setIsAddingNew(false);
                    }}
                    className="p-2 hover:bg-panel-light rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteMember(member.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setEditingMember(null);
              setIsAddingNew(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-panel-medium rounded-xl p-6 w-full max-w-md border border-border shadow-xl"
            >
              <h3 className="text-lg font-medium text-text-primary mb-4">
                {isAddingNew ? 'Add Team Member' : 'Edit Team Member'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Name</label>
                  <input
                    type="text"
                    value={editingMember.name}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-panel-dark border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingMember.phone}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, phone: e.target.value })
                    }
                    placeholder="+1 555 123 4567"
                    className="w-full px-4 py-2 bg-panel-dark border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Role</label>
                  <input
                    type="text"
                    value={editingMember.role}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, role: e.target.value })
                    }
                    placeholder="Sales Manager"
                    className="w-full px-4 py-2 bg-panel-dark border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setEditingMember(null);
                    setIsAddingNew(false);
                  }}
                  className="px-4 py-2 bg-panel-light hover:bg-panel-dark text-text-primary rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveMember(editingMember)}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Call Handling Tab Component
function CallHandlingTab({
  config,
  updateConfig,
}: {
  config: ReceptionistConfig;
  updateConfig: <K extends keyof ReceptionistConfig>(key: K, value: ReceptionistConfig[K]) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Classification Patience */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Classification Patience
          <span className="text-text-secondary ml-2">({config.classificationPatience} seconds)</span>
        </label>
        <p className="text-xs text-text-secondary mb-3">
          How long to listen before determining caller intent
        </p>
        <input
          type="range"
          min={10}
          max={120}
          value={config.classificationPatience}
          onChange={(e) => updateConfig('classificationPatience', parseInt(e.target.value))}
          className="w-full h-2 bg-panel-light rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-text-secondary mt-1">
          <span>10s</span>
          <span>120s</span>
        </div>
      </div>

      {/* Ping Timeout */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Ping Timeout
          <span className="text-text-secondary ml-2">({config.pingTimeout} seconds)</span>
        </label>
        <p className="text-xs text-text-secondary mb-3">
          How long to wait for each team member to answer
        </p>
        <input
          type="range"
          min={5}
          max={60}
          value={config.pingTimeout}
          onChange={(e) => updateConfig('pingTimeout', parseInt(e.target.value))}
          className="w-full h-2 bg-panel-light rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-text-secondary mt-1">
          <span>5s</span>
          <span>60s</span>
        </div>
      </div>

      {/* Ping Strategy */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Ping Strategy</label>
        <div className="space-y-2">
          {PING_STRATEGIES.map((strategy) => (
            <button
              key={strategy.value}
              onClick={() => updateConfig('pingStrategy', strategy.value)}
              className={`w-full p-4 rounded-xl border text-left transition-all ${
                config.pingStrategy === strategy.value
                  ? 'bg-primary/10 border-primary'
                  : 'bg-panel-medium border-border hover:border-border/80'
              }`}
            >
              <p className="font-medium text-text-primary">{strategy.label}</p>
              <p className="text-sm text-text-secondary mt-1">{strategy.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Owner Accepts Leads */}
      <div className="flex items-center justify-between p-4 bg-panel-medium rounded-xl border border-border">
        <div>
          <p className="font-medium text-text-primary">Owner Accepts Leads</p>
          <p className="text-sm text-text-secondary">Include business owner in call routing</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.ownerAcceptsLeads}
            onChange={(e) => updateConfig('ownerAcceptsLeads', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-panel-light peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
        </label>
      </div>

      {/* Solicitor Handling */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Solicitor Handling</label>
        <select
          value={config.solicitorHandling}
          onChange={(e) => updateConfig('solicitorHandling', e.target.value as SolicitorHandling)}
          className="w-full px-4 py-3 bg-panel-dark border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        >
          {SOLICITOR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-panel-medium">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Solicitor Message */}
      {config.solicitorHandling === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Custom Solicitor Message
          </label>
          <textarea
            value={config.customSolicitorMessage || ''}
            onChange={(e) => updateConfig('customSolicitorMessage', e.target.value)}
            placeholder="I'm sorry, we're not interested in sales calls at this time. Please remove us from your list."
            rows={3}
            className="w-full px-4 py-3 bg-panel-dark border border-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
          />
        </div>
      )}
    </motion.div>
  );
}

// Business Hours Tab Component
function BusinessHoursTab({
  businessHours,
  timezone,
  afterHoursBehavior,
  onChange,
  onTimezoneChange,
  onAfterHoursChange,
}: {
  businessHours: BusinessHours[];
  timezone: string;
  afterHoursBehavior: AfterHoursBehavior;
  onChange: (hours: BusinessHours[]) => void;
  onTimezoneChange: (tz: string) => void;
  onAfterHoursChange: (b: AfterHoursBehavior) => void;
}) {
  const updateDay = (day: typeof DAYS_OF_WEEK[number], updates: Partial<BusinessHours>) => {
    onChange(
      businessHours.map((h) => (h.day === day ? { ...h, ...updates } : h))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Timezone</label>
        <select
          value={timezone}
          onChange={(e) => onTimezoneChange(e.target.value)}
          className="w-full px-4 py-3 bg-panel-dark border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz} className="bg-panel-medium">
              {tz.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Hours Grid */}
      <div className="space-y-2">
        {businessHours.map((hours) => (
          <div
            key={hours.day}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
              hours.enabled
                ? 'bg-panel-medium border-border'
                : 'bg-panel-light border-border/50'
            }`}
          >
            <label className="flex items-center gap-3 w-32 cursor-pointer">
              <input
                type="checkbox"
                checked={hours.enabled}
                onChange={(e) => updateDay(hours.day, { enabled: e.target.checked })}
                className="w-4 h-4 rounded border-border bg-panel-dark text-primary focus:ring-primary/50"
              />
              <span className={`text-sm font-medium capitalize ${hours.enabled ? 'text-text-primary' : 'text-text-secondary'}`}>
                {hours.day}
              </span>
            </label>
            {hours.enabled && (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={hours.startTime}
                  onChange={(e) => updateDay(hours.day, { startTime: e.target.value })}
                  className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
                <span className="text-text-secondary">to</span>
                <input
                  type="time"
                  value={hours.endTime}
                  onChange={(e) => updateDay(hours.day, { endTime: e.target.value })}
                  className="px-3 py-2 bg-panel-dark border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            )}
            {!hours.enabled && (
              <span className="text-sm text-text-secondary">Closed</span>
            )}
          </div>
        ))}
      </div>

      {/* After Hours Behavior */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">After Hours Behavior</label>
        <select
          value={afterHoursBehavior}
          onChange={(e) => onAfterHoursChange(e.target.value as AfterHoursBehavior)}
          className="w-full px-4 py-3 bg-panel-dark border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        >
          {AFTER_HOURS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-panel-medium">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </motion.div>
  );
}

// FAQ Tab Component
function FAQTab({
  faqEntries,
  onChange,
}: {
  faqEntries: FAQEntry[];
  onChange: (entries: FAQEntry[]) => void;
}) {
  const [editingEntry, setEditingEntry] = useState<FAQEntry | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const addEntry = () => {
    const newEntry: FAQEntry = {
      id: `faq_${Date.now()}`,
      question: '',
      answer: '',
    };
    setEditingEntry(newEntry);
    setIsAddingNew(true);
  };

  const saveEntry = (entry: FAQEntry) => {
    if (isAddingNew) {
      onChange([...faqEntries, entry]);
    } else {
      onChange(faqEntries.map((e) => (e.id === entry.id ? entry : e)));
    }
    setEditingEntry(null);
    setIsAddingNew(false);
  };

  const deleteEntry = (id: string) => {
    onChange(faqEntries.filter((e) => e.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-text-primary">Frequently Asked Questions</h3>
          <p className="text-sm text-text-secondary">Common questions Haley can answer</p>
        </div>
        <button
          onClick={addEntry}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add FAQ
        </button>
      </div>

      {faqEntries.length === 0 ? (
        <div className="text-center py-12 bg-panel-medium rounded-xl border border-border">
          <svg className="w-12 h-12 mx-auto text-text-secondary/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-text-secondary">No FAQ entries yet</p>
          <p className="text-text-secondary/70 text-sm mt-1">Add common questions and answers</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 bg-panel-medium rounded-xl border border-border"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{entry.question}</p>
                  <p className="text-sm text-text-secondary mt-1">{entry.answer}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingEntry(entry);
                      setIsAddingNew(false);
                    }}
                    className="p-2 hover:bg-panel-light rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setEditingEntry(null);
              setIsAddingNew(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-panel-medium rounded-xl p-6 w-full max-w-lg border border-border shadow-xl"
            >
              <h3 className="text-lg font-medium text-text-primary mb-4">
                {isAddingNew ? 'Add FAQ' : 'Edit FAQ'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Question</label>
                  <input
                    type="text"
                    value={editingEntry.question}
                    onChange={(e) =>
                      setEditingEntry({ ...editingEntry, question: e.target.value })
                    }
                    placeholder="What are your hours?"
                    className="w-full px-4 py-2 bg-panel-dark border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Answer</label>
                  <textarea
                    value={editingEntry.answer}
                    onChange={(e) =>
                      setEditingEntry({ ...editingEntry, answer: e.target.value })
                    }
                    placeholder="We're open Monday through Friday, 9am to 5pm."
                    rows={3}
                    className="w-full px-4 py-2 bg-panel-dark border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setEditingEntry(null);
                    setIsAddingNew(false);
                  }}
                  className="px-4 py-2 bg-panel-light hover:bg-panel-dark text-text-primary rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveEntry(editingEntry)}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Phone Tab Component
function PhoneTab({
  twilioNumber,
  forwardingNumber,
  onProvisionNumber,
  onForwardingChange,
}: {
  twilioNumber?: string;
  forwardingNumber?: string;
  onProvisionNumber: (areaCode: string) => void;
  onForwardingChange: (num: string) => void;
}) {
  const [areaCode, setAreaCode] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);

  const handleProvision = async () => {
    if (!areaCode || areaCode.length !== 3) return;
    setIsProvisioning(true);
    await onProvisionNumber(areaCode);
    setIsProvisioning(false);
    setAreaCode('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Current Number */}
      <div className="p-6 bg-panel-medium rounded-xl border border-border">
        <h3 className="text-lg font-medium text-text-primary mb-4">Your Receptionist Number</h3>
        {twilioNumber ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{twilioNumber}</p>
              <p className="text-sm text-text-secondary">Active and receiving calls</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-text-primary">No number configured</p>
              <p className="text-sm text-text-secondary">Provision a new number below</p>
            </div>
          </div>
        )}
      </div>

      {/* Provision New Number */}
      <div className="p-6 bg-panel-medium rounded-xl border border-border">
        <h3 className="text-lg font-medium text-text-primary mb-4">Provision New Number</h3>
        <p className="text-sm text-text-secondary mb-4">
          Get a new phone number for your AI receptionist. Choose your preferred area code.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={areaCode}
            onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
            placeholder="Area code (e.g. 415)"
            maxLength={3}
            className="w-40 px-4 py-3 bg-panel-dark border border-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          <button
            onClick={handleProvision}
            disabled={areaCode.length !== 3 || isProvisioning}
            className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {isProvisioning ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Provisioning...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Provision Number</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Call Forwarding */}
      <div className="p-6 bg-panel-medium rounded-xl border border-border">
        <h3 className="text-lg font-medium text-text-primary mb-4">Forward Existing Number</h3>
        <p className="text-sm text-text-secondary mb-4">
          If you want to keep your existing business number, set up call forwarding to your Twilio number.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Your Existing Number</label>
            <input
              type="tel"
              value={forwardingNumber || ''}
              onChange={(e) => onForwardingChange(e.target.value)}
              placeholder="+1 555 123 4567"
              className="w-full px-4 py-3 bg-panel-dark border border-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <h4 className="text-sm font-medium text-primary mb-2">Setup Instructions</h4>
            <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
              <li>Contact your phone carrier</li>
              <li>Request call forwarding to {twilioNumber || 'your Twilio number'}</li>
              <li>Test by calling your business number</li>
              <li>Your AI receptionist will now answer!</li>
            </ol>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Leads Tab Component
function LeadsTab({
  leads,
  onUpdateStatus,
  onRefresh,
}: {
  leads: Lead[];
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onRefresh: () => void;
}) {
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');

  const filteredLeads = statusFilter === 'all'
    ? leads
    : leads.filter((l) => l.status === statusFilter);

  const statusColors: Record<LeadStatus, string> = {
    pending: 'bg-yellow-500/20 text-yellow-500',
    contacted: 'bg-blue-500/20 text-blue-500',
    converted: 'bg-green-500/20 text-green-500',
    lost: 'bg-red-500/20 text-red-500',
  };

  const urgencyColors: Record<string, string> = {
    low: 'text-text-secondary',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    emergency: 'text-red-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-text-primary">Recent Leads</h3>
          <p className="text-sm text-text-secondary">{leads.length} total leads</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
            className="px-4 py-2 bg-panel-dark border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          >
            <option value="all" className="bg-panel-medium">All Status</option>
            <option value="pending" className="bg-panel-medium">Pending</option>
            <option value="contacted" className="bg-panel-medium">Contacted</option>
            <option value="converted" className="bg-panel-medium">Converted</option>
            <option value="lost" className="bg-panel-medium">Lost</option>
          </select>
          <button
            onClick={onRefresh}
            className="p-2 bg-panel-light hover:bg-panel-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="text-center py-12 bg-panel-medium rounded-xl border border-border">
          <svg className="w-12 h-12 mx-auto text-text-secondary/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-text-secondary">No leads yet</p>
          <p className="text-text-secondary/70 text-sm mt-1">Leads will appear here after calls</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="bg-panel-medium rounded-xl border border-border overflow-hidden"
            >
              <button
                onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                    <div className="text-sm text-text-secondary">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{lead.callerName || lead.callerNumber}</p>
                      {lead.callerName && (
                        <p className="text-xs text-text-secondary">{lead.callerNumber}</p>
                      )}
                    </div>
                    <div className="col-span-2 text-sm text-text-secondary truncate">
                      {lead.summary}
                    </div>
                    <div className={`text-sm font-medium ${urgencyColors[lead.urgency]}`}>
                      {lead.urgency.charAt(0).toUpperCase() + lead.urgency.slice(1)}
                    </div>
                    <div>
                      <select
                        value={lead.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(lead.id, e.target.value as LeadStatus);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[lead.status]} bg-transparent border-none focus:outline-none cursor-pointer`}
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-text-secondary transition-transform ${
                      expandedLead === lead.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              <AnimatePresence>
                {expandedLead === lead.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0 border-t border-border">
                      <div className="pt-4 space-y-4">
                        {/* Recording */}
                        {lead.recordingUrl && (
                          <div>
                            <label className="block text-sm text-text-secondary mb-2">Recording</label>
                            <audio
                              controls
                              src={lead.recordingUrl}
                              className="w-full"
                            />
                          </div>
                        )}

                        {/* Transcript */}
                        {lead.transcript && (
                          <div>
                            <label className="block text-sm text-text-secondary mb-2">Transcript</label>
                            <div className="p-4 bg-panel-light rounded-lg text-sm text-text-primary/80 max-h-40 overflow-auto">
                              {lead.transcript}
                            </div>
                          </div>
                        )}

                        {/* Outcome */}
                        <div>
                          <label className="block text-sm text-text-secondary mb-2">Call Outcome</label>
                          <p className="text-sm text-text-primary capitalize">
                            {lead.outcome.replace(/_/g, ' ')}
                          </p>
                        </div>

                        {/* Notes */}
                        {lead.notes && (
                          <div>
                            <label className="block text-sm text-text-secondary mb-2">Notes</label>
                            <p className="text-sm text-text-primary/80">{lead.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
