'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { HaleyCoreGlyph } from '@/components/HaleyCoreGlyph';
import IconSoundboard from '@/components/icons/IconSoundboard';
import { generateClaims } from '@/lib/ai_rd/claimsGenerator';
import { questionizeClaims, type Claim, type Question } from '@/lib/ai_rd/rd_questionizer';
import { createLLMAdapter } from '@/lib/ai_rd/llmAdapter';

type Phase = 'input' | 'claims' | 'questions' | 'done';

export default function AiRDSoundboardPage() {
  const router = useRouter();
  
  // Phase A: Input state
  const [userIdea, setUserIdea] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');
  
  // Phase B: Claims state
  const [claims, setClaims] = useState<Claim[]>([]);
  
  // Phase C: Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // UI state
  const [phase, setPhase] = useState<Phase>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateClaims = () => {
    setError(null);

    const concept = userIdea.trim();
    const omega = successCriteria.trim() || 'viable and user-friendly implementation';

    const generatedClaims = generateClaims(concept, omega);

    if (generatedClaims.length === 0) {
      setError('Tell me what you want to build first.');
      return;
    }

    setClaims(generatedClaims);
    setPhase('claims');
  };

  const handleGenerateQuestions = async () => {
    setError(null);
    setLoading(true);

    try {
      const llmCall = createLLMAdapter('claude');
      const result = await questionizeClaims({
        claims,
        llmCall,
        temperature: 0.2
      });

      console.log('[Soundboard] Questionize result:', result);
      
      if (result.questions.length === 0) {
        setError('No user questions needed - all claims can be validated without user input.');
        setPhase('done');
        return;
      }
      
      setQuestions(result.questions);
      setPhase('questions');
    } catch (err) {
      console.error('[Soundboard] Error generating questions:', err);
      setError('Couldn\'t generate questions. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleContinue = () => {
    // Store answers in session (for now just log them)
    console.log('[Soundboard] Answers captured:', answers);
    
    // Store in sessionStorage for persistence
    sessionStorage.setItem('rd_soundboard_answers', JSON.stringify({
      userIdea,
      successCriteria,
      claims,
      questions,
      answers,
      timestamp: new Date().toISOString()
    }));
    
    setPhase('done');
  };

  const handleReset = () => {
    setUserIdea('');
    setSuccessCriteria('');
    setClaims([]);
    setQuestions([]);
    setAnswers({});
    setError(null);
    setPhase('input');
  };

  return (
    <div className="full-screen flex overflow-hidden">
      {/* Space Background */}
      <div className="space-bg">
        <div className="stars" />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="shooting-star"
            style={{
              top: `${Math.random() * 50}%`,
              right: `${Math.random() * 50}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="glass-strong border-b border-border p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back to AI R&D</span>
            </button>
            <div className="flex items-center gap-2">
              <HaleyCoreGlyph size={24} className="text-primary" />
              <span className="text-lg font-bold text-gradient">Haley</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            {/* Title */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                  <IconSoundboard 
                    className="text-primary" 
                    style={{ width: '48px', height: '48px' }}
                  />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gradient mb-2">
                AI R&D Soundboard
              </h1>
              <p className="text-secondary">
                Tell me your idea, I'll figure out what questions to ask
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="glass border border-red-500/30 bg-red-500/10 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Phase A: Conversational R&D Intake */}
            {phase === 'input' && (
              <div className="glass rounded-xl border border-border p-6">
                <div className="space-y-6">
                  {/* Main Question */}
                  <div>
                    <label className="block text-lg font-medium mb-3">
                      What do you want to build?
                    </label>
                    <textarea
                      value={userIdea}
                      onChange={(e) => setUserIdea(e.target.value)}
                      placeholder="Describe your idea naturally... e.g., 'A mobile app that translates conversations in real-time' or 'An internal tool to automate our customer onboarding workflow'"
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg bg-panel-dark border border-border focus:border-primary focus:outline-none transition-colors resize-none text-sm"
                    />
                  </div>
                  
                  {/* Optional Success Criteria */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-secondary">
                      Success criteria <span className="text-xs opacity-60">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={successCriteria}
                      onChange={(e) => setSuccessCriteria(e.target.value)}
                      placeholder="e.g., 'Under 500ms latency' or 'Works offline' or 'Handles 10k concurrent users'"
                      className="w-full px-4 py-2 rounded-lg bg-panel-dark border border-border focus:border-primary focus:outline-none transition-colors text-sm"
                    />
                    <p className="text-xs text-secondary mt-2 opacity-70">
                      Leave blank and I'll infer sensible constraints
                    </p>
                  </div>
                  
                  <button
                    onClick={handleGenerateClaims}
                    disabled={!userIdea.trim()}
                    className="w-full px-6 py-3 rounded-lg bg-primary/20 hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium text-primary"
                  >
                    Start R&D Analysis
                  </button>
                </div>
              </div>
            )}

            {/* Phase B: Claims */}
            {phase === 'claims' && (
              <div className="glass rounded-xl border border-border p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2">Generated Claims</h2>
                  <p className="text-sm text-secondary">
                    {claims.length} feasibility claims identified
                  </p>
                </div>
                
                <div className="space-y-3 mb-6">
                  {claims.map((claim) => (
                    <div key={claim.id} className="glass-light rounded-lg p-4 border border-border/50">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-mono text-primary px-2 py-1 rounded bg-primary/10 flex-shrink-0">
                          {claim.id}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm mb-1">{claim.statement}</p>
                          <div className="flex gap-2 text-xs text-secondary">
                            <span className="px-2 py-0.5 rounded bg-panel-dark">
                              {claim.type}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-panel-dark">
                              {claim.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 px-6 py-3 rounded-lg bg-panel-light hover:bg-panel-medium transition-colors text-sm font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleGenerateQuestions}
                    disabled={loading}
                    className="flex-1 px-6 py-3 rounded-lg bg-primary/20 hover:bg-primary/30 disabled:opacity-50 transition-colors text-sm font-medium text-primary flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    Generate Questions
                  </button>
                </div>
              </div>
            )}

            {/* Phase C: Questions */}
            {phase === 'questions' && (
              <div className="glass rounded-xl border border-border p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2">User Questions</h2>
                  <p className="text-sm text-secondary">
                    {questions.length} questions need your input
                  </p>
                </div>
                
                <div className="space-y-4 mb-6">
                  {questions.map((question) => (
                    <div key={question.id} className="glass-light rounded-lg p-4 border border-border/50">
                      <div className="mb-3">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-xs font-mono text-primary px-2 py-1 rounded bg-primary/10 flex-shrink-0">
                            {question.id}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            question.priority === 'must' ? 'bg-red-500/20 text-red-400' :
                            question.priority === 'should' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {question.priority}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-1">{question.question}</p>
                        {question.why && (
                          <p className="text-xs text-secondary italic">
                            {question.why}
                          </p>
                        )}
                      </div>
                      
                      {/* Input based on kind */}
                      {question.kind === 'choice' && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={question.id}
                                value={option}
                                checked={answers[question.id] === option}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                className="text-primary"
                              />
                              <span className="text-sm">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {question.kind === 'boolean' && (
                        <div className="flex gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={question.id}
                              value="yes"
                              checked={answers[question.id] === 'yes'}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              className="text-primary"
                            />
                            <span className="text-sm">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={question.id}
                              value="no"
                              checked={answers[question.id] === 'no'}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              className="text-primary"
                            />
                            <span className="text-sm">No</span>
                          </label>
                        </div>
                      )}
                      
                      {question.kind === 'number' && (
                        <input
                          type="number"
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-panel-dark border border-border focus:border-primary focus:outline-none transition-colors text-sm"
                          placeholder="Enter a number"
                        />
                      )}
                      
                      {question.kind === 'text' && (
                        <textarea
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg bg-panel-dark border border-border focus:border-primary focus:outline-none transition-colors text-sm resize-none"
                          placeholder="Enter your answer"
                        />
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setPhase('claims')}
                    className="flex-1 px-6 py-3 rounded-lg bg-panel-light hover:bg-panel-medium transition-colors text-sm font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleContinue}
                    className="flex-1 px-6 py-3 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors text-sm font-medium text-primary"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Phase D: Done */}
            {phase === 'done' && (
              <div className="glass rounded-xl border border-border p-6 text-center">
                <div className="mb-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                      <svg 
                        className="w-12 h-12 text-primary" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M5 13l4 4L19 7" 
                        />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gradient mb-2">
                    Questions Captured
                  </h2>
                  <p className="text-secondary">
                    Your answers have been stored in the session
                  </p>
                </div>
                
                <div className="glass-light rounded-lg p-4 mb-6 text-left text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-secondary">Claims:</span>
                      <span className="font-medium">{claims.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Questions:</span>
                      <span className="font-medium">{questions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Answers:</span>
                      <span className="font-medium">{Object.keys(answers).length}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleReset}
                  className="w-full px-6 py-3 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors text-sm font-medium text-primary"
                >
                  Start New Session
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
