import { TopicId } from "@/lib/workflow";

export type StepStatus = "locked" | "active" | "approved" | "skipped_optional";

export type UserDecision = "approve" | "request_revision" | "add_context";

export type ModelPreference = "openai" | "gemini" | "auto";

export type Citation = {
  id: string;
  label: string;
  url?: string;
  note: string;
};

export type StepVersion = {
  id: string;
  createdAt: string;
  draft: string;
  citations: Citation[];
  userInput?: string;
};

export type StepRun = {
  topicId: TopicId;
  status: StepStatus;
  versions: StepVersion[];
  approvedByUser?: boolean;
  approvedAt?: string;
  approvalNotes?: string;
  skippedReason?: string;
};

export type MasterDocEvent = {
  id: string;
  projectId: string;
  createdAt: string;
  topicId: TopicId;
  stepTitle: string;
  agentDraft: string;
  userValidation: string;
};

export type Artifacts = {
  masterDocumentMarkdown?: string;
  slideOutlineMarkdown?: string;
  reviewChecklistMarkdown?: string;
  assumptionsLogMarkdown?: string;
  pptxPath?: string;
  generatedAt?: string;
};

export type ContentOp = "+" | "-";

export type ContentLedgerEntry = {
  id: string;
  createdAt: string;
  op: ContentOp;
  title: string;
  content: string;
  reason?: string;
  author: "user" | "agent";
};

export type Project = {
  id: string;
  name: string;
  productName: string;
  productUrl?: string;
  problemStatement: string;
  modelPreference: ModelPreference;
  createdAt: string;
  updatedAt: string;
  currentTopicId: TopicId;
  completed: boolean;
  steps: StepRun[];
  evidenceItems: Citation[];
  masterDocEvents: MasterDocEvent[];
  knowledgeDump: string;
  contentLedger: ContentLedgerEntry[];
  artifacts: Artifacts;
};

export type StoreData = {
  projects: Project[];
};
