# Star Enterprise

This file is the single source of truth (SSOT) for AI behavior on this project.
Every AI-assisted change must follow the principles below.

## Coding Principles

- **No assumptions.** Base everything on facts. If unsure, investigate first.
- **Never delegate up.** You work for the user, not the other way around. When a
  decision is needed, investigate, then bring a recommended answer with a
  one-line why — the user's job is to approve or reject, not to do the
  thinking. Ask only when a call genuinely needs them, and never empty-handed.
- **No shortcuts, no workarounds, no lazy patches.** Fix the root cause.
- **Fix it properly, not narrowly.** When the clean fix spans several files,
  that is the right fix — don't force a hacky one-file patch to avoid it.
  Simple means well-structured, not fewest-lines — never add scope the task
  didn't ask for.
- **If something errors, show the real error to the user.** Never fake
  success, never use mock data.
- **Never trust AI output blindly.** For structured generation, use a model
  and gateway that support structured outputs, validate against the schema,
  and retry or repair on a mismatch. Keep schemas lean; a failed generation
  fails loud, never silently faked or empty.
- **Think about the whole system** (frontend, backend, database, UX) — don't
  break existing features.
- **Security follows the PRD's access model** — build exactly the protection
  it calls for, no more and no less. Where the model has user accounts or
  private data, access-control it so each user can read and write only their
  own rows — for database tables, enforce this with row-level security (RLS)
  policies, the database's own gate, not just an app-route check. Enforce
  every gate on the server, never the client — a gate you can bypass by
  editing the URL is not a gate. Validate and sanitise all input server-side.
  Secrets (API keys, tokens, passwords) live only in the platform's secret
  store — never in chat, in code, in the PRD, or in a commit.
- **Protect existing data.** A schema change to a table that already holds
  data must migrate it, never drop-and-recreate. Surface any destructive
  migration before running it.
- **Maintain Single Source of Truth (SSOT).** Every piece of data has exactly
  one authoritative home. No duplicates, no parallel truths. When data must be
  derived, derive it at one place and flow it outward.
- **Never trust auto-memory as truth.** Auto-generated memory (e.g. Lovable's
  `.lovable/plan.md` and `mem://` files) drifts and is often stale or partial —
  treat it as unreliable scratch, never a source of truth. The code and the
  maintained docs (`PRD.md`, the Changelog, the Product Roadmap, and plan
  files) are the only authoritative sources; reconcile against them and
  re-read the real files, never memory.
- **Keep it simple and fit-for-purpose.**
- **Must work with TanStack Start.**
- **Write clean, elegant code** — not tutorial-flavored fluff.
- **Design like a craftsman, not a default.** Every UI must look
  intentionally crafted — deliberate typography, spacing, hierarchy, and
  restraint — genuinely pleasing to use and easier to understand. It must be
  responsive (works and looks right on phone and desktop). Reject the generic
  AI-default look (stock gradients, lone centered cards, emoji headings,
  untouched component defaults); beautify before every final output.

## Authoritative Docs

- `PRD.md` — the product requirements (single source of truth for scope)
- `Product_Roadmap.md` — ordered milestones; the next milestone to build
- `CLAUDE.md` (this file) — coding principles binding on every change
