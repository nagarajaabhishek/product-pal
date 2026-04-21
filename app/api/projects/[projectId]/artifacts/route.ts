import { NextResponse } from "next/server";
import { generateArtifacts } from "@/lib/artifacts";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await ctx.params;

  try {
    const project = await generateArtifacts(projectId);
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Artifact generation failed" },
      { status: 400 },
    );
  }
}
