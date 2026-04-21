"use client";

import { FormEvent, useMemo, useState } from "react";
import { Project } from "@/lib/types";
import { TopicId, WORKFLOW_STEPS } from "@/lib/workflow";

type CreatePayload = {
  name: string;
  productName: string;
  productUrl?: string;
  problemStatement: string;
  modelPreference: "openai" | "gemini" | "auto";
};

const defaultForm: CreatePayload = {
  name: "Google Maps Menu Teardown",
  productName: "Google Maps",
  productUrl: "https://maps.google.com",
  problemStatement:
    "Restaurant menus are often not digitized or are static images, which makes item-level discovery difficult.",
  modelPreference: "auto",
};

export default function Home() {
  const [form, setForm] = useState<CreatePayload>(defaultForm);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [knowledgeDump, setKnowledgeDump] = useState("");
  const [ledgerTitle, setLedgerTitle] = useState("");
  const [ledgerContent, setLedgerContent] = useState("");
  const [ledgerReason, setLedgerReason] = useState("");
  const [amendTopicId, setAmendTopicId] = useState<TopicId>("2.1");
  const [amendNotes, setAmendNotes] = useState("");

  const activeStep = useMemo(() => {
    if (!project) return null;
    return project.steps.find((step) => step.topicId === project.currentTopicId) ?? null;
  }, [project]);

  const approvedSteps = useMemo(() => {
    if (!project) return [];
    return WORKFLOW_STEPS.filter((step) => {
      const run = project.steps.find((item) => item.topicId === step.id);
      return run?.status === "approved" || run?.status === "skipped_optional";
    });
  }, [project]);

  const selectedAmendTopicId: TopicId =
    approvedSteps.find((step) => step.id === amendTopicId)?.id ??
    approvedSteps[0]?.id ??
    "2.1";

  async function createProject(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create project");
      setProject(data.project as Project);
      setKnowledgeDump((data.project as Project).knowledgeDump ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function submitDecision(decision: "approve" | "request_revision" | "add_context") {
    if (!project) return;
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: project.currentTopicId,
          decision,
          notes: note || undefined,
          optionalStepDecision:
            project.currentTopicId === "2.11" && decision === "approve"
              ? "yes"
              : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Decision failed");
      setProject(data.project as Project);
      setKnowledgeDump((data.project as Project).knowledgeDump ?? "");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function generateSuggestion() {
    if (!project) return;
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: note,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Suggestion generation failed");
      setProject(data.project as Project);
      setKnowledgeDump((data.project as Project).knowledgeDump ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function generateArtifacts() {
    if (!project) return;
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/artifacts`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Artifact generation failed");
      setProject(data.project as Project);
      setKnowledgeDump((data.project as Project).knowledgeDump ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveKnowledgeDump() {
    if (!project) return;
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "dump",
          content: knowledgeDump,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save knowledge dump");
      setProject(data.project as Project);
      setKnowledgeDump((data.project as Project).knowledgeDump ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function addLedger(op: "+" | "-") {
    if (!project) return;
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "ledger",
          op,
          title: ledgerTitle,
          content: ledgerContent,
          reason: ledgerReason || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to append ledger operation");
      setProject(data.project as Project);
      setKnowledgeDump((data.project as Project).knowledgeDump ?? "");
      setLedgerTitle("");
      setLedgerContent("");
      setLedgerReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function amendApprovedStep() {
    if (!project) return;
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/amend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: selectedAmendTopicId,
          notes: amendNotes,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to amend step");
      setProject(data.project as Project);
      setKnowledgeDump((data.project as Project).knowledgeDump ?? "");
      setAmendNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <h1 className="text-3xl font-bold">Product-Pal Agent MVP</h1>
      <p className="text-sm text-zinc-600">
        Guided, approval-based teardown workflow with append-only master document and export artifacts.
      </p>

      {!project && (
        <form onSubmit={createProject} className="grid gap-3 rounded-xl border p-4">
          <input
            className="rounded border px-3 py-2"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            placeholder="Project name"
          />
          <input
            className="rounded border px-3 py-2"
            value={form.productName}
            onChange={(e) => setForm((s) => ({ ...s, productName: e.target.value }))}
            placeholder="Product name"
          />
          <input
            className="rounded border px-3 py-2"
            value={form.productUrl}
            onChange={(e) => setForm((s) => ({ ...s, productUrl: e.target.value }))}
            placeholder="Product URL (optional)"
          />
          <textarea
            className="min-h-28 rounded border px-3 py-2"
            value={form.problemStatement}
            onChange={(e) => setForm((s) => ({ ...s, problemStatement: e.target.value }))}
            placeholder="Problem statement"
          />
          <select
            className="rounded border px-3 py-2"
            value={form.modelPreference}
            onChange={(e) =>
              setForm((s) => ({ ...s, modelPreference: e.target.value as CreatePayload["modelPreference"] }))
            }
          >
            <option value="auto">Auto</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
          </select>
          <button className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" disabled={loading}>
            {loading ? "Creating..." : "Start Teardown"}
          </button>
        </form>
      )}

      {project && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-300 bg-white p-4 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 md:col-span-1">
            <h2 className="mb-3 text-lg font-semibold">Progress</h2>
            <div className="space-y-2 text-sm">
              {WORKFLOW_STEPS.map((step) => {
                const run = project.steps.find((item) => item.topicId === step.id);
                return (
                  <div key={step.id} className="flex items-center justify-between">
                    <span>
                      {step.id} {step.title}
                    </span>
                    <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100">
                      {run?.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-300 bg-white p-4 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 md:col-span-2">
            <h2 className="text-lg font-semibold">
              Active Topic: {project.currentTopicId}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {WORKFLOW_STEPS.find((step) => step.id === project.currentTopicId)?.description}
            </p>
            <div className="mt-4 whitespace-pre-wrap rounded border border-zinc-300 bg-zinc-50 p-3 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
              {activeStep?.versions.at(-1)?.draft ??
                "No suggestion yet. Add your context below and click Generate Suggestion."}
            </div>
            <textarea
              className="mt-3 min-h-24 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-400"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Phase input from you first: context, constraints, desired direction"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded bg-indigo-700 px-3 py-2 text-white disabled:opacity-50"
                onClick={generateSuggestion}
                disabled={loading || note.trim().length < 5}
              >
                Generate Suggestion
              </button>
              <button
                className="rounded bg-emerald-600 px-3 py-2 text-white disabled:opacity-50"
                onClick={() => submitDecision("approve")}
                disabled={loading || project.completed || (activeStep?.versions.length ?? 0) === 0}
              >
                Approve
              </button>
              <button
                className="rounded bg-amber-500 px-3 py-2 text-white disabled:opacity-50"
                onClick={() => submitDecision("request_revision")}
                disabled={loading || project.completed || (activeStep?.versions.length ?? 0) === 0}
              >
                Request Revision
              </button>
              <button
                className="rounded bg-sky-600 px-3 py-2 text-white disabled:opacity-50"
                onClick={() => submitDecision("add_context")}
                disabled={loading || project.completed || (activeStep?.versions.length ?? 0) === 0}
              >
                Add Context
              </button>
              <button
                className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
                onClick={generateArtifacts}
                disabled={loading || !project.completed}
              >
                Generate Final Artifacts
              </button>
            </div>
            {project.artifacts.generatedAt && (
              <div className="mt-4 rounded border border-zinc-300 bg-zinc-50 p-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
                <p>Artifacts generated: {project.artifacts.generatedAt}</p>
                {project.artifacts.pptxPath && (
                  <a className="text-blue-600 underline" href={project.artifacts.pptxPath}>
                    Download PPTX
                  </a>
                )}
                <pre className="mt-2 max-h-40 overflow-auto rounded bg-white p-2 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                  {project.artifacts.slideOutlineMarkdown}
                </pre>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-300 bg-white p-4 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 md:col-span-3">
            <h2 className="text-lg font-semibold">Update Previously Approved Step</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Select any approved step to append an updated version without losing history.
            </p>
            <div className="mt-3 grid gap-2">
              <select
                className="rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                value={selectedAmendTopicId}
                onChange={(e) => setAmendTopicId(e.target.value as TopicId)}
                disabled={approvedSteps.length === 0}
              >
                {approvedSteps.map((step) => (
                  <option key={step.id} value={step.id}>
                    {step.id} {step.title}
                  </option>
                ))}
              </select>
              <textarea
                className="min-h-24 rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                value={amendNotes}
                onChange={(e) => setAmendNotes(e.target.value)}
                placeholder="Describe what needs to change in this approved step"
              />
              <button
                className="w-fit rounded bg-purple-700 px-3 py-2 text-white disabled:opacity-50"
                onClick={amendApprovedStep}
                disabled={loading || approvedSteps.length === 0 || amendNotes.trim().length < 5}
              >
                Append Updated Version
              </button>
              {approvedSteps.length === 0 && (
                <p className="text-sm text-zinc-600">
                  Approve at least one step before using post-approval updates.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-300 bg-white p-4 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 md:col-span-3">
            <h2 className="text-lg font-semibold">Knowledge Dump (single place)</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Paste existing teardowns, notes, links, and context in one appendable workspace.
            </p>
            <textarea
              className="mt-3 min-h-32 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-400"
              value={knowledgeDump}
              onChange={(e) => setKnowledgeDump(e.target.value)}
              placeholder="Dump all context here..."
            />
            <button
              className="mt-2 rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50"
              onClick={saveKnowledgeDump}
              disabled={loading}
            >
              Save Dump
            </button>
          </div>

          <div className="rounded-xl border border-zinc-300 bg-white p-4 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 md:col-span-3">
            <h2 className="text-lg font-semibold">Content Ledger (+ / -)</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Track content changes as explicit operations to preserve context and intent.
            </p>
            <div className="mt-3 grid gap-2">
              <input
                className="rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                placeholder="Change title"
                value={ledgerTitle}
                onChange={(e) => setLedgerTitle(e.target.value)}
              />
              <textarea
                className="min-h-24 rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                placeholder="Content to add/remove"
                value={ledgerContent}
                onChange={(e) => setLedgerContent(e.target.value)}
              />
              <input
                className="rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                placeholder="Reason (optional)"
                value={ledgerReason}
                onChange={(e) => setLedgerReason(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  className="rounded bg-emerald-600 px-3 py-2 text-white disabled:opacity-50"
                  onClick={() => addLedger("+")}
                  disabled={loading}
                >
                  + Add Content
                </button>
                <button
                  className="rounded bg-rose-600 px-3 py-2 text-white disabled:opacity-50"
                  onClick={() => addLedger("-")}
                  disabled={loading}
                >
                  - Remove Content
                </button>
              </div>
            </div>

            <div className="mt-4 max-h-52 overflow-auto rounded border border-zinc-300 bg-zinc-50 p-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
              {(project.contentLedger ?? []).length === 0 && "No ledger entries yet."}
              {(project.contentLedger ?? []).map((entry) => (
                <div key={entry.id} className="mb-3 border-b pb-2 last:border-b-0">
                  <p className="font-medium">
                    {entry.op} {entry.title}
                  </p>
                  <p className="text-zinc-700">{entry.content}</p>
                  <p className="text-xs text-zinc-500">
                    {entry.createdAt} {entry.reason ? `• ${entry.reason}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <p className="mt-2 text-center text-sm text-zinc-500">
        Built by{" "}
        <a
          href="https://www.abhisheknagaraja.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-zinc-700"
        >
          Logan
        </a>
      </p>
    </div>
  );
}
