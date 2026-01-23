// Keyword Extraction and Analysis Engine

import {
  ExtractedKeyword,
  KeywordCategory,
  KeywordMatch,
  MissingKeyword,
  ParsedJobDescription,
  ParsedResume,
  MasterProfile,
} from '../types';

// Common tech skills and their variations
export const SKILL_SYNONYMS: Record<string, string[]> = {
  'javascript': ['js', 'ecmascript', 'es6', 'es2015', 'es2020'],
  'typescript': ['ts'],
  'python': ['py', 'python3'],
  'react': ['reactjs', 'react.js'],
  'vue': ['vuejs', 'vue.js'],
  'angular': ['angularjs', 'angular.js'],
  'node': ['nodejs', 'node.js'],
  'kubernetes': ['k8s'],
  'postgresql': ['postgres', 'psql'],
  'mongodb': ['mongo'],
  'elasticsearch': ['elastic', 'es'],
  'amazon web services': ['aws'],
  'google cloud platform': ['gcp', 'google cloud'],
  'microsoft azure': ['azure'],
  'continuous integration': ['ci', 'ci/cd'],
  'continuous deployment': ['cd', 'ci/cd'],
  'machine learning': ['ml'],
  'artificial intelligence': ['ai'],
  'natural language processing': ['nlp'],
  'application programming interface': ['api', 'apis'],
  'graphql': ['gql'],
  'rest api': ['restful', 'rest'],
  'docker': ['containerization', 'containers'],
  'microservices': ['micro-services', 'micro services'],
  'agile': ['scrum', 'kanban'],
};

// Action verbs commonly used in resumes
const ACTION_VERBS = new Set([
  'achieved', 'administered', 'analyzed', 'architected', 'automated',
  'built', 'collaborated', 'configured', 'created', 'delivered',
  'deployed', 'designed', 'developed', 'drove', 'engineered',
  'enhanced', 'established', 'executed', 'expanded', 'facilitated',
  'generated', 'implemented', 'improved', 'increased', 'initiated',
  'integrated', 'launched', 'led', 'maintained', 'managed',
  'mentored', 'migrated', 'modernized', 'negotiated', 'optimized',
  'orchestrated', 'oversaw', 'partnered', 'pioneered', 'planned',
  'reduced', 'refactored', 'resolved', 'restructured', 'scaled',
  'spearheaded', 'streamlined', 'supervised', 'trained', 'transformed',
]);

// Common soft skills
const SOFT_SKILLS = new Set([
  'leadership', 'communication', 'teamwork', 'problem-solving', 'analytical',
  'collaboration', 'adaptability', 'creativity', 'critical thinking', 'decision-making',
  'time management', 'project management', 'strategic thinking', 'mentoring',
  'presentation', 'negotiation', 'conflict resolution', 'stakeholder management',
]);

// Experience level indicators
const EXPERIENCE_INDICATORS: Record<string, string[]> = {
  'entry': ['entry-level', 'junior', '0-2 years', '1-2 years', 'new grad', 'graduate'],
  'mid': ['mid-level', 'mid level', '3-5 years', '2-5 years', '3+ years'],
  'senior': ['senior', '5+ years', '5-7 years', '7+ years', 'experienced'],
  'lead': ['lead', 'principal', 'staff', '8+ years', '10+ years', 'team lead'],
  'executive': ['director', 'vp', 'head of', 'chief', 'c-level', 'executive'],
};

/**
 * Extract keywords from job description text
 */
export function extractJobKeywords(text: string): ExtractedKeyword[] {
  const keywords: ExtractedKeyword[] = [];
  const lowerText = text.toLowerCase();
  const words = text.split(/\s+/);

  // Extract hard skills (programming languages, frameworks, tools)
  const hardSkillPatterns = [
    /\b(javascript|typescript|python|java|c\+\+|c#|go|rust|ruby|php|swift|kotlin)\b/gi,
    /\b(react|vue|angular|next\.?js|node\.?js|express|django|flask|spring|rails)\b/gi,
    /\b(aws|gcp|azure|docker|kubernetes|terraform|ansible|jenkins|github actions)\b/gi,
    /\b(postgresql|mysql|mongodb|redis|elasticsearch|dynamodb|cassandra)\b/gi,
    /\b(graphql|rest|grpc|websocket|kafka|rabbitmq)\b/gi,
    /\b(git|jira|confluence|figma|sketch|adobe)\b/gi,
  ];

  hardSkillPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const term = match[0];
      const existing = keywords.find(k => k.term.toLowerCase() === term.toLowerCase());
      if (existing) {
        existing.frequency++;
      } else {
        keywords.push({
          term,
          category: 'hard_skill',
          frequency: 1,
          importance: determineImportance(lowerText, term.toLowerCase()),
          context: extractContext(text, match.index),
        });
      }
    }
  });

  // Extract tools
  const toolPatterns = [
    /\b(vs code|visual studio|intellij|pycharm|vim|emacs)\b/gi,
    /\b(postman|insomnia|swagger|openapi)\b/gi,
    /\b(datadog|splunk|new relic|grafana|prometheus)\b/gi,
    /\b(slack|teams|zoom|notion|linear)\b/gi,
  ];

  toolPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const term = match[0];
      if (!keywords.find(k => k.term.toLowerCase() === term.toLowerCase())) {
        keywords.push({
          term,
          category: 'tool',
          frequency: 1,
          importance: 'nice-to-have',
          context: extractContext(text, match.index),
        });
      }
    }
  });

  // Extract soft skills
  SOFT_SKILLS.forEach(skill => {
    if (lowerText.includes(skill)) {
      keywords.push({
        term: skill,
        category: 'soft_skill',
        frequency: countOccurrences(lowerText, skill),
        importance: 'important',
        context: extractContext(text, lowerText.indexOf(skill)),
      });
    }
  });

  // Extract certifications
  const certPatterns = [
    /\b(aws certified|google certified|azure certified|pmp|scrum master|cissp|cka|ckad)\b/gi,
    /\b(certified [\w\s]+ (professional|associate|expert))\b/gi,
  ];

  certPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      keywords.push({
        term: match[0],
        category: 'certification',
        frequency: 1,
        importance: 'important',
        context: extractContext(text, match.index),
      });
    }
  });

  // Extract experience level requirements
  const expPattern = /(\d+)\+?\s*(?:-\s*\d+)?\s*years?\s*(?:of\s+)?(?:experience|exp)?/gi;
  let expMatch;
  while ((expMatch = expPattern.exec(text)) !== null) {
    keywords.push({
      term: expMatch[0],
      category: 'experience_level',
      frequency: 1,
      importance: 'critical',
      context: extractContext(text, expMatch.index),
    });
  }

  return keywords;
}

/**
 * Extract keywords from resume text
 */
export function extractResumeKeywords(text: string): ExtractedKeyword[] {
  const keywords: ExtractedKeyword[] = [];
  const lowerText = text.toLowerCase();

  // Use same patterns as JD extraction
  const allPatterns = [
    /\b(javascript|typescript|python|java|c\+\+|c#|go|rust|ruby|php|swift|kotlin)\b/gi,
    /\b(react|vue|angular|next\.?js|node\.?js|express|django|flask|spring|rails)\b/gi,
    /\b(aws|gcp|azure|docker|kubernetes|terraform|ansible|jenkins)\b/gi,
    /\b(postgresql|mysql|mongodb|redis|elasticsearch)\b/gi,
    /\b(graphql|rest|grpc|websocket|kafka|rabbitmq)\b/gi,
  ];

  allPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const term = match[0];
      const existing = keywords.find(k => k.term.toLowerCase() === term.toLowerCase());
      if (existing) {
        existing.frequency++;
      } else {
        keywords.push({
          term,
          category: 'hard_skill',
          frequency: 1,
          importance: 'important',
          context: extractContext(text, match.index),
        });
      }
    }
  });

  // Extract action verbs
  ACTION_VERBS.forEach(verb => {
    const regex = new RegExp(`\\b${verb}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      keywords.push({
        term: verb,
        category: 'action_verb',
        frequency: matches.length,
        importance: 'nice-to-have',
        context: '',
      });
    }
  });

  return keywords;
}

/**
 * Match resume keywords against job keywords
 */
export function matchKeywords(
  resumeKeywords: ExtractedKeyword[],
  jobKeywords: ExtractedKeyword[]
): KeywordMatch[] {
  const matches: KeywordMatch[] = [];

  for (const jk of jobKeywords) {
    const jkLower = jk.term.toLowerCase();

    // Look for exact match
    const exactMatch = resumeKeywords.find(
      rk => rk.term.toLowerCase() === jkLower
    );
    if (exactMatch) {
      matches.push({
        jobKeyword: jk.term,
        resumeKeyword: exactMatch.term,
        matchType: 'exact',
        strength: 1.0,
      });
      continue;
    }

    // Look for synonym match
    const synonyms = SKILL_SYNONYMS[jkLower] || [];
    const synonymMatch = resumeKeywords.find(rk =>
      synonyms.includes(rk.term.toLowerCase()) ||
      synonyms.some(s => s === rk.term.toLowerCase())
    );
    if (synonymMatch) {
      matches.push({
        jobKeyword: jk.term,
        resumeKeyword: synonymMatch.term,
        matchType: 'synonym',
        strength: 0.9,
      });
      continue;
    }

    // Look for partial match
    const partialMatch = resumeKeywords.find(rk =>
      rk.term.toLowerCase().includes(jkLower) ||
      jkLower.includes(rk.term.toLowerCase())
    );
    if (partialMatch) {
      matches.push({
        jobKeyword: jk.term,
        resumeKeyword: partialMatch.term,
        matchType: 'partial',
        strength: 0.5,
      });
    }
  }

  return matches;
}

/**
 * Find missing keywords (in JD but not in resume)
 */
export function findMissingKeywords(
  jobKeywords: ExtractedKeyword[],
  matches: KeywordMatch[]
): MissingKeyword[] {
  const matchedJobKeywords = new Set(matches.map(m => m.jobKeyword.toLowerCase()));

  return jobKeywords
    .filter(jk => !matchedJobKeywords.has(jk.term.toLowerCase()))
    .map(keyword => ({
      keyword,
      suggestedAddition: generateSuggestion(keyword),
      insertionPoints: ['Skills section', 'Relevant experience bullet'],
      priority: keyword.importance === 'critical' ? 1 : keyword.importance === 'important' ? 2 : 3,
    }))
    .sort((a, b) => a.priority - b.priority);
}

// Helper functions

function determineImportance(text: string, keyword: string): 'critical' | 'important' | 'nice-to-have' {
  const lowerText = text.toLowerCase();
  const keywordPos = lowerText.indexOf(keyword);

  // Check if it's in requirements section
  const reqIndicators = ['required', 'must have', 'essential', 'minimum'];
  const niceIndicators = ['preferred', 'nice to have', 'bonus', 'plus'];

  // Look at surrounding context
  const contextStart = Math.max(0, keywordPos - 100);
  const contextEnd = Math.min(text.length, keywordPos + 100);
  const context = lowerText.slice(contextStart, contextEnd);

  if (reqIndicators.some(ind => context.includes(ind))) {
    return 'critical';
  }
  if (niceIndicators.some(ind => context.includes(ind))) {
    return 'nice-to-have';
  }

  return 'important';
}

function extractContext(text: string, position: number, contextLength: number = 50): string {
  const start = Math.max(0, position - contextLength);
  const end = Math.min(text.length, position + contextLength);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

function countOccurrences(text: string, keyword: string): number {
  const regex = new RegExp(keyword, 'gi');
  return (text.match(regex) || []).length;
}

function generateSuggestion(keyword: ExtractedKeyword): string {
  switch (keyword.category) {
    case 'hard_skill':
      return `Add "${keyword.term}" to your skills section`;
    case 'tool':
      return `Mention experience with ${keyword.term} in relevant bullets`;
    case 'soft_skill':
      return `Demonstrate ${keyword.term} through achievement examples`;
    case 'certification':
      return `Add ${keyword.term} to certifications section if you have it`;
    default:
      return `Consider adding "${keyword.term}" where relevant`;
  }
}

/**
 * Get canonical form of a skill (resolve synonyms)
 */
export function getCanonicalSkill(skill: string): string {
  const lower = skill.toLowerCase();

  // Check if this is a synonym
  for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    if (synonyms.includes(lower) || lower === canonical) {
      return canonical.charAt(0).toUpperCase() + canonical.slice(1);
    }
  }

  return skill;
}

/**
 * Detect seniority level from text
 */
export function detectSeniorityLevel(text: string): 'entry' | 'mid' | 'senior' | 'lead' | 'executive' {
  const lowerText = text.toLowerCase();

  for (const [level, indicators] of Object.entries(EXPERIENCE_INDICATORS)) {
    if (indicators.some(ind => lowerText.includes(ind))) {
      return level as 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
    }
  }

  // Default based on years mentioned
  const yearsMatch = lowerText.match(/(\d+)\+?\s*(?:years?|yrs?)/);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1]);
    if (years <= 2) return 'entry';
    if (years <= 5) return 'mid';
    if (years <= 8) return 'senior';
    return 'lead';
  }

  return 'mid'; // Default
}
