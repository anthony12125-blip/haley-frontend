// Module Registry - Central configuration for all Haley modules
// UPDATED: New modules from drop-in package now set to 'active'

export interface ModuleConfig {
  name: string;
  emoji: string;
  category: string;
  status: 'active' | 'coming' | 'beta';
  description?: string;
}

export const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  // Developer Tools (existing modules)
  'api-keys': { name: 'API Keys', emoji: '🔑', category: 'developer', status: 'active', description: 'Manage your API keys' },
  engineering: { name: 'Engineering', emoji: '🔧', category: 'developer', status: 'active', description: 'Engineering agent assistant' },
  ideaharvester: { name: 'Idea Harvester', emoji: '💡', category: 'developer', status: 'active', description: 'AI product replication pipeline' },
  soundboard: { name: 'R&D', emoji: '🔬', category: 'developer', status: 'active', description: 'AI research and development sandbox' },
  robloxexpert: { name: 'Roblox Expert', emoji: '🎮', category: 'developer', status: 'active', description: 'Describe scenes, get Lua code' },
  workflow_builder: { name: 'Workflow Builder', emoji: '⚡', category: 'developer', status: 'active', description: 'Drift-immune workflow automation — import from N8N, Zapier, Make.com' },
  workflow_analytics: { name: 'Workflow Analytics', emoji: '📊', category: 'developer', status: 'active', description: 'Logic Engine usage logs, drift analysis, health recommendations' },

  // Domain Expert System
  navigator: { name: 'Navigator', emoji: '🧭', category: 'productivity', status: 'active', description: 'Real-time decision support for complex domains' },

  // Chat & Assistant
  multi_llm: { name: 'Multi-LLM Chat', emoji: '💬', category: 'chat', status: 'active', description: 'Query multiple LLMs at once' },

  // Education
  homework_solver: { name: 'Homework Solver', emoji: '📚', category: 'education', status: 'active', description: 'Step-by-step homework help' },
  study_guide: { name: 'Study Guide', emoji: '📖', category: 'education', status: 'active', description: 'AI study material generation' },

  // Writing - NEW ACTIVE
  writing_assist: { name: 'Writing Assistant', emoji: '✏️', category: 'writing', status: 'active', description: 'Improve, simplify, formalize your writing' },
  email_gen: { name: 'Email Generator', emoji: '📧', category: 'writing', status: 'active', description: 'Professional email drafts' },
  story_writer: { name: 'Story Writer', emoji: '✍️', category: 'creative', status: 'active', description: 'Creative story generation' },

  // Creative - NEW ACTIVE
  image_gen: { name: 'Image Generator', emoji: '🖼️', category: 'creative', status: 'active', description: 'AI image generation with Flux, SDXL, DALL-E' },
  image_enhancer: { name: 'Image Enhancer', emoji: '✨', category: 'creative', status: 'active', description: 'AI upscaling and enhancement' },
  beauty_retouch: { name: 'Beauty & Retouch', emoji: '💄', category: 'creative', status: 'active', description: 'AI portrait enhancement' },
  voice_cloner: { name: 'Voice Cloner', emoji: '🗣️', category: 'creative', status: 'active', description: 'Clone voices with ElevenLabs AI' },
  audio_dubber: { name: 'Audio Dubber', emoji: '🎙️', category: 'creative', status: 'active', description: 'AI voice dubbing and translation' },
  visual_storyboarder: { name: 'Visual Storyboarder', emoji: '🎨', category: 'creative', status: 'active', description: 'Script to visual storyboard' },
  music_producer: { name: 'Music Producer', emoji: '🎵', category: 'creative', status: 'active', description: 'AI music generation with MusicGen' },
  face_swap_motion: { name: 'Face Swap & Motion', emoji: '🎭', category: 'creative', status: 'active', description: 'AI face swapping and animation' },
  all_in_one_design: { name: 'All-in-One Design', emoji: '🎯', category: 'creative', status: 'active', description: 'Complete graphic design toolkit' },
  cinematic_video_gen: { name: 'Cinematic Video Gen', emoji: '🎥', category: 'creative', status: 'active', description: 'AI cinematic video generation' },

  // Utility - NEW ACTIVE
  code_assist: { name: 'Code Assistant', emoji: '💻', category: 'developer', status: 'active', description: 'Claude Code in your browser' },
  doc_scanner: { name: 'Doc Scanner', emoji: '📄', category: 'utility', status: 'active', description: 'OCR and document scanning' },
  summarizer: { name: 'Summarizer', emoji: '📝', category: 'utility', status: 'active', description: 'AI-powered text summarization' },
  translator: { name: 'Translator', emoji: '🌐', category: 'utility', status: 'active', description: 'Multi-language translation' },
  plant_diagnostic: { name: 'Plant Diagnostic', emoji: '🌱', category: 'utility', status: 'active', description: 'AI plant health diagnosis' },
  safety_ingredient_scanner: { name: 'Safety Ingredient Scanner', emoji: '🧪', category: 'utility', status: 'active', description: 'Analyze product ingredients' },
  slide_deck_generator: { name: 'Slide Deck Generator', emoji: '📊', category: 'utility', status: 'active', description: 'AI presentation generation' },
  video_auto_cutter: { name: 'Video Auto-Cutter', emoji: '🎬', category: 'creative', status: 'active', description: 'AI-powered video clip extraction' },

  // Media & Creative
  photo_studio: { name: 'AI Photo Studio', emoji: '📸', category: 'creative', status: 'active', description: 'Professional photo editing' },

  // Business & Productivity
  receptionist: { name: 'Receptionist', emoji: '📞', category: 'business', status: 'active', description: 'AI phone receptionist' },
  crm: { name: 'CRM', emoji: '🤝', category: 'productivity', status: 'active', description: 'Customer relationship management' },
  atlas: { name: 'Atlas', emoji: '🗺️', category: 'productivity', status: 'active', description: 'Marketing optimization' },
  grammar_overlay: { name: 'Grammar Overlay', emoji: '📝', category: 'writing', status: 'active', description: 'Real-time grammar checking' },
  action_item_extractor: { name: 'Action Item Extractor', emoji: '✅', category: 'productivity', status: 'active', description: 'Extract tasks from meetings' },
  ats_resume_optimizer: { name: 'ATS Resume Optimizer', emoji: '📋', category: 'productivity', status: 'active', description: 'Resume optimization' },
  speaking_coach: { name: 'Speaking Coach', emoji: '🎤', category: 'education', status: 'active', description: 'AI presentation feedback' },
  expense_auditor: { name: 'Expense Auditor', emoji: '💰', category: 'utility', status: 'active', description: 'Expense analysis and categorization' },
  collectible_valuer: { name: 'Collectible Valuer', emoji: '💎', category: 'utility', status: 'active', description: 'AI collectible appraisal' },
  contract_auditor: { name: 'Contract Auditor', emoji: '⚖️', category: 'utility', status: 'active', description: 'AI contract analysis' },
  legal_workflow: { name: 'Legal Workflow', emoji: '⚖️', category: 'business', status: 'active', description: 'Legal case management' },
  feedback_admin: { name: 'Feedback Admin', emoji: '📊', category: 'developer', status: 'active', description: 'Admin feedback dashboard' },
  viral_trend_tracker: { name: 'Viral Trend Tracker', emoji: '📈', category: 'utility', status: 'active', description: 'Track viral trends' },
  no_code_web_scraper: { name: 'No-Code Web Scraper', emoji: '🕸️', category: 'developer', status: 'active', description: 'Visual web scraping' },
  code_smoke_tester: { name: 'Code Smoke Tester', emoji: '🔥', category: 'developer', status: 'active', description: 'Quick automated code testing' },
  math_logic_solver: { name: 'Math Logic Solver', emoji: '🧮', category: 'education', status: 'active', description: 'Advanced math and logic solving' },
  identity_architect: { name: 'Identity Architect', emoji: '🪪', category: 'creative', status: 'active', description: 'Brand identity asset generation' },

  // Integrations
  openclaw: { name: 'OpenClaw', emoji: '📡', category: 'business', status: 'active', description: 'Multi-platform messaging gateway — Telegram, Discord, Slack, WhatsApp' },
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

export function getModulesByCategory(categoryId: string): Array<{ id: string } & ModuleConfig> {
  return Object.entries(MODULE_REGISTRY)
    .filter(([_, config]) => config.category === categoryId)
    .map(([id, config]) => ({ id, ...config }));
}

export function getModule(id: string): ModuleConfig | undefined {
  return MODULE_REGISTRY[id];
}
