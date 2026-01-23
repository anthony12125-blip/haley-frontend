// Resume Generation from Selections

import {
  MasterProfile,
  ParsedJobDescription,
  ATSPreferences,
  GeneratedResume,
  GeneratedExperience,
  GeneratedSkillSection,
  GeneratedProject,
  MasterBullet,
  MasterSkill,
} from '../types';
import { SKILL_SYNONYMS } from './keywords';

/**
 * Generate resume from profile and selections
 */
export function generateResumeFromSelections(
  profile: MasterProfile,
  jd: ParsedJobDescription,
  selections: {
    experienceIds: string[];
    bulletOverrides: Record<string, string[]>;
    skillNames: string[];
    projectIds: string[];
    summaryVariantId?: string;
  },
  preferences: ATSPreferences
): GeneratedResume {
  // 1. Get selected summary or generate custom
  const summaryVariant = selections.summaryVariantId
    ? profile.summaries.find(s => s.id === selections.summaryVariantId)
    : profile.summaries[0];
  const summary = summaryVariant?.text || generateCustomSummary(profile, jd);

  // 2. Build experience section
  const experience: GeneratedExperience[] = [];
  const bulletsReframed: { original: string; reframed: string }[] = [];

  for (const expId of selections.experienceIds) {
    const sourceExp = profile.experience.find(e => e.id === expId);
    if (!sourceExp) continue;

    const selectedBulletIds = selections.bulletOverrides[expId] || [];
    const bullets = sourceExp.bullets
      .filter(b => selectedBulletIds.includes(b.id))
      .map(bullet => {
        // Check if we should reframe this bullet for better keyword match
        const reframed = reframeBullet(bullet, jd);
        if (reframed && reframed !== bullet.text) {
          bulletsReframed.push({ original: bullet.text, reframed });
        }
        return {
          sourceBulletId: bullet.id,
          text: reframed || bullet.text,
          wasReframed: !!reframed && reframed !== bullet.text,
        };
      });

    experience.push({
      sourceExperienceId: expId,
      company: sourceExp.company,
      title: sourceExp.title,
      location: sourceExp.location,
      startDate: sourceExp.startDate,
      endDate: sourceExp.endDate,
      bullets,
    });
  }

  // 3. Build skills section (grouped for ATS)
  const selectedSkillObjects = profile.skills.filter(s => selections.skillNames.includes(s.name));
  const skills = groupSkillsForATS(selectedSkillObjects, preferences.includeSoftSkills);

  // 4. Build projects section
  const projects: GeneratedProject[] = selections.projectIds.map(pid => {
    const source = profile.projects.find(p => p.id === pid)!;
    return {
      sourceProjectId: pid,
      name: source.name,
      description: tailorProjectDescription(source.description, jd),
      technologies: source.technologies,
      url: source.url,
    };
  });

  // 5. Find injected keywords
  const keywordsInjected = findInjectedKeywords(
    experience.flatMap(e => e.bullets.map(b => b.text)).join(' ') + ' ' + skills.technical.join(' '),
    jd
  );

  // 6. Generate raw text
  const rawText = assembleResumeText(
    profile.contact,
    summary,
    experience,
    skills,
    profile.education,
    profile.certifications,
    projects.length > 0 ? projects : undefined,
    preferences.resumeLength
  );

  return {
    sourceProfileId: profile.id,
    targetJobId: jd.title,
    generatedAt: Date.now(),
    contact: profile.contact,
    summary,
    experience,
    skills,
    education: profile.education,
    certifications: profile.certifications,
    projects: projects.length > 0 ? projects : undefined,
    selections: {
      experienceIds: selections.experienceIds,
      bulletIds: Object.values(selections.bulletOverrides).flat(),
      skillNames: selections.skillNames,
      projectIds: selections.projectIds,
    },
    tailoring: {
      keywordsInjected,
      bulletsReframed,
      summaryCustomized: !selections.summaryVariantId,
    },
    rawText,
    saved: false,
  };
}

/**
 * Generate a custom summary based on profile and JD
 */
function generateCustomSummary(profile: MasterProfile, jd: ParsedJobDescription): string {
  const yearsExp = profile.metadata.totalYearsExperience;
  const topSkills = profile.metadata.primarySkills.slice(0, 3);
  const industries = profile.metadata.primaryIndustries.slice(0, 2);

  // Get JD keywords to include
  const jdKeywords = Array.from(jd.keywords.get('hard_skill') || [])
    .slice(0, 3)
    .map(k => k.term);

  // Build summary
  let summary = `${profile.metadata.seniorityLevel.charAt(0).toUpperCase() + profile.metadata.seniorityLevel.slice(1)} `;
  summary += `professional with ${yearsExp}+ years of experience `;

  if (industries.length > 0) {
    summary += `in ${industries.join(' and ')} `;
  }

  summary += `specializing in ${topSkills.join(', ')}. `;

  if (jdKeywords.length > 0) {
    summary += `Proven expertise in ${jdKeywords.join(', ')} `;
  }

  summary += `with a track record of delivering results.`;

  return summary;
}

/**
 * Reframe bullet to better match JD keywords
 */
function reframeBullet(bullet: MasterBullet, jd: ParsedJobDescription): string | null {
  let reframed = bullet.text;
  let wasChanged = false;

  const jdTerms = Array.from(jd.keywords.values()).flat().map(k => k.term);

  for (const jdTerm of jdTerms) {
    const jdTermLower = jdTerm.toLowerCase();

    // Check if bullet uses a synonym that should be replaced
    const synonyms = SKILL_SYNONYMS[jdTermLower] || [];

    // Also check reverse - bullet might use canonical and JD uses abbreviation
    let termsToReplace: string[] = [];
    for (const [canonical, syns] of Object.entries(SKILL_SYNONYMS)) {
      if (syns.includes(jdTermLower) || canonical === jdTermLower) {
        termsToReplace = [...termsToReplace, canonical, ...syns];
      }
    }

    for (const synonym of [...synonyms, ...termsToReplace]) {
      const synonymLower = synonym.toLowerCase();
      if (synonymLower === jdTermLower) continue; // Don't replace with itself

      // Check if bullet contains this synonym (case insensitive)
      const regex = new RegExp(`\\b${escapeRegExp(synonym)}\\b`, 'gi');
      if (regex.test(reframed) && !reframed.toLowerCase().includes(jdTermLower)) {
        // Replace synonym with exact JD term
        reframed = reframed.replace(regex, jdTerm);
        wasChanged = true;
      }
    }
  }

  // Use variant if available and appropriate
  if (!wasChanged && bullet.variants) {
    if (jd.roleSignals.isLeadership && bullet.variants.leadership) {
      return bullet.variants.leadership;
    }
    if (jd.roleSignals.isIC && bullet.variants.technical) {
      return bullet.variants.technical;
    }
  }

  return wasChanged ? reframed : null;
}

/**
 * Group skills for ATS-friendly output
 */
function groupSkillsForATS(skills: MasterSkill[], includeSoft: boolean): GeneratedSkillSection {
  const technical: string[] = [];
  const tools: string[] = [];
  const methodologies: string[] = [];
  const soft: string[] = [];

  for (const skill of skills) {
    switch (skill.category) {
      case 'programming_language':
      case 'framework':
      case 'database':
      case 'cloud':
      case 'devops':
        technical.push(skill.name);
        break;
      case 'tool':
        tools.push(skill.name);
        break;
      case 'methodology':
        methodologies.push(skill.name);
        break;
      case 'soft_skill':
        if (includeSoft) soft.push(skill.name);
        break;
      default:
        technical.push(skill.name);
    }
  }

  return {
    technical,
    tools,
    methodologies,
    soft: includeSoft && soft.length > 0 ? soft : undefined,
  };
}

/**
 * Tailor project description to JD
 */
function tailorProjectDescription(description: string, jd: ParsedJobDescription): string {
  // For now, return as-is. Could enhance to inject keywords.
  return description;
}

/**
 * Find keywords that were injected through reframing
 */
function findInjectedKeywords(text: string, jd: ParsedJobDescription): string[] {
  const textLower = text.toLowerCase();
  const jdKeywords = Array.from(jd.keywords.values()).flat().map(k => k.term);

  return jdKeywords.filter(kw => textLower.includes(kw.toLowerCase()));
}

/**
 * Assemble resume text from components
 */
function assembleResumeText(
  contact: { name: string; email: string; phone: string; location: string; linkedin?: string },
  summary: string,
  experience: GeneratedExperience[],
  skills: GeneratedSkillSection,
  education: { institution: string; degree: string; field: string; graduationYear: string }[],
  certifications: { name: string; issuer: string; date: string }[],
  projects: GeneratedProject[] | undefined,
  lengthPreference: '1-page' | '2-page' | 'auto'
): string {
  const lines: string[] = [];

  // Contact
  lines.push(contact.name.toUpperCase());
  lines.push([contact.email, contact.phone, contact.location, contact.linkedin].filter(Boolean).join(' | '));
  lines.push('');

  // Summary
  lines.push('PROFESSIONAL SUMMARY');
  lines.push(summary);
  lines.push('');

  // Experience
  lines.push('EXPERIENCE');
  for (const exp of experience) {
    lines.push(`${exp.title} | ${formatDateRange(exp.startDate, exp.endDate)}`);
    lines.push(`${exp.company}${exp.location ? ' | ' + exp.location : ''}`);
    for (const bullet of exp.bullets) {
      lines.push(`• ${bullet.text}`);
    }
    lines.push('');
  }

  // Skills
  lines.push('SKILLS');
  if (skills.technical.length > 0) {
    lines.push(`Technical: ${skills.technical.join(', ')}`);
  }
  if (skills.tools.length > 0) {
    lines.push(`Tools: ${skills.tools.join(', ')}`);
  }
  if (skills.methodologies.length > 0) {
    lines.push(`Methodologies: ${skills.methodologies.join(', ')}`);
  }
  if (skills.soft && skills.soft.length > 0) {
    lines.push(`Soft Skills: ${skills.soft.join(', ')}`);
  }
  lines.push('');

  // Education
  lines.push('EDUCATION');
  for (const edu of education) {
    lines.push(`${edu.degree} in ${edu.field} | ${edu.institution} | ${edu.graduationYear}`);
  }
  lines.push('');

  // Certifications
  if (certifications.length > 0) {
    lines.push('CERTIFICATIONS');
    for (const cert of certifications) {
      lines.push(`${cert.name} | ${cert.issuer} | ${cert.date}`);
    }
    lines.push('');
  }

  // Projects
  if (projects && projects.length > 0) {
    lines.push('PROJECTS');
    for (const project of projects) {
      lines.push(`${project.name}${project.url ? ' | ' + project.url : ''}`);
      lines.push(project.description);
      lines.push(`Technologies: ${project.technologies.join(', ')}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Format date range
 */
function formatDateRange(start: string, end?: string): string {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const startFormatted = formatDate(start);
  const endFormatted = end ? formatDate(end) : 'Present';

  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
