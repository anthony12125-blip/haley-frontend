// ATS Resume Optimizer - Type Definitions

// ============================================================================
// MODE TYPES
// ============================================================================

export type ATSMode = 'optimize' | 'generate';

// ============================================================================
// MASTER PROFILE TYPES
// ============================================================================

export interface MasterProfile {
  id: string;
  lastUpdated: number;
  contact: ContactInfo;
  summaries: SummaryVariant[];
  experience: MasterExperience[];
  education: Education[];
  skills: MasterSkill[];
  certifications: Certification[];
  projects: MasterProject[];
  additional: {
    publications: Publication[];
    awards: Award[];
    volunteer: VolunteerExperience[];
    languages: Language[];
  };
  metadata: ProfileMetadata;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface SummaryVariant {
  id: string;
  name: string;
  targetRole: string;
  text: string;
  keywords: string[];
}

export interface MasterExperience {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrentRole: boolean;
  bullets: MasterBullet[];
  tags: string[];
  industries: string[];
  skills: string[];
  highlights: boolean;
}

export interface MasterBullet {
  id: string;
  text: string;
  category: BulletCategory;
  skills: string[];
  keywords: string[];
  hasMetrics: boolean;
  metrics?: ExtractedMetric[];
  variants?: {
    technical?: string;
    leadership?: string;
    concise?: string;
  };
  timesUsed: number;
  lastUsed?: number;
}

export type BulletCategory =
  | 'achievement'
  | 'leadership'
  | 'technical'
  | 'process'
  | 'collaboration'
  | 'communication'
  | 'problem_solving';

export interface MasterSkill {
  name: string;
  category: SkillCategory;
  proficiency: 'expert' | 'advanced' | 'intermediate' | 'beginner';
  yearsExperience: number;
  lastUsed?: string;
  aliases: string[];
  relatedSkills: string[];
}

export type SkillCategory =
  | 'programming_language'
  | 'framework'
  | 'database'
  | 'cloud'
  | 'devops'
  | 'tool'
  | 'methodology'
  | 'soft_skill'
  | 'domain';

export interface MasterProject {
  id: string;
  name: string;
  description: string;
  role: string;
  technologies: string[];
  outcomes: string[];
  url?: string;
  startDate?: string;
  endDate?: string;
  tags: string[];
  relevantFor: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationYear: string;
  gpa?: string;
  honors?: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expirationDate?: string;
  credentialId?: string;
}

export interface Publication {
  id: string;
  title: string;
  venue: string;
  date: string;
  url?: string;
}

export interface Award {
  id: string;
  name: string;
  issuer: string;
  date: string;
  description?: string;
}

export interface VolunteerExperience {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate?: string;
  description: string;
}

export interface Language {
  name: string;
  proficiency: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic';
}

export interface ProfileMetadata {
  totalYearsExperience: number;
  seniorityLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  primaryIndustries: string[];
  primarySkills: string[];
  targetRoles: string[];
}

// ============================================================================
// ANALYSIS TYPES
// ============================================================================

export interface ATSAnalysis {
  mode: 'optimize' | 'generate';
  overallScore: number;
  keywordScore: number;
  formatScore: number;
  structureScore: number;
  quantificationScore: number;
  profileMatchScore?: number;
  resumeKeywords: ExtractedKeyword[];
  jobKeywords: ExtractedKeyword[];
  matchedKeywords: KeywordMatch[];
  missingKeywords: MissingKeyword[];
  hardRequirements: Requirement[];
  softRequirements: Requirement[];
  formatIssues: FormatIssue[];
  selectionDecisions?: SelectionDecision[];
  recommendations: Recommendation[];
  analyzedAt: number;
  processingTime: number;
}

export interface SelectionDecision {
  type: 'experience' | 'bullet' | 'skill' | 'project';
  itemId: string;
  itemName: string;
  included: boolean;
  reason: string;
  relevanceScore: number;
  matchedRequirements: string[];
}

export interface ExtractedKeyword {
  term: string;
  category: KeywordCategory;
  frequency: number;
  importance: 'critical' | 'important' | 'nice-to-have';
  context: string;
}

export type KeywordCategory =
  | 'hard_skill'
  | 'soft_skill'
  | 'tool'
  | 'certification'
  | 'education'
  | 'experience_level'
  | 'industry_term'
  | 'action_verb';

export interface KeywordMatch {
  jobKeyword: string;
  resumeKeyword: string;
  matchType: 'exact' | 'synonym' | 'partial';
  strength: number;
}

export interface MissingKeyword {
  keyword: ExtractedKeyword;
  suggestedAddition: string;
  insertionPoints: string[];
  priority: number;
  profileSources?: {
    experienceId?: string;
    bulletId?: string;
    skillName?: string;
  }[];
}

export interface Requirement {
  text: string;
  type: 'years_experience' | 'education' | 'skill' | 'certification' | 'other';
  isMet: boolean;
  evidence?: string;
  gap?: string;
  satisfiedBy?: {
    type: 'experience' | 'skill' | 'certification' | 'education';
    itemId: string;
    itemName: string;
  };
}

export interface FormatIssue {
  type: FormatIssueType;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  location?: string;
  fix: string;
}

export type FormatIssueType =
  | 'table_detected'
  | 'graphics_detected'
  | 'non_standard_font'
  | 'header_footer_content'
  | 'multi_column'
  | 'text_box'
  | 'non_standard_section'
  | 'missing_section'
  | 'encoding_issue';

export interface Recommendation {
  category: 'keyword' | 'format' | 'structure' | 'content' | 'quantification' | 'selection';
  priority: number;
  title: string;
  description: string;
  before?: string;
  after?: string;
  impact: 'high' | 'medium' | 'low';
}

export interface ExtractedMetric {
  value: string;
  type: 'percentage' | 'currency' | 'count' | 'time' | 'other';
  context: string;
}

// ============================================================================
// RESUME TYPES
// ============================================================================

export interface ParsedResume {
  raw: string;
  format: 'pdf' | 'docx' | 'txt';
  sections: ResumeSection[];
  contact: ContactInfo;
  experience: Experience[];
  education: Education[];
  skills: ParsedSkill[];
  certifications: Certification[];
  wordCount: number;
  bulletCount: number;
  quantifiedStatements: number;
  parseConfidence: number;
  parseWarnings: string[];
}

export interface ResumeSection {
  type: SectionType;
  title: string;
  standardTitle: string;
  content: string;
  startLine: number;
  endLine: number;
  issues: FormatIssue[];
}

export type SectionType =
  | 'contact'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'projects'
  | 'awards'
  | 'publications'
  | 'volunteer'
  | 'unknown';

export interface Experience {
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  bullets: ExperienceBullet[];
  keywords: string[];
}

export interface ExperienceBullet {
  text: string;
  hasMetrics: boolean;
  metrics?: ExtractedMetric[];
  actionVerb?: string;
  keywords: string[];
}

export interface ParsedSkill {
  name: string;
  category?: SkillCategory;
}

// ============================================================================
// GENERATED RESUME TYPES
// ============================================================================

export interface GeneratedResume {
  sourceProfileId: string;
  targetJobId: string;
  generatedAt: number;
  contact: ContactInfo;
  summary: string;
  experience: GeneratedExperience[];
  skills: GeneratedSkillSection;
  education: Education[];
  certifications: Certification[];
  projects?: GeneratedProject[];
  selections: {
    experienceIds: string[];
    bulletIds: string[];
    skillNames: string[];
    projectIds: string[];
  };
  tailoring: {
    keywordsInjected: string[];
    bulletsReframed: { original: string; reframed: string }[];
    summaryCustomized: boolean;
  };
  rawText: string;
  docxBuffer?: ArrayBuffer;
  saved: boolean;
}

export interface GeneratedExperience {
  sourceExperienceId: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  bullets: {
    sourceBulletId: string;
    text: string;
    wasReframed: boolean;
  }[];
}

export interface GeneratedSkillSection {
  technical: string[];
  tools: string[];
  methodologies: string[];
  soft?: string[];
}

export interface GeneratedProject {
  sourceProjectId: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

// ============================================================================
// JOB DESCRIPTION TYPES
// ============================================================================

export interface ParsedJobDescription {
  raw: string;
  title: string;
  company?: string;
  location?: string;
  requirements: {
    hard: Requirement[];
    soft: Requirement[];
  };
  keywords: Map<KeywordCategory, ExtractedKeyword[]>;
  experienceRange?: {
    min: number;
    max?: number;
    unit: 'years' | 'months';
  };
  educationRequirements: EducationReq[];
  keyPhrases: string[];
  industry?: string;
  domain?: string;
  roleSignals: {
    isLeadership: boolean;
    isIC: boolean;
    isCustomerFacing: boolean;
    isRemote: boolean;
    seniorityLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  };
}

export interface EducationReq {
  level: 'high_school' | 'associate' | 'bachelor' | 'master' | 'doctorate' | 'certification';
  field?: string;
  required: boolean;
}

// ============================================================================
// CONTEXT / STATE TYPES
// ============================================================================

export interface ATSOptimizerContext {
  mode: 'optimize' | 'generate' | null;
  currentStep: ATSWorkflowStep;
  // Optimize mode state
  resumeFile?: {
    name: string;
    type: string;
    size: number;
    data: string; // base64
  };
  parsedResume?: ParsedResume;
  optimizedResume?: {
    text: string;
    docxBase64?: string;
    changeLog: OptimizationChange[];
    saved: boolean;
  };
  // Generate mode state
  masterProfile?: MasterProfile;
  profileSource: 'existing' | 'import' | 'build' | null;
  generatedResume?: GeneratedResume;
  manualSelections?: {
    experienceIds: string[];
    bulletOverrides: Record<string, string[]>;
    skillNames: string[];
    projectIds: string[];
    summaryVariantId?: string;
  };
  // Shared state
  jobDescriptionText?: string;
  parsedJobDescription?: ParsedJobDescription;
  analysis?: ATSAnalysis;
  // Preferences
  preferences: ATSPreferences;
  // History
  analysisHistory: AnalysisHistoryEntry[];
}

export interface ATSPreferences {
  aggressiveness: 'conservative' | 'balanced' | 'aggressive';
  preserveFormatting: boolean;
  targetScore: number;
  focusAreas: KeywordCategory[];
  maxExperiences: number;
  maxBulletsPerJob: number;
  includeProjects: boolean;
  includeSoftSkills: boolean;
  resumeLength: '1-page' | '2-page' | 'auto';
  prioritizeRecent?: boolean;
}

export type ATSWorkflowStep =
  | 'mode_select'
  // Optimize mode
  | 'upload'
  | 'parsing'
  | 'analyzing'
  | 'results'
  | 'optimizing'
  | 'review'
  | 'export'
  // Generate mode
  | 'profile_select'
  | 'profile_build'
  | 'profile_import'
  | 'profile_review'
  | 'jd_input'
  | 'matching'
  | 'selection_review'
  | 'customize'
  | 'preview'
  | 'generate_export';

export interface OptimizationChange {
  type: 'keyword_add' | 'keyword_rephrase' | 'metric_add' | 'section_reorder' | 'format_fix';
  location: string;
  before: string;
  after: string;
  reason: string;
  applied: boolean;
}

export interface AnalysisHistoryEntry {
  timestamp: number;
  mode: 'optimize' | 'generate';
  jobTitle: string;
  score: number;
  keywordMatches: number;
  totalKeywords: number;
}

// Default preferences
export const DEFAULT_PREFERENCES: ATSPreferences = {
  aggressiveness: 'balanced',
  preserveFormatting: false,
  targetScore: 80,
  focusAreas: ['hard_skill', 'tool'],
  maxExperiences: 4,
  maxBulletsPerJob: 5,
  includeProjects: true,
  includeSoftSkills: false,
  resumeLength: 'auto',
  prioritizeRecent: true,
};

// Default context
export const DEFAULT_CONTEXT: ATSOptimizerContext = {
  mode: null,
  currentStep: 'mode_select',
  profileSource: null,
  preferences: DEFAULT_PREFERENCES,
  analysisHistory: [],
};

// Export types
export type ExportFormat = 'docx' | 'pdf' | 'txt';

export interface ExportOptions {
  includeMetrics?: boolean;
  includeKeywords?: boolean;
  compactMode?: boolean;
}
