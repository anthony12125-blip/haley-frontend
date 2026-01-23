'use client';

import { useRef, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { useProcess, SYSTEM_PIDS, HaleyProcess } from '@/providers/ProcessProvider';
import { MODULE_REGISTRY } from '@/config/moduleRegistry';

interface ProcessTabProps {
  process: HaleyProcess;
  isChat: boolean;
  isActive: boolean;
  onSelect: () => void;
  onKill?: () => void;
}

function ProcessTab({ process, isChat, isActive, onSelect, onKill }: ProcessTabProps) {
  const moduleConfig = !isChat ? MODULE_REGISTRY[process.moduleId] : null;
  const name = isChat ? 'Chat' : moduleConfig?.name || process.moduleId;
  // Truncate long names
  const truncatedName = name.length > 12 ? name.slice(0, 11) + '...' : name;

  return (
    <div
      className={`
        relative flex items-center gap-2 px-3 h-10 rounded-t-lg cursor-pointer
        transition-all duration-150 select-none whitespace-nowrap min-w-0
        ${isActive
          ? 'bg-background text-foreground border-t border-l border-r border-border'
          : 'bg-zinc-800/40 text-zinc-400 border-b border-border hover:bg-zinc-700/50 hover:text-zinc-200'
        }
      `}
      onClick={onSelect}
    >
      {/* Module icon */}
      <span className="text-base flex-shrink-0">
        {isChat ? (
          <MessageCircle size={16} className={isActive ? 'text-primary' : 'text-zinc-500'} />
        ) : (
          moduleConfig?.emoji || '?'
        )}
      </span>

      {/* Module name - truncated */}
      <span className="text-sm font-medium truncate max-w-[80px]">
        {truncatedName}
      </span>

      {/* Close button - not for chat */}
      {!isChat && onKill && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onKill();
          }}
          className="flex-shrink-0 p-0.5 rounded transition-colors hover:bg-red-500/20 text-zinc-500 hover:text-red-400"
          title="Close"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default function ProcessTabBar() {
  const { listProcesses, foreground, kill, processTable } = useProcess();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);

  // Get all processes, sorted with chat first
  const processes = listProcesses();
  const sortedProcesses = [...processes].sort((a, b) => {
    if (a.pid === SYSTEM_PIDS.CHAT) return -1;
    if (b.pid === SYSTEM_PIDS.CHAT) return 1;
    return a.spawnedAt - b.spawnedAt; // Order by spawn time
  });

  // Scroll active tab into view when it changes
  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const activeTab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();

      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [processTable.foregroundPid]);

  // Don't render if only chat is running
  if (sortedProcesses.length <= 1) {
    return null;
  }

  return (
    <div className="bg-zinc-900/50 border-b border-border">
      <div
        ref={scrollRef}
        className="flex items-end gap-1 px-2 pt-2 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {sortedProcesses.map((process) => {
          const isChat = process.pid === SYSTEM_PIDS.CHAT;
          const isActive = process.pid === processTable.foregroundPid;

          return (
            <div
              key={process.pid}
              ref={isActive ? activeTabRef : undefined}
              className="flex-shrink-0"
            >
              <ProcessTab
                process={process}
                isChat={isChat}
                isActive={isActive}
                onSelect={() => foreground(process.pid)}
                onKill={isChat ? undefined : () => kill(process.pid)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
