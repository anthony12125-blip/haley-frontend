// Module Registry - Central configuration for all Haley modules

export interface ModuleConfig {
  name: string;
  emoji: string;
  category: string;
  status: 'active' | 'coming' | 'beta';
  description?: string;
}

export const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  // Developer Tools (existing modules)
  'api-keys': {
    name: 'API Keys',
    emoji: '🔑',
    category: 'developer',
    status: 'active',
    description: 'Manage your API keys',
  },
  engineering: {
    name: 'Engineering',
    emoji: '🔧',
    category: 'developer',
    status: 'active',
    description: 'Engineering agent assistant',
  },
  ideaharvester: {
    name: 'Idea Harvester',
    emoji: '💡',
    category: 'developer',
    status: 'active',
    description: 'AI product replication pipeline',
  },
  soundboard: {
    name: 'R&D',
    emoji: '🔬',
    category: 'developer',
    status: 'active',
    description: 'AI research and development sandbox',
  },
  robloxexpert: {
    name: 'Roblox Expert',
    emoji: '🎮',
    category: 'developer',
    status: 'active',
    description: 'Describe scenes, get Lua code',
  },

  // Chat & Assistant
  multi_llm: {
    name: 'Multi-LLM Chat',
    emoji: '💬',
    category: 'chat',
    status: 'coming',
    description: 'Query multiple LLMs at once',
  },

  // Education
  homework_solver: {
    name: 'Homework Solver',
    emoji: '📚',
    category: 'education',
    status: 'active',
    description: 'Step-by-step homework help',
  },
  study_guide: {
    name: 'Study Guide',
    emoji: '📖',
    category: 'education',
    status: 'coming',
    description: 'Generate study materials',
  },

  // Writing
  writing_assist: {
    name: 'Writing Assistant',
    emoji: '✏️',
    category: 'writing',
    status: 'coming',
    description: 'Improve your writing',
  },
  email_gen: {
    name: 'Email Generator',
    emoji: '📧',
    category: 'writing',
    status: 'coming',
    description: 'Professional email drafts',
  },
  story_writer: {
    name: 'Story Writer',
    emoji: '✍️',
    category: 'creative',
    status: 'coming',
    description: 'Creative story generation',
  },

  // Creative
  image_gen: {
    name: 'Image Generator',
    emoji: '🖼️',
    category: 'creative',
    status: 'coming',
    description: 'AI-generated images',
  },

  // Utility
  code_assist: {
    name: 'Code Assistant',
    emoji: '💻',
    category: 'developer',
    status: 'active',
    description: 'Claude Code in your browser - AI pair programming',
  },
  doc_scanner: {
    name: 'Doc Scanner',
    emoji: '📄',
    category: 'utility',
    status: 'coming',
    description: 'Scan and analyze documents',
  },
  summarizer: {
    name: 'Summarizer',
    emoji: '📝',
    category: 'utility',
    status: 'coming',
    description: 'Summarize long content',
  },
  translator: {
    name: 'Translator',
    emoji: '🌐',
    category: 'utility',
    status: 'coming',
    description: 'Multi-language translation',
  },

  // Media & Creative
  photo_studio: {
    name: 'AI Photo Studio',
    emoji: '📸',
    category: 'creative',
    status: 'active',
    description: 'Professional photo editing: enhance, retouch, background removal, upscaling, and more',
  },
  video_auto_cutter: {
    name: 'Video Auto-Cutter',
    emoji: '🎬',
    category: 'creative',
    status: 'coming',
    description: 'Automatically edit and cut videos',
  },
  image_enhancer: {
    name: 'Image Enhancer',
    emoji: '✨',
    category: 'creative',
    status: 'coming',
    description: 'Upscale and enhance images with AI',
  },
  audio_dubber: {
    name: 'Audio Dubber',
    emoji: '🎙️',
    category: 'creative',
    status: 'coming',
    description: 'AI voice dubbing and translation',
  },
  visual_storyboarder: {
    name: 'Visual Storyboarder',
    emoji: '🎨',
    category: 'creative',
    status: 'coming',
    description: 'Create visual storyboards from scripts',
  },
  music_producer: {
    name: 'Music Producer',
    emoji: '🎵',
    category: 'creative',
    status: 'coming',
    description: 'AI music generation and production',
  },

  // Business & Productivity
  receptionist: {
    name: 'Receptionist',
    emoji: '📞',
    category: 'business',
    status: 'active',
    description: 'AI phone receptionist - answers calls, qualifies leads, routes to your team',
  },
  crm: {
    name: 'CRM',
    emoji: '🤝',
    category: 'productivity',
    status: 'active',
    description: 'Customer relationship management - contacts, deals, pipelines, activities',
  },
  atlas: {
    name: 'Atlas',
    emoji: '🗺️',
    category: 'productivity',
    status: 'active',
    description: 'Marketing optimization - ad spend analysis, channel scoring, kill/scale decisions',
  },
  grammar_overlay: {
    name: 'Grammar Overlay',
    emoji: '📝',
    category: 'writing',
    status: 'coming',
    description: 'Real-time grammar and style checking',
  },
  action_item_extractor: {
    name: 'Action Item Extractor',
    emoji: '✅',
    category: 'productivity',
    status: 'active',
    description: 'Extract tasks from meetings, emails, and notes',
  },
  slide_deck_generator: {
    name: 'Slide Deck Generator',
    emoji: '📊',
    category: 'utility',
    status: 'coming',
    description: 'Generate presentations from content',
  },
  ats_resume_optimizer: {
    name: 'ATS Resume Optimizer',
    emoji: '📋',
    category: 'productivity',
    status: 'active',
    description: 'Dual-mode ATS optimizer - analyze existing resumes or generate tailored ones from your master profile',
  },
  speaking_coach: {
    name: 'Speaking Coach',
    emoji: '🎤',
    category: 'education',
    status: 'coming',
    description: 'AI feedback on presentations and speech',
  },
  expense_auditor: {
    name: 'Expense Auditor',
    emoji: '💰',
    category: 'utility',
    status: 'coming',
    description: 'Analyze and categorize expenses',
  },

  // Analysis & Research
  plant_diagnostic: {
    name: 'Plant Diagnostic',
    emoji: '🌱',
    category: 'utility',
    status: 'coming',
    description: 'Identify plant issues from photos',
  },
  safety_ingredient_scanner: {
    name: 'Safety Ingredient Scanner',
    emoji: '🧪',
    category: 'utility',
    status: 'coming',
    description: 'Scan and analyze product ingredients',
  },
  collectible_valuer: {
    name: 'Collectible Valuer',
    emoji: '💎',
    category: 'utility',
    status: 'coming',
    description: 'Estimate value of collectibles',
  },
  contract_auditor: {
    name: 'Contract Auditor',
    emoji: '⚖️',
    category: 'utility',
    status: 'coming',
    description: 'AI contract review and analysis',
  },
  legal_workflow: {
    name: 'Legal Workflow',
    emoji: '⚖️',
    category: 'business',
    status: 'active',
    description: 'Comprehensive legal case management - intake, discovery, FOIA, motions, conflict checks, multi-LLM verification',
  },
  feedback_admin: {
    name: 'Feedback Admin',
    emoji: '📊',
    category: 'developer',
    status: 'active',
    description: 'Admin dashboard for reviewing user feedback, feature requests, and bug reports across all modules',
  },
  viral_trend_tracker: {
    name: 'Viral Trend Tracker',
    emoji: '📈',
    category: 'utility',
    status: 'coming',
    description: 'Track and analyze viral trends',
  },

  // Developer Tools
  no_code_web_scraper: {
    name: 'No-Code Web Scraper',
    emoji: '🕸️',
    category: 'developer',
    status: 'coming',
    description: 'Visual web scraping without code',
  },
  code_smoke_tester: {
    name: 'Code Smoke Tester',
    emoji: '🔥',
    category: 'developer',
    status: 'coming',
    description: 'Quick automated code testing',
  },
  math_logic_solver: {
    name: 'Math Logic Solver',
    emoji: '🧮',
    category: 'education',
    status: 'coming',
    description: 'Advanced math and logic problem solving',
  },

  // Identity & Avatar
  identity_architect: {
    name: 'Identity Architect',
    emoji: '🪪',
    category: 'creative',
    status: 'coming',
    description: 'Create and manage digital identities',
  },
  beauty_retouch: {
    name: 'Beauty & Retouch',
    emoji: '💄',
    category: 'creative',
    status: 'coming',
    description: 'AI beauty enhancement and photo retouching',
  },
  face_swap_motion: {
    name: 'Face Swap & Motion',
    emoji: '🎭',
    category: 'creative',
    status: 'coming',
    description: 'Face swapping and motion transfer',
  },
  all_in_one_design: {
    name: 'All-in-One Design',
    emoji: '🎯',
    category: 'creative',
    status: 'coming',
    description: 'Complete design toolkit in one place',
  },
  cinematic_video_gen: {
    name: 'Cinematic Video Gen',
    emoji: '🎥',
    category: 'creative',
    status: 'coming',
    description: 'Generate cinematic video content',
  },
  voice_cloner: {
    name: 'Voice Cloner',
    emoji: '🗣️',
    category: 'creative',
    status: 'coming',
    description: 'Clone and synthesize voices with AI',
  },
};

export interface CategoryConfig {
  id: string;
  name: string;
}

export const CATEGORIES: CategoryConfig[] = [
  { id: 'business', name: 'Business' },
  { id: 'developer', name: 'Developer Tools' },
  { id: 'chat', name: 'Chat & Assistant' },
  { id: 'education', name: 'Education' },
  { id: 'writing', name: 'Writing' },
  { id: 'creative', name: 'Creative' },
  { id: 'productivity', name: 'Productivity' },
  { id: 'utility', name: 'Utility' },
];

// Helper to get modules by category
export function getModulesByCategory(categoryId: string): Array<{ id: string } & ModuleConfig> {
  return Object.entries(MODULE_REGISTRY)
    .filter(([_, config]) => config.category === categoryId)
    .map(([id, config]) => ({ id, ...config }));
}

// Helper to get a module by ID
export function getModule(id: string): ModuleConfig | undefined {
  return MODULE_REGISTRY[id];
}
