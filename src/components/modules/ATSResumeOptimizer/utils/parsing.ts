// Resume and Job Description Parsing

import {
  ParsedResume,
  ParsedJobDescription,
  ResumeSection,
  SectionType,
  Experience,
  ExperienceBullet,
  Education,
  Certification,
  ContactInfo,
  ExtractedMetric,
  FormatIssue,
  Requirement,
  EducationReq,
  KeywordCategory,
  ExtractedKeyword,
} from '../types';
import { extractJobKeywords, detectSeniorityLevel } from './keywords';

// Section header patterns
const SECTION_PATTERNS: Record<SectionType, RegExp[]> = {
  contact: [/^(contact|personal)\s*(information|info|details)?$/i],
  summary: [
    /^(professional\s+)?(summary|profile|objective|about(\s+me)?|overview)$/i,
    /^(career\s+)?(highlights?|snapshot)$/i,
  ],
  experience: [
    /^(work\s+)?(experience|history|employment)$/i,
    /^(professional|career)\s+(experience|background)$/i,
  ],
  education: [
    /^education(al)?\s*(background|history)?$/i,
    /^(academic|degrees?|qualifications?)$/i,
  ],
  skills: [
    /^(technical\s+)?skills?\s*(summary|profile)?$/i,
    /^(core\s+)?(competencies|expertise|proficiencies)$/i,
    /^technologies?$/i,
  ],
  certifications: [
    /^certifications?\s*(and\s+licenses?)?$/i,
    /^(professional\s+)?(credentials?|licenses?)$/i,
  ],
  projects: [
    /^(personal\s+|key\s+)?projects?$/i,
    /^(portfolio|work\s+samples?)$/i,
  ],
  awards: [/^awards?\s*(and\s+honors?)?$/i, /^honors?\s*(and\s+awards?)?$/i],
  publications: [/^publications?$/i, /^(research|papers?)$/i],
  volunteer: [/^volunteer(ing)?\s*(experience|work)?$/i, /^community\s+(service|involvement)$/i],
  unknown: [],
};

/**
 * Parse resume text into structured format
 */
export function parseResume(text: string, format: 'pdf' | 'docx' | 'txt'): ParsedResume {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const sections = identifySections(lines, text);
  const contact = extractContactInfo(text, sections);
  const experience = extractExperience(sections);
  const education = extractEducation(sections);
  const skills = extractSkills(sections);
  const certifications = extractCertifications(sections);

  // Count metrics
  const allBullets = experience.flatMap(e => e.bullets);
  const bulletCount = allBullets.length;
  const quantifiedStatements = allBullets.filter(b => b.hasMetrics).length;

  return {
    raw: text,
    format,
    sections,
    contact,
    experience,
    education,
    skills,
    certifications,
    wordCount: text.split(/\s+/).length,
    bulletCount,
    quantifiedStatements,
    parseConfidence: calculateParseConfidence(sections, contact, experience),
    parseWarnings: generateParseWarnings(sections, contact, experience),
  };
}

/**
 * Identify sections in resume
 */
function identifySections(lines: string[], fullText: string): ResumeSection[] {
  const sections: ResumeSection[] = [];
  let currentSection: Partial<ResumeSection> | null = null;
  let contentLines: string[] = [];
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sectionType = identifySectionHeader(line);

    if (sectionType !== 'unknown') {
      // Save previous section
      if (currentSection) {
        currentSection.content = contentLines.join('\n');
        currentSection.endLine = i - 1;
        currentSection.issues = detectFormatIssues(currentSection.content!, currentSection.type as SectionType);
        sections.push(currentSection as ResumeSection);
      }

      // Start new section
      currentSection = {
        type: sectionType,
        title: line,
        standardTitle: getStandardTitle(sectionType),
        startLine: i,
      };
      contentLines = [];
      startLine = i;
    } else if (currentSection) {
      contentLines.push(line);
    } else {
      // Lines before any section header - likely contact info
      if (sections.length === 0 && !currentSection) {
        currentSection = {
          type: 'contact',
          title: 'Contact',
          standardTitle: 'CONTACT',
          startLine: 0,
        };
      }
      contentLines.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = contentLines.join('\n');
    currentSection.endLine = lines.length - 1;
    currentSection.issues = detectFormatIssues(currentSection.content!, currentSection.type as SectionType);
    sections.push(currentSection as ResumeSection);
  }

  return sections;
}

/**
 * Identify section type from header text
 */
function identifySectionHeader(line: string): SectionType {
  const cleanLine = line.replace(/[_\-=*#]/g, '').trim();

  for (const [type, patterns] of Object.entries(SECTION_PATTERNS)) {
    if (type === 'unknown') continue;
    for (const pattern of patterns) {
      if (pattern.test(cleanLine)) {
        return type as SectionType;
      }
    }
  }

  return 'unknown';
}

/**
 * Get standard ATS-friendly section title
 */
function getStandardTitle(type: SectionType): string {
  const titles: Record<SectionType, string> = {
    contact: 'CONTACT',
    summary: 'PROFESSIONAL SUMMARY',
    experience: 'EXPERIENCE',
    education: 'EDUCATION',
    skills: 'SKILLS',
    certifications: 'CERTIFICATIONS',
    projects: 'PROJECTS',
    awards: 'AWARDS',
    publications: 'PUBLICATIONS',
    volunteer: 'VOLUNTEER EXPERIENCE',
    unknown: '',
  };
  return titles[type];
}

/**
 * Extract contact information
 */
function extractContactInfo(text: string, sections: ResumeSection[]): ContactInfo {
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/(\+?1?\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/);
  const linkedinMatch = text.match(/linkedin\.com\/in\/([\w-]+)/i);
  const githubMatch = text.match(/github\.com\/([\w-]+)/i);

  // Try to extract name from first few lines
  const firstLines = text.split('\n').slice(0, 5).join(' ');
  const nameMatch = firstLines.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);

  // Extract location (city, state pattern)
  const locationMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+([A-Z]{2})\b/);

  return {
    name: nameMatch?.[1] || 'Unknown',
    email: emailMatch?.[0] || '',
    phone: phoneMatch?.[0] || '',
    location: locationMatch ? `${locationMatch[1]}, ${locationMatch[2]}` : '',
    linkedin: linkedinMatch ? `linkedin.com/in/${linkedinMatch[1]}` : undefined,
    github: githubMatch ? `github.com/${githubMatch[1]}` : undefined,
  };
}

/**
 * Extract work experience
 */
function extractExperience(sections: ResumeSection[]): Experience[] {
  const expSection = sections.find(s => s.type === 'experience');
  if (!expSection) return [];

  const experiences: Experience[] = [];
  const lines = expSection.content!.split('\n');

  let currentExp: Partial<Experience> | null = null;
  let bullets: ExperienceBullet[] = [];

  // Pattern for job titles and companies
  const titlePattern = /^([A-Z][^,\n]+?)(?:\s+at\s+|\s*[-–|]\s*|\s*,\s*)([A-Z][^\n]+)$/i;
  const datePattern = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|(?:\d{1,2}\/\d{4})|(?:\d{4})/gi;
  const bulletPattern = /^[\s]*[•\-*]\s+(.+)$/;

  for (const line of lines) {
    // Check if this is a job title line
    const titleMatch = line.match(titlePattern);
    const dates = line.match(datePattern);

    if (titleMatch || (dates && dates.length >= 1 && !line.match(bulletPattern))) {
      // Save previous experience
      if (currentExp && currentExp.title) {
        currentExp.bullets = bullets;
        currentExp.keywords = extractKeywordsFromBullets(bullets);
        experiences.push(currentExp as Experience);
      }

      // Start new experience
      currentExp = {
        title: titleMatch?.[1]?.trim() || line.split(/[-–|,]/)[0]?.trim() || line,
        company: titleMatch?.[2]?.trim() || line.split(/[-–|,]/)[1]?.trim() || '',
        startDate: dates?.[0] || '',
        endDate: dates?.[1] || undefined,
      };
      bullets = [];
    } else {
      // Check for bullet point
      const bulletMatch = line.match(bulletPattern);
      if (bulletMatch && currentExp) {
        const bulletText = bulletMatch[1];
        bullets.push(parseBullet(bulletText));
      }
    }
  }

  // Save last experience
  if (currentExp && currentExp.title) {
    currentExp.bullets = bullets;
    currentExp.keywords = extractKeywordsFromBullets(bullets);
    experiences.push(currentExp as Experience);
  }

  return experiences;
}

/**
 * Parse a bullet point
 */
function parseBullet(text: string): ExperienceBullet {
  const metrics = extractMetrics(text);
  const actionVerb = extractActionVerb(text);
  const keywords = extractBulletKeywords(text);

  return {
    text,
    hasMetrics: metrics.length > 0,
    metrics: metrics.length > 0 ? metrics : undefined,
    actionVerb,
    keywords,
  };
}

/**
 * Extract metrics from text
 */
function extractMetrics(text: string): ExtractedMetric[] {
  const metrics: ExtractedMetric[] = [];

  // Percentage patterns
  const percentMatches = text.matchAll(/(\d+(?:\.\d+)?)\s*%/g);
  for (const match of percentMatches) {
    metrics.push({
      value: match[1] + '%',
      type: 'percentage',
      context: text.slice(Math.max(0, match.index! - 20), match.index! + match[0].length + 20),
    });
  }

  // Currency patterns
  const currencyMatches = text.matchAll(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*([KMB])?/gi);
  for (const match of currencyMatches) {
    metrics.push({
      value: match[0],
      type: 'currency',
      context: text.slice(Math.max(0, match.index! - 20), match.index! + match[0].length + 20),
    });
  }

  // Count patterns
  const countMatches = text.matchAll(/(\d+(?:,\d{3})*)\+?\s+(users?|customers?|clients?|team members?|employees?|projects?)/gi);
  for (const match of countMatches) {
    metrics.push({
      value: match[1],
      type: 'count',
      context: match[0],
    });
  }

  return metrics;
}

/**
 * Extract action verb from bullet
 */
function extractActionVerb(text: string): string | undefined {
  const words = text.split(/\s+/);
  const firstWord = words[0]?.toLowerCase();

  const actionVerbs = [
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
  ];

  if (actionVerbs.includes(firstWord)) {
    return firstWord;
  }

  return undefined;
}

/**
 * Extract keywords from bullet text
 */
function extractBulletKeywords(text: string): string[] {
  const keywords: string[] = [];
  const patterns = [
    /\b(javascript|typescript|python|java|react|node|aws|docker|kubernetes)\b/gi,
    /\b(api|rest|graphql|microservices|ci\/cd|agile|scrum)\b/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (!keywords.includes(match[0].toLowerCase())) {
        keywords.push(match[0].toLowerCase());
      }
    }
  }

  return keywords;
}

/**
 * Extract keywords from bullets
 */
function extractKeywordsFromBullets(bullets: ExperienceBullet[]): string[] {
  const allKeywords = bullets.flatMap(b => b.keywords);
  return [...new Set(allKeywords)];
}

/**
 * Extract education
 */
function extractEducation(sections: ResumeSection[]): Education[] {
  const eduSection = sections.find(s => s.type === 'education');
  if (!eduSection) return [];

  const education: Education[] = [];
  const lines = eduSection.content!.split('\n');

  // Simple pattern matching for degrees
  const degreePattern = /(bachelor|master|phd|doctorate|associate|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?)/i;
  const yearPattern = /\b(19|20)\d{2}\b/;

  let currentEdu: Partial<Education> | null = null;

  for (const line of lines) {
    if (degreePattern.test(line) || line.match(/university|college|institute/i)) {
      if (currentEdu && currentEdu.institution) {
        education.push({
          ...currentEdu,
          id: `edu-${education.length}`,
        } as Education);
      }

      const yearMatch = line.match(yearPattern);
      const degreeMatch = line.match(degreePattern);

      currentEdu = {
        institution: line.replace(degreePattern, '').replace(yearPattern, '').trim(),
        degree: degreeMatch?.[0] || 'Degree',
        field: '',
        graduationYear: yearMatch?.[0] || '',
      };
    }
  }

  if (currentEdu && currentEdu.institution) {
    education.push({
      ...currentEdu,
      id: `edu-${education.length}`,
    } as Education);
  }

  return education;
}

/**
 * Extract skills
 */
function extractSkills(sections: ResumeSection[]): { name: string }[] {
  const skillSection = sections.find(s => s.type === 'skills');
  if (!skillSection) return [];

  const content = skillSection.content!;
  const skills: string[] = [];

  // Split by common delimiters
  const skillTokens = content.split(/[,;|•\n]/).map(s => s.trim()).filter(s => s.length > 0);

  for (const token of skillTokens) {
    // Clean up and validate
    const cleaned = token.replace(/^\s*[-*]\s*/, '').trim();
    if (cleaned.length > 1 && cleaned.length < 50) {
      skills.push(cleaned);
    }
  }

  return skills.map(name => ({ name }));
}

/**
 * Extract certifications
 */
function extractCertifications(sections: ResumeSection[]): Certification[] {
  const certSection = sections.find(s => s.type === 'certifications');
  if (!certSection) return [];

  const certs: Certification[] = [];
  const lines = certSection.content!.split('\n');

  for (const line of lines) {
    if (line.length > 5) {
      certs.push({
        id: `cert-${certs.length}`,
        name: line.trim(),
        issuer: '',
        date: '',
      });
    }
  }

  return certs;
}

/**
 * Detect format issues
 */
function detectFormatIssues(content: string, type: SectionType): FormatIssue[] {
  const issues: FormatIssue[] = [];

  // Check for table-like structures
  if ((content.match(/\|/g) || []).length > 3) {
    issues.push({
      type: 'table_detected',
      severity: 'warning',
      description: 'Possible table structure detected',
      fix: 'Convert tables to plain text lists for better ATS parsing',
    });
  }

  // Check for special characters
  if (/[^\x00-\x7F]/.test(content)) {
    issues.push({
      type: 'encoding_issue',
      severity: 'info',
      description: 'Non-ASCII characters detected',
      fix: 'Replace special characters with ASCII equivalents',
    });
  }

  return issues;
}

/**
 * Calculate parse confidence
 */
function calculateParseConfidence(
  sections: ResumeSection[],
  contact: ContactInfo,
  experience: Experience[]
): number {
  let confidence = 50; // Base confidence

  // Boost for recognized sections
  const recognizedSections = sections.filter(s => s.type !== 'unknown');
  confidence += recognizedSections.length * 5;

  // Boost for contact info
  if (contact.name !== 'Unknown') confidence += 10;
  if (contact.email) confidence += 10;
  if (contact.phone) confidence += 5;

  // Boost for parsed experience
  confidence += Math.min(20, experience.length * 5);

  return Math.min(100, confidence);
}

/**
 * Generate parse warnings
 */
function generateParseWarnings(
  sections: ResumeSection[],
  contact: ContactInfo,
  experience: Experience[]
): string[] {
  const warnings: string[] = [];

  if (contact.name === 'Unknown') {
    warnings.push('Could not extract name from resume');
  }

  if (!contact.email) {
    warnings.push('No email address found');
  }

  if (experience.length === 0) {
    warnings.push('No work experience could be parsed');
  }

  const unknownSections = sections.filter(s => s.type === 'unknown');
  if (unknownSections.length > 2) {
    warnings.push('Multiple unrecognized sections - consider using standard headers');
  }

  return warnings;
}

/**
 * Parse job description
 */
export function parseJobDescription(text: string): ParsedJobDescription {
  const keywords = new Map<KeywordCategory, ExtractedKeyword[]>();
  const extractedKeywords = extractJobKeywords(text);

  // Group keywords by category
  for (const kw of extractedKeywords) {
    if (!keywords.has(kw.category)) {
      keywords.set(kw.category, []);
    }
    keywords.get(kw.category)!.push(kw);
  }

  // Extract title (usually first prominent line)
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const title = lines[0]?.trim() || 'Unknown Position';

  // Extract company
  const companyMatch = text.match(/(?:at|company:?|employer:?)\s*([A-Z][^\n,]+)/i);
  const company = companyMatch?.[1]?.trim();

  // Extract experience requirements
  const expMatch = text.match(/(\d+)\+?\s*(?:-\s*(\d+))?\s*years?\s*(?:of\s+)?experience/i);
  const experienceRange = expMatch ? {
    min: parseInt(expMatch[1]),
    max: expMatch[2] ? parseInt(expMatch[2]) : undefined,
    unit: 'years' as const,
  } : undefined;

  // Detect role signals
  const lowerText = text.toLowerCase();
  const roleSignals = {
    isLeadership: /\b(lead|manage|supervise|director|head|vp)\b/i.test(text),
    isIC: !(/\b(lead|manage|supervise|director|head|vp)\b/i.test(text)) && /\b(engineer|developer|analyst|designer)\b/i.test(text),
    isCustomerFacing: /\b(customer|client|stakeholder|user-facing)\b/i.test(text),
    isRemote: /\b(remote|work from home|wfh|distributed)\b/i.test(text),
    seniorityLevel: detectSeniorityLevel(text),
  };

  // Extract requirements
  const requirements = extractRequirements(text);

  // Extract education requirements
  const educationRequirements: EducationReq[] = [];
  if (/bachelor'?s?\s+degree/i.test(text)) {
    educationRequirements.push({
      level: 'bachelor',
      required: /required/i.test(text.slice(text.toLowerCase().indexOf('bachelor') - 50, text.toLowerCase().indexOf('bachelor') + 50)),
    });
  }
  if (/master'?s?\s+degree/i.test(text)) {
    educationRequirements.push({
      level: 'master',
      required: /required/i.test(text.slice(text.toLowerCase().indexOf('master') - 50, text.toLowerCase().indexOf('master') + 50)),
    });
  }

  return {
    raw: text,
    title,
    company,
    requirements,
    keywords,
    experienceRange,
    educationRequirements,
    keyPhrases: extractKeyPhrases(text),
    industry: detectIndustry(text),
    roleSignals,
  };
}

/**
 * Extract requirements from JD
 */
function extractRequirements(text: string): { hard: Requirement[]; soft: Requirement[] } {
  const hard: Requirement[] = [];
  const soft: Requirement[] = [];

  // Look for requirement sections
  const reqPatterns = [
    /requirements?:?\s*\n([\s\S]+?)(?=\n\n|\npreferred|\nnice|$)/i,
    /qualifications?:?\s*\n([\s\S]+?)(?=\n\n|$)/i,
    /must\s+have:?\s*\n([\s\S]+?)(?=\n\n|$)/i,
  ];

  const nicePatterns = [
    /preferred:?\s*\n([\s\S]+?)(?=\n\n|$)/i,
    /nice\s+to\s+have:?\s*\n([\s\S]+?)(?=\n\n|$)/i,
    /bonus:?\s*\n([\s\S]+?)(?=\n\n|$)/i,
  ];

  for (const pattern of reqPatterns) {
    const match = text.match(pattern);
    if (match) {
      const lines = match[1].split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'));
      for (const line of lines) {
        hard.push({
          text: line.replace(/^[-•]\s*/, '').trim(),
          type: 'other',
          isMet: false,
        });
      }
    }
  }

  for (const pattern of nicePatterns) {
    const match = text.match(pattern);
    if (match) {
      const lines = match[1].split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'));
      for (const line of lines) {
        soft.push({
          text: line.replace(/^[-•]\s*/, '').trim(),
          type: 'other',
          isMet: false,
        });
      }
    }
  }

  return { hard, soft };
}

/**
 * Extract key phrases
 */
function extractKeyPhrases(text: string): string[] {
  const phrases: string[] = [];

  // Look for quoted phrases
  const quotedMatches = text.matchAll(/"([^"]+)"/g);
  for (const match of quotedMatches) {
    phrases.push(match[1]);
  }

  return phrases;
}

/**
 * Detect industry from text
 */
function detectIndustry(text: string): string | undefined {
  const industries: Record<string, string[]> = {
    'fintech': ['fintech', 'financial', 'banking', 'payments', 'trading'],
    'healthcare': ['healthcare', 'medical', 'health tech', 'biotech', 'pharma'],
    'ecommerce': ['e-commerce', 'ecommerce', 'retail', 'marketplace'],
    'saas': ['saas', 'b2b', 'enterprise software'],
    'gaming': ['gaming', 'game dev', 'video games'],
    'social': ['social media', 'social network', 'community'],
  };

  const lowerText = text.toLowerCase();

  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      return industry;
    }
  }

  return undefined;
}
