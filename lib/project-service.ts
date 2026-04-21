import { randomUUID } from "node:crypto";
import { generateTopicDraft } from "@/lib/agent";
import { ContentLedgerEntry, Project, StepRun, UserDecision } from "@/lib/types";
import { readStore, writeStore } from "@/lib/store";
import { getNextStep, TopicId, WORKFLOW_STEPS } from "@/lib/workflow";

function now(): string {
  return new Date().toISOString();
}

function initSteps(): StepRun[] {
  return WORKFLOW_STEPS.map((step, idx) => ({
    topicId: step.id,
    status: idx === 0 ? "active" : "locked",
    versions: [],
  }));
}

function hydrateProject(project: Project): Project {
  return {
    ...project,
    knowledgeDump: project.knowledgeDump ?? "",
    contentLedger: project.contentLedger ?? [],
  };
}

export async function listProjects(): Promise<Project[]> {
  const store = await readStore();
  return store.projects
    .map((project) => hydrateProject(project))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function getProject(projectId: string): Promise<Project | null> {
  const store = await readStore();
  const project = store.projects.find((item) => item.id === projectId);
  return project ? hydrateProject(project) : null;
}

export async function createProject(input: {
  name: string;
  productName: string;
  productUrl?: string;
  problemStatement: string;
  modelPreference: Project["modelPreference"];
}): Promise<Project> {
  const store = await readStore();
  const projectId = randomUUID();
  const createdAt = now();

  const project: Project = {
    id: projectId,
    name: input.name,
    productName: input.productName,
    productUrl: input.productUrl,
    problemStatement: input.problemStatement,
    modelPreference: input.modelPreference,
    createdAt,
    updatedAt: createdAt,
    currentTopicId: "2.1",
    completed: false,
    steps: initSteps(),
    evidenceItems: [],
    masterDocEvents: [],
    knowledgeDump: "",
    contentLedger: [],
    artifacts: {},
  };

  store.projects.push(project);
  await writeStore(store);
  return project;
}

function assertActiveTopic(project: Project, topicId: TopicId): void {
  if (project.currentTopicId !== topicId) {
    throw new Error(
      `Cannot update topic ${topicId}. Active topic is ${project.currentTopicId}.`,
    );
  }
}

export async function applyDecision(input: {
  projectId: string;
  topicId: TopicId;
  decision: UserDecision;
  notes?: string;
  optionalStepDecision?: "yes" | "no";
}): Promise<Project> {
  const store = await readStore();
  const project = store.projects.find((item) => item.id === input.projectId);
  if (!project) throw new Error("Project not found.");
  const hydrated = hydrateProject(project);

  assertActiveTopic(hydrated, input.topicId);

  const step = hydrated.steps.find((item) => item.topicId === input.topicId);
  if (!step) throw new Error("Step not found.");

  if (input.decision === "request_revision" || input.decision === "add_context") {
    const revisedDraft = await generateTopicDraft({
      project: hydrated,
      topicId: input.topicId,
      userInput: input.notes,
      decision: input.decision,
    });
    step.versions.push(revisedDraft);
    hydrated.evidenceItems.push(...revisedDraft.citations);
    hydrated.updatedAt = now();
    Object.assign(project, hydrated);
    await writeStore(store);
    return hydrated;
  }

  const latestVersion = step.versions.at(-1);
  if (!latestVersion) {
    throw new Error("Cannot approve a step with no draft.");
  }

  const canonicalStep = WORKFLOW_STEPS.find((item) => item.id === input.topicId);
  if (canonicalStep?.optional && input.optionalStepDecision === "no") {
    step.status = "skipped_optional";
    step.skippedReason = input.notes || "User skipped optional step";
  } else {
    step.status = "approved";
    step.approvedByUser = true;
    step.approvedAt = now();
    step.approvalNotes = input.notes;
    hydrated.masterDocEvents.push({
      id: randomUUID(),
      projectId: project.id,
      createdAt: now(),
      topicId: input.topicId,
      stepTitle: canonicalStep?.title ?? input.topicId,
      agentDraft: latestVersion.draft,
      userValidation: input.notes || "Approved",
    });
  }

  const next = getNextStep(input.topicId);
  if (!next) {
    hydrated.completed = true;
    hydrated.updatedAt = now();
    Object.assign(project, hydrated);
    await writeStore(store);
    return hydrated;
  }

  const nextStepRun = hydrated.steps.find((item) => item.topicId === next.id);
  if (!nextStepRun) throw new Error("Invalid next step.");
  nextStepRun.status = "active";
  hydrated.currentTopicId = next.id;

  hydrated.updatedAt = now();
  Object.assign(project, hydrated);
  await writeStore(store);
  return hydrated;
}

export async function generateActiveStepDraft(input: {
  projectId: string;
  userInput: string;
}): Promise<Project> {
  const store = await readStore();
  const project = store.projects.find((item) => item.id === input.projectId);
  if (!project) throw new Error("Project not found.");
  const hydrated = hydrateProject(project);

  const activeTopicId = hydrated.currentTopicId;
  const activeStep = hydrated.steps.find((item) => item.topicId === activeTopicId);
  if (!activeStep) throw new Error("Active step not found.");

  const generated = await generateTopicDraft({
    project: hydrated,
    topicId: activeTopicId,
    userInput: input.userInput,
    decision: "add_context",
  });
  activeStep.versions.push(generated);
  hydrated.evidenceItems.push(...generated.citations);
  hydrated.updatedAt = now();

  Object.assign(project, hydrated);
  await writeStore(store);
  return hydrated;
}

export async function setKnowledgeDump(input: {
  projectId: string;
  content: string;
}): Promise<Project> {
  const store = await readStore();
  const project = store.projects.find((item) => item.id === input.projectId);
  if (!project) throw new Error("Project not found.");
  const hydrated = hydrateProject(project);

  hydrated.knowledgeDump = input.content;
  hydrated.updatedAt = now();
  Object.assign(project, hydrated);
  await writeStore(store);
  return hydrated;
}

export async function appendContentLedger(input: {
  projectId: string;
  op: "+" | "-";
  title: string;
  content: string;
  reason?: string;
  author?: "user" | "agent";
}): Promise<Project> {
  const store = await readStore();
  const project = store.projects.find((item) => item.id === input.projectId);
  if (!project) throw new Error("Project not found.");
  const hydrated = hydrateProject(project);

  const entry: ContentLedgerEntry = {
    id: randomUUID(),
    createdAt: now(),
    op: input.op,
    title: input.title,
    content: input.content,
    reason: input.reason,
    author: input.author ?? "user",
  };
  hydrated.contentLedger.push(entry);
  hydrated.updatedAt = now();
  Object.assign(project, hydrated);
  await writeStore(store);
  return hydrated;
}

export async function amendApprovedStep(input: {
  projectId: string;
  topicId: TopicId;
  notes: string;
}): Promise<Project> {
  const store = await readStore();
  const project = store.projects.find((item) => item.id === input.projectId);
  if (!project) throw new Error("Project not found.");
  const hydrated = hydrateProject(project);

  const step = hydrated.steps.find((item) => item.topicId === input.topicId);
  if (!step) throw new Error("Step not found.");
  if (step.status !== "approved" && step.status !== "skipped_optional") {
    throw new Error("Only approved steps can be amended.");
  }

  const amendedDraft = await generateTopicDraft({
    project: hydrated,
    topicId: input.topicId,
    userInput: input.notes,
    decision: "request_revision",
  });
  step.versions.push(amendedDraft);
  hydrated.evidenceItems.push(...amendedDraft.citations);

  const canonicalStep = WORKFLOW_STEPS.find((item) => item.id === input.topicId);
  hydrated.masterDocEvents.push({
    id: randomUUID(),
    projectId: hydrated.id,
    createdAt: now(),
    topicId: input.topicId,
    stepTitle: canonicalStep?.title ?? input.topicId,
    agentDraft: amendedDraft.draft,
    userValidation: `Post-approval update: ${input.notes}`,
  });

  hydrated.updatedAt = now();
  Object.assign(project, hydrated);
  await writeStore(store);
  return hydrated;
}
