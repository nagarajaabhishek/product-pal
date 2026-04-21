import { NextResponse } from "next/server";
import { z } from "zod";
import { amendApprovedStep } from "@/lib/project-service";

const amendSchema = z.object({
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
  notes: z.string().min(5),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await ctx.params;
  const body = await req.json();
  const parsed = amendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const project = await amendApprovedStep({
      projectId,
      topicId: parsed.data.topicId,
      notes: parsed.data.notes,
    });
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Amendment failed" },
      { status: 400 },
    );
  }
}
