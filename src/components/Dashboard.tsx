'use client';

import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Mic,
  Lightbulb,
  Gamepad2,
  Wrench,
  Key,
  MessageSquare,
  GraduationCap,
  BookOpen,
  PenTool,
  Mail,
  Image,
  BookMarked,
  Scan,
  Languages,
  Code,
  FileText,
  LucideIcon,
} from 'lucide-react';
import { MODULE_REGISTRY, CATEGORIES, getModulesByCategory } from '@/config/moduleRegistry';

interface DashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (moduleId: string) => void;
}

// Icon mapping
const ICON_MAP: Record<string, LucideIcon> = {
  Mic,
  Lightbulb,
  Gamepad2,
  Wrench,
  Key,
  MessageSquare,
  GraduationCap,
  BookOpen,
  PenTool,
  Mail,
  Image,
  BookMarked,
  Scan,
  Languages,
  Code,
  FileText,
};

// Get gradient class for category
function getCategoryGradient(categoryId: string): string {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  return category?.gradient || 'from-gray-500 to-gray-600';
}

export default function Dashboard({ isOpen, onClose, onSelectModule }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Generate stable star positions
  const starPositions = useMemo(() =>
    [...Array(3)].map(() => ({
      top: `${Math.random() * 50}%`,
      right: `${Math.random() * 50}%`,
      delay: `${Math.random() * 3}s`,
    })), []
  );

  // Filter modules based on search
  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return CATEGORIES;

    return CATEGORIES.filter((cat) => {
      const modules = getModulesByCategory(cat.id);
      return modules.some(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  // Get filtered modules for a category
  const getFilteredModules = (categoryId: string) => {
    const modules = getModulesByCategory(categoryId);
    const query = searchQuery.toLowerCase().trim();
    if (!query) return modules;
    return modules.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-background animate-in fade-in duration-200">
      {/* Space background with stars */}
      <div className="space-bg">
        <div className="stars" />
        {starPositions.map((pos, i) => (
          <div key={i} className="shooting-star" style={{ top: pos.top, right: pos.right, animationDelay: pos.delay }} />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 border-b border-border">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to Chat</span>
        </button>
        <h1 className="text-xl font-bold text-gradient">Haley Dashboard</h1>
        <div className="w-28" /> {/* Spacer for alignment */}
      </header>

      {/* Search */}
      <div className="relative z-10 p-4">
        <div className="relative max-w-md mx-auto">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-panel border border-border focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Module Grid by Category */}
      <div className="relative z-10 overflow-y-auto p-4 space-y-8" style={{ maxHeight: 'calc(100vh - 160px)' }}>
        {filteredCategories.map((category) => {
          const modules = getFilteredModules(category.id);
          if (modules.length === 0) return null;

          return (
            <div key={category.id}>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 px-1">
                {category.name}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {modules.map((module) => {
                  const IconComponent = ICON_MAP[module.icon] || Lightbulb;
                  const isActive = module.status === 'active';
                  const gradient = getCategoryGradient(category.id);

                  return (
                    <button
                      key={module.id}
                      onClick={() => isActive && onSelectModule(module.id)}
                      disabled={!isActive}
                      className={`group flex flex-col items-center p-4 rounded-2xl transition-all duration-200 ${
                        isActive
                          ? 'hover:bg-panel-light hover:scale-105 cursor-pointer'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {/* iOS-style icon */}
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-lg ${
                          isActive ? 'group-hover:shadow-xl group-hover:shadow-primary/20' : ''
                        }`}
                      >
                        <IconComponent size={28} className="text-white" />
                      </div>
                      {/* Module name */}
                      <span className="text-sm font-medium text-center leading-tight">
                        {module.name}
                      </span>
                      {/* Coming soon badge */}
                      {module.status === 'coming' && (
                        <span className="text-[10px] text-gray-500 mt-1">Coming Soon</span>
                      )}
                      {module.status === 'beta' && (
                        <span className="text-[10px] text-amber-500 mt-1">Beta</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Empty state when no results */}
        {filteredCategories.every((cat) => getFilteredModules(cat.id).length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-400">No modules found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
