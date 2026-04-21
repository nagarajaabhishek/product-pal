import { NextResponse } from "next/server";
import { z } from "zod";
import { createProject, listProjects } from "@/lib/project-service";

const createSchema = z.object({
  name: z.string().min(2),
  productName: z.string().min(2),
  productUrl: z.string().url().optional().or(z.literal("")),
  problemStatement: z.string().min(10),
  modelPreference: z.enum(["openai", "gemini", "auto"]),
});

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const payload = await req.json();
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const project = await createProject({
    ...parsed.data,
    productUrl: parsed.data.productUrl || undefined,
  });
  return NextResponse.json({ project }, { status: 201 });
}
