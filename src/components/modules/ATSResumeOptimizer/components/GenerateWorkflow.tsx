'use client';

import React, { useCallback, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ATSOptimizerContext,
  ATSWorkflowStep,
  MasterProfile,
  MasterExperience,
  MasterBullet,
  MasterSkill,
  MasterProject,
  SelectionDecision,
} from '../types';
import { parseJobDescription } from '../utils/parsing';
import { matchProfileToJob } from '../utils/selection';
import { generateResumeFromSelections } from '../utils/generation';
import { exportResume, downloadBlob, getSuggestedFilename } from '../utils/export';
import ScoreCard from './shared/ScoreCard';

interface GenerateWorkflowProps {
  context: any;
}

const GENERATE_STEPS: { key: string; label: string }[] = [
  { key: 'profile_select', label: 'Profile' },
  { key: 'jd_input', label: 'Job' },
  { key: 'matching', label: 'Match' },
  { key: 'selection_review', label: 'Review' },
  { key: 'preview', label: 'Preview' },
  { key: 'generate_export', label: 'Export' },
];

export default function GenerateWorkflow({ context }: GenerateWorkflowProps) {
  const {
    currentStep,
    setStep,
    profiles,
    activeProfile,
    setActiveProfile,
    saveProfile,
    deleteProfile,
    parsedJD,
    setParsedJD,
    selectionDecision,
    setSelectionDecision,
    generatedResume,
    setGeneratedResume,
    preferences,
    isProcessing,
    setIsProcessing,
    setError,
  } = context;

  const [jdText, setJdText] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedSelections, setEditedSelections] = useState<any>(null);

  const currentStepIndex = GENERATE_STEPS.findIndex(s => s.key === currentStep);

  // Parse JD and match
  const handleMatchProfile = useCallback(async () => {
    if (!activeProfile || !jdText) {
      setError?.('Please select a profile and enter a job description');
      return;
    }

    setIsProcessing?.(true);
    try {
      const jd = parseJobDescription(jdText);
      setParsedJD?.(jd);

      const decision = matchProfileToJob(activeProfile, jd, preferences) as any;
      setSelectionDecision?.(decision);
      setEditedSelections(decision as any);

      setStep?.('matching');
    } catch (e) {
      setError?.('Failed to analyze job description');
    } finally {
      setIsProcessing?.(false);
    }
  }, [activeProfile, jdText, preferences, setIsProcessing, setParsedJD, setSelectionDecision, setStep, setError]);

  // Generate resume
  const handleGenerate = useCallback(async () => {
    if (!activeProfile || !parsedJD || !editedSelections) return;

    setIsProcessing?.(true);
    try {
      const resume = generateResumeFromSelections(
        activeProfile,
        parsedJD,
        {
          experienceIds: editedSelections.selectedExperiences.map((e: any) => e.experienceId),
          bulletOverrides: editedSelections.selectedExperiences.reduce((acc: Record<string, string[]>, exp: any) => {
            acc[exp.experienceId] = exp.selectedBulletIds;
            return acc;
          }, {} as Record<string, string[]>),
          skillNames: editedSelections.selectedSkills,
          projectIds: editedSelections.selectedProjects.map((p: any) => p.projectId),
          summaryVariantId: editedSelections.summaryVariantId,
        },
        preferences
      );

      setGeneratedResume?.(resume);
      setStep?.('preview');
    } catch (e) {
      setError?.('Failed to generate resume');
    } finally {
      setIsProcessing?.(false);
    }
  }, [activeProfile, parsedJD, editedSelections, preferences, setIsProcessing, setGeneratedResume, setStep, setError]);

  // Export
  const handleExport = useCallback(async (format: 'docx' | 'pdf' | 'txt') => {
    if (!generatedResume) return;

    setIsProcessing?.(true);
    try {
      const blob = await exportResume(generatedResume, format);
      const filename = getSuggestedFilename(generatedResume, format, parsedJD?.title);
      downloadBlob(blob, filename);
    } catch (e) {
      setError?.(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setIsProcessing?.(false);
    }
  }, [generatedResume, parsedJD, setIsProcessing, setError]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Step Progress */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {GENERATE_STEPS.map((step, index) => (
            <React.Fragment key={step.key}>
              <button
                onClick={() => index < currentStepIndex && setStep?.(step.key)}
                disabled={index > currentStepIndex}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                  index === currentStepIndex
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : index < currentStepIndex
                    ? 'text-white/70 hover:bg-white/5 cursor-pointer'
                    : 'text-white/30 cursor-not-allowed'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  index === currentStepIndex
                    ? 'bg-emerald-500 text-white'
                    : index < currentStepIndex
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-white/30'
                }`}>
                  {index < currentStepIndex ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="hidden md:inline text-sm">{step.label}</span>
              </button>
              {index < GENERATE_STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-1 ${
                  index < currentStepIndex ? 'bg-green-500' : 'bg-white/10'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-auto p-6">
        <AnimatePresence mode="wait">
          {currentStep === 'profile_select' && (
            <motion.div
              key="profile-select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <ProfileSelectStep
                profiles={profiles}
                activeProfile={activeProfile}
                onSelectProfile={(p) => {
                  setActiveProfile?.(p);
                  setIsEditingProfile(false);
                }}
                onCreateProfile={() => {
                  setActiveProfile?.(createEmptyProfile());
                  setIsEditingProfile(true);
                }}
                onEditProfile={() => setIsEditingProfile(true)}
                onDeleteProfile={deleteProfile!}
                isEditing={isEditingProfile}
                onSaveProfile={(p) => {
                  saveProfile?.(p);
                  setIsEditingProfile(false);
                }}
                onCancelEdit={() => {
                  setIsEditingProfile(false);
                  if (!activeProfile?.id) {
                    setActiveProfile?.(null);
                  }
                }}
                onNext={() => setStep?.('jd_input')}
              />
            </motion.div>
          )}

          {currentStep === 'jd_input' && (
            <motion.div
              key="jd-input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <JDInputStep
                jdText={jdText}
                onJdChange={setJdText}
                onMatch={handleMatchProfile}
                onBack={() => setStep?.('profile_select')}
                isProcessing={isProcessing || false}
                profileName={activeProfile?.contact.name || 'Unknown'}
              />
            </motion.div>
          )}

          {currentStep === 'matching' && selectionDecision && (
            <motion.div
              key="matching"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <MatchingStep
                decision={selectionDecision}
                onNext={() => setStep?.('selection_review')}
                onBack={() => setStep?.('jd_input')}
              />
            </motion.div>
          )}

          {currentStep === 'selection_review' && editedSelections && activeProfile && (
            <motion.div
              key="selection-review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-6xl mx-auto"
            >
              <SelectionReviewStep
                profile={activeProfile}
                selections={editedSelections}
                onUpdateSelections={setEditedSelections}
                onGenerate={handleGenerate}
                onBack={() => setStep?.('matching')}
                isProcessing={isProcessing || false}
              />
            </motion.div>
          )}

          {currentStep === 'preview' && generatedResume && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-6xl mx-auto"
            >
              <PreviewStep
                resume={generatedResume}
                onExport={() => setStep?.('generate_export')}
                onBack={() => setStep?.('selection_review')}
              />
            </motion.div>
          )}

          {currentStep === 'generate_export' && generatedResume && (
            <motion.div
              key="generate-export"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <GenerateExportStep
                resume={generatedResume}
                onExport={handleExport}
                onBack={() => setStep?.('preview')}
                isProcessing={isProcessing || false}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Helper to create empty profile
function createEmptyProfile(): MasterProfile {
  return {
    id: `profile-${Date.now()}`,
    contact: { name: '', email: '', phone: '', location: '' },
    summaries: [],
    experience: [],
    skills: [],
    education: [],
    certifications: [],
    projects: [],
    metadata: {
      totalYearsExperience: 0,
      primarySkills: [],
      primaryIndustries: [],
      seniorityLevel: 'mid',
      targetRoles: [],
    },
    lastUpdated: Date.now(),
    additional: {
      publications: [],
      awards: [],
      volunteer: [],
      languages: [],
    },
  };
}

// Profile Select Step
function ProfileSelectStep({
  profiles,
  activeProfile,
  onSelectProfile,
  onCreateProfile,
  onEditProfile,
  onDeleteProfile,
  isEditing,
  onSaveProfile,
  onCancelEdit,
  onNext,
}: {
  profiles: MasterProfile[];
  activeProfile: MasterProfile | null;
  onSelectProfile: (profile: MasterProfile) => void;
  onCreateProfile: () => void;
  onEditProfile: () => void;
  onDeleteProfile: (id: string) => void;
  isEditing: boolean;
  onSaveProfile: (profile: MasterProfile) => void;
  onCancelEdit: () => void;
  onNext: () => void;
}) {
  const [editingProfile, setEditingProfile] = useState<MasterProfile | null>(null);

  // Initialize editing state
  React.useEffect(() => {
    if (isEditing && activeProfile) {
      setEditingProfile(JSON.parse(JSON.stringify(activeProfile)));
    }
  }, [isEditing, activeProfile]);

  if (isEditing && editingProfile) {
    return (
      <ProfileEditor
        profile={editingProfile}
        onChange={setEditingProfile}
        onSave={() => onSaveProfile(editingProfile)}
        onCancel={onCancelEdit}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">
          Select Your Master Profile
        </h2>
        <p className="text-white/60">
          Choose an existing profile or create a new one with all your career history
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-white/50 mb-4">No profiles yet</p>
          <button
            onClick={onCreateProfile}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
          >
            Create Your First Profile
          </button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {profiles.map((profile) => (
              <motion.div
                key={profile.id}
                whileHover={{ scale: 1.01 }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  activeProfile?.id === profile.id
                    ? 'bg-emerald-500/10 border-emerald-500/50'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
                onClick={() => onSelectProfile(profile)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-white">{profile.contact.name || 'Unnamed Profile'}</h3>
                    <p className="text-sm text-white/50">{profile.contact.email}</p>
                    <div className="mt-2 flex gap-2 text-xs text-white/40">
                      <span>{profile.experience.length} roles</span>
                      <span>•</span>
                      <span>{profile.skills.length} skills</span>
                      <span>•</span>
                      <span>{profile.metadata.totalYearsExperience} years</span>
                    </div>
                  </div>
                  {activeProfile?.id === profile.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProfile();
                        }}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this profile?')) {
                            onDeleteProfile(profile.id);
                          }
                        }}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Create New Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              onClick={onCreateProfile}
              className="p-4 rounded-xl border-2 border-dashed border-white/20 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 text-white/50 hover:text-emerald-400 transition-colors min-h-[120px]"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create New Profile</span>
            </motion.button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onNext}
              disabled={!activeProfile}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <span>Continue</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Profile Editor Component
function ProfileEditor({
  profile,
  onChange,
  onSave,
  onCancel,
}: {
  profile: MasterProfile;
  onChange: (profile: MasterProfile) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'contact' | 'experience' | 'skills' | 'education' | 'projects'>('contact');

  const updateContact = (field: keyof typeof profile.contact, value: string) => {
    onChange({
      ...profile,
      contact: { ...profile.contact, [field]: value },
      lastUpdated: Date.now(),
    });
  };

  const addExperience = () => {
    const newExp: MasterExperience = {
      id: `exp-${Date.now()}`,
      company: '',
      title: '',
      location: '',
      startDate: '',
      isCurrentRole: false,
      bullets: [],
      tags: [],
      industries: [],
      skills: [],
      highlights: false,
    };
    onChange({
      ...profile,
      experience: [...profile.experience, newExp],
      lastUpdated: Date.now(),
    });
  };

  const updateExperience = (index: number, updates: Partial<MasterExperience>) => {
    const newExp = [...profile.experience];
    newExp[index] = { ...newExp[index], ...updates };
    onChange({
      ...profile,
      experience: newExp,
      lastUpdated: Date.now(),
    });
  };

  const removeExperience = (index: number) => {
    onChange({
      ...profile,
      experience: profile.experience.filter((_, i) => i !== index),
      lastUpdated: Date.now(),
    });
  };

  const addBullet = (expIndex: number) => {
    const newBullet: MasterBullet = {
      id: `bullet-${Date.now()}`,
      text: '',
      category: 'achievement',
      skills: [],
      keywords: [],
      hasMetrics: false,
      timesUsed: 0,
    };
    const newExp = [...profile.experience];
    newExp[expIndex].bullets = [...newExp[expIndex].bullets, newBullet];
    onChange({
      ...profile,
      experience: newExp,
      lastUpdated: Date.now(),
    });
  };

  const updateBullet = (expIndex: number, bulletIndex: number, text: string) => {
    const newExp = [...profile.experience];
    newExp[expIndex].bullets[bulletIndex].text = text;
    onChange({
      ...profile,
      experience: newExp,
      lastUpdated: Date.now(),
    });
  };

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const newExp = [...profile.experience];
    newExp[expIndex].bullets = newExp[expIndex].bullets.filter((_, i) => i !== bulletIndex);
    onChange({
      ...profile,
      experience: newExp,
      lastUpdated: Date.now(),
    });
  };

  const addSkill = () => {
    const newSkill: MasterSkill = {
      name: '',
      category: 'programming_language',
      yearsExperience: 1,
      proficiency: 'intermediate',
      aliases: [],
      relatedSkills: [],
    };
    onChange({
      ...profile,
      skills: [...profile.skills, newSkill],
      lastUpdated: Date.now(),
    });
  };

  const updateSkill = (index: number, updates: Partial<MasterSkill>) => {
    const newSkills = [...profile.skills];
    newSkills[index] = { ...newSkills[index], ...updates };
    onChange({
      ...profile,
      skills: newSkills,
      lastUpdated: Date.now(),
    });
  };

  const removeSkill = (index: number) => {
    onChange({
      ...profile,
      skills: profile.skills.filter((_, i) => i !== index),
      lastUpdated: Date.now(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Edit Profile</h2>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            Save Profile
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {(['contact', 'experience', 'skills', 'education', 'projects'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10 max-h-[60vh] overflow-auto">
        {activeTab === 'contact' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Full Name</label>
              <input
                type="text"
                value={profile.contact.name}
                onChange={(e) => updateContact('name', e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Email</label>
              <input
                type="email"
                value={profile.contact.email}
                onChange={(e) => updateContact('email', e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Phone</label>
              <input
                type="tel"
                value={profile.contact.phone}
                onChange={(e) => updateContact('phone', e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Location</label>
              <input
                type="text"
                value={profile.contact.location}
                onChange={(e) => updateContact('location', e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={profile.contact.linkedin || ''}
                onChange={(e) => updateContact('linkedin', e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Portfolio URL</label>
              <input
                type="url"
                value={profile.contact.portfolio || ''}
                onChange={(e) => updateContact('portfolio', e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="space-y-6">
            {profile.experience.map((exp, expIndex) => (
              <div key={exp.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-medium text-white">Role {expIndex + 1}</h4>
                  <button
                    onClick={() => removeExperience(expIndex)}
                    className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-3 mb-4">
                  <input
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => updateExperience(expIndex, { company: e.target.value })}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <input
                    placeholder="Title"
                    value={exp.title}
                    onChange={(e) => updateExperience(expIndex, { title: e.target.value })}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <input
                    placeholder="Location"
                    value={exp.location}
                    onChange={(e) => updateExperience(expIndex, { location: e.target.value })}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      placeholder="Start Date"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(expIndex, { startDate: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <input
                      type="date"
                      placeholder="End Date"
                      value={exp.endDate || ''}
                      onChange={(e) => updateExperience(expIndex, { endDate: e.target.value || undefined })}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                {/* Bullets */}
                <div className="space-y-2">
                  <label className="block text-sm text-white/60">Bullet Points</label>
                  {exp.bullets.map((bullet, bulletIndex) => (
                    <div key={bullet.id} className="flex gap-2">
                      <input
                        value={bullet.text}
                        onChange={(e) => updateBullet(expIndex, bulletIndex, e.target.value)}
                        placeholder="Describe your achievement..."
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      <button
                        onClick={() => removeBullet(expIndex, bulletIndex)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addBullet(expIndex)}
                    className="text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    + Add bullet point
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={addExperience}
              className="w-full py-3 border-2 border-dashed border-white/20 hover:border-emerald-500/50 rounded-lg text-white/50 hover:text-emerald-400 transition-colors"
            >
              + Add Experience
            </button>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full"
                >
                  <input
                    value={skill.name}
                    onChange={(e) => updateSkill(index, { name: e.target.value })}
                    className="w-24 bg-transparent text-white text-sm focus:outline-none"
                    placeholder="Skill name"
                  />
                  <button
                    onClick={() => removeSkill(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addSkill}
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              + Add Skill
            </button>
          </div>
        )}

        {activeTab === 'education' && (
          <div className="text-white/50 text-center py-8">
            Education editing coming soon...
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="text-white/50 text-center py-8">
            Projects editing coming soon...
          </div>
        )}
      </div>
    </div>
  );
}

// JD Input Step
function JDInputStep({
  jdText,
  onJdChange,
  onMatch,
  onBack,
  isProcessing,
  profileName,
}: {
  jdText: string;
  onJdChange: (text: string) => void;
  onMatch: () => void;
  onBack: () => void;
  isProcessing: boolean;
  profileName: string;
}) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">
          Enter Job Description
        </h2>
        <p className="text-white/60">
          Paste the job posting you're applying to. We'll match it against {profileName}'s profile.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-white/80">
          Job Description
        </label>
        <textarea
          value={jdText}
          onChange={(e) => onJdChange(e.target.value)}
          placeholder="Paste the full job description here..."
          className="w-full h-80 p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
        {jdText && (
          <p className="text-sm text-green-400">
            {jdText.split(/\s+/).length} words loaded
          </p>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
        >
          Back
        </button>
        <button
          onClick={onMatch}
          disabled={!jdText || isProcessing}
          className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Matching...</span>
            </>
          ) : (
            <>
              <span>Match Profile</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Matching Step
function MatchingStep({
  decision,
  onNext,
  onBack,
}: {
  decision: any;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">
          Match Results
        </h2>
        <p className="text-white/60">
          We've analyzed your profile against the job requirements
        </p>
      </div>

      {/* Match Score */}
      <div className="flex justify-center">
        <ScoreCard
          label="Profile Match"
          score={decision.matchScore}
          color="green"
          size="large"
        />
      </div>

      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {decision.selectedExperiences.length}
          </div>
          <p className="text-sm text-white/60">Roles Selected</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {decision.selectedSkills.length}
          </div>
          <p className="text-sm text-white/60">Skills Matched</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {decision.selectedProjects.length}
          </div>
          <p className="text-sm text-white/60">Projects Included</p>
        </div>
      </div>

      {/* Rationale */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="font-medium text-white mb-4">Selection Rationale</h3>
        <div className="space-y-3">
          {decision.rationale.slice(0, 5).map((item: any, index: number) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-400">
                {index + 1}
              </div>
              <p className="text-white/70">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          <span>Review Selections</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Selection Review Step
function SelectionReviewStep({
  profile,
  selections,
  onUpdateSelections,
  onGenerate,
  onBack,
  isProcessing,
}: {
  profile: MasterProfile;
  selections: any;
  onUpdateSelections: (selections: any) => void;
  onGenerate: () => void;
  onBack: () => void;
  isProcessing: boolean;
}) {
  const toggleExperience = (expId: string) => {
    const existing = selections.selectedExperiences.find((e: any) => e.experienceId === expId);
    if (existing) {
      onUpdateSelections({
        ...selections,
        selectedExperiences: selections.selectedExperiences.filter((e: any) => e.experienceId !== expId),
      });
    } else {
      const exp = profile.experience.find((e: any) => e.id === expId);
      if (exp) {
        onUpdateSelections({
          ...selections,
          selectedExperiences: [
            ...selections.selectedExperiences,
            {
              experienceId: expId,
              selectedBulletIds: exp.bullets.map((b: any) => b.id).slice(0, 5),
              score: 0.5,
            },
          ],
        });
      }
    }
  };

  const toggleSkill = (skillName: string) => {
    if (selections.selectedSkills.includes(skillName)) {
      onUpdateSelections({
        ...selections,
        selectedSkills: selections.selectedSkills.filter((s: any) => s !== skillName),
      });
    } else {
      onUpdateSelections({
        ...selections,
        selectedSkills: [...selections.selectedSkills, skillName],
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          Review Selections
        </h2>
        <p className="text-white/60">
          Adjust what to include in your tailored resume
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Experience Selection */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="font-medium text-white mb-4">Experience</h3>
          <div className="space-y-3 max-h-80 overflow-auto">
            {profile.experience.map((exp: any) => {
              const isSelected = selections.selectedExperiences.some((e: any) => e.experienceId === exp.id);
              return (
                <button
                  key={exp.id}
                  onClick={() => toggleExperience(exp.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{exp.title}</p>
                      <p className="text-sm text-white/50">{exp.company}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Skills Selection */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="font-medium text-white mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2 max-h-80 overflow-auto">
            {profile.skills.map((skill: any, skillIdx: number) => {
              const isSelected = selections.selectedSkills.includes(skill.name);
              return (
                <button
                  key={skillIdx}
                  onClick={() => toggleSkill(skill.name)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-white/10 text-white/60 border border-transparent hover:border-white/20'
                  }`}
                >
                  {skill.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
        >
          Back
        </button>
        <button
          onClick={onGenerate}
          disabled={isProcessing || selections.selectedExperiences.length === 0}
          className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <span>Generate Resume</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Preview Step
function PreviewStep({
  resume,
  onExport,
  onBack,
}: {
  resume: NonNullable<ATSOptimizerContext['generatedResume']>;
  onExport: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            Resume Preview
          </h2>
          <p className="text-white/60">
            Review your tailored resume before exporting
          </p>
        </div>
        {resume.tailoring.keywordsInjected.length > 0 && (
          <div className="px-3 py-1.5 bg-green-500/10 rounded-full text-sm text-green-400">
            {resume.tailoring.keywordsInjected.length} keywords injected
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl p-8 shadow-xl max-h-[60vh] overflow-auto">
        <div className="max-w-2xl mx-auto text-gray-900">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold uppercase">{resume.contact.name}</h1>
            <p className="text-gray-600">
              {[resume.contact.email, resume.contact.phone, resume.contact.location]
                .filter(Boolean)
                .join(' | ')}
            </p>
          </div>

          {/* Summary */}
          {resume.summary && (
            <div className="mb-6">
              <h2 className="text-lg font-bold border-b border-gray-300 mb-2">PROFESSIONAL SUMMARY</h2>
              <p className="text-sm">{resume.summary}</p>
            </div>
          )}

          {/* Experience */}
          {resume.experience.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold border-b border-gray-300 mb-2">EXPERIENCE</h2>
              {resume.experience.map((exp) => (
                <div key={exp.sourceExperienceId} className="mb-4">
                  <div className="flex justify-between">
                    <span className="font-semibold">{exp.title}</span>
                    <span className="text-sm text-gray-600">
                      {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Present'}
                    </span>
                  </div>
                  <p className="text-gray-600 italic">{exp.company}{exp.location ? `, ${exp.location}` : ''}</p>
                  <ul className="mt-2 space-y-1">
                    {exp.bullets.map((bullet) => (
                      <li key={bullet.sourceBulletId} className="text-sm flex gap-2">
                        <span>•</span>
                        <span className={bullet.wasReframed ? 'bg-yellow-100' : ''}>{bullet.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          <div className="mb-6">
            <h2 className="text-lg font-bold border-b border-gray-300 mb-2">SKILLS</h2>
            <div className="text-sm space-y-1">
              {resume.skills.technical.length > 0 && (
                <p><strong>Technical:</strong> {resume.skills.technical.join(', ')}</p>
              )}
              {resume.skills.tools.length > 0 && (
                <p><strong>Tools:</strong> {resume.skills.tools.join(', ')}</p>
              )}
              {resume.skills.methodologies.length > 0 && (
                <p><strong>Methodologies:</strong> {resume.skills.methodologies.join(', ')}</p>
              )}
            </div>
          </div>

          {/* Education */}
          {resume.education.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold border-b border-gray-300 mb-2">EDUCATION</h2>
              {resume.education.map((edu, i) => (
                <p key={i} className="text-sm">
                  {edu.degree} in {edu.field} | {edu.institution} | {edu.graduationYear}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tailoring Info */}
      {(resume.tailoring.bulletsReframed.length > 0 || resume.tailoring.keywordsInjected.length > 0) && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h4 className="font-medium text-white mb-2">Tailoring Applied</h4>
          <div className="flex flex-wrap gap-4 text-sm text-white/60">
            {resume.tailoring.bulletsReframed.length > 0 && (
              <span>{resume.tailoring.bulletsReframed.length} bullets reframed</span>
            )}
            {resume.tailoring.keywordsInjected.length > 0 && (
              <span>{resume.tailoring.keywordsInjected.length} keywords injected</span>
            )}
            {resume.tailoring.summaryCustomized && (
              <span>Custom summary generated</span>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
        >
          Back to Edit
        </button>
        <button
          onClick={onExport}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          <span>Export Resume</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Generate Export Step
function GenerateExportStep({
  resume,
  onExport,
  onBack,
  isProcessing,
}: {
  resume: NonNullable<ATSOptimizerContext['generatedResume']>;
  onExport: (format: 'docx' | 'pdf' | 'txt') => void;
  onBack: () => void;
  isProcessing: boolean;
}) {
  const formats: { key: 'docx' | 'pdf' | 'txt'; label: string; desc: string; recommended?: boolean }[] = [
    { key: 'docx', label: 'Word Document', desc: 'Best for ATS systems', recommended: true },
    { key: 'pdf', label: 'PDF Document', desc: 'Print-ready format' },
    { key: 'txt', label: 'Plain Text', desc: 'Simple text format' },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">
          Export Your Resume
        </h2>
        <p className="text-white/60">
          Download your tailored resume in your preferred format
        </p>
      </div>

      {/* Summary Stats */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
        <p className="text-white/50 mb-2">Generated for</p>
        <p className="text-xl font-semibold text-white">{resume.targetJobId || 'Target Position'}</p>
        <div className="mt-4 flex justify-center gap-6 text-sm text-white/60">
          <span>{resume.experience.length} roles</span>
          <span>•</span>
          <span>{resume.skills.technical.length + resume.skills.tools.length} skills</span>
          <span>•</span>
          <span>{resume.tailoring.keywordsInjected.length} keywords</span>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid md:grid-cols-3 gap-4">
        {formats.map((format) => (
          <motion.button
            key={format.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onExport(format.key)}
            disabled={isProcessing}
            className={`p-6 rounded-xl border text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              format.recommended
                ? 'bg-emerald-500/10 border-emerald-500/50 hover:border-emerald-500'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            {format.recommended && (
              <span className="text-xs text-emerald-400 mb-2 block">Recommended</span>
            )}
            <h3 className="text-white font-medium mb-1">{format.label}</h3>
            <p className="text-sm text-white/50">{format.desc}</p>
          </motion.button>
        ))}
      </div>

      <div className="flex justify-start">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
        >
          Back to Preview
        </button>
      </div>
    </div>
  );
}

// Helper
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
