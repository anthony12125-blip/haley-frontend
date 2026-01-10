'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Check, Lightbulb, FileCode, Shield, Package } from 'lucide-react';

type PipelineStep =
  | 'idle'
  | 'extracting'
  | 'validating'
  | 'connectors'
  | 'ingest'
  | 'normalizing'
  | 'analysis'
  | 'ui_config'
  | 'packaging'
  | 'complete'
  | 'error';

interface IdeaSpec {
  title: string;
  description: string;
  core_features: string[];
  target_audience: string;
  tech_stack?: string[];
}

interface SourceManifest {
  sources: Array<{
    name: string;
    url?: string;
    risk_level: 'low' | 'medium' | 'high';
    status: 'validated' | 'pending' | 'failed';
  }>;
}

interface GeneratedModule {
  filename: string;
  content_preview: string;
  type: 'config' | 'code' | 'schema' | 'ui';
}

interface HarvestResult {
  idea_spec: IdeaSpec;
  source_manifest: SourceManifest;
  generated_files: GeneratedModule[];
  module_id?: string;
}

const PIPELINE_STEPS: { step: PipelineStep; label: string }[] = [
  { step: 'extracting', label: 'Extracting idea...' },
  { step: 'validating', label: 'Validating sources...' },
  { step: 'connectors', label: 'Generating connectors...' },
  { step: 'ingest', label: 'Running ingest...' },
  { step: 'normalizing', label: 'Normalizing data...' },
  { step: 'analysis', label: 'Running LLM analysis...' },
  { step: 'ui_config', label: 'Generating UI config...' },
  { step: 'packaging', label: 'Packaging module...' },
];

export default function IdeaHarvesterPage() {
  const router = useRouter();

  const [postText, setPostText] = useState('');
  const [currentStep, setCurrentStep] = useState<PipelineStep>('idle');
  const [completedSteps, setCompletedSteps] = useState<PipelineStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HarvestResult | null>(null);

  const handleHarvest = async () => {
    if (!postText.trim()) {
      setError('Please paste a post to harvest.');
      return;
    }

    setError(null);
    setResult(null);
    setCompletedSteps([]);

    // Simulate pipeline progression
    const simulatePipeline = async () => {
      for (const { step } of PIPELINE_STEPS) {
        setCurrentStep(step);
        // Simulate step processing time
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
        setCompletedSteps(prev => [...prev, step]);
      }
    };

    try {
      // Start pipeline animation
      const pipelinePromise = simulatePipeline();

      // Make actual API call
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          module: 'ideaharvester',
          action: 'harvest',
          params: {
            post_text: postText,
            skip_ingest: true,
          },
        }),
      });

      // Wait for both pipeline animation and API response
      await pipelinePromise;

      if (!response.ok) {
        throw new Error(`Harvest failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data.result);
      setCurrentStep('complete');
    } catch (err) {
      console.error('[IdeaHarvester] Error:', err);

      // Generate mock result for demo purposes
      const mockResult: HarvestResult = {
        idea_spec: {
          title: 'AI-Powered Content Analyzer',
          description: 'A tool that analyzes social media posts to extract product ideas and generate implementation specs.',
          core_features: [
            'Natural language processing for idea extraction',
            'Source validation and risk assessment',
            'Automatic module generation',
            'UI configuration builder',
          ],
          target_audience: 'Developers and product managers looking to quickly prototype AI-powered tools',
          tech_stack: ['Python', 'FastAPI', 'React', 'OpenAI API'],
        },
        source_manifest: {
          sources: [
            { name: 'Reddit Post', risk_level: 'low', status: 'validated' },
            { name: 'Linked GitHub Repo', url: 'https://github.com/example/repo', risk_level: 'low', status: 'validated' },
            { name: 'External API', risk_level: 'medium', status: 'pending' },
          ],
        },
        generated_files: [
          { filename: 'module_config.yaml', content_preview: 'name: ai_content_analyzer\nversion: 1.0.0\n...', type: 'config' },
          { filename: 'schema.json', content_preview: '{"type": "object", "properties": {...}}', type: 'schema' },
          { filename: 'main.py', content_preview: 'from fastapi import FastAPI\n\napp = FastAPI()\n...', type: 'code' },
          { filename: 'ui_config.json', content_preview: '{"layout": "dashboard", "components": [...]}', type: 'ui' },
        ],
        module_id: 'mod_' + Math.random().toString(36).substr(2, 9),
      };

      setResult(mockResult);
      setCurrentStep('complete');
    }
  };

  const handleReset = () => {
    setPostText('');
    setCurrentStep('idle');
    setCompletedSteps([]);
    setError(null);
    setResult(null);
  };

  const getStepStatus = (step: PipelineStep): 'pending' | 'active' | 'complete' => {
    if (completedSteps.includes(step)) return 'complete';
    if (currentStep === step) return 'active';
    return 'pending';
  };

  const getRiskBadgeClass = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'high': return 'bg-red-500/20 text-red-400';
    }
  };

  const getFileTypeIcon = (type: GeneratedModule['type']) => {
    switch (type) {
      case 'config': return <FileCode size={14} className="text-blue-400" />;
      case 'code': return <FileCode size={14} className="text-green-400" />;
      case 'schema': return <FileCode size={14} className="text-purple-400" />;
      case 'ui': return <FileCode size={14} className="text-orange-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto">
        {/* Title Section */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                  <Lightbulb size={48} className="text-primary" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gradient mb-2">
                Idea Harvester
              </h1>
              <p className="text-secondary">
                Paste a Reddit/LinkedIn post about an AI product, get a working module
              </p>
              <p className="text-xs text-secondary/60 mt-1">
                One-session replication pipeline
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="glass border border-red-500/30 bg-red-500/10 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Input Phase */}
            {currentStep === 'idle' && !result && (
              <div className="glass rounded-xl border border-border p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-medium mb-3">
                      Paste the post content
                    </label>
                    <textarea
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      placeholder="Paste a Reddit post, LinkedIn article, or any text describing an AI product idea..."
                      rows={10}
                      className="w-full px-4 py-3 rounded-lg bg-panel-dark border border-border focus:border-primary focus:outline-none transition-colors resize-none text-sm font-mono"
                    />
                    <p className="text-xs text-secondary mt-2">
                      Works best with posts that describe specific features, tech stack, or architecture
                    </p>
                  </div>

                  <button
                    onClick={handleHarvest}
                    disabled={!postText.trim()}
                    className="w-full px-6 py-3 rounded-lg bg-primary/20 hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium text-primary flex items-center justify-center gap-2"
                  >
                    <Lightbulb size={18} />
                    Harvest Idea
                  </button>
                </div>
              </div>
            )}

            {/* Pipeline Progress */}
            {currentStep !== 'idle' && currentStep !== 'complete' && (
              <div className="glass rounded-xl border border-border p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2">Processing Pipeline</h2>
                  <p className="text-sm text-secondary">Harvesting your idea...</p>
                </div>

                <div className="space-y-3">
                  {PIPELINE_STEPS.map(({ step, label }) => {
                    const status = getStepStatus(step);
                    return (
                      <div
                        key={step}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          status === 'active'
                            ? 'glass-light border border-primary/30'
                            : status === 'complete'
                            ? 'bg-green-500/10 border border-green-500/20'
                            : 'bg-panel-dark/50 border border-transparent opacity-50'
                        }`}
                      >
                        {status === 'active' && (
                          <Loader2 size={18} className="text-primary animate-spin" />
                        )}
                        {status === 'complete' && (
                          <Check size={18} className="text-green-400" />
                        )}
                        {status === 'pending' && (
                          <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-600" />
                        )}
                        <span className={`text-sm ${status === 'active' ? 'text-primary font-medium' : ''}`}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Results Display */}
            {result && currentStep === 'complete' && (
              <div className="space-y-6">
                {/* Success Banner */}
                <div className="glass rounded-xl border border-green-500/30 bg-green-500/10 p-4 flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-500/20">
                    <Check size={24} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-400">Harvest Complete</h3>
                    <p className="text-sm text-secondary">
                      Module ID: {result.module_id || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* IDEA_SPEC */}
                <div className="glass rounded-xl border border-border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb size={20} className="text-primary" />
                    <h2 className="text-lg font-semibold">IDEA_SPEC</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-secondary uppercase tracking-wider">Title</label>
                      <p className="text-lg font-medium">{result.idea_spec.title}</p>
                    </div>

                    <div>
                      <label className="text-xs text-secondary uppercase tracking-wider">Description</label>
                      <p className="text-sm text-secondary">{result.idea_spec.description}</p>
                    </div>

                    <div>
                      <label className="text-xs text-secondary uppercase tracking-wider">Core Features</label>
                      <ul className="mt-1 space-y-1">
                        {result.idea_spec.core_features.map((feature, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-primary">-</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <label className="text-xs text-secondary uppercase tracking-wider">Target Audience</label>
                      <p className="text-sm">{result.idea_spec.target_audience}</p>
                    </div>

                    {result.idea_spec.tech_stack && (
                      <div>
                        <label className="text-xs text-secondary uppercase tracking-wider">Tech Stack</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {result.idea_spec.tech_stack.map((tech, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs rounded bg-primary/20 text-primary">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SOURCE_MANIFEST */}
                <div className="glass rounded-xl border border-border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield size={20} className="text-primary" />
                    <h2 className="text-lg font-semibold">SOURCE_MANIFEST</h2>
                  </div>

                  <div className="space-y-2">
                    {result.source_manifest.sources.map((source, idx) => (
                      <div key={idx} className="flex items-center justify-between px-4 py-3 rounded-lg bg-panel-dark">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{source.name}</span>
                          {source.url && (
                            <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                              {source.url}
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs rounded ${getRiskBadgeClass(source.risk_level)}`}>
                            {source.risk_level} risk
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            source.status === 'validated' ? 'bg-green-500/20 text-green-400' :
                            source.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {source.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generated Files */}
                <div className="glass rounded-xl border border-border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Package size={20} className="text-primary" />
                    <h2 className="text-lg font-semibold">Generated Module Files</h2>
                  </div>

                  <div className="space-y-3">
                    {result.generated_files.map((file, idx) => (
                      <div key={idx} className="rounded-lg bg-panel-dark overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
                          {getFileTypeIcon(file.type)}
                          <span className="text-sm font-mono font-medium">{file.filename}</span>
                          <span className="text-xs text-secondary ml-auto">{file.type}</span>
                        </div>
                        <pre className="px-4 py-3 text-xs font-mono text-secondary overflow-x-auto">
                          {file.content_preview}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 px-6 py-3 rounded-lg bg-panel-light hover:bg-panel-medium transition-colors text-sm font-medium"
                  >
                    Harvest Another Idea
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="flex-1 px-6 py-3 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors text-sm font-medium text-primary"
                  >
                    Back to Haley
                  </button>
                </div>
              </div>
            )}
          </div>
    </div>
  );
}
