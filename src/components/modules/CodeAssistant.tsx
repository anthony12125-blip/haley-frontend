'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, FolderOpen, File, ChevronRight, ChevronDown,
  Send, Mic, Loader2, RefreshCw, Settings, X, Check,
  GitBranch, Upload, Clock, Trash2, MessageSquare, Code,
  FileCode, FileJson, FileText, Copy, ExternalLink
} from 'lucide-react';

// Monaco Editor must be dynamically imported with SSR disabled
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodeAssistantProps {
  onBack: () => void;
}

type ViewState = 'initial' | 'connecting' | 'connected' | 'processing' | 'error';

interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  size?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  diffs?: ProposedDiff[];
}

interface ProposedDiff {
  file_path: string;
  diff: string;
  change_type: 'modify' | 'create' | 'delete';
  old_content?: string;
  new_content?: string;
}

interface RecentProject {
  session_id: string;
  repo_name: string;
  repo_url: string;
  last_accessed: number;
}

const STORAGE_KEY_RECENT = 'code_assist_recent';
const STORAGE_KEY_LLM = 'code_assist_llm_preference';
const MAX_RECENT = 10;

const LLM_OPTIONS = [
  { id: 'claude', name: 'Claude', icon: '🤖' },
  { id: 'gemini', name: 'Gemini', icon: '✨' },
  { id: 'gpt', name: 'GPT', icon: '🧠' },
  { id: 'meta', name: 'Meta (Llama)', icon: '🦙' },
  { id: 'mistral', name: 'Mistral', icon: '🌬️' },
  { id: 'perplexity', name: 'Perplexity', icon: '🔍' },
  { id: 'grok', name: 'Grok', icon: '⚡' },
];

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode size={14} className="text-blue-400" />;
    case 'js':
    case 'jsx':
      return <FileCode size={14} className="text-yellow-400" />;
    case 'py':
      return <FileCode size={14} className="text-green-400" />;
    case 'json':
      return <FileJson size={14} className="text-orange-400" />;
    case 'md':
      return <FileText size={14} className="text-zinc-400" />;
    case 'css':
    case 'scss':
      return <FileCode size={14} className="text-pink-400" />;
    case 'html':
      return <FileCode size={14} className="text-red-400" />;
    default:
      return <File size={14} className="text-zinc-500" />;
  }
}

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', json: 'json', md: 'markdown', html: 'html', css: 'css',
    scss: 'scss', yaml: 'yaml', yml: 'yaml', sh: 'shell', bash: 'shell',
    sql: 'sql', rs: 'rust', go: 'go', java: 'java', cpp: 'cpp', c: 'c',
  };
  return langMap[ext || ''] || 'plaintext';
}

// File Tree Component
function FileTreeNode({
  node,
  depth = 0,
  selectedPath,
  onSelect,
  expandedFolders,
  onToggleFolder
}: {
  node: FileNode;
  depth?: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
}) {
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedPath === node.path;

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => onToggleFolder(node.path)}
          className={`w-full flex items-center gap-1 px-2 py-1 text-sm hover:bg-zinc-700/50 rounded transition-colors ${
            isSelected ? 'bg-zinc-700/50' : ''
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <FolderOpen size={14} className="text-yellow-500" />
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && node.children && (
          <div>
            {node.children.map((child, idx) => (
              <FileTreeNode
                key={`${child.path}-${idx}`}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={`w-full flex items-center gap-2 px-2 py-1 text-sm hover:bg-zinc-700/50 rounded transition-colors ${
        isSelected ? 'bg-teal-500/20 text-teal-400' : ''
      }`}
      style={{ paddingLeft: `${depth * 12 + 24}px` }}
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </button>
  );
}

// Diff Viewer Component
function DiffViewer({
  diffs,
  onAccept,
  onReject,
  onClose
}: {
  diffs: ProposedDiff[];
  onAccept: (diff: ProposedDiff) => void;
  onReject: (diff: ProposedDiff) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-zinc-900 rounded-xl w-[90vw] max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h3 className="font-semibold flex items-center gap-2">
            <Code size={18} className="text-teal-400" />
            Proposed Changes ({diffs.length} files)
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => diffs.forEach(d => onAccept(d))}
              className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm flex items-center gap-1"
            >
              <Check size={14} /> Accept All
            </button>
            <button
              onClick={() => diffs.forEach(d => onReject(d))}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm flex items-center gap-1"
            >
              <X size={14} /> Reject All
            </button>
            <button onClick={onClose} className="p-1 hover:bg-zinc-700 rounded">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {diffs.map((diff, idx) => (
            <div key={idx} className="bg-zinc-800/50 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                <span className="text-sm font-medium flex items-center gap-2">
                  <FileCode size={14} className="text-teal-400" />
                  {diff.file_path}
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    diff.change_type === 'create' ? 'bg-green-500/20 text-green-400' :
                    diff.change_type === 'delete' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {diff.change_type}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAccept(diff)}
                    className="px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onReject(diff)}
                    className="px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs"
                  >
                    Reject
                  </button>
                </div>
              </div>
              <pre className="p-4 text-sm font-mono overflow-x-auto">
                {diff.diff.split('\n').map((line, i) => (
                  <div
                    key={i}
                    className={`${
                      line.startsWith('+') ? 'bg-green-500/10 text-green-400' :
                      line.startsWith('-') ? 'bg-red-500/10 text-red-400' :
                      'text-zinc-400'
                    }`}
                  >
                    {line}
                  </div>
                ))}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CodeAssistant({ onBack }: CodeAssistantProps) {
  // State
  const [viewState, setViewState] = useState<ViewState>('initial');
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [repoName, setRepoName] = useState<string>('');
  const [repoUrl, setRepoUrl] = useState('');

  // File tree state
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileLanguage, setFileLanguage] = useState<string>('plaintext');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Diff state
  const [showDiffViewer, setShowDiffViewer] = useState(false);
  const [pendingDiffs, setPendingDiffs] = useState<ProposedDiff[]>([]);

  // Settings state
  const [selectedLLM, setSelectedLLM] = useState('claude');
  const [showLLMDropdown, setShowLLMDropdown] = useState(false);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

  // Load recent projects and LLM preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRecent = localStorage.getItem(STORAGE_KEY_RECENT);
      if (savedRecent) {
        try {
          setRecentProjects(JSON.parse(savedRecent));
        } catch { /* ignore */ }
      }
      const savedLLM = localStorage.getItem(STORAGE_KEY_LLM);
      if (savedLLM) setSelectedLLM(savedLLM);
    }
  }, []);

  // Save LLM preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_LLM, selectedLLM);
    }
  }, [selectedLLM]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save recent project
  const saveRecentProject = useCallback((session: { session_id: string; repo_name: string; repo_url: string }) => {
    if (typeof window !== 'undefined') {
      const recent: RecentProject = {
        session_id: session.session_id,
        repo_name: session.repo_name,
        repo_url: session.repo_url,
        last_accessed: Date.now(),
      };
      const updated = [recent, ...recentProjects.filter(p => p.repo_url !== session.repo_url)].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(updated));
      setRecentProjects(updated);
    }
  }, [recentProjects]);

  // Connect to repository
  const connectRepository = async (url: string) => {
    setViewState('connecting');
    setError(null);
    setRepoUrl(url);

    try {
      const response = await fetch(`${backendUrl}/code-assist/project/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to connect');
      }

      const data = await response.json();
      setSessionId(data.session_id);
      setRepoName(data.repo_name);
      setFileTree(data.file_tree);
      setViewState('connected');

      saveRecentProject({
        session_id: data.session_id,
        repo_name: data.repo_name,
        repo_url: url,
      });

      // Add welcome message
      setMessages([{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `Connected to **${data.repo_name}**! I can help you understand the codebase, explain code, suggest improvements, or help you make changes. Select files from the tree and ask me anything.`,
        timestamp: new Date(),
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setViewState('error');
    }
  };

  // Fetch file content
  const fetchFileContent = async (path: string) => {
    if (!sessionId) return;

    try {
      const response = await fetch(
        `${backendUrl}/code-assist/project/${sessionId}/file?path=${encodeURIComponent(path)}`
      );
      if (!response.ok) throw new Error('Failed to load file');

      const data = await response.json();
      setFileContent(data.content);
      setFileLanguage(data.language || getLanguageFromPath(path));
      setSelectedFile(path);
    } catch (err) {
      console.error('Failed to load file:', err);
    }
  };

  // Send chat message
  const sendMessage = async () => {
    if (!chatInput.trim() || !sessionId || isStreaming) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsStreaming(true);

    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch(`${backendUrl}/code-assist/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: chatInput,
          selected_files: selectedFile ? [selectedFile] : [],
          llm: selectedLLM,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let collectedDiffs: ProposedDiff[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));

                if (event.type === 'token') {
                  fullContent += event.content;
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMessage.id
                        ? { ...m, content: fullContent }
                        : m
                    )
                  );
                } else if (event.type === 'diffs') {
                  collectedDiffs = event.changes || [];
                } else if (event.type === 'error') {
                  throw new Error(event.error);
                }
              } catch { /* ignore parse errors */ }
            }
          }
        }
      }

      // Update final message with diffs
      if (collectedDiffs.length > 0) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessage.id
              ? { ...m, content: fullContent, diffs: collectedDiffs }
              : m
          )
        );
      }
    } catch (err) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessage.id
            ? { ...m, content: `Error: ${err instanceof Error ? err.message : 'Failed to get response'}` }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // Apply changes
  const applyChanges = async (changes: ProposedDiff[]) => {
    if (!sessionId) return;

    try {
      const response = await fetch(`${backendUrl}/code-assist/changes/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, changes }),
      });

      if (!response.ok) throw new Error('Failed to apply changes');

      // Refresh file tree
      const treeResponse = await fetch(`${backendUrl}/code-assist/project/${sessionId}/tree`);
      if (treeResponse.ok) {
        const treeData = await treeResponse.json();
        setFileTree(treeData.file_tree);
      }

      // Refresh current file if it was modified
      if (selectedFile && changes.some(c => c.file_path === selectedFile)) {
        fetchFileContent(selectedFile);
      }

      setShowDiffViewer(false);
      setPendingDiffs([]);
    } catch (err) {
      console.error('Failed to apply changes:', err);
    }
  };

  // Toggle folder
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Remove recent project
  const removeRecentProject = (url: string) => {
    const updated = recentProjects.filter(p => p.repo_url !== url);
    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(updated));
    setRecentProjects(updated);
  };

  const currentLLM = LLM_OPTIONS.find(l => l.id === selectedLLM) || LLM_OPTIONS[0];

  // Render initial/setup view
  if (viewState === 'initial' || viewState === 'connecting' || viewState === 'error') {
    return (
      <div className="flex-1 flex flex-col bg-panel-dark overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-border">
          <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Code size={20} className="text-teal-400" />
            Code Assistant
          </h1>
          <div className="w-20" />
        </header>

        {/* Setup Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg space-y-6">
            {viewState === 'connecting' ? (
              <div className="text-center py-12">
                <Loader2 size={48} className="text-teal-400 animate-spin mx-auto mb-4" />
                <p className="text-lg font-medium">Connecting to repository...</p>
                <p className="text-sm text-zinc-400">Cloning and analyzing codebase</p>
              </div>
            ) : (
              <>
                {/* Error Display */}
                {viewState === 'error' && error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                    <X size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-400 font-medium">Connection Failed</p>
                      <p className="text-sm text-red-400/80">{error}</p>
                    </div>
                  </div>
                )}

                {/* GitHub URL Input */}
                <div className="bg-zinc-800/50 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <GitBranch size={24} className="text-teal-400" />
                    <div>
                      <h2 className="text-lg font-semibold">Connect Repository</h2>
                      <p className="text-sm text-zinc-400">Enter a GitHub URL to get started</p>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="github.com/user/repo"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && repoUrl.trim() && connectRepository(repoUrl.trim())}
                  />

                  <button
                    onClick={() => repoUrl.trim() && connectRepository(repoUrl.trim())}
                    disabled={!repoUrl.trim()}
                    className="w-full py-3 rounded-lg bg-teal-500 text-white font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <GitBranch size={18} />
                    Connect Repository
                  </button>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-zinc-700" />
                    <span className="text-xs text-zinc-500">or</span>
                    <div className="flex-1 h-px bg-zinc-700" />
                  </div>

                  <button className="w-full py-3 rounded-lg bg-zinc-700 text-white font-medium hover:bg-zinc-600 transition-colors flex items-center justify-center gap-2">
                    <Upload size={18} />
                    Upload Files
                  </button>
                </div>

                {/* Recent Projects */}
                {recentProjects.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                      <Clock size={14} />
                      Recent Projects
                    </h3>
                    <div className="space-y-2">
                      {recentProjects.map((project) => (
                        <div
                          key={project.repo_url}
                          className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors group"
                        >
                          <button
                            onClick={() => connectRepository(project.repo_url)}
                            className="flex-1 flex items-center gap-3 text-left"
                          >
                            <GitBranch size={16} className="text-zinc-500" />
                            <div>
                              <p className="text-sm font-medium">{project.repo_name}</p>
                              <p className="text-xs text-zinc-500">{project.repo_url}</p>
                            </div>
                          </button>
                          <button
                            onClick={() => removeRecentProject(project.repo_url)}
                            className="p-1.5 rounded hover:bg-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} className="text-zinc-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render connected view (three-panel layout)
  return (
    <div className="flex-1 flex flex-col bg-panel-dark overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-3 border-b border-border">
        <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors">
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="flex items-center gap-3">
          <GitBranch size={16} className="text-teal-400" />
          <span className="font-semibold">{repoName}</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
            <RefreshCw size={18} />
          </button>

          {/* LLM Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLLMDropdown(!showLLMDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm"
            >
              <span>{currentLLM.icon}</span>
              <span className="hidden sm:inline">{currentLLM.name}</span>
              <ChevronDown size={14} className={`transition-transform ${showLLMDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showLLMDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden shadow-xl z-50 min-w-[140px]">
                {LLM_OPTIONS.map(llm => (
                  <button
                    key={llm.id}
                    onClick={() => { setSelectedLLM(llm.id); setShowLLMDropdown(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-zinc-700 transition-colors ${
                      selectedLLM === llm.id ? 'bg-zinc-700 text-teal-400' : ''
                    }`}
                  >
                    <span>{llm.icon}</span>
                    <span>{llm.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Three-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - File Tree */}
        <div className="w-[20%] min-w-[200px] border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Files</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {fileTree && (
              <FileTreeNode
                node={fileTree}
                selectedPath={selectedFile}
                onSelect={fetchFileContent}
                expandedFolders={expandedFolders}
                onToggleFolder={toggleFolder}
              />
            )}
          </div>
        </div>

        {/* Center Panel - Code Viewer */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedFile ? (
            <>
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 border-b border-border">
                <span className="text-sm font-medium flex items-center gap-2">
                  {getFileIcon(selectedFile)}
                  {selectedFile}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(fileContent)}
                  className="p-1.5 rounded hover:bg-zinc-700 transition-colors"
                  title="Copy file content"
                >
                  <Copy size={14} />
                </button>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={fileLanguage}
                  value={fileContent}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              <div className="text-center">
                <FileCode size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a file to view</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Chat */}
        <div className="w-[25%] min-w-[280px] border-l border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={14} />
              Chat
            </h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${
                  msg.role === 'user'
                    ? 'ml-4 bg-teal-500/20 rounded-xl rounded-tr-sm'
                    : 'mr-4 bg-zinc-800/50 rounded-xl rounded-tl-sm'
                } p-3`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.diffs && msg.diffs.length > 0 && (
                  <button
                    onClick={() => { setPendingDiffs(msg.diffs!); setShowDiffViewer(true); }}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs flex items-center gap-1"
                  >
                    <Code size={12} />
                    View Changes ({msg.diffs.length} files)
                  </button>
                )}
              </div>
            ))}
            {isStreaming && (
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Loader2 size={14} className="animate-spin" />
                Analyzing...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            {selectedFile && (
              <div className="flex items-center gap-2 mb-2 text-xs text-zinc-500">
                <FileCode size={12} />
                Context: {selectedFile.split('/').pop()}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask about your code..."
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
                disabled={isStreaming}
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim() || isStreaming}
                className="px-3 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Diff Viewer Modal */}
      {showDiffViewer && pendingDiffs.length > 0 && (
        <DiffViewer
          diffs={pendingDiffs}
          onAccept={(diff) => {
            applyChanges([diff]);
            setPendingDiffs(prev => prev.filter(d => d.file_path !== diff.file_path));
          }}
          onReject={(diff) => {
            setPendingDiffs(prev => prev.filter(d => d.file_path !== diff.file_path));
            if (pendingDiffs.length <= 1) setShowDiffViewer(false);
          }}
          onClose={() => setShowDiffViewer(false)}
        />
      )}
    </div>
  );
}
