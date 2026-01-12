// Module Registry - Central configuration for all Haley modules

export interface ModuleConfig {
  name: string;
  icon: string;
  category: string;
  status: 'active' | 'coming' | 'beta';
  description?: string;
}

export const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  // Developer Tools (existing modules)
  soundboard: {
    name: 'R&D Soundboard',
    icon: 'Mic',
    category: 'developer',
    status: 'active',
    description: 'AI research and development sandbox',
  },
  ideaharvester: {
    name: 'Idea Harvester',
    icon: 'Lightbulb',
    category: 'developer',
    status: 'active',
    description: 'AI product replication pipeline',
  },
  robloxexpert: {
    name: 'Roblox Expert',
    icon: 'Gamepad2',
    category: 'developer',
    status: 'active',
    description: 'Describe scenes, get Lua code',
  },
  engineering: {
    name: 'Engineering',
    icon: 'Wrench',
    category: 'developer',
    status: 'active',
    description: 'Engineering agent assistant',
  },
  'api-keys': {
    name: 'API Keys',
    icon: 'Key',
    category: 'developer',
    status: 'active',
    description: 'Manage your API keys',
  },

  // Chat & Assistant
  multi_llm: {
    name: 'Multi-LLM Chat',
    icon: 'MessageSquare',
    category: 'chat',
    status: 'coming',
    description: 'Query multiple LLMs at once',
  },

  // Education
  homework_solver: {
    name: 'Homework Solver',
    icon: 'GraduationCap',
    category: 'education',
    status: 'coming',
    description: 'Step-by-step homework help',
  },
  study_guide: {
    name: 'Study Guide',
    icon: 'BookOpen',
    category: 'education',
    status: 'coming',
    description: 'Generate study materials',
  },

  // Writing
  writing_assist: {
    name: 'Writing Assistant',
    icon: 'PenTool',
    category: 'writing',
    status: 'coming',
    description: 'Improve your writing',
  },
  email_gen: {
    name: 'Email Generator',
    icon: 'Mail',
    category: 'writing',
    status: 'coming',
    description: 'Professional email drafts',
  },

  // Creative
  image_gen: {
    name: 'Image Generator',
    icon: 'Image',
    category: 'creative',
    status: 'coming',
    description: 'AI-generated images',
  },
  story_writer: {
    name: 'Story Writer',
    icon: 'BookMarked',
    category: 'creative',
    status: 'coming',
    description: 'Creative story generation',
  },

  // Utility
  doc_scanner: {
    name: 'Doc Scanner',
    icon: 'Scan',
    category: 'utility',
    status: 'coming',
    description: 'Scan and analyze documents',
  },
  translator: {
    name: 'Translator',
    icon: 'Languages',
    category: 'utility',
    status: 'coming',
    description: 'Multi-language translation',
  },
  code_assist: {
    name: 'Code Assistant',
    icon: 'Code',
    category: 'utility',
    status: 'coming',
    description: 'Code help and debugging',
  },
  summarizer: {
    name: 'Summarizer',
    icon: 'FileText',
    category: 'utility',
    status: 'coming',
    description: 'Summarize long content',
  },
};

export interface CategoryConfig {
  id: string;
  name: string;
  gradient: string;
}

export const CATEGORIES: CategoryConfig[] = [
  { id: 'developer', name: 'Developer Tools', gradient: 'from-violet-500 to-purple-600' },
  { id: 'chat', name: 'Chat & Assistant', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'education', name: 'Education', gradient: 'from-emerald-500 to-teal-500' },
  { id: 'writing', name: 'Writing', gradient: 'from-amber-500 to-orange-500' },
  { id: 'creative', name: 'Creative', gradient: 'from-pink-500 to-rose-500' },
  { id: 'utility', name: 'Utility', gradient: 'from-slate-500 to-gray-600' },
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
