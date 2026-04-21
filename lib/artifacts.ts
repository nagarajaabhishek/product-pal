import path from "node:path";
import { promises as fs } from "node:fs";
import PptxGenJS from "pptxgenjs";
import { Project } from "@/lib/types";
import { readStore, writeStore } from "@/lib/store";

function ensureMarkdown(text: string): string {
  return text.trim() ? text : "_No content generated yet._";
}

function buildMasterDoc(project: Project): string {
  const history = project.masterDocEvents
    .map(
      (event) => `## ${event.topicId} ${event.stepTitle}

### Agent Draft
${event.agentDraft}

### User Validation
${event.userValidation}
`,
    )
    .join("\n");

  const ledger = project.contentLedger
    .map(
      (entry) => `- ${entry.op} [${entry.createdAt}] ${entry.title}
  - ${entry.content}
  - Reason: ${entry.reason ?? "Not provided"}`,
    )
    .join("\n");

  return ensureMarkdown(`# Product-Pal Master Document

Project: ${project.name}
Product: ${project.productName}
Problem Statement: ${project.problemStatement}

## Documentation Process
- Format: Append-only living teardown journal
- Method: Immutable topic validation records + content ledger operations
- Change notation: \`+\` add and \`-\` remove recommendations/content

## Knowledge Dump
${project.knowledgeDump || "_No bulk context dump yet._"}

## 1.0 Introduction & Objective
- Executive Summary (generated from validated steps)
- Project Objective & Success Metrics
- Approach & Scope

## 2.0-8.0 Validated Topic History
${history}

## Content Ledger
${ledger || "_No content ledger operations yet._"}`);
}

function buildSlideOutline(project: Project): string {
  return ensureMarkdown(`# Slide Outline

1. Objective and Scope
2. User Personas and Needs
3. Core Problems and Evidence
4. Opportunity and Risk Analysis
5. Competitor Insights
6. Recommendations and Prioritization
7. Roadmap
8. Final Decision Checklist

Derived from ${project.masterDocEvents.length} validated topics.`);
}

function buildReviewChecklist(project: Project): string {
  return ensureMarkdown(`# Review Checklist

- [ ] All mandatory steps approved in sequence
- [ ] Optional heuristic decision recorded
- [ ] Claims contain evidence references
- [ ] Prioritization matrix aligns with recommendations
- [ ] Roadmap themes align with objectives
- [ ] Final sign-off captured

## Assumptions Log
- Model preference used: ${project.modelPreference}
- Evidence items captured: ${project.evidenceItems.length}
- Project completion flag: ${project.completed ? "Complete" : "In progress"}
`);
}

async function exportPptx(project: Project, slideOutline: string): Promise<string> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Product-Pal";
  pptx.subject = project.problemStatement;
  pptx.title = `${project.name} Teardown`;

  const cover = pptx.addSlide();
  cover.addText(project.name, { x: 0.5, y: 0.8, w: 12, h: 1, fontSize: 30, bold: true });
  cover.addText(`Product: ${project.productName}`, { x: 0.5, y: 2, w: 12, h: 0.6, fontSize: 16 });
  cover.addText(`Problem: ${project.problemStatement}`, { x: 0.5, y: 2.8, w: 12, h: 1.5, fontSize: 14 });

  const sections = slideOutline.split("\n").filter((line) => /^\d+\./.test(line));
  sections.forEach((section, idx) => {
    const slide = pptx.addSlide();
    slide.addText(section, { x: 0.5, y: 0.5, w: 12, h: 0.6, fontSize: 22, bold: true });
    const event = project.masterDocEvents[idx];
    slide.addText(event?.agentDraft ?? "Content will populate from validated topic output.", {
      x: 0.5,
      y: 1.4,
      w: 12,
      h: 5,
      fontSize: 14,
      valign: "top",
    });
  });

  const exportDir = path.join(process.cwd(), "public", "exports");
  await fs.mkdir(exportDir, { recursive: true });
  const fileName = `${project.id}.pptx`;
  const filePath = path.join(exportDir, fileName);
  await pptx.writeFile({ fileName: filePath });
  return `/exports/${fileName}`;
}

export async function generateArtifacts(projectId: string): Promise<Project> {
  const store = await readStore();
  const project = store.projects.find((item) => item.id === projectId);
  if (!project) throw new Error("Project not found.");

  const masterDocumentMarkdown = buildMasterDoc(project);
  const slideOutlineMarkdown = buildSlideOutline(project);
  const reviewChecklistMarkdown = buildReviewChecklist(project);
  const assumptionsLogMarkdown = reviewChecklistMarkdown.split("## Assumptions Log")[1] ?? "";
  const pptxPath = await exportPptx(project, slideOutlineMarkdown);

  project.artifacts = {
    masterDocumentMarkdown,
    slideOutlineMarkdown,
    reviewChecklistMarkdown,
    assumptionsLogMarkdown: assumptionsLogMarkdown.trim(),
    pptxPath,
    generatedAt: new Date().toISOString(),
  };
  project.updatedAt = new Date().toISOString();

  await writeStore(store);
  return project;
}
