# Product Roadmap — Star Enterprise

Ordered so the product is usable at every step; each milestone builds on the last.

## Milestone 1: The Data Foundation

**Value:** The official contractor lists exist as clean, structured, searchable data instead of locked-up PDFs.

The operator runs the ingestion script against the four trade-category PDFs (Interior Renovation, Air-conditioning, External Wall/Pipe, Truss-out Scaffolding). Each contractor record comes out with enterprise name, address, telephone, effective date, accreditation since, safety tier (OSH Star / OSH Gold Star), trade, and normalized district. The output is a single validated JSON file — the app's sole data source.

*Traces to: PRD User Journey step 5 (operator ingests PDF data), Hard Constraint (single data source).*

## Milestone 2: The Contractor Grid

**Value:** A homeowner opens the site and immediately sees every vetted contractor in a scannable, responsive card layout — the PDF directory is now a living page.

The TanStack Start app renders the full bento-box card grid from the ingested JSON. Each card shows enterprise name, address, phone, dates, trade, and a dynamic OSH Star or OSH Gold Star badge. Cards with a phone number have one-click call (`tel:`) and WhatsApp (`wa.me`) buttons; cards without show "Contact unavailable." The grid is responsive — usable on phone and desktop. Server-side rendered for fast load and SEO.

*Traces to: PRD User Journey steps 3–4, Hard Constraints (safety tier badges, contact actions, TanStack Start, containerized).*

## Milestone 3: Natural Language Search

**Value:** The homeowner types what they need in plain language — "AC dripping in Yuen Long" — and the grid narrows instantly to the right contractors, no dropdowns or filters to learn.

A search bar sits above the grid. The query goes to a server function that sends it to Gemini, which returns structured filters (trade, district). The grid filters to matching contractors. If Gemini fails or returns nothing useful, the app falls back to client-side text search so the homeowner always gets results. A best-effort per-IP rate limit protects Free Tier Gemini usage.

*Traces to: PRD User Journey step 2, Hard Constraints (AI calls server-side only, per-user search cap), SUCCESS demo scenario.*

## Milestone 4: The Educational Hub

**Value:** Before searching, the homeowner learns why hiring a safety-accredited contractor matters — renovation liability, fall-arrest equipment standards, working-at-height courses, and the 2-year re-certification rule — building trust in the directory below and capturing high-intent local SEO traffic.

A static content section at the top of the page with bite-sized educational cards. Designated image placeholder slots are styled and ready for the owner's commissioned character illustrations (watercolor/traditional comic style). Content is factual, sourced from public OSHC and Buildings Ordinance guidelines. Semantic HTML and SSR ensure search engines index it.

*Traces to: PRD User Journey step 1, SUCCESS (educational hub renders with placeholder illustrations), Out of Scope confirms no dynamic content generation.*

## Milestone 5: Deployment-Ready Container

**Value:** The product ships — a single `docker build && docker run` puts the complete working app on Google Cloud Run, with the Gemini API key as the only secret to configure.

The repo includes a production Dockerfile that builds the TanStack Start app and bakes in the contractor JSON data. One container serves everything: SSR pages, the search server function, static assets. The operator deploys to Cloud Run, sets the Gemini API key via environment/Secret Manager, and the site is live.

*Traces to: PRD Hard Constraints (containerized for Cloud Run, Dockerfile in repo, secrets in platform secret store only).*
