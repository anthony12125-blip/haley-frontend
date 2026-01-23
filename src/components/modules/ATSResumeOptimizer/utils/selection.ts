// Profile-to-JD Matching and Selection Algorithm

import {
  MasterProfile,
  MasterExperience,
  MasterBullet,
  MasterSkill,
  MasterProject,
  ParsedJobDescription,
  ATSAnalysis,
  ATSPreferences,
  SelectionDecision,
  ExtractedKeyword,
  KeywordCategory,
} from '../types';
import { extractJobKeywords, matchKeywords, findMissingKeywords, SKILL_SYNONYMS } from './keywords';
import { calculateProfileMatchScore } from './scoring';

export interface MatchResult {
  analysis: ATSAnalysis;
  selections: {
    experienceIds: string[];
    bulletOverrides: Record<string, string[]>;
    skillNames: string[];
    projectIds: string[];
    summaryVariantId?: string;
  };
}

interface Constraint {
  type: 'skill' | 'experience' | 'education' | 'certification' | 'keyword';
  value: string;
  importance: 'critical' | 'important' | 'nice-to-have';
  source: string;
}

/**
 * Match master profile to job description and select optimal content
 */
export function matchProfileToJob(
  profile: MasterProfile,
  jd: ParsedJobDescription,
  preferences: ATSPreferences
): MatchResult {
  const startTime = Date.now();

  // 1. Extract all JD requirements as constraints
  const constraints = extractConstraints(jd);

  // 2. Score each experience against constraints
  const experienceScores = profile.experience.map(exp => ({
    experience: exp,
    score: scoreExperience(exp, constraints, jd),
    matchedConstraints: findMatchedConstraints(exp, constraints),
  }));

  // 3. Select top experiences (respecting preferences.maxExperiences)
  const selectedExperiences = experienceScores
    .sort((a, b) => b.score - a.score)
    .slice(0, preferences.maxExperiences)
    .map(e => e.experience);

  // 4. For each selected experience, score and select bullets
  const bulletOverrides: Record<string, string[]> = {};
  const selectionDecisions: SelectionDecision[] = [];

  for (const exp of selectedExperiences) {
    const bulletScores = exp.bullets.map(bullet => ({
      bullet,
      score: scoreBullet(bullet, constraints, jd),
      matchedKeywords: findBulletMatchedKeywords(bullet, jd),
    }));

    // Select top bullets, prioritizing those with metrics
    const selectedBullets = bulletScores
      .sort((a, b) => {
        // Prioritize metrics
        if (a.bullet.hasMetrics && !b.bullet.hasMetrics) return -1;
        if (!a.bullet.hasMetrics && b.bullet.hasMetrics) return 1;
        return b.score - a.score;
      })
      .slice(0, preferences.maxBulletsPerJob)
      .map(b => b.bullet.id);

    bulletOverrides[exp.id] = selectedBullets;

    // Track selection decisions
    selectionDecisions.push({
      type: 'experience',
      itemId: exp.id,
      itemName: `${exp.title} at ${exp.company}`,
      included: true,
      reason: `Score: ${experienceScores.find(e => e.experience.id === exp.id)?.score.toFixed(0)}`,
      relevanceScore: experienceScores.find(e => e.experience.id === exp.id)?.score || 0 / 100,
      matchedRequirements: experienceScores.find(e => e.experience.id === exp.id)?.matchedConstraints || [],
    });

    for (const bullet of exp.bullets) {
      const bulletScore = bulletScores.find(b => b.bullet.id === bullet.id);
      selectionDecisions.push({
        type: 'bullet',
        itemId: bullet.id,
        itemName: bullet.text.slice(0, 50) + '...',
        included: selectedBullets.includes(bullet.id),
        reason: selectedBullets.includes(bullet.id)
          ? `Score: ${bulletScore?.score.toFixed(0)}, ${bullet.hasMetrics ? 'Has metrics' : 'No metrics'}`
          : 'Lower relevance score',
        relevanceScore: (bulletScore?.score || 0) / 100,
        matchedRequirements: bulletScore?.matchedKeywords || [],
      });
    }
  }

  // 5. Select skills that match JD keywords
  const jdSkills = Array.from(jd.keywords.get('hard_skill') || []).map(k => k.term.toLowerCase());
  const jdTools = Array.from(jd.keywords.get('tool') || []).map(k => k.term.toLowerCase());
  const allJdSkillKeywords = [...jdSkills, ...jdTools];

  const selectedSkills = profile.skills
    .filter(skill => {
      const skillLower = skill.name.toLowerCase();
      return allJdSkillKeywords.some(jk =>
        skillLower.includes(jk) ||
        jk.includes(skillLower) ||
        skill.aliases.some(a => a.toLowerCase() === jk)
      );
    })
    .map(s => s.name);

  // Add skills from selected bullets that aren't already included
  for (const exp of selectedExperiences) {
    const selectedBulletIds = bulletOverrides[exp.id] || [];
    for (const bullet of exp.bullets.filter(b => selectedBulletIds.includes(b.id))) {
      for (const skill of bullet.skills) {
        if (!selectedSkills.includes(skill)) {
          selectedSkills.push(skill);
        }
      }
    }
  }

  // Track skill selections
  for (const skill of profile.skills) {
    selectionDecisions.push({
      type: 'skill',
      itemId: skill.name,
      itemName: skill.name,
      included: selectedSkills.includes(skill.name),
      reason: selectedSkills.includes(skill.name)
        ? 'Matches JD keywords'
        : 'Not mentioned in JD',
      relevanceScore: selectedSkills.includes(skill.name) ? 0.8 : 0.2,
      matchedRequirements: [],
    });
  }

  // 6. Select projects if enabled
  const selectedProjects = preferences.includeProjects
    ? selectProjects(profile.projects, jd, constraints)
    : [];

  // 7. Select best summary variant
  const summaryVariantId = selectSummaryVariant(profile.summaries, jd);

  // 8. Build analysis
  const profileKeywords = extractProfileKeywords(profile);
  const jobKeywords = Array.from(jd.keywords.values()).flat();
  const matches = matchKeywords(profileKeywords, jobKeywords);
  const missingKeywords = findMissingKeywords(jobKeywords, matches);

  const analysis: ATSAnalysis = {
    mode: 'generate',
    overallScore: calculateProfileMatchScore(profile, jd),
    keywordScore: Math.round((matches.length / Math.max(1, jobKeywords.length)) * 100),
    formatScore: 100, // Generate mode always produces clean format
    structureScore: 100, // Generate mode always uses standard structure
    quantificationScore: calculateQuantificationScore(selectedExperiences, bulletOverrides),
    profileMatchScore: calculateProfileMatchScore(profile, jd),
    resumeKeywords: profileKeywords,
    jobKeywords,
    matchedKeywords: matches,
    missingKeywords,
    hardRequirements: jd.requirements.hard.map(r => ({
      ...r,
      isMet: checkRequirementMet(r.text, profile),
    })),
    softRequirements: jd.requirements.soft.map(r => ({
      ...r,
      isMet: checkRequirementMet(r.text, profile),
    })),
    formatIssues: [],
    selectionDecisions,
    recommendations: generateSelectionRecommendations(
      selectedExperiences,
      bulletOverrides,
      selectedSkills,
      missingKeywords
    ),
    analyzedAt: Date.now(),
    processingTime: Date.now() - startTime,
  };

  return {
    analysis,
    selections: {
      experienceIds: selectedExperiences.map(e => e.id),
      bulletOverrides,
      skillNames: selectedSkills,
      projectIds: selectedProjects.map(p => p.id),
      summaryVariantId,
    },
  };
}

/**
 * Extract constraints from job description
 */
function extractConstraints(jd: ParsedJobDescription): Constraint[] {
  const constraints: Constraint[] = [];

  // Hard requirements are critical constraints
  for (const req of jd.requirements.hard) {
    constraints.push({
      type: req.type === 'skill' ? 'skill' : req.type === 'years_experience' ? 'experience' : 'keyword',
      value: req.text,
      importance: 'critical',
      source: 'requirements',
    });
  }

  // Soft requirements are important constraints
  for (const req of jd.requirements.soft) {
    constraints.push({
      type: req.type === 'skill' ? 'skill' : 'keyword',
      value: req.text,
      importance: 'important',
      source: 'nice-to-have',
    });
  }

  // Keywords are constraints
  for (const [category, keywords] of jd.keywords) {
    for (const keyword of keywords) {
      constraints.push({
        type: 'keyword',
        value: keyword.term,
        importance: keyword.importance,
        source: keyword.context,
      });
    }
  }

  return constraints;
}

/**
 * Score an experience against constraints
 */
function scoreExperience(
  exp: MasterExperience,
  constraints: Constraint[],
  jd: ParsedJobDescription
): number {
  let score = 0;

  // Recency bonus (more recent = higher score)
  const yearsAgo = exp.endDate
    ? (Date.now() - new Date(exp.endDate).getTime()) / (365 * 24 * 60 * 60 * 1000)
    : 0; // Current role gets max bonus
  score += Math.max(0, 10 - yearsAgo);

  // Highlight bonus
  if (exp.highlights) score += 15;

  // Current role bonus
  if (exp.isCurrentRole) score += 10;

  // Industry match
  if (jd.industry && exp.industries.includes(jd.industry)) {
    score += 20;
  }

  // Skill overlap
  const expSkills = new Set(exp.skills.map(s => s.toLowerCase()));
  const jdSkills = Array.from(jd.keywords.get('hard_skill') || []).map(k => k.term.toLowerCase());
  const overlap = jdSkills.filter(s => expSkills.has(s)).length;
  score += overlap * 5;

  // Leadership match
  if (jd.roleSignals.isLeadership && exp.tags.includes('leadership')) {
    score += 15;
  }

  // Technical match for IC roles
  if (jd.roleSignals.isIC && exp.tags.includes('technical')) {
    score += 10;
  }

  // Constraint satisfaction
  for (const constraint of constraints) {
    if (constraintSatisfiedByExperience(constraint, exp)) {
      score += constraint.importance === 'critical' ? 10 : constraint.importance === 'important' ? 5 : 2;
    }
  }

  return score;
}

/**
 * Check if constraint is satisfied by experience
 */
function constraintSatisfiedByExperience(constraint: Constraint, exp: MasterExperience): boolean {
  const valueLower = constraint.value.toLowerCase();

  // Check in skills
  if (exp.skills.some(s => s.toLowerCase().includes(valueLower))) {
    return true;
  }

  // Check in tags
  if (exp.tags.some(t => t.toLowerCase().includes(valueLower))) {
    return true;
  }

  // Check in bullet text
  if (exp.bullets.some(b => b.text.toLowerCase().includes(valueLower))) {
    return true;
  }

  // Check in bullet keywords
  if (exp.bullets.some(b => b.keywords.some(k => k.toLowerCase().includes(valueLower)))) {
    return true;
  }

  return false;
}

/**
 * Find constraints matched by experience
 */
function findMatchedConstraints(exp: MasterExperience, constraints: Constraint[]): string[] {
  return constraints
    .filter(c => constraintSatisfiedByExperience(c, exp))
    .map(c => c.value);
}

/**
 * Score a bullet against constraints
 */
function scoreBullet(
  bullet: MasterBullet,
  constraints: Constraint[],
  jd: ParsedJobDescription
): number {
  let score = 0;

  // Metrics are gold
  if (bullet.hasMetrics) score += 20;

  // Category match
  if (jd.roleSignals.isLeadership && bullet.category === 'leadership') score += 10;
  if (jd.roleSignals.isIC && bullet.category === 'technical') score += 10;
  if (bullet.category === 'achievement') score += 5; // Achievements are always good

  // Keyword overlap
  const bulletKeywords = new Set(bullet.keywords.map(k => k.toLowerCase()));
  const jdKeywords = Array.from(jd.keywords.values())
    .flat()
    .map(k => k.term.toLowerCase());

  for (const jdKeyword of jdKeywords) {
    if (bulletKeywords.has(jdKeyword)) {
      score += 5;
    }
  }

  // Skill overlap
  const jdSkills = Array.from(jd.keywords.get('hard_skill') || []).map(k => k.term.toLowerCase());
  for (const skill of bullet.skills) {
    if (jdSkills.includes(skill.toLowerCase())) {
      score += 3;
    }
  }

  // Constraint satisfaction
  for (const constraint of constraints) {
    const valueLower = constraint.value.toLowerCase();
    if (
      bullet.text.toLowerCase().includes(valueLower) ||
      bullet.keywords.some(k => k.toLowerCase().includes(valueLower)) ||
      bullet.skills.some(s => s.toLowerCase().includes(valueLower))
    ) {
      score += constraint.importance === 'critical' ? 8 : constraint.importance === 'important' ? 4 : 2;
    }
  }

  return score;
}

/**
 * Find keywords matched by bullet
 */
function findBulletMatchedKeywords(bullet: MasterBullet, jd: ParsedJobDescription): string[] {
  const matched: string[] = [];
  const jdKeywords = Array.from(jd.keywords.values()).flat().map(k => k.term.toLowerCase());

  for (const jdKeyword of jdKeywords) {
    if (
      bullet.text.toLowerCase().includes(jdKeyword) ||
      bullet.keywords.some(k => k.toLowerCase() === jdKeyword) ||
      bullet.skills.some(s => s.toLowerCase() === jdKeyword)
    ) {
      matched.push(jdKeyword);
    }
  }

  return matched;
}

/**
 * Select best projects
 */
function selectProjects(
  projects: MasterProject[],
  jd: ParsedJobDescription,
  constraints: Constraint[]
): MasterProject[] {
  const jdKeywords = Array.from(jd.keywords.values()).flat().map(k => k.term.toLowerCase());

  const scored = projects.map(project => {
    let score = 0;

    // Tech overlap
    for (const tech of project.technologies) {
      if (jdKeywords.includes(tech.toLowerCase())) {
        score += 5;
      }
    }

    // Relevance tags
    if (jd.industry && project.relevantFor.includes(jd.industry)) {
      score += 10;
    }

    return { project, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .filter(s => s.score > 0)
    .slice(0, 3)
    .map(s => s.project);
}

/**
 * Select best summary variant
 */
function selectSummaryVariant(
  summaries: { id: string; name: string; targetRole: string; text: string }[],
  jd: ParsedJobDescription
): string | undefined {
  if (summaries.length === 0) return undefined;

  const titleLower = jd.title.toLowerCase();

  // Try to match by target role
  const roleMatch = summaries.find(s =>
    titleLower.includes(s.targetRole.toLowerCase()) ||
    s.targetRole.toLowerCase().includes(titleLower.split(' ')[0])
  );

  if (roleMatch) return roleMatch.id;

  // Try to match by keywords in summary
  const jdKeywords = Array.from(jd.keywords.values()).flat().map(k => k.term.toLowerCase());

  const scored = summaries.map(summary => {
    let score = 0;
    for (const keyword of jdKeywords) {
      if (summary.text.toLowerCase().includes(keyword)) {
        score++;
      }
    }
    return { summary, score };
  });

  const best = scored.sort((a, b) => b.score - a.score)[0];
  return best?.summary.id;
}

/**
 * Extract keywords from profile
 */
function extractProfileKeywords(profile: MasterProfile): ExtractedKeyword[] {
  const keywords: ExtractedKeyword[] = [];

  // Skills
  for (const skill of profile.skills) {
    keywords.push({
      term: skill.name,
      category: skill.category as unknown as KeywordCategory,
      frequency: 1,
      importance: 'important',
      context: '',
    });
  }

  // From experience bullets
  for (const exp of profile.experience) {
    for (const bullet of exp.bullets) {
      for (const kw of bullet.keywords) {
        if (!keywords.find(k => k.term.toLowerCase() === kw.toLowerCase())) {
          keywords.push({
            term: kw,
            category: 'hard_skill',
            frequency: 1,
            importance: 'important',
            context: bullet.text.slice(0, 50),
          });
        }
      }
    }
  }

  return keywords;
}

/**
 * Calculate quantification score for selected content
 */
function calculateQuantificationScore(
  experiences: MasterExperience[],
  bulletOverrides: Record<string, string[]>
): number {
  let totalBullets = 0;
  let quantifiedBullets = 0;

  for (const exp of experiences) {
    const selectedIds = bulletOverrides[exp.id] || [];
    for (const bullet of exp.bullets) {
      if (selectedIds.includes(bullet.id)) {
        totalBullets++;
        if (bullet.hasMetrics) {
          quantifiedBullets++;
        }
      }
    }
  }

  if (totalBullets === 0) return 0;
  return Math.round((quantifiedBullets / totalBullets) * 100);
}

/**
 * Check if a requirement is met by profile
 */
function checkRequirementMet(requirementText: string, profile: MasterProfile): boolean {
  const textLower = requirementText.toLowerCase();

  // Check years of experience
  const yearsMatch = textLower.match(/(\d+)\+?\s*years?/);
  if (yearsMatch) {
    const required = parseInt(yearsMatch[1]);
    return profile.metadata.totalYearsExperience >= required;
  }

  // Check skills
  for (const skill of profile.skills) {
    if (textLower.includes(skill.name.toLowerCase())) {
      return true;
    }
  }

  // Check certifications
  for (const cert of profile.certifications) {
    if (textLower.includes(cert.name.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Generate recommendations for selection
 */
function generateSelectionRecommendations(
  selectedExperiences: MasterExperience[],
  bulletOverrides: Record<string, string[]>,
  selectedSkills: string[],
  missingKeywords: { keyword: ExtractedKeyword }[]
): { category: string; priority: number; title: string; description: string; impact: 'high' | 'medium' | 'low' }[] {
  const recommendations: { category: string; priority: number; title: string; description: string; impact: 'high' | 'medium' | 'low' }[] = [];

  // Critical missing keywords
  const criticalMissing = missingKeywords.filter(mk => mk.keyword.importance === 'critical');
  if (criticalMissing.length > 0) {
    recommendations.push({
      category: 'selection',
      priority: 1,
      title: 'Missing critical keywords',
      description: `Consider adding experience with: ${criticalMissing.slice(0, 3).map(m => m.keyword.term).join(', ')}`,
      impact: 'high',
    });
  }

  // Check bullet count
  let totalBullets = 0;
  for (const exp of selectedExperiences) {
    totalBullets += (bulletOverrides[exp.id] || []).length;
  }
  if (totalBullets < 10) {
    recommendations.push({
      category: 'content',
      priority: 2,
      title: 'Add more bullet points',
      description: 'Consider selecting more achievements to demonstrate depth of experience',
      impact: 'medium',
    });
  }

  return recommendations;
}
