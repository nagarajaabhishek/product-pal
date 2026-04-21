import { NextResponse } from "next/server";
import { z } from "zod";
import { appendContentLedger, setKnowledgeDump } from "@/lib/project-service";

const dumpSchema = z.object({
  mode: z.literal("dump"),
  content: z.string(),
});

const ledgerSchema = z.object({
  mode: z.literal("ledger"),
  op: z.enum(["+", "-"]),
  title: z.string().min(1),
  content: z.string().min(1),
  reason: z.string().optional(),
});

const payloadSchema = z.union([dumpSchema, ledgerSchema]);

export async function POST(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await ctx.params;
  const body = await req.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    if (parsed.data.mode === "dump") {
      const project = await setKnowledgeDump({
        projectId,
        content: parsed.data.content,
      });
      return NextResponse.json({ project });
    }

    const project = await appendContentLedger({
      projectId,
      op: parsed.data.op,
      title: parsed.data.title,
      content: parsed.data.content,
      reason: parsed.data.reason,
      author: "user",
    });
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Content update failed" },
      { status: 400 },
    );
  }
}
