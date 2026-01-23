// ATS-Clean DOCX Export
// Generates ATS-optimized Word documents with clean formatting

import {
  GeneratedResume,
  ParsedResume,
  ATSAnalysis,
  ExportFormat,
  ExportOptions,
} from '../types';

/**
 * Export resume to specified format
 */
export async function exportResume(
  resume: GeneratedResume | ParsedResume,
  format: ExportFormat,
  options: ExportOptions = {}
): Promise<Blob> {
  switch (format) {
    case 'docx':
      return exportToDocx(resume, options);
    case 'pdf':
      return exportToPdf(resume, options);
    case 'txt':
      return exportToTxt(resume);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Export to ATS-clean DOCX format
 * Uses simple formatting that ATS systems can parse reliably
 */
async function exportToDocx(
  resume: GeneratedResume | ParsedResume,
  options: ExportOptions
): Promise<Blob> {
  // Dynamic import of docx library
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import('docx');

  const children: any[] = [];

  // Contact Header
  const contact = 'contact' in resume ? resume.contact : null;
  if (contact) {
    // Name - large and bold
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: contact.name.toUpperCase(),
            bold: true,
            size: 28, // 14pt
            font: 'Arial',
          }),
        ],
      })
    );

    // Contact info line
    const contactParts = [contact.email, contact.phone, contact.location];
    if (contact.linkedin) contactParts.push(contact.linkedin);

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: contactParts.filter(Boolean).join(' | '),
            size: 20, // 10pt
            font: 'Arial',
          }),
        ],
      })
    );
  }

  // Summary Section
  const summary = 'summary' in resume ? resume.summary : null;
  if (summary) {
    children.push(createSectionHeader('PROFESSIONAL SUMMARY', { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle }));
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: summary,
            size: 22, // 11pt
            font: 'Arial',
          }),
        ],
      })
    );
  }

  // Experience Section
  const experience = 'experience' in resume ? resume.experience : [];
  if (experience.length > 0) {
    children.push(createSectionHeader('EXPERIENCE', { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle }));

    for (const exp of experience) {
      // Title and dates
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 50 },
          children: [
            new TextRun({
              text: exp.title,
              bold: true,
              size: 22,
              font: 'Arial',
            }),
            new TextRun({
              text: ` | ${formatDateRange(exp.startDate, exp.endDate)}`,
              size: 22,
              font: 'Arial',
            }),
          ],
        })
      );

      // Company and location
      children.push(
        new Paragraph({
          spacing: { after: 50 },
          children: [
            new TextRun({
              text: exp.company,
              italics: true,
              size: 22,
              font: 'Arial',
            }),
            ...(exp.location ? [
              new TextRun({
                text: ` | ${exp.location}`,
                size: 22,
                font: 'Arial',
              }),
            ] : []),
          ],
        })
      );

      // Bullets
      const bullets = 'bullets' in exp
        ? (Array.isArray(exp.bullets)
            ? exp.bullets.map((b: any) => typeof b === 'string' ? b : b.text)
            : [])
        : [];

      for (const bullet of bullets) {
        children.push(
          new Paragraph({
            spacing: { after: 50 },
            indent: { left: 360 }, // 0.25 inch
            children: [
              new TextRun({
                text: '• ',
                size: 22,
                font: 'Arial',
              }),
              new TextRun({
                text: bullet,
                size: 22,
                font: 'Arial',
              }),
            ],
          })
        );
      }
    }
  }

  // Skills Section
  const skills = 'skills' in resume ? resume.skills : null;
  if (skills) {
    children.push(createSectionHeader('SKILLS', { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle }));

    if (Array.isArray(skills)) {
      // ParsedResume format - simple array
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: skills.join(', '),
              size: 22,
              font: 'Arial',
            }),
          ],
        })
      );
    } else {
      // GeneratedResume format - categorized
      if (skills.technical && skills.technical.length > 0) {
        children.push(
          new Paragraph({
            spacing: { after: 50 },
            children: [
              new TextRun({
                text: 'Technical: ',
                bold: true,
                size: 22,
                font: 'Arial',
              }),
              new TextRun({
                text: skills.technical.join(', '),
                size: 22,
                font: 'Arial',
              }),
            ],
          })
        );
      }
      if (skills.tools && skills.tools.length > 0) {
        children.push(
          new Paragraph({
            spacing: { after: 50 },
            children: [
              new TextRun({
                text: 'Tools: ',
                bold: true,
                size: 22,
                font: 'Arial',
              }),
              new TextRun({
                text: skills.tools.join(', '),
                size: 22,
                font: 'Arial',
              }),
            ],
          })
        );
      }
      if (skills.methodologies && skills.methodologies.length > 0) {
        children.push(
          new Paragraph({
            spacing: { after: 50 },
            children: [
              new TextRun({
                text: 'Methodologies: ',
                bold: true,
                size: 22,
                font: 'Arial',
              }),
              new TextRun({
                text: skills.methodologies.join(', '),
                size: 22,
                font: 'Arial',
              }),
            ],
          })
        );
      }
      if (skills.soft && skills.soft.length > 0) {
        children.push(
          new Paragraph({
            spacing: { after: 50 },
            children: [
              new TextRun({
                text: 'Soft Skills: ',
                bold: true,
                size: 22,
                font: 'Arial',
              }),
              new TextRun({
                text: skills.soft.join(', '),
                size: 22,
                font: 'Arial',
              }),
            ],
          })
        );
      }
    }
  }

  // Education Section
  const education = 'education' in resume ? resume.education : [];
  if (education.length > 0) {
    children.push(createSectionHeader('EDUCATION', { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle }));

    for (const edu of education) {
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: `${edu.degree} in ${edu.field}`,
              bold: true,
              size: 22,
              font: 'Arial',
            }),
            new TextRun({
              text: ` | ${edu.institution} | ${edu.graduationYear}`,
              size: 22,
              font: 'Arial',
            }),
          ],
        })
      );
    }
  }

  // Certifications Section
  const certifications = 'certifications' in resume ? resume.certifications : [];
  if (certifications && certifications.length > 0) {
    children.push(createSectionHeader('CERTIFICATIONS', { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle }));

    for (const cert of certifications) {
      children.push(
        new Paragraph({
          spacing: { after: 50 },
          children: [
            new TextRun({
              text: cert.name,
              bold: true,
              size: 22,
              font: 'Arial',
            }),
            new TextRun({
              text: ` | ${cert.issuer} | ${cert.date}`,
              size: 22,
              font: 'Arial',
            }),
          ],
        })
      );
    }
  }

  // Projects Section
  const projects = 'projects' in resume ? resume.projects : undefined;
  if (projects && projects.length > 0) {
    children.push(createSectionHeader('PROJECTS', { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle }));

    for (const project of projects) {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 50 },
          children: [
            new TextRun({
              text: project.name,
              bold: true,
              size: 22,
              font: 'Arial',
            }),
            ...('url' in project && project.url ? [
              new TextRun({
                text: ` | ${project.url}`,
                size: 22,
                font: 'Arial',
              }),
            ] : []),
          ],
        })
      );

      const desc = 'description' in project ? project.description : '';
      if (desc) {
        children.push(
          new Paragraph({
            spacing: { after: 50 },
            children: [
              new TextRun({
                text: desc,
                size: 22,
                font: 'Arial',
              }),
            ],
          })
        );
      }

      const techs = 'technologies' in project ? project.technologies : [];
      if (techs && techs.length > 0) {
        children.push(
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: 'Technologies: ',
                italics: true,
                size: 22,
                font: 'Arial',
              }),
              new TextRun({
                text: techs.join(', '),
                size: 22,
                font: 'Arial',
              }),
            ],
          })
        );
      }
    }
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

/**
 * Create a section header with underline
 */
function createSectionHeader(title: string, { Paragraph, TextRun, BorderStyle }: any) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    border: {
      bottom: {
        color: '000000',
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 24, // 12pt
        font: 'Arial',
      }),
    ],
  });
}

/**
 * Export to PDF (via print-ready HTML)
 */
async function exportToPdf(
  resume: GeneratedResume | ParsedResume,
  options: ExportOptions
): Promise<Blob> {
  // Generate HTML and use browser print for PDF
  const html = generatePrintableHtml(resume);

  // Create a blob with HTML that can be printed to PDF
  return new Blob([html], { type: 'text/html' });
}

/**
 * Export to plain text
 */
async function exportToTxt(resume: GeneratedResume | ParsedResume): Promise<Blob> {
  let text = '';

  // Use rawText if available (GeneratedResume)
  if ('rawText' in resume && resume.rawText) {
    text = resume.rawText;
  } else {
    // Build from components
    const contact = 'contact' in resume ? resume.contact : null;
    if (contact) {
      text += contact.name.toUpperCase() + '\n';
      text += [contact.email, contact.phone, contact.location].filter(Boolean).join(' | ') + '\n\n';
    }

    const summary = 'summary' in resume ? resume.summary : null;
    if (summary) {
      text += 'PROFESSIONAL SUMMARY\n';
      text += summary + '\n\n';
    }

    const experience = 'experience' in resume ? resume.experience : [];
    if (experience.length > 0) {
      text += 'EXPERIENCE\n';
      for (const exp of experience) {
        text += `${exp.title} | ${formatDateRange(exp.startDate, exp.endDate)}\n`;
        text += `${exp.company}${exp.location ? ' | ' + exp.location : ''}\n`;
        const bullets = 'bullets' in exp
          ? (Array.isArray(exp.bullets)
              ? exp.bullets.map((b: any) => typeof b === 'string' ? b : b.text)
              : [])
          : [];
        for (const bullet of bullets) {
          text += `• ${bullet}\n`;
        }
        text += '\n';
      }
    }

    const skills = 'skills' in resume ? resume.skills : null;
    if (skills) {
      text += 'SKILLS\n';
      if (Array.isArray(skills)) {
        text += skills.join(', ') + '\n\n';
      } else {
        if (skills.technical?.length) text += `Technical: ${skills.technical.join(', ')}\n`;
        if (skills.tools?.length) text += `Tools: ${skills.tools.join(', ')}\n`;
        if (skills.methodologies?.length) text += `Methodologies: ${skills.methodologies.join(', ')}\n`;
        if (skills.soft?.length) text += `Soft Skills: ${skills.soft.join(', ')}\n`;
        text += '\n';
      }
    }

    const education = 'education' in resume ? resume.education : [];
    if (education.length > 0) {
      text += 'EDUCATION\n';
      for (const edu of education) {
        text += `${edu.degree} in ${edu.field} | ${edu.institution} | ${edu.graduationYear}\n`;
      }
      text += '\n';
    }

    const certifications = 'certifications' in resume ? resume.certifications : [];
    if (certifications?.length > 0) {
      text += 'CERTIFICATIONS\n';
      for (const cert of certifications) {
        text += `${cert.name} | ${cert.issuer} | ${cert.date}\n`;
      }
      text += '\n';
    }
  }

  return new Blob([text], { type: 'text/plain' });
}

/**
 * Generate printable HTML for PDF export
 */
function generatePrintableHtml(resume: GeneratedResume | ParsedResume): string {
  const contact = 'contact' in resume ? resume.contact : null;
  const summary = 'summary' in resume ? resume.summary : null;
  const experience = 'experience' in resume ? resume.experience : [];
  const skills = 'skills' in resume ? resume.skills : null;
  const education = 'education' in resume ? resume.education : [];
  const certifications = 'certifications' in resume ? resume.certifications : [];
  const projects = 'projects' in resume ? resume.projects : undefined;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Resume</title>
  <style>
    @page { margin: 0.5in; }
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
    }
    .header { text-align: center; margin-bottom: 20px; }
    .name { font-size: 18pt; font-weight: bold; text-transform: uppercase; }
    .contact { font-size: 10pt; color: #333; }
    .section { margin-bottom: 15px; }
    .section-title {
      font-weight: bold;
      font-size: 12pt;
      border-bottom: 1px solid #000;
      padding-bottom: 3px;
      margin-bottom: 8px;
    }
    .job { margin-bottom: 12px; }
    .job-header { font-weight: bold; }
    .job-company { font-style: italic; }
    .bullet { margin-left: 20px; margin-bottom: 3px; }
    .skills-category { margin-bottom: 5px; }
    .skills-label { font-weight: bold; }
  </style>
</head>
<body>
  ${contact ? `
  <div class="header">
    <div class="name">${contact.name}</div>
    <div class="contact">${[contact.email, contact.phone, contact.location, contact.linkedin].filter(Boolean).join(' | ')}</div>
  </div>
  ` : ''}

  ${summary ? `
  <div class="section">
    <div class="section-title">PROFESSIONAL SUMMARY</div>
    <div>${summary}</div>
  </div>
  ` : ''}

  ${experience.length > 0 ? `
  <div class="section">
    <div class="section-title">EXPERIENCE</div>
    ${experience.map(exp => {
      const bullets = 'bullets' in exp
        ? (Array.isArray(exp.bullets)
            ? exp.bullets.map((b: any) => typeof b === 'string' ? b : b.text)
            : [])
        : [];
      return `
      <div class="job">
        <div class="job-header">${exp.title} | ${formatDateRange(exp.startDate, exp.endDate)}</div>
        <div class="job-company">${exp.company}${exp.location ? ' | ' + exp.location : ''}</div>
        ${bullets.map(b => `<div class="bullet">• ${b}</div>`).join('')}
      </div>
      `;
    }).join('')}
  </div>
  ` : ''}

  ${skills ? `
  <div class="section">
    <div class="section-title">SKILLS</div>
    ${Array.isArray(skills)
      ? `<div>${skills.join(', ')}</div>`
      : `
        ${skills.technical?.length ? `<div class="skills-category"><span class="skills-label">Technical:</span> ${skills.technical.join(', ')}</div>` : ''}
        ${skills.tools?.length ? `<div class="skills-category"><span class="skills-label">Tools:</span> ${skills.tools.join(', ')}</div>` : ''}
        ${skills.methodologies?.length ? `<div class="skills-category"><span class="skills-label">Methodologies:</span> ${skills.methodologies.join(', ')}</div>` : ''}
        ${skills.soft?.length ? `<div class="skills-category"><span class="skills-label">Soft Skills:</span> ${skills.soft.join(', ')}</div>` : ''}
      `
    }
  </div>
  ` : ''}

  ${education.length > 0 ? `
  <div class="section">
    <div class="section-title">EDUCATION</div>
    ${education.map(edu => `
      <div>${edu.degree} in ${edu.field} | ${edu.institution} | ${edu.graduationYear}</div>
    `).join('')}
  </div>
  ` : ''}

  ${certifications?.length > 0 ? `
  <div class="section">
    <div class="section-title">CERTIFICATIONS</div>
    ${certifications.map(cert => `
      <div>${cert.name} | ${cert.issuer} | ${cert.date}</div>
    `).join('')}
  </div>
  ` : ''}

  ${(projects?.length ?? 0) > 0 ? `
  <div class="section">
    <div class="section-title">PROJECTS</div>
    ${projects!.map((project: any) => `
      <div class="job">
        <div class="job-header">${project.name}${'url' in project && project.url ? ' | ' + project.url : ''}</div>
        ${'description' in project ? `<div>${project.description}</div>` : ''}
        ${'technologies' in project && project.technologies?.length ? `<div><em>Technologies:</em> ${project.technologies.join(', ')}</div>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}
</body>
</html>
  `.trim();
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
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get suggested filename for export
 */
export function getSuggestedFilename(
  resume: GeneratedResume | ParsedResume,
  format: ExportFormat,
  targetJob?: string
): string {
  const contact = 'contact' in resume ? resume.contact : null;
  const name = contact?.name?.replace(/\s+/g, '_') || 'Resume';
  const job = targetJob?.replace(/\s+/g, '_').substring(0, 30) || '';
  const date = new Date().toISOString().split('T')[0];

  const baseName = job
    ? `${name}_${job}_${date}`
    : `${name}_${date}`;

  const extensions: Record<ExportFormat, string> = {
    docx: '.docx',
    pdf: '.pdf',
    txt: '.txt',
  };

  return baseName + extensions[format];
}

/**
 * Generate ATS analysis report
 */
export function generateAnalysisReport(analysis: ATSAnalysis): string {
  const lines: string[] = [];

  lines.push('ATS ANALYSIS REPORT');
  lines.push('='.repeat(50));
  lines.push('');

  // Scores
  lines.push('SCORES');
  lines.push('-'.repeat(30));
  lines.push(`Overall Score: ${analysis.overallScore}/100`);
  lines.push(`Keyword Match: ${analysis.keywordScore}/100`);
  lines.push(`Format Score: ${analysis.formatScore}/100`);
  lines.push(`Structure Score: ${analysis.structureScore}/100`);
  lines.push(`Quantification: ${analysis.quantificationScore}/100`);
  lines.push('');

  // Matched Keywords
  lines.push('MATCHED KEYWORDS');
  lines.push('-'.repeat(30));
  for (const match of analysis.matchedKeywords) {
    lines.push(`✓ ${match.jobKeyword} (${match.matchType}, ${Math.round(match.strength * 100)}%)`);
  }
  lines.push('');

  // Missing Keywords
  lines.push('MISSING KEYWORDS');
  lines.push('-'.repeat(30));
  for (const missing of analysis.missingKeywords.slice(0, 10)) {
    const importance = missing.keyword.importance === 'critical' ? '!!!' :
                       missing.keyword.importance === 'important' ? '!!' : '!';
    lines.push(`${importance} ${missing.keyword.term} - ${missing.suggestedAddition}`);
  }
  lines.push('');

  // Requirements
  lines.push('REQUIREMENTS CHECK');
  lines.push('-'.repeat(30));
  for (const req of analysis.hardRequirements) {
    const status = req.isMet ? '✓' : '✗';
    lines.push(`${status} ${req.text}${req.gap ? ` (${req.gap})` : ''}`);
  }
  lines.push('');

  // Recommendations
  lines.push('TOP RECOMMENDATIONS');
  lines.push('-'.repeat(30));
  for (const rec of analysis.recommendations.slice(0, 5)) {
    lines.push(`${rec.priority}. [${rec.impact.toUpperCase()}] ${rec.title}`);
    lines.push(`   ${rec.description}`);
  }

  return lines.join('\n');
}
