import { NextResponse } from "next/server";
import { z } from "zod";
import { applyDecision } from "@/lib/project-service";

const decisionSchema = z.object({
  topicId: z.enum([
    "2.1",
    "2.2",
    "2.3",
    "2.4",
    "2.5",
    "2.6",
    "2.7",
    "2.8",
    "2.9",
    "2.10",
    "2.11",
    "2.12",
    "2.13",
    "2.14",
    "2.15",
  ]),
  decision: z.enum(["approve", "request_revision", "add_context"]),
  notes: z.string().optional(),
  optionalStepDecision: z.enum(["yes", "no"]).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await ctx.params;
  const body = await req.json();
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const project = await applyDecision({ projectId, ...parsed.data });
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Decision failed" },
      { status: 400 },
    );
  }
}
