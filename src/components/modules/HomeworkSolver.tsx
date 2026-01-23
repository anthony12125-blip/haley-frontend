'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Camera, Type, Mic, Loader2, ChevronDown, ChevronUp,
  MessageSquare, RotateCcw, Trash2, X, Star, Sparkles, BookOpen,
  StopCircle, ChevronRight, Trophy, FileText, BarChart3, Copy,
  Check, Zap, GraduationCap
} from 'lucide-react';
import { sendMessage, sendAudioMessage } from '@/lib/haleyApi';

interface HomeworkSolverProps {
  onBack: () => void;
}

type InputTab = 'camera' | 'type' | 'voice';
type MainView = 'home' | 'quiz' | 'studyGuide' | 'progress';
type Subject = 'math' | 'science' | 'history' | 'english' | 'languages' | 'other' | null;
type Difficulty = 'easy' | 'medium' | 'hard';
type ExplanationDepth = 'brief' | 'detailed';

interface FollowUpItem {
  question: string;
  answer: string;
}

interface SolvedProblem {
  id: string;
  timestamp: number;
  problem: string;
  problemType: 'text' | 'image' | 'voice';
  imageData?: string;
  answer: string;
  steps: string[];
  bookmarked?: boolean;
  followUps?: FollowUpItem[];
  provider?: string;
  subject?: Subject;
}

interface PracticeProblem {
  problem: string;
  answer: string | null;
  showAnswer: boolean;
}

interface QuizQuestion {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean | null;
  explanation?: string;
}

interface QuizState {
  subject: Subject;
  difficulty: Difficulty;
  questions: QuizQuestion[];
  currentIndex: number;
  isComplete: boolean;
  score: number;
}

interface StudyGuide {
  topic: string;
  content: string;
  isLoading: boolean;
}

interface ProgressData {
  totalSolved: number;
  subjectBreakdown: Record<string, number>;
  quizScores: number[];
  lastActiveDate: string;
  streak: number;
}

const STORAGE_KEY = 'homework_solver_history';
const SETTINGS_KEY = 'homework_solver_settings';
const PROGRESS_KEY = 'homework_solver_progress';
const MAX_HISTORY = 20;

const SUBJECTS: { id: Subject; name: string; icon: string }[] = [
  { id: 'math', name: 'Math', icon: '🔢' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'history', name: 'History', icon: '📜' },
  { id: 'english', name: 'English', icon: '📖' },
  { id: 'languages', name: 'Languages', icon: '🌍' },
  { id: 'other', name: 'Other', icon: '📝' },
];

const LLM_OPTIONS = [
  { id: 'gemini', name: 'Gemini', icon: '✨' },
  { id: 'claude', name: 'Claude', icon: '🤖' },
  { id: 'gpt', name: 'GPT', icon: '🧠' },
  { id: 'meta', name: 'Meta (Llama)', icon: '🦙' },
  { id: 'mistral', name: 'Mistral', icon: '🌬️' },
  { id: 'perplexity', name: 'Perplexity', icon: '🔍' },
  { id: 'grok', name: 'Grok', icon: '⚡' },
];

const BRIEF_PROMPT = `You are a homework tutor. Be concise.
PROBLEM: [One sentence]
ANSWER: [Direct answer]
STEPS: [Maximum 3 brief steps]`;

const DETAILED_PROMPT = `You are a homework tutor. Be thorough and educational.
PROBLEM: [Restate in detail]
ANSWER: [Clear, complete answer]
STEPS:
1. [Detailed step with explanation of WHY]
2. [Continue with reasoning...]
Include tips and common mistakes to avoid.`;

function getSystemPrompt(depth: ExplanationDepth, subject: Subject): string {
  const base = depth === 'brief' ? BRIEF_PROMPT : DETAILED_PROMPT;
  const subjectHint = subject ? `\nThis is a ${subject} problem.` : '';
  return base + subjectHint;
}

function parseResponse(response: string): { problem: string; answer: string; steps: string[] } {
  let problem = '';
  let answer = '';
  let steps: string[] = [];

  const problemMatch = response.match(/PROBLEM:\s*(.+?)(?=\n\n|\nANSWER:)/is);
  if (problemMatch) problem = problemMatch[1].trim();

  const answerMatch = response.match(/ANSWER:\s*(.+?)(?=\n\n|\nSTEPS:)/is);
  if (answerMatch) {
    answer = answerMatch[1].trim();
  } else {
    const fallbackAnswer = response.match(/(?:answer|solution):\s*(.+?)(?:\n|$)/i);
    if (fallbackAnswer) answer = fallbackAnswer[1].trim();
  }

  const stepsMatch = response.match(/STEPS:\s*([\s\S]+?)(?=$)/i);
  if (stepsMatch) {
    const stepMatches = stepsMatch[1].match(/\d+\.\s*[^\n]+/g);
    if (stepMatches) steps = stepMatches.map(s => s.replace(/^\d+\.\s*/, '').trim());
  }

  if (steps.length === 0) {
    const numberedSteps = response.match(/(?:^|\n)(\d+)[.):]\s*([^\n]+)/gm);
    if (numberedSteps) steps = numberedSteps.map(s => s.replace(/(?:^|\n)\d+[.):]\s*/, '').trim());
  }

  return { problem, answer, steps };
}

function detectSubject(text: string): Subject {
  const lower = text.toLowerCase();
  if (/\b(equation|solve|x\s*=|calculate|math|algebra|geometry|calculus|\d+\s*[+\-*/]\s*\d+)\b/.test(lower)) return 'math';
  if (/\b(atom|molecule|physics|chemistry|biology|experiment|hypothesis|cell|energy)\b/.test(lower)) return 'science';
  if (/\b(war|century|president|king|queen|empire|revolution|ancient|medieval)\b/.test(lower)) return 'history';
  if (/\b(essay|grammar|sentence|paragraph|literature|poem|novel|verb|noun)\b/.test(lower)) return 'english';
  if (/\b(translate|spanish|french|german|chinese|japanese|vocabulary|conjugat)\b/.test(lower)) return 'languages';
  return 'other';
}

export default function HomeworkSolver({ onBack }: HomeworkSolverProps) {
  // Main view state
  const [mainView, setMainView] = useState<MainView>('home');

  // Input state
  const [activeTab, setActiveTab] = useState<InputTab>('type');
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject>(null);
  const [explanationDepth, setExplanationDepth] = useState<ExplanationDepth>('detailed');

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Solution state
  const [currentSolution, setCurrentSolution] = useState<SolvedProblem | null>(null);
  const [showSteps, setShowSteps] = useState(true);
  const [followUpInput, setFollowUpInput] = useState('');
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

  // History state
  const [history, setHistory] = useState<SolvedProblem[]>([]);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [historySubjectFilter, setHistorySubjectFilter] = useState<Subject>(null);

  // LLM selector state
  const [selectedLLM, setSelectedLLM] = useState('gemini');
  const [showLLMDropdown, setShowLLMDropdown] = useState(false);

  // Practice problem state
  const [practiceProblem, setPracticeProblem] = useState<PracticeProblem | null>(null);
  const [isPracticeLoading, setIsPracticeLoading] = useState(false);

  // Quiz state
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [quizSubject, setQuizSubject] = useState<Subject>('math');
  const [quizDifficulty, setQuizDifficulty] = useState<Difficulty>('medium');
  const [quizAnswer, setQuizAnswer] = useState('');
  const [isQuizLoading, setIsQuizLoading] = useState(false);

  // Study guide state
  const [studyGuide, setStudyGuide] = useState<StudyGuide | null>(null);
  const [studyGuideTopic, setStudyGuideTopic] = useState('');
  const [copiedGuide, setCopiedGuide] = useState(false);

  // Progress state
  const [progress, setProgress] = useState<ProgressData>({
    totalSolved: 0,
    subjectBreakdown: {},
    quizScores: [],
    lastActiveDate: '',
    streak: 0,
  });

  // Load data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load history
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory).slice(0, MAX_HISTORY));
        } catch { setHistory([]); }
      }

      // Load settings
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          if (settings.selectedLLM) setSelectedLLM(settings.selectedLLM);
          if (settings.explanationDepth) setExplanationDepth(settings.explanationDepth);
        } catch { /* Use defaults */ }
      }

      // Load progress
      const savedProgress = localStorage.getItem(PROGRESS_KEY);
      if (savedProgress) {
        try {
          const p = JSON.parse(savedProgress);
          // Calculate streak
          const today = new Date().toDateString();
          const lastActive = p.lastActiveDate || '';
          const yesterday = new Date(Date.now() - 86400000).toDateString();

          let streak = p.streak || 0;
          if (lastActive === today) {
            // Already active today, keep streak
          } else if (lastActive === yesterday) {
            // Was active yesterday, increment streak
            streak += 1;
          } else if (lastActive !== today) {
            // Missed days, reset streak
            streak = 1;
          }

          setProgress({ ...p, streak, lastActiveDate: today });
        } catch { /* Use defaults */ }
      }
    }
  }, []);

  // Save settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ selectedLLM, explanationDepth }));
    }
  }, [selectedLLM, explanationDepth]);

  // Save progress
  const saveProgress = useCallback((newProgress: ProgressData) => {
    if (typeof window !== 'undefined') {
      const today = new Date().toDateString();
      const updated = { ...newProgress, lastActiveDate: today };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
      setProgress(updated);
    }
  }, []);

  // Update progress when solving a problem
  const updateProgressForSolve = useCallback((subject: Subject) => {
    const subjectKey = subject || 'other';
    saveProgress({
      ...progress,
      totalSolved: progress.totalSolved + 1,
      subjectBreakdown: {
        ...progress.subjectBreakdown,
        [subjectKey]: (progress.subjectBreakdown[subjectKey] || 0) + 1,
      },
    });
  }, [progress, saveProgress]);

  // Save history
  const saveHistory = useCallback((newHistory: SolvedProblem[]) => {
    if (typeof window !== 'undefined') {
      const trimmed = newHistory.slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      setHistory(trimmed);
    }
  }, []);

  // Camera functions
  const startCamera = useCallback(async () => {
    if (cameraActive || streamRef.current) return;
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setCameraError(null);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Could not access camera. Please check permissions.');
      setCameraActive(false);
    }
  }, [cameraActive]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
      stopCamera();
    }
  }, [stopCamera]);

  // Voice functions
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      setTranscribedText(null);
      recordingIntervalRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsLoading(true);
    setError(null);
    let transcribedContent = '';
    try {
      await sendAudioMessage(
        audioBlob, selectedLLM,
        (token) => { transcribedContent += token; },
        () => {
          setTranscribedText(transcribedContent);
          setIsLoading(false);
          if (transcribedContent.trim()) {
            solveProblem(transcribedContent.trim(), undefined, 'voice');
          }
        },
        (err) => { setError(`Transcription failed: ${err}`); setIsLoading(false); }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
      setIsLoading(false);
    }
  };

  // Effects for camera
  useEffect(() => {
    const shouldShowCamera = mainView === 'home' && activeTab === 'camera' && !capturedImage && !currentSolution;
    if (shouldShowCamera) {
      if (!cameraActive && !streamRef.current) startCamera();
    } else {
      stopCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [mainView, activeTab, capturedImage, currentSolution]); // eslint-disable-line

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
    };
  }, [isRecording]);

  // Solve problem
  const solveProblem = useCallback(async (
    problemText: string,
    imageData?: string,
    problemType: 'text' | 'image' | 'voice' = 'text'
  ) => {
    setIsLoading(true);
    setError(null);
    setPracticeProblem(null);

    const detectedSubject = selectedSubject || detectSubject(problemText);
    let fullResponse = '';

    try {
      const systemPrompt = getSystemPrompt(explanationDepth, detectedSubject);
      const message = imageData
        ? `${systemPrompt}\n\n[Image attached - analyze the homework problem shown in the image]`
        : `${systemPrompt}\n\nProblem: ${problemText}`;

      let files: File[] | undefined;
      if (imageData) {
        const base64Data = imageData.split(',')[1];
        const byteString = atob(base64Data);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        files = [new File([new Blob([ab], { type: 'image/jpeg' })], 'homework.jpg', { type: 'image/jpeg' })];
      }

      const provider = imageData ? 'gemini' : selectedLLM;

      await sendMessage(
        message, provider,
        (token) => { fullResponse += token; },
        () => {
          const { problem, answer, steps } = parseResponse(fullResponse);
          const solved: SolvedProblem = {
            id: `hw_${Date.now()}`,
            timestamp: Date.now(),
            problem: problem || problemText || 'Image problem',
            problemType,
            imageData,
            answer: answer || 'Could not determine answer',
            steps: steps.length > 0 ? steps : ['No steps provided'],
            bookmarked: false,
            followUps: [],
            provider,
            subject: detectedSubject,
          };
          setCurrentSolution(solved);
          saveHistory([solved, ...history]);
          updateProgressForSolve(detectedSubject);
          setIsLoading(false);
        },
        (err) => { setError(err); setIsLoading(false); },
        files
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to solve problem');
      setIsLoading(false);
    }
  }, [history, saveHistory, selectedLLM, selectedSubject, explanationDepth, updateProgressForSolve]);

  // Quiz functions
  const startQuiz = async () => {
    setIsQuizLoading(true);
    setError(null);
    let fullResponse = '';

    const prompt = `Generate a ${quizDifficulty} difficulty quiz with 5 questions about ${quizSubject}.

Format EXACTLY like this for each question:
Q1: [Question]
A1: [Correct answer]

Q2: [Question]
A2: [Correct answer]

...continue for Q3, Q4, Q5`;

    try {
      await sendMessage(
        prompt, selectedLLM,
        (token) => { fullResponse += token; },
        () => {
          const questions: QuizQuestion[] = [];
          for (let i = 1; i <= 5; i++) {
            const qMatch = fullResponse.match(new RegExp(`Q${i}:\\s*(.+?)(?=\\nA${i}:)`, 's'));
            const aMatch = fullResponse.match(new RegExp(`A${i}:\\s*(.+?)(?=\\n|Q${i+1}:|$)`, 's'));
            if (qMatch && aMatch) {
              questions.push({
                question: qMatch[1].trim(),
                correctAnswer: aMatch[1].trim(),
                userAnswer: '',
                isCorrect: null,
              });
            }
          }
          setQuiz({
            subject: quizSubject,
            difficulty: quizDifficulty,
            questions,
            currentIndex: 0,
            isComplete: false,
            score: 0,
          });
          setIsQuizLoading(false);
        },
        (err) => { setError(err); setIsQuizLoading(false); }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
      setIsQuizLoading(false);
    }
  };

  const submitQuizAnswer = async () => {
    if (!quiz || !quizAnswer.trim()) return;

    setIsQuizLoading(true);
    const currentQ = quiz.questions[quiz.currentIndex];
    let fullResponse = '';

    const prompt = `Question: ${currentQ.question}
Correct answer: ${currentQ.correctAnswer}
Student's answer: ${quizAnswer}

Is the student's answer correct? Respond with:
CORRECT: yes or no
EXPLANATION: Brief explanation`;

    try {
      await sendMessage(
        prompt, selectedLLM,
        (token) => { fullResponse += token; },
        () => {
          const isCorrect = /CORRECT:\s*yes/i.test(fullResponse);
          const explanationMatch = fullResponse.match(/EXPLANATION:\s*(.+)/is);

          const updatedQuestions = [...quiz.questions];
          updatedQuestions[quiz.currentIndex] = {
            ...currentQ,
            userAnswer: quizAnswer,
            isCorrect,
            explanation: explanationMatch?.[1]?.trim() || '',
          };

          const newScore = isCorrect ? quiz.score + 1 : quiz.score;
          const isComplete = quiz.currentIndex >= quiz.questions.length - 1;

          setQuiz({
            ...quiz,
            questions: updatedQuestions,
            currentIndex: isComplete ? quiz.currentIndex : quiz.currentIndex + 1,
            isComplete,
            score: newScore,
          });

          if (isComplete) {
            // Save quiz score to progress
            const scorePercent = Math.round((newScore / quiz.questions.length) * 100);
            saveProgress({
              ...progress,
              quizScores: [...progress.quizScores, scorePercent].slice(-20),
            });
          }

          setQuizAnswer('');
          setIsQuizLoading(false);
        },
        (err) => { setError(err); setIsQuizLoading(false); }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check answer');
      setIsQuizLoading(false);
    }
  };

  // Study guide functions
  const generateStudyGuide = async () => {
    if (!studyGuideTopic.trim()) return;

    setStudyGuide({ topic: studyGuideTopic, content: '', isLoading: true });
    let fullResponse = '';

    const prompt = `Create a comprehensive study guide for: "${studyGuideTopic}"

Structure it like this:

## Overview
Brief introduction to the topic

## Key Concepts
- Concept 1: explanation
- Concept 2: explanation
...

## Important Facts/Formulas
- Fact/formula 1
- Fact/formula 2
...

## Common Mistakes to Avoid
1. Mistake and why it's wrong
2. ...

## Practice Problems
1. Problem (with answer in parentheses)
2. ...

## Tips for Success
- Tip 1
- Tip 2`;

    try {
      await sendMessage(
        prompt, selectedLLM,
        (token) => {
          fullResponse += token;
          setStudyGuide(prev => prev ? { ...prev, content: fullResponse } : null);
        },
        () => {
          setStudyGuide(prev => prev ? { ...prev, isLoading: false } : null);
        },
        (err) => {
          setError(err);
          setStudyGuide(null);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate study guide');
      setStudyGuide(null);
    }
  };

  const copyStudyGuide = () => {
    if (studyGuide?.content) {
      navigator.clipboard.writeText(studyGuide.content);
      setCopiedGuide(true);
      setTimeout(() => setCopiedGuide(false), 2000);
    }
  };

  // Other handlers
  const handleTextSolve = () => { if (textInput.trim()) solveProblem(textInput.trim()); };
  const handleImageSolve = () => { if (capturedImage) solveProblem('', capturedImage, 'image'); };
  const handleRetake = () => { setCapturedImage(null); startCamera(); };

  const handleNewProblem = () => {
    setCurrentSolution(null);
    setCapturedImage(null);
    setTextInput('');
    setFollowUpInput('');
    setTranscribedText(null);
    setPracticeProblem(null);
    setSelectedSubject(null);
    if (activeTab === 'camera') startCamera();
  };

  const handleFollowUp = async () => {
    if (!followUpInput.trim() || !currentSolution) return;
    setIsFollowUpLoading(true);
    let fullResponse = '';

    try {
      const previousFollowUps = currentSolution.followUps?.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n') || '';
      const context = `Original problem: ${currentSolution.problem}
Original answer: ${currentSolution.answer}
${previousFollowUps ? `\nPrevious follow-ups:\n${previousFollowUps}\n` : ''}
New follow-up question: ${followUpInput}

Please answer this follow-up question in the context of the original problem.`;

      await sendMessage(
        context, selectedLLM,
        (token) => { fullResponse += token; },
        () => {
          const newFollowUp: FollowUpItem = { question: followUpInput, answer: fullResponse };
          setCurrentSolution(prev => {
            if (!prev) return null;
            const updated = { ...prev, followUps: [...(prev.followUps || []), newFollowUp] };
            saveHistory(history.map(h => h.id === prev.id ? updated : h));
            return updated;
          });
          setFollowUpInput('');
          setIsFollowUpLoading(false);
        },
        (err) => { setError(err); setIsFollowUpLoading(false); }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process follow-up');
      setIsFollowUpLoading(false);
    }
  };

  const toggleBookmark = (id: string) => {
    const updated = history.map(h => h.id === id ? { ...h, bookmarked: !h.bookmarked } : h);
    saveHistory(updated);
    if (currentSolution?.id === id) {
      setCurrentSolution(prev => prev ? { ...prev, bookmarked: !prev.bookmarked } : null);
    }
  };

  const generatePracticeProblem = async () => {
    if (!currentSolution) return;
    setIsPracticeLoading(true);
    let fullResponse = '';

    try {
      await sendMessage(
        `Generate a similar practice problem to: ${currentSolution.problem}\n\nFormat: PRACTICE PROBLEM: [problem]`,
        selectedLLM,
        (token) => { fullResponse += token; },
        () => {
          const match = fullResponse.match(/PRACTICE PROBLEM:\s*(.+)/is);
          setPracticeProblem({ problem: match?.[1]?.trim() || fullResponse.trim(), answer: null, showAnswer: false });
          setIsPracticeLoading(false);
        },
        (err) => { setError(err); setIsPracticeLoading(false); }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate practice problem');
      setIsPracticeLoading(false);
    }
  };

  const solvePracticeProblem = async () => {
    if (!practiceProblem) return;
    setIsPracticeLoading(true);
    let fullResponse = '';

    try {
      await sendMessage(
        `${getSystemPrompt(explanationDepth, selectedSubject)}\n\nProblem: ${practiceProblem.problem}`,
        selectedLLM,
        (token) => { fullResponse += token; },
        () => {
          const { answer, steps } = parseResponse(fullResponse);
          setPracticeProblem(prev => prev ? {
            ...prev,
            answer: `${answer}\n\nSteps:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
            showAnswer: true,
          } : null);
          setIsPracticeLoading(false);
        },
        (err) => { setError(err); setIsPracticeLoading(false); }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to solve practice problem');
      setIsPracticeLoading(false);
    }
  };

  // Filtered history
  const filteredHistory = history.filter(h => {
    if (showBookmarkedOnly && !h.bookmarked) return false;
    if (historySubjectFilter && h.subject !== historySubjectFilter) return false;
    return true;
  });

  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  const currentLLM = LLM_OPTIONS.find(l => l.id === selectedLLM) || LLM_OPTIONS[0];
  const avgQuizScore = progress.quizScores.length > 0
    ? Math.round(progress.quizScores.reduce((a, b) => a + b, 0) / progress.quizScores.length)
    : 0;

  return (
    <div className="flex-1 flex flex-col bg-panel-dark overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">📚 Homework Solver</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress button */}
          <button
            onClick={() => setMainView(mainView === 'progress' ? 'home' : 'progress')}
            className={`p-2 rounded-lg transition-colors ${mainView === 'progress' ? 'bg-teal-500/20 text-teal-400' : 'hover:bg-zinc-800'}`}
            title="My Progress"
          >
            <BarChart3 size={20} />
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
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-zinc-700 transition-colors ${selectedLLM === llm.id ? 'bg-zinc-700 text-teal-400' : ''}`}
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

      {/* Mode Tabs */}
      {!currentSolution && mainView !== 'progress' && (
        <div className="flex border-b border-border">
          <button
            onClick={() => { setMainView('home'); setQuiz(null); setStudyGuide(null); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${mainView === 'home' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-zinc-400 hover:text-white'}`}
          >
            Solve
          </button>
          <button
            onClick={() => { setMainView('quiz'); setCurrentSolution(null); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mainView === 'quiz' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-zinc-400 hover:text-white'}`}
          >
            <Trophy size={16} />
            Quiz
          </button>
          <button
            onClick={() => { setMainView('studyGuide'); setCurrentSolution(null); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mainView === 'studyGuide' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-zinc-400 hover:text-white'}`}
          >
            <FileText size={16} />
            Study Guide
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <X size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto"><X size={16} className="text-red-400" /></button>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="bg-zinc-800/50 rounded-xl p-8 flex flex-col items-center justify-center">
              <Loader2 size={48} className="text-teal-400 animate-spin mb-4" />
              <p className="text-lg font-medium">Solving...</p>
              <p className="text-sm text-zinc-400 animate-pulse">Analyzing your homework problem</p>
            </div>
          )}

          {/* PROGRESS VIEW */}
          {mainView === 'progress' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 size={24} className="text-teal-400" />
                  My Progress
                </h2>
                <button onClick={() => setMainView('home')} className="text-sm text-zinc-400 hover:text-white">
                  Back to Solve
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-teal-400">{progress.totalSolved}</p>
                  <p className="text-sm text-zinc-400">Problems Solved</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-orange-400">{progress.streak}</p>
                  <p className="text-sm text-zinc-400">Day Streak 🔥</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-purple-400">{progress.quizScores.length}</p>
                  <p className="text-sm text-zinc-400">Quizzes Taken</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">{avgQuizScore}%</p>
                  <p className="text-sm text-zinc-400">Avg Quiz Score</p>
                </div>
              </div>

              {/* Subject Breakdown */}
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-zinc-400 mb-4">Problems by Subject</h3>
                <div className="space-y-2">
                  {Object.entries(progress.subjectBreakdown).map(([subject, count]) => {
                    const subjectInfo = SUBJECTS.find(s => s.id === subject);
                    const percentage = progress.totalSolved > 0 ? Math.round((count / progress.totalSolved) * 100) : 0;
                    return (
                      <div key={subject} className="flex items-center gap-3">
                        <span className="text-lg">{subjectInfo?.icon || '📝'}</span>
                        <span className="text-sm flex-1">{subjectInfo?.name || subject}</span>
                        <div className="w-24 h-2 bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-400 rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="text-xs text-zinc-500 w-8">{count}</span>
                      </div>
                    );
                  })}
                  {Object.keys(progress.subjectBreakdown).length === 0 && (
                    <p className="text-sm text-zinc-500 text-center py-4">No problems solved yet</p>
                  )}
                </div>
              </div>

              {/* Recent Quiz Scores */}
              {progress.quizScores.length > 0 && (
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-zinc-400 mb-4">Recent Quiz Scores</h3>
                  <div className="flex gap-2 flex-wrap">
                    {progress.quizScores.slice(-10).map((score, idx) => (
                      <div
                        key={idx}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          score >= 80 ? 'bg-green-500/20 text-green-400' :
                          score >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {score}%
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QUIZ VIEW */}
          {mainView === 'quiz' && !currentSolution && (
            <div className="space-y-6">
              {!quiz ? (
                <>
                  <div className="text-center">
                    <Trophy size={48} className="text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Quiz Mode</h2>
                    <p className="text-sm text-zinc-400">Test your knowledge with generated questions</p>
                  </div>

                  {/* Subject Selection */}
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Subject</label>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECTS.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setQuizSubject(s.id)}
                          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                            quizSubject === s.id ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' : 'bg-zinc-800 hover:bg-zinc-700'
                          }`}
                        >
                          {s.icon} {s.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Selection */}
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Difficulty</label>
                    <div className="flex gap-2">
                      {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                        <button
                          key={d}
                          onClick={() => setQuizDifficulty(d)}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                            quizDifficulty === d ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' : 'bg-zinc-800 hover:bg-zinc-700'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={startQuiz}
                    disabled={isQuizLoading}
                    className="w-full py-4 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isQuizLoading ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                    Start Quiz
                  </button>
                </>
              ) : quiz.isComplete ? (
                /* Quiz Results */
                <div className="space-y-6">
                  <div className="text-center">
                    <div className={`text-6xl mb-4 ${quiz.score >= 4 ? '🎉' : quiz.score >= 3 ? '👍' : '📚'}`}>
                      {quiz.score >= 4 ? '🎉' : quiz.score >= 3 ? '👍' : '📚'}
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
                    <p className="text-4xl font-bold text-teal-400">{quiz.score}/{quiz.questions.length}</p>
                    <p className="text-sm text-zinc-400 mt-2">
                      {quiz.score === quiz.questions.length ? 'Perfect score!' :
                       quiz.score >= 4 ? 'Great job!' :
                       quiz.score >= 3 ? 'Good effort!' : 'Keep practicing!'}
                    </p>
                  </div>

                  {/* Review Answers */}
                  <div className="space-y-3">
                    {quiz.questions.map((q, idx) => (
                      <div key={idx} className={`p-4 rounded-xl ${q.isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                        <p className="text-sm font-medium mb-2">Q{idx + 1}: {q.question}</p>
                        <p className="text-xs text-zinc-400">Your answer: {q.userAnswer}</p>
                        {!q.isCorrect && (
                          <>
                            <p className="text-xs text-teal-400 mt-1">Correct: {q.correctAnswer}</p>
                            {q.explanation && <p className="text-xs text-zinc-400 mt-2">{q.explanation}</p>}
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setQuiz(null); startQuiz(); }}
                      className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => setQuiz(null)}
                      className="flex-1 py-3 rounded-xl bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors"
                    >
                      New Quiz
                    </button>
                  </div>
                </div>
              ) : (
                /* Active Quiz */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Question {quiz.currentIndex + 1} of {quiz.questions.length}</span>
                    <span className="text-sm font-medium text-teal-400">Score: {quiz.score}</span>
                  </div>

                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-400 transition-all duration-300"
                      style={{ width: `${((quiz.currentIndex) / quiz.questions.length) * 100}%` }}
                    />
                  </div>

                  <div className="bg-zinc-800/50 rounded-xl p-6">
                    <p className="text-lg">{quiz.questions[quiz.currentIndex].question}</p>
                  </div>

                  <input
                    type="text"
                    value={quizAnswer}
                    onChange={(e) => setQuizAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isQuizLoading && submitQuizAnswer()}
                    placeholder="Type your answer..."
                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
                    disabled={isQuizLoading}
                  />

                  <button
                    onClick={submitQuizAnswer}
                    disabled={!quizAnswer.trim() || isQuizLoading}
                    className="w-full py-3 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isQuizLoading ? <Loader2 size={20} className="animate-spin" /> : 'Submit Answer'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STUDY GUIDE VIEW */}
          {mainView === 'studyGuide' && !currentSolution && (
            <div className="space-y-6">
              {!studyGuide ? (
                <>
                  <div className="text-center">
                    <GraduationCap size={48} className="text-purple-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Study Guide Generator</h2>
                    <p className="text-sm text-zinc-400">Create a comprehensive study guide for any topic</p>
                  </div>

                  <input
                    type="text"
                    value={studyGuideTopic}
                    onChange={(e) => setStudyGuideTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && generateStudyGuide()}
                    placeholder="Enter a topic (e.g., Quadratic equations, World War 2 causes)"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500 focus:outline-none"
                  />

                  <button
                    onClick={generateStudyGuide}
                    disabled={!studyGuideTopic.trim()}
                    className="w-full py-4 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText size={20} />
                    Generate Study Guide
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">{studyGuide.topic}</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={copyStudyGuide}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm"
                      >
                        {copiedGuide ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                        {copiedGuide ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => { setStudyGuide(null); setStudyGuideTopic(''); }}
                        className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm"
                      >
                        New Guide
                      </button>
                    </div>
                  </div>

                  <div className="bg-zinc-800/50 rounded-xl p-6 prose prose-invert prose-sm max-w-none">
                    {studyGuide.isLoading && (
                      <div className="flex items-center gap-2 text-zinc-400 mb-4">
                        <Loader2 size={16} className="animate-spin" />
                        Generating...
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-sm">{studyGuide.content}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HOME/SOLVE VIEW */}
          {mainView === 'home' && !currentSolution && !isLoading && (
            <>
              {/* Explanation Depth Toggle */}
              <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-3">
                <span className="text-sm text-zinc-400">Explanation Detail</span>
                <div className="flex bg-zinc-700 rounded-lg p-1">
                  <button
                    onClick={() => setExplanationDepth('brief')}
                    className={`px-3 py-1 rounded text-xs transition-colors ${explanationDepth === 'brief' ? 'bg-teal-500 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Brief
                  </button>
                  <button
                    onClick={() => setExplanationDepth('detailed')}
                    className={`px-3 py-1 rounded text-xs transition-colors ${explanationDepth === 'detailed' ? 'bg-teal-500 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Detailed
                  </button>
                </div>
              </div>

              {/* Subject Quick Filters */}
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubject(selectedSubject === s.id ? null : s.id)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                      selectedSubject === s.id ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                  >
                    {s.icon} {s.name}
                  </button>
                ))}
              </div>

              {/* Input Tabs */}
              <div className="flex bg-zinc-800/50 rounded-xl p-1">
                {(['camera', 'type', 'voice'] as InputTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${activeTab === tab ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    {tab === 'camera' && <Camera size={18} />}
                    {tab === 'type' && <Type size={18} />}
                    {tab === 'voice' && <Mic size={18} />}
                    <span className="capitalize">{tab}</span>
                  </button>
                ))}
              </div>

              {/* Camera Tab */}
              {activeTab === 'camera' && (
                <div className="space-y-4">
                  {cameraError && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center text-red-400">{cameraError}</div>}
                  {!capturedImage ? (
                    <div className="relative bg-zinc-900 rounded-xl overflow-hidden aspect-[4/3]">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <div className="absolute inset-4 border-2 border-white/30 rounded-lg pointer-events-none">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />
                      </div>
                      <div className="absolute bottom-4 left-0 right-0 text-center">
                        <span className="bg-black/60 px-4 py-2 rounded-full text-sm">Point at your homework</span>
                      </div>
                      {cameraActive && (
                        <button onClick={captureImage} className="absolute bottom-16 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-lg">
                          <div className="w-12 h-12 bg-teal-500 rounded-full" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative bg-zinc-900 rounded-xl overflow-hidden">
                        <img src={capturedImage} alt="Captured" className="w-full" />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={handleRetake} className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">Retake</button>
                        <button onClick={handleImageSolve} className="flex-1 px-4 py-3 rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-colors font-medium">Solve</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Type Tab */}
              {activeTab === 'type' && (
                <div className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={selectedSubject ? `Type your ${selectedSubject} problem...` : 'Type or paste your homework question...'}
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none resize-none"
                    />
                    <span className="absolute bottom-3 right-3 text-xs text-zinc-500">{textInput.length} chars</span>
                  </div>
                  <button onClick={handleTextSolve} disabled={!textInput.trim()} className="w-full px-4 py-3 rounded-xl bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">Solve</button>
                </div>
              )}

              {/* Voice Tab */}
              {activeTab === 'voice' && (
                <div className="bg-zinc-800/50 rounded-xl p-8 flex flex-col items-center justify-center">
                  {isRecording ? (
                    <>
                      <div className="relative mb-6">
                        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                          <div className="w-16 h-16 rounded-full bg-red-500/40 flex items-center justify-center">
                            <Mic size={32} className="text-red-400" />
                          </div>
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                      </div>
                      <p className="text-lg font-medium text-red-400 mb-2">Recording...</p>
                      <p className="text-3xl font-mono text-white mb-6">{formatDuration(recordingDuration)}</p>
                      <button onClick={stopRecording} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-medium">
                        <StopCircle size={20} /> Stop Recording
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 rounded-full bg-teal-500/20 flex items-center justify-center mb-6">
                        <Mic size={32} className="text-teal-400" />
                      </div>
                      <p className="text-lg font-medium mb-2">Speak Your Problem</p>
                      <p className="text-sm text-zinc-400 mb-6 text-center">Tap the button below and read your homework question aloud</p>
                      <button onClick={startRecording} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-colors font-medium">
                        <Mic size={20} /> Start Recording
                      </button>
                    </>
                  )}
                  {transcribedText && (
                    <div className="mt-6 w-full bg-zinc-700/30 rounded-lg p-4">
                      <p className="text-xs text-zinc-400 mb-1">Transcribed:</p>
                      <p className="text-sm">{transcribedText}</p>
                    </div>
                  )}
                </div>
              )}

              {/* History */}
              {history.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-zinc-400">{showBookmarkedOnly ? 'Bookmarked' : 'Recent Problems'}</h3>
                    <div className="flex items-center gap-3">
                      {/* Subject filter for history */}
                      <select
                        value={historySubjectFilter || ''}
                        onChange={(e) => setHistorySubjectFilter(e.target.value as Subject || null)}
                        className="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-400"
                      >
                        <option value="">All Subjects</option>
                        {SUBJECTS.map(s => <option key={s.id} value={s.id!}>{s.name}</option>)}
                      </select>
                      <button onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)} className={`text-xs flex items-center gap-1 transition-colors ${showBookmarkedOnly ? 'text-yellow-400' : 'text-zinc-500 hover:text-yellow-400'}`}>
                        <Star size={12} fill={showBookmarkedOnly ? 'currentColor' : 'none'} />
                        {showBookmarkedOnly ? 'Show All' : 'Bookmarked'}
                      </button>
                      <button onClick={() => saveHistory([])} className="text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1">
                        <Trash2 size={12} /> Clear
                      </button>
                    </div>
                  </div>
                  {filteredHistory.length > 0 ? (
                    <div className="space-y-2">
                      {filteredHistory.slice(0, 8).map((item) => (
                        <button key={item.id} onClick={() => { setCurrentSolution(item); setPracticeProblem(null); }} className="w-full text-left p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors">
                          <div className="flex items-start gap-3">
                            {item.imageData && <img src={item.imageData} alt="" className="w-12 h-12 object-cover rounded" />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm truncate">{item.problem}</p>
                                <div className="flex items-center gap-1">
                                  {item.subject && <span className="text-xs">{SUBJECTS.find(s => s.id === item.subject)?.icon}</span>}
                                  {item.bookmarked && <Star size={14} className="text-yellow-400" fill="currentColor" />}
                                </div>
                              </div>
                              <p className="text-xs text-teal-400 mt-1">Answer: {item.answer.substring(0, 50)}...</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-500 text-sm">No matching problems</div>
                  )}
                </div>
              )}
            </>
          )}

          {/* SOLUTION VIEW */}
          {currentSolution && !isLoading && (
            <div className="space-y-4">
              {/* Back to input */}
              <button onClick={handleNewProblem} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                <ArrowLeft size={16} /> New Problem
              </button>

              {/* Problem */}
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-zinc-400">Problem</h3>
                    {currentSolution.subject && <span className="text-sm">{SUBJECTS.find(s => s.id === currentSolution.subject)?.icon}</span>}
                  </div>
                  <button onClick={() => toggleBookmark(currentSolution.id)} className={`p-1 rounded transition-colors ${currentSolution.bookmarked ? 'text-yellow-400 hover:text-yellow-300' : 'text-zinc-500 hover:text-yellow-400'}`}>
                    <Star size={18} fill={currentSolution.bookmarked ? 'currentColor' : 'none'} />
                  </button>
                </div>
                {currentSolution.imageData && <img src={currentSolution.imageData} alt="Problem" className="w-32 h-24 object-cover rounded-lg mb-2" />}
                <p className="text-sm">{currentSolution.problem}</p>
              </div>

              {/* Answer */}
              <div className="bg-teal-500/10 border-2 border-teal-500/50 rounded-xl p-6 shadow-lg shadow-teal-500/10">
                <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-2">Answer</h3>
                <p className="text-2xl font-bold text-white">{currentSolution.answer}</p>
              </div>

              {/* Steps */}
              <div className="bg-zinc-800/50 rounded-xl overflow-hidden">
                <button onClick={() => setShowSteps(!showSteps)} className="w-full flex items-center justify-between p-4 hover:bg-zinc-700/30 transition-colors">
                  <span className="font-medium">Show Steps ({currentSolution.steps.length})</span>
                  {showSteps ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {showSteps && (
                  <div className="p-4 pt-0 space-y-3">
                    {currentSolution.steps.map((step, idx) => (
                      <div key={idx} className="bg-zinc-700/30 rounded-lg p-3">
                        <span className="text-teal-400 font-bold mr-2">{idx + 1}.</span>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Follow-ups */}
              {currentSolution.followUps && currentSolution.followUps.length > 0 && (
                <div className="bg-zinc-800/50 rounded-xl p-4 space-y-4">
                  <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2"><MessageSquare size={16} /> Follow-up Questions</h3>
                  <div className="space-y-3">
                    {currentSolution.followUps.map((fu, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="bg-blue-500/10 rounded-lg p-3 ml-4"><p className="text-sm text-blue-300">Q: {fu.question}</p></div>
                        <div className="bg-zinc-700/30 rounded-lg p-3"><p className="text-sm whitespace-pre-wrap">{fu.answer}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Input */}
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <div className="flex gap-2">
                  <input type="text" value={followUpInput} onChange={(e) => setFollowUpInput(e.target.value)} placeholder="Ask a follow-up question..." className="flex-1 px-4 py-3 rounded-lg bg-zinc-700/50 border border-zinc-600 text-white placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none" onKeyDown={(e) => e.key === 'Enter' && !isFollowUpLoading && handleFollowUp()} disabled={isFollowUpLoading} />
                  <button onClick={handleFollowUp} disabled={!followUpInput.trim() || isFollowUpLoading} className="px-4 py-2 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 disabled:opacity-50 transition-colors">
                    {isFollowUpLoading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
                  </button>
                </div>
              </div>

              {/* Practice Problem */}
              {practiceProblem ? (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 text-purple-400"><BookOpen size={18} /><h3 className="font-medium">Practice Problem</h3></div>
                  <p className="text-sm">{practiceProblem.problem}</p>
                  {practiceProblem.showAnswer && practiceProblem.answer ? (
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-teal-400 mb-2">Solution</h4>
                      <p className="text-sm whitespace-pre-wrap">{practiceProblem.answer}</p>
                    </div>
                  ) : (
                    <button onClick={solvePracticeProblem} disabled={isPracticeLoading} className="w-full px-4 py-3 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                      {isPracticeLoading ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={18} /> Show Answer</>}
                    </button>
                  )}
                  <button onClick={() => setPracticeProblem(null)} className="text-xs text-zinc-500 hover:text-zinc-400">Dismiss</button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button onClick={generatePracticeProblem} disabled={isPracticeLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 disabled:opacity-50 transition-colors">
                    {isPracticeLoading ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={18} /> Similar Problem</>}
                  </button>
                  <button onClick={handleNewProblem} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors">
                    <RotateCcw size={18} /> New Problem
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
