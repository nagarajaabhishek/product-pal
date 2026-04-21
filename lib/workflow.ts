export type TopicId =
  | "2.1"
  | "2.2"
  | "2.3"
  | "2.4"
  | "2.5"
  | "2.6"
  | "2.7"
  | "2.8"
  | "2.9"
  | "2.10"
  | "2.11"
  | "2.12"
  | "2.13"
  | "2.14"
  | "2.15";

export type WorkflowStep = {
  id: TopicId;
  title: string;
  phase: string;
  description: string;
  requiresApproval: boolean;
  inputHint?: string;
  optional?: boolean;
};

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: "2.1",
    title: "Product Identification",
    phase: "Phase 1",
    description: "Confirm product, problem statement, and teardown start.",
    requiresApproval: true,
    inputHint: "Product name, product URL, and primary problem statement.",
  },
  {
    id: "2.2",
    title: "Hypothetical Personas",
    phase: "Phase 1",
    description: "Propose personas with needs, wants, and goals.",
    requiresApproval: true,
  },
  {
    id: "2.3",
    title: "Problem Discovery & Objective Definition",
    phase: "Phase 1",
    description: "Define objective and KPIs using complaint patterns.",
    requiresApproval: true,
  },
  {
    id: "2.4",
    title: "Competitor Identification",
    phase: "Phase 1",
    description: "Identify key competitors in the problem space.",
    requiresApproval: true,
  },
  {
    id: "2.5",
    title: "Visual Context",
    phase: "Phase 2",
    description: "Collect screenshots for current experience analysis.",
    requiresApproval: true,
    inputHint: "Upload screenshots of current flow and menu discovery journey.",
  },
  {
    id: "2.6",
    title: "Deep Online Research & Analysis",
    phase: "Phase 3",
    description: "Synthesize online market/user insights and evidence.",
    requiresApproval: true,
  },
  {
    id: "2.7",
    title: "Survey Question Generation",
    phase: "Phase 3",
    description: "Generate survey in automation-ready format.",
    requiresApproval: true,
  },
  {
    id: "2.8",
    title: "Survey Distribution Strategy",
    phase: "Phase 3",
    description: "Recommend channels and sample distribution posts.",
    requiresApproval: true,
  },
  {
    id: "2.9",
    title: "Primary Research Ingestion",
    phase: "Phase 3",
    description: "Ingest survey/interview findings from user.",
    requiresApproval: true,
    inputHint: "Summarized primary research findings from surveys/interviews.",
  },
  {
    id: "2.10",
    title: "General Problem & Recommendation Pairing",
    phase: "Phase 4",
    description: "Pair each problem with recommendation, impact, and risk.",
    requiresApproval: true,
  },
  {
    id: "2.11",
    title: "UX Heuristic Evaluation",
    phase: "Phase 5",
    description: "Optional UX heuristic pass from screenshots.",
    requiresApproval: true,
    optional: true,
  },
  {
    id: "2.12",
    title: "Prioritization",
    phase: "Phase 6",
    description: "Map recommendations on impact vs effort.",
    requiresApproval: true,
  },
  {
    id: "2.13",
    title: "Roadmap Formulation",
    phase: "Phase 6",
    description: "Convert prioritized initiatives into themed roadmap.",
    requiresApproval: true,
  },
  {
    id: "2.14",
    title: "Final Document Assembly",
    phase: "Phase 7",
    description: "Assemble full structured teardown report.",
    requiresApproval: true,
  },
  {
    id: "2.15",
    title: "Final Review & Sign-Off",
    phase: "Phase 7",
    description: "Capture final edits and complete sign-off.",
    requiresApproval: true,
  },
];

export function getStepIndex(topicId: TopicId): number {
  return WORKFLOW_STEPS.findIndex((step) => step.id === topicId);
}

export function getNextStep(topicId: TopicId): WorkflowStep | null {
  const idx = getStepIndex(topicId);
  if (idx === -1 || idx === WORKFLOW_STEPS.length - 1) {
    return null;
  }

  return WORKFLOW_STEPS[idx + 1];
}
