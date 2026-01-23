'use client';

import React, { useState } from 'react';
import { CheckSquare, ArrowLeft, Copy, Download, AlertTriangle, Loader2, Check } from 'lucide-react';

interface ActionItem {
  id: string;
  task: string;
  owner: string | null;
  deadline: string | null;
  priority: 'high' | 'medium' | 'normal' | 'low';
  isAmbiguous: boolean;
  sourceContext: string;
  completed: boolean;
}

interface ActionItemExtractorProps {
  onBack: () => void;
}

export default function ActionItemExtractor({ onBack }: ActionItemExtractorProps) {
  const [inputText, setInputText] = useState('');
  const [items, setItems] = useState<ActionItem[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Settings
  const [detectAssignees, setDetectAssignees] = useState(true);
  const [parseDeadlines, setParseDeadlines] = useState(true);
  const [inferPriorities, setInferPriorities] = useState(true);
  const [flagAmbiguous, setFlagAmbiguous] = useState(true);

  const handleExtract = async () => {
    if (!inputText.trim()) return;

    setIsExtracting(true);
    setError(null);

    try {
      // Call the Module Matrix API for action item extraction
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'action_item_extractor',
          action: 'extract',
          params: {
            text: inputText,
            settings: {
              detectAssignees,
              parseDeadlines,
              inferPriorities,
              flagAmbiguous
            }
          }
        })
      });

      if (!response.ok) throw new Error('Extraction failed');

      const data = await response.json();

      if (data.result && data.result.items) {
        setItems(data.result.items);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('[ActionItemExtractor] Error:', err);

      // Generate mock results for demo/fallback
      const mockItems = extractMockActionItems(inputText);
      setItems(mockItems);
    } finally {
      setIsExtracting(false);
    }
  };

  // Simple client-side extraction for demo/fallback
  const extractMockActionItems = (text: string): ActionItem[] => {
    const items: ActionItem[] = [];
    const sentences = text.split(/[.!?\n]+/).filter(s => s.trim());

    const actionPatterns = [
      /(\w+)\s+(?:will|should|needs? to|must|has to|going to)\s+(.+)/i,
      /(?:@|)(\w+),?\s+(?:can you|please|could you)\s+(.+)/i,
      /(\w+)\s+(?:mentioned|said)\s+(?:he'd|she'd|they'd|he'll|she'll|they'll)\s+(.+)/i,
      /(?:need to|have to|must)\s+(.+)/i,
    ];

    const urgencyKeywords = {
      high: ['urgent', 'asap', 'critical', 'immediately', 'today', 'priority', 'crucial', 'must'],
      medium: ['soon', 'this week', 'important', 'needed', 'before'],
      low: ['when you can', 'eventually', 'sometime', 'nice to have', 'if possible']
    };

    const deadlinePatterns = [
      /by\s+(\w+day)/i,
      /by\s+(end of \w+)/i,
      /before\s+(\w+\s+\d+)/i,
      /(tomorrow|today)/i,
      /(EOD|EOW|EOM|EOY)/i,
      /(next \w+)/i,
    ];

    sentences.forEach((sentence, idx) => {
      const trimmed = sentence.trim();
      if (trimmed.length < 10) return;

      let owner: string | null = null;
      let task = trimmed;
      let isAmbiguous = false;

      // Try to extract owner and task
      for (const pattern of actionPatterns) {
        const match = trimmed.match(pattern);
        if (match) {
          if (match.length >= 3) {
            owner = match[1];
            task = match[2].trim();
          } else if (match.length >= 2) {
            task = match[1].trim();
            isAmbiguous = true;
          }
          break;
        }
      }

      // Check if this looks like an action item
      const actionWords = ['send', 'review', 'follow', 'update', 'schedule', 'create', 'prepare', 'contact', 'call', 'email', 'submit', 'complete', 'finish', 'check', 'coordinate'];
      const hasActionWord = actionWords.some(word => trimmed.toLowerCase().includes(word));

      if (!hasActionWord && !owner) return;

      // Detect priority
      let priority: 'high' | 'medium' | 'normal' | 'low' = 'normal';
      const lowerText = trimmed.toLowerCase();

      if (urgencyKeywords.high.some(k => lowerText.includes(k))) {
        priority = 'high';
      } else if (urgencyKeywords.medium.some(k => lowerText.includes(k))) {
        priority = 'medium';
      } else if (urgencyKeywords.low.some(k => lowerText.includes(k))) {
        priority = 'low';
      }

      // Extract deadline
      let deadline: string | null = null;
      for (const pattern of deadlinePatterns) {
        const match = trimmed.match(pattern);
        if (match) {
          deadline = match[1];
          break;
        }
      }

      // Check for ambiguous ownership
      if (!owner && (lowerText.includes('someone') || lowerText.includes('we should') || lowerText.includes('need to'))) {
        isAmbiguous = true;
      }

      items.push({
        id: `item_${idx}_${Date.now()}`,
        task: task.charAt(0).toUpperCase() + task.slice(1),
        owner,
        deadline,
        priority,
        isAmbiguous: flagAmbiguous && isAmbiguous,
        sourceContext: trimmed,
        completed: false
      });
    });

    return items.slice(0, 10); // Limit to 10 items
  };

  const copyAsMarkdown = () => {
    const md = `## Action Items - ${new Date().toLocaleDateString()}\n\n` +
      items.map(item => {
        const priority = item.priority === 'high' ? ' [HIGH]' : item.priority === 'medium' ? ' [MED]' : '';
        const owner = item.owner ? ` - @${item.owner}` : '';
        const due = item.deadline ? ` (Due: ${item.deadline})` : '';
        const ambiguous = item.isAmbiguous ? ' [NEEDS CLARIFICATION]' : '';
        return `- [ ] **${item.task}**${owner}${due}${priority}${ambiguous}`;
      }).join('\n') +
      '\n\n---\n*Extracted by HaleyOS Action Item Extractor*';

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAsJSON = () => {
    const json = JSON.stringify({
      extractedAt: new Date().toISOString(),
      items: items.map(({ id, task, owner, deadline, priority, isAmbiguous, completed }) => ({
        id, task, owner, deadline, priority, isAmbiguous, completed
      })),
      summary: {
        total: items.length,
        highPriority: items.filter(i => i.priority === 'high').length,
        ambiguous: items.filter(i => i.isAmbiguous).length
      }
    }, null, 2);

    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-text-secondary';
      default: return 'text-green-400';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400">High</span>;
      case 'medium': return <span className="px-2 py-0.5 text-xs rounded bg-yellow-500/20 text-yellow-400">Medium</span>;
      case 'low': return <span className="px-2 py-0.5 text-xs rounded bg-panel-light text-text-secondary">Low</span>;
      default: return <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400">Normal</span>;
    }
  };

  const toggleItemComplete = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="flex items-center text-secondary hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <div className="flex items-center">
          <CheckSquare className="w-6 h-6 mr-2 text-primary" />
          <h1 className="text-xl font-semibold">Action Item Extractor</h1>
        </div>
        <div className="w-20" />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Input Section */}
        <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-2">
              Paste meeting notes, email thread, or transcript:
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g., John mentioned he'll send the updated spec by Thursday. Sarah needs to review the marketing budget before Friday's presentation..."
              className="w-full h-48 p-4 bg-panel-dark border border-border rounded-lg resize-none focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          {/* Settings */}
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={detectAssignees}
                onChange={(e) => setDetectAssignees(e.target.checked)}
                className="mr-2 accent-primary"
              />
              <span className="text-secondary">Detect assignees</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={parseDeadlines}
                onChange={(e) => setParseDeadlines(e.target.checked)}
                className="mr-2 accent-primary"
              />
              <span className="text-secondary">Parse deadlines</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={inferPriorities}
                onChange={(e) => setInferPriorities(e.target.checked)}
                className="mr-2 accent-primary"
              />
              <span className="text-secondary">Infer priorities</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={flagAmbiguous}
                onChange={(e) => setFlagAmbiguous(e.target.checked)}
                className="mr-2 accent-primary"
              />
              <span className="text-secondary">Flag ambiguous</span>
            </label>
          </div>

          {/* Extract Button */}
          <button
            onClick={handleExtract}
            disabled={!inputText.trim() || isExtracting}
            className="w-full md:w-auto px-6 py-3 bg-primary/20 hover:bg-primary/30 disabled:bg-panel-light disabled:opacity-50 rounded-lg font-medium flex items-center justify-center text-primary transition-colors"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <CheckSquare className="w-5 h-5 mr-2" />
                Extract Action Items
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="glass rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {items.length > 0 && (
          <div className="glass rounded-xl border border-border p-4 md:p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-medium flex items-center">
                <CheckSquare className="w-5 h-5 mr-2 text-primary" />
                Extracted Action Items ({items.length} found)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={copyAsMarkdown}
                  className="px-3 py-1.5 bg-panel-dark hover:bg-panel-light border border-border rounded-lg text-sm flex items-center transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 mr-1 text-green-400" /> : <Copy className="w-4 h-4 mr-1" />}
                  Markdown
                </button>
                <button
                  onClick={copyAsJSON}
                  className="px-3 py-1.5 bg-panel-dark hover:bg-panel-light border border-border rounded-lg text-sm flex items-center transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 mr-1 text-green-400" /> : <Download className="w-4 h-4 mr-1" />}
                  JSON
                </button>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-10 p-3"></th>
                    <th className="text-left p-3 text-sm text-secondary font-medium">Task</th>
                    <th className="text-left p-3 text-sm text-secondary font-medium w-28">Owner</th>
                    <th className="text-left p-3 text-sm text-secondary font-medium w-28">Due</th>
                    <th className="text-left p-3 text-sm text-secondary font-medium w-24">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b border-border/50 hover:bg-panel-dark/50 transition-colors ${item.completed ? 'opacity-50' : ''}`}
                    >
                      <td className="p-3 text-center">
                        {item.isAmbiguous ? (
                          <AlertTriangle className="w-5 h-5 text-yellow-500 mx-auto" />
                        ) : (
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleItemComplete(item.id)}
                            className="w-4 h-4 accent-primary cursor-pointer"
                          />
                        )}
                      </td>
                      <td className={`p-3 ${item.completed ? 'line-through' : ''}`}>{item.task}</td>
                      <td className="p-3 text-primary">
                        {item.owner ? `@${item.owner}` : <span className="text-secondary">-</span>}
                      </td>
                      <td className="p-3 text-secondary">{item.deadline || '-'}</td>
                      <td className="p-3">{getPriorityBadge(item.priority)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 bg-panel-dark rounded-lg border border-border ${item.completed ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {item.isAmbiguous ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleItemComplete(item.id)}
                        className="w-4 h-4 accent-primary cursor-pointer mt-1 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${item.completed ? 'line-through' : ''}`}>{item.task}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                        {item.owner && <span className="text-primary">@{item.owner}</span>}
                        {item.deadline && <span className="text-secondary">{item.deadline}</span>}
                        {getPriorityBadge(item.priority)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {items.some(i => i.isAmbiguous) && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-200">Some items need clarification</p>
                  <p className="text-sm text-yellow-200/70">
                    Items marked with a warning have unclear ownership or missing details.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
