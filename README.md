# Product-Pal

Product-Pal is a guided teardown agent for product teams. It helps users move step-by-step through a structured product teardown process, from problem framing and persona definition to recommendations, prioritization, and final presentation output.

## Problem Statement

Product teardown and strategy documentation are often scattered across chats, notes, screenshots, links, and drafts. This creates three major issues:

- Context gets lost between phases.
- Teams struggle to keep a clear, auditable decision trail.
- Turning research into polished final outputs (master doc + slides) is manual and slow.

Product-Pal solves this by combining a strict, conversational teardown workflow with append-only documentation and export-ready deliverables.

## Product Features

- **Guided sequential workflow (2.1 to 2.15):** Enforces one active teardown topic at a time with explicit validation gates.
- **User-first conversational phases:** Each phase starts with user input first, then generates agent suggestions.
- **Approval and revision loop:** Per-step controls for approve, request revision, and add context.
- **Post-approval updates:** Approved steps can be amended later without losing history.
- **Append-only master document:** Every validated exchange is preserved as an immutable event trail.
- **Knowledge Dump workspace:** Paste existing teardown notes, links, and research in one centralized context area.
- **Content Ledger (+ / -):** Track content operations as explicit add/remove entries with timestamps and reasons.
- **Artifact generation:** Build final master document, slide outline, review checklist, assumptions log, and downloadable PPTX.
- **Evidence-aware structure:** Captures citations/evidence metadata attached to generated content.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Vercel AI SDK (OpenAI + Gemini model routing support)
- Local JSON-backed runtime store for MVP persistence
- PptxGenJS for presentation export

## Getting Started

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Build and Lint

```bash
npm run lint
npm run build
```

## Deployment

Recommended platform: Vercel.
