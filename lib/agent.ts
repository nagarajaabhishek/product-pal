import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { randomUUID } from "node:crypto";
import { ModelPreference, Project, StepVersion, UserDecision } from "@/lib/types";
import { WORKFLOW_STEPS } from "@/lib/workflow";

type DraftInput = {
  project: Project;
  topicId: Project["currentTopicId"];
  userInput?: string;
  decision?: UserDecision;
};

function getModel(preference: ModelPreference) {
  if (preference === "openai" && process.env.OPENAI_API_KEY) {
    return openai("gpt-4o-mini");
  }

  if (preference === "gemini" && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return google("gemini-2.0-flash");
  }

  if (preference === "auto") {
    if (process.env.OPENAI_API_KEY) {
      return openai("gpt-4o-mini");
    }
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return google("gemini-2.0-flash");
    }
  }

  return null;
}

function fallbackDraft(input: DraftInput): string {
  const step = WORKFLOW_STEPS.find((item) => item.id === input.topicId);
  const userContext = input.userInput?.trim()
    ? `\n\nUser input context:\n${input.userInput.trim()}`
    : "";

  return `### ${step?.id} ${step?.title}

Objective for this topic:
${step?.description}

First draft proposal:
- Key observation 1 for the topic
- Key observation 2 with practical recommendation
- Evidence request and next data needed before approval

Please review and either Approve, Request Revision, or Add Context.${userContext}`;
}

export async function generateTopicDraft(input: DraftInput): Promise<StepVersion> {
  const model = getModel(input.project.modelPreference);
  const step = WORKFLOW_STEPS.find((item) => item.id === input.topicId);

  let draft = fallbackDraft(input);

  if (model && step) {
    const response = await generateText({
      model,
      prompt: `You are Product-Pal. Follow strict sequential teardown behavior.
Current topic: ${step.id} - ${step.title}
Topic goal: ${step.description}
Project product: ${input.project.productName}
Problem statement: ${input.project.problemStatement}
User optional context: ${input.userInput ?? "None"}
Latest user decision: ${input.decision ?? "initial"}

Provide:
1) A concise first draft for ONLY this topic.
2) 2-4 evidence-backed bullets.
3) A clear "What I need from you" line for validation.
Keep format markdown.`,
    });

    draft = response.text;
  }

  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    draft,
    userInput: input.userInput,
    citations: [
      {
        id: randomUUID(),
        label: "Process Prompt Source",
        note: `Generated for topic ${input.topicId}`,
      },
    ],
  };
}
