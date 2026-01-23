// ATS Scoring Algorithm

import {
  ATSAnalysis,
  ParsedResume,
  ParsedJobDescription,
  ExtractedKeyword,
  KeywordMatch,
  MissingKeyword,
  Requirement,
  FormatIssue,
  Recommendation,
  MasterProfile,
  SelectionDecision,
} from '../types';
import {
  extractJobKeywords,
  extractResumeKeywords,
  matchKeywords,
  findMissingKeywords,
  detectSeniorityLevel,
} from './keywords';

/**
 * Calculate overall ATS score for Optimize mode
 */
export function calculateATSScore(
  resume: ParsedResume,
  jd: ParsedJobDescription,
  resumeKeywords: ExtractedKeyword[],
  jobKeywords: ExtractedKeyword[],
  matches: KeywordMatch[]
): { overall: number; keyword: number; format: number; structure: number; quantification: number } {
  // Keyword score (40% weight)
  const keywordScore = calculateKeywordScore(jobKeywords, matches);

  // Format score (20% weight)
  const formatScore = calculateFormatScore(resume);

  // Structure score (20% weight)
  const structureScore = calculateStructureScore(resume);

  // Quantification score (20% weight)
  const quantificationScore = calculateQuantificationScore(resume);

  // Weighted overall
  const overall = Math.round(
    keywordScore * 0.4 +
    formatScore * 0.2 +
    structureScore * 0.2 +
    quantificationScore * 0.2
  );

  return {
    overall,
    keyword: keywordScore,
    format: formatScore,
    structure: structureScore,
    quantification: quantificationScore,
  };
}

/**
 * Calculate keyword match score
 */
function calculateKeywordScore(
  jobKeywords: ExtractedKeyword[],
  matches: KeywordMatch[]
): number {
  if (jobKeywords.length === 0) return 100;

  // Weight by importance
  let totalWeight = 0;
  let matchedWeight = 0;

  for (const jk of jobKeywords) {
    const weight = jk.importance === 'critical' ? 3 : jk.importance === 'important' ? 2 : 1;
    totalWeight += weight;

    const match = matches.find(m => m.jobKeyword.toLowerCase() === jk.term.toLowerCase());
    if (match) {
      matchedWeight += weight * match.strength;
    }
  }

  return Math.round((matchedWeight / totalWeight) * 100);
}

/**
 * Calculate format compliance score
 */
function calculateFormatScore(resume: ParsedResume): number {
  let score = 100;
  const deductions: { reason: string; points: number }[] = [];

  // Check for format issues
  const criticalIssues = resume.sections
    .flatMap(s => s.issues)
    .filter(i => i.severity === 'critical').length;
  const warningIssues = resume.sections
    .flatMap(s => s.issues)
    .filter(i => i.severity === 'warning').length;

  // Critical issues: -15 each
  score -= criticalIssues * 15;

  // Warning issues: -5 each
  score -= warningIssues * 5;

  // Check for common ATS problems
  const rawLower = resume.raw.toLowerCase();

  // Tables detected
  if (rawLower.includes('|') && (rawLower.match(/\|/g) || []).length > 5) {
    score -= 10;
  }

  // Check section headers
  const standardHeaders = ['experience', 'education', 'skills', 'summary', 'certifications'];
  const foundHeaders = resume.sections.filter(s =>
    standardHeaders.some(h => s.title.toLowerCase().includes(h))
  ).length;
  if (foundHeaders < 3) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate structure score
 */
function calculateStructureScore(resume: ParsedResume): number {
  let score = 100;

  // Check required sections
  const hasContact = resume.contact.name && resume.contact.email;
  const hasExperience = resume.experience.length > 0;
  const hasEducation = resume.education.length > 0;
  const hasSkills = resume.skills.length > 0;

  if (!hasContact) score -= 20;
  if (!hasExperience) score -= 30;
  if (!hasEducation) score -= 15;
  if (!hasSkills) score -= 15;

  // Check bullet count per job
  const avgBullets = resume.experience.length > 0
    ? resume.experience.reduce((sum, exp) => sum + exp.bullets.length, 0) / resume.experience.length
    : 0;

  if (avgBullets < 2) score -= 15;
  else if (avgBullets < 3) score -= 5;
  else if (avgBullets > 8) score -= 10; // Too many bullets

  // Check section order (contact should be first, experience before education)
  const sectionOrder = resume.sections.map(s => s.type);
  if (sectionOrder.indexOf('contact') !== 0) score -= 5;
  if (sectionOrder.indexOf('experience') > sectionOrder.indexOf('education')) {
    // Education before experience is usually suboptimal for experienced candidates
    if (resume.experience.length > 1) score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate quantification score
 */
function calculateQuantificationScore(resume: ParsedResume): number {
  const totalBullets = resume.bulletCount;
  if (totalBullets === 0) return 0;

  const quantifiedPercentage = (resume.quantifiedStatements / totalBullets) * 100;

  // Ideal: 60%+ bullets have metrics
  if (quantifiedPercentage >= 60) return 100;
  if (quantifiedPercentage >= 40) return 80;
  if (quantifiedPercentage >= 25) return 60;
  if (quantifiedPercentage >= 10) return 40;
  return 20;
}

/**
 * Analyze hard requirements
 */
export function analyzeRequirements(
  jd: ParsedJobDescription,
  resume: ParsedResume
): { hard: Requirement[]; soft: Requirement[] } {
  const hard: Requirement[] = [];
  const soft: Requirement[] = [];

  // Check experience requirements
  if (jd.experienceRange) {
    const years = estimateYearsExperience(resume);
    const isMet = years >= jd.experienceRange.min;

    hard.push({
      text: `${jd.experienceRange.min}+ years of experience`,
      type: 'years_experience',
      isMet,
      evidence: isMet ? `Resume shows approximately ${years} years of experience` : undefined,
      gap: !isMet ? `Need ${jd.experienceRange.min - years} more years` : undefined,
    });
  }

  // Check education requirements
  for (const eduReq of jd.educationRequirements) {
    const hasDegree = resume.education.some(edu => {
      const degreeLower = edu.degree.toLowerCase();
      if (eduReq.level === 'bachelor') {
        return degreeLower.includes('bachelor') || degreeLower.includes('b.s.') || degreeLower.includes('b.a.');
      }
      if (eduReq.level === 'master') {
        return degreeLower.includes('master') || degreeLower.includes('m.s.') || degreeLower.includes('m.a.');
      }
      return true;
    });

    const req: Requirement = {
      text: `${eduReq.level.charAt(0).toUpperCase() + eduReq.level.slice(1)}'s degree${eduReq.field ? ` in ${eduReq.field}` : ''}`,
      type: 'education',
      isMet: hasDegree,
      evidence: hasDegree ? 'Degree found in education section' : undefined,
      gap: !hasDegree ? 'No matching degree found' : undefined,
    };

    if (eduReq.required) {
      hard.push(req);
    } else {
      soft.push(req);
    }
  }

  return { hard, soft };
}

/**
 * Estimate years of experience from resume
 */
function estimateYearsExperience(resume: ParsedResume): number {
  let totalMonths = 0;

  for (const exp of resume.experience) {
    const start = new Date(exp.startDate);
    const end = exp.endDate ? new Date(exp.endDate) : new Date();
    const months = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
    totalMonths += months;
  }

  return Math.round(totalMonths / 12);
}

/**
 * Generate recommendations based on analysis
 */
export function generateRecommendations(
  scores: { overall: number; keyword: number; format: number; structure: number; quantification: number },
  missingKeywords: MissingKeyword[],
  formatIssues: FormatIssue[],
  requirements: { hard: Requirement[]; soft: Requirement[] }
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  let priority = 1;

  // High priority: Critical missing keywords
  const criticalMissing = missingKeywords.filter(mk => mk.keyword.importance === 'critical');
  for (const missing of criticalMissing.slice(0, 3)) {
    recommendations.push({
      category: 'keyword',
      priority: priority++,
      title: `Add "${missing.keyword.term}"`,
      description: missing.suggestedAddition,
      impact: 'high',
    });
  }

  // High priority: Unmet hard requirements
  const unmetHard = requirements.hard.filter(r => !r.isMet);
  for (const req of unmetHard) {
    recommendations.push({
      category: 'content',
      priority: priority++,
      title: `Address: ${req.text}`,
      description: req.gap || 'This requirement is not clearly demonstrated',
      impact: 'high',
    });
  }

  // Medium priority: Format issues
  const criticalFormat = formatIssues.filter(f => f.severity === 'critical');
  for (const issue of criticalFormat) {
    recommendations.push({
      category: 'format',
      priority: priority++,
      title: issue.description,
      description: issue.fix,
      impact: 'high',
    });
  }

  // Medium priority: Important missing keywords
  const importantMissing = missingKeywords.filter(mk => mk.keyword.importance === 'important');
  for (const missing of importantMissing.slice(0, 5)) {
    recommendations.push({
      category: 'keyword',
      priority: priority++,
      title: `Consider adding "${missing.keyword.term}"`,
      description: missing.suggestedAddition,
      impact: 'medium',
    });
  }

  // Low priority: Quantification
  if (scores.quantification < 60) {
    recommendations.push({
      category: 'quantification',
      priority: priority++,
      title: 'Add more metrics',
      description: 'Only ' + Math.round(scores.quantification) + '% of your bullets have quantified results. Aim for 60%+.',
      impact: 'medium',
    });
  }

  // Low priority: Structure improvements
  if (scores.structure < 80) {
    recommendations.push({
      category: 'structure',
      priority: priority++,
      title: 'Improve resume structure',
      description: 'Consider reorganizing sections for better ATS parsing',
      impact: 'low',
    });
  }

  return recommendations.slice(0, 10); // Limit to top 10
}

/**
 * Full analysis for Optimize mode
 */
export function analyzeResume(
  resume: ParsedResume,
  jd: ParsedJobDescription
): ATSAnalysis {
  const startTime = Date.now();

  // Extract keywords
  const resumeKeywords = extractResumeKeywords(resume.raw);
  const jobKeywords = Array.from(jd.keywords.values()).flat();

  // Match keywords
  const matches = matchKeywords(resumeKeywords, jobKeywords);
  const missingKeywords = findMissingKeywords(jobKeywords, matches);

  // Calculate scores
  const scores = calculateATSScore(resume, jd, resumeKeywords, jobKeywords, matches);

  // Analyze requirements
  const requirements = analyzeRequirements(jd, resume);

  // Collect format issues
  const formatIssues = resume.sections.flatMap(s => s.issues);

  // Generate recommendations
  const recommendations = generateRecommendations(
    scores,
    missingKeywords,
    formatIssues,
    requirements
  );

  return {
    mode: 'optimize',
    overallScore: scores.overall,
    keywordScore: scores.keyword,
    formatScore: scores.format,
    structureScore: scores.structure,
    quantificationScore: scores.quantification,
    resumeKeywords,
    jobKeywords,
    matchedKeywords: matches,
    missingKeywords,
    hardRequirements: requirements.hard,
    softRequirements: requirements.soft,
    formatIssues,
    recommendations,
    analyzedAt: Date.now(),
    processingTime: Date.now() - startTime,
  };
}

/**
 * Calculate profile match score for Generate mode
 */
export function calculateProfileMatchScore(
  profile: MasterProfile,
  jd: ParsedJobDescription
): number {
  let score = 0;
  let maxScore = 0;

  // Skill match (40 points)
  maxScore += 40;
  const jdSkills = Array.from(jd.keywords.get('hard_skill') || []).map(k => k.term.toLowerCase());
  const profileSkills = profile.skills.map(s => s.name.toLowerCase());
  const skillMatches = jdSkills.filter(s => profileSkills.some(ps => ps.includes(s) || s.includes(ps)));
  score += Math.min(40, (skillMatches.length / Math.max(1, jdSkills.length)) * 40);

  // Experience relevance (30 points)
  maxScore += 30;
  const expYears = profile.metadata.totalYearsExperience;
  const reqYears = jd.experienceRange?.min || 0;
  if (expYears >= reqYears) {
    score += 30;
  } else if (expYears >= reqYears - 2) {
    score += 20;
  } else {
    score += 10;
  }

  // Seniority match (15 points)
  maxScore += 15;
  if (profile.metadata.seniorityLevel === jd.roleSignals.seniorityLevel) {
    score += 15;
  } else {
    // Close match
    const levels = ['entry', 'mid', 'senior', 'lead', 'executive'];
    const diff = Math.abs(
      levels.indexOf(profile.metadata.seniorityLevel) -
      levels.indexOf(jd.roleSignals.seniorityLevel)
    );
    score += Math.max(0, 15 - diff * 5);
  }

  // Industry match (15 points)
  maxScore += 15;
  if (jd.industry && profile.metadata.primaryIndustries.includes(jd.industry)) {
    score += 15;
  } else if (profile.metadata.primaryIndustries.length > 0) {
    score += 5;
  }

  return Math.round((score / maxScore) * 100);
}
