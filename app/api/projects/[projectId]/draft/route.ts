import { NextResponse } from "next/server";
import { z } from "zod";
import { generateActiveStepDraft } from "@/lib/project-service";

const draftSchema = z.object({
  userInput: z.string().min(5),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await ctx.params;
  const body = await req.json();
  const parsed = draftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const project = await generateActiveStepDraft({
      projectId,
      userInput: parsed.data.userInput,
    });
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Draft generation failed" },
      { status: 400 },
    );
  }
}
