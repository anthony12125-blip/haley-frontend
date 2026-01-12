'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
  GripVertical,
  LucideIcon,
} from 'lucide-react';
import { MODULE_REGISTRY, CATEGORIES } from '@/config/moduleRegistry';

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
  return category?.gradient || 'from-violet-500 to-purple-600';
}

// localStorage key for saved order
const STORAGE_KEY = 'haley_dashboard_module_order';

// Get all modules as array with id
function getAllModules() {
  return Object.entries(MODULE_REGISTRY).map(([id, config]) => ({
    id,
    ...config,
  }));
}

export default function Dashboard({ isOpen, onClose, onSelectModule }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModuleOrder, setActiveModuleOrder] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Generate stable star positions
  const starPositions = useMemo(() =>
    [...Array(3)].map(() => ({
      top: `${Math.random() * 50}%`,
      right: `${Math.random() * 50}%`,
      delay: `${Math.random() * 3}s`,
    })), []
  );

  // Get active and coming soon modules
  const { activeModules, comingSoonModules } = useMemo(() => {
    const all = getAllModules();
    const active = all.filter((m) => m.status === 'active');
    const coming = all.filter((m) => m.status === 'coming' || m.status === 'beta');

    // Sort coming soon alphabetically
    coming.sort((a, b) => a.name.localeCompare(b.name));

    return { activeModules: active, comingSoonModules: coming };
  }, []);

  // Load saved order from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const savedOrder = JSON.parse(saved);
          // Validate that all saved IDs still exist
          const validOrder = savedOrder.filter((id: string) =>
            activeModules.some((m) => m.id === id)
          );
          // Add any new modules not in saved order
          const newModules = activeModules
            .filter((m) => !validOrder.includes(m.id))
            .map((m) => m.id)
            .sort();
          setActiveModuleOrder([...validOrder, ...newModules]);
        } catch {
          // Default to alphabetical
          setActiveModuleOrder(
            [...activeModules].sort((a, b) => a.name.localeCompare(b.name)).map((m) => m.id)
          );
        }
      } else {
        // Default to alphabetical
        setActiveModuleOrder(
          [...activeModules].sort((a, b) => a.name.localeCompare(b.name)).map((m) => m.id)
        );
      }
    }
  }, [activeModules]);

  // Save order to localStorage
  const saveOrder = useCallback((order: string[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    }
  }, []);

  // Get ordered active modules
  const orderedActiveModules = useMemo(() => {
    if (activeModuleOrder.length === 0) return activeModules;
    return activeModuleOrder
      .map((id) => activeModules.find((m) => m.id === id))
      .filter(Boolean) as typeof activeModules;
  }, [activeModules, activeModuleOrder]);

  // Filter modules based on search
  const filteredActiveModules = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return orderedActiveModules;
    return orderedActiveModules.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
    );
  }, [orderedActiveModules, searchQuery]);

  const filteredComingSoonModules = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return comingSoonModules;
    return comingSoonModules.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
    );
  }, [comingSoonModules, searchQuery]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, moduleId: string) => {
    setDraggedId(moduleId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', moduleId);
  };

  const handleDragOver = (e: React.DragEvent, moduleId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (moduleId !== draggedId) {
      setDragOverId(moduleId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const newOrder = [...activeModuleOrder];
    const draggedIndex = newOrder.indexOf(draggedId);
    const targetIndex = newOrder.indexOf(targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove dragged item and insert at target position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedId);
      setActiveModuleOrder(newOrder);
      saveOrder(newOrder);
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
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

      {/* Module Grid */}
      <div className="relative z-10 overflow-y-auto p-4 space-y-8" style={{ maxHeight: 'calc(100vh - 160px)' }}>
        {/* Active Modules - Draggable */}
        {filteredActiveModules.length > 0 && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredActiveModules.map((module) => {
                const IconComponent = ICON_MAP[module.icon] || Lightbulb;
                const gradient = getCategoryGradient(module.category);
                const isDragging = draggedId === module.id;
                const isDragOver = dragOverId === module.id;

                return (
                  <div
                    key={module.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, module.id)}
                    onDragOver={(e) => handleDragOver(e, module.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, module.id)}
                    onDragEnd={handleDragEnd}
                    className={`group relative flex flex-col items-center p-4 rounded-2xl transition-all duration-200 cursor-grab active:cursor-grabbing
                      ${isDragging ? 'opacity-50 scale-95' : ''}
                      ${isDragOver ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                      hover:bg-panel-light hover:scale-105
                    `}
                    onClick={() => onSelectModule(module.id)}
                  >
                    {/* Drag handle indicator */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-50 transition-opacity">
                      <GripVertical size={14} className="text-gray-400" />
                    </div>
                    {/* iOS-style icon */}
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl group-hover:shadow-primary/20`}
                    >
                      <IconComponent size={28} className="text-white" />
                    </div>
                    {/* Module name */}
                    <span className="text-sm font-medium text-center leading-tight">
                      {module.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Separator */}
        {filteredActiveModules.length > 0 && filteredComingSoonModules.length > 0 && (
          <div className="border-t border-border/50" />
        )}

        {/* Coming Soon Modules - Static */}
        {filteredComingSoonModules.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 px-1">
              Coming Soon
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredComingSoonModules.map((module) => {
                const IconComponent = ICON_MAP[module.icon] || Lightbulb;
                const gradient = getCategoryGradient(module.category);

                return (
                  <div
                    key={module.id}
                    className="group flex flex-col items-center p-4 rounded-2xl opacity-40 cursor-not-allowed"
                  >
                    {/* iOS-style icon - grayed out */}
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-lg grayscale`}
                    >
                      <IconComponent size={28} className="text-white" />
                    </div>
                    {/* Module name */}
                    <span className="text-sm font-medium text-center leading-tight text-gray-400">
                      {module.name}
                    </span>
                    {module.status === 'beta' && (
                      <span className="text-[10px] text-amber-500/60 mt-1">Beta</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state when no results */}
        {filteredActiveModules.length === 0 && filteredComingSoonModules.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No modules found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
