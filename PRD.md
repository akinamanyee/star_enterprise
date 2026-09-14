# PRD — Star Enterprise v1

## NORTHSTAR

Become the go-to digital gateway that connects every Hong Kong homeowner to a safety-accredited contractor in under 60 seconds.

## USER

Hong Kong residential homeowners who need renovation, air-conditioning, external-wall repair, or scaffolding work and want to verify a contractor's safety credentials before hiring.

## PROBLEM

Official lists of safety-accredited contractors are buried in static PDFs on government sites, making it nearly impossible for homeowners to quickly find, compare, and contact a vetted enterprise for their specific trade and district.

## USER JOURNEY

1. **Homeowner — lands on the page.** Sees a bite-sized educational hub at the top explaining renovation liability rules, the importance of fall-arrest equipment compliance, working-at-height safety courses, and the 2-year re-certification cycle. Localized safety-character illustrations (watercolor/traditional comic style) sit in designated image placeholders alongside the copy.
2. **Homeowner — searches naturally.** Types a casual query ("AC dripping in Yuen Long") into the search bar. Gemini converts the query into a structured filter `{"trade": "Air-conditioning", "location": "Yuen Long"}` and the bento-box grid instantly narrows to matching contractors.
3. **Homeowner — scans and compares.** Browses a responsive bento-box card grid. Each card shows Enterprise Name, Address, Telephone, Effective Date, and Accreditation Since, plus a dynamic badge (OSH Star or OSH Gold Star). Cards are scannable at a glance on both phone and desktop.
4. **Homeowner — contacts a contractor.** Taps a one-click `tel:` call button or a WhatsApp link (`https://wa.me/...`) directly on the card to reach the enterprise immediately.
5. **Operator (one-time, backend) — ingests PDF data.** Runs a backend script that feeds official contractor-list PDFs to the Gemini API, which extracts table data (Enterprise Name, Address, Telephone, Effective Date, Accreditation Since, safety tier) into a clean JSON array stored as the app's data source.

## SUCCESS

In the live demo: the educational hub renders at the top with placeholder character illustrations; the operator has already ingested at least one official PDF into JSON; the homeowner types "scaffolding Kowloon" into the search bar; Gemini translates it to structured filters; the bento grid narrows to matching contractors with correct badges; the homeowner taps the WhatsApp link on a card and the device opens WhatsApp with the contractor's number pre-filled.

## OUT OF SCOPE

- User accounts, login, or saved-contractor lists
- Contractor-side portal or self-registration
- Online booking, payment, or quoting
- Reviews, ratings, or contractor ranking
- Real-time availability or scheduling
- Automated periodic PDF re-ingestion (operator runs the script manually)
- Multi-language support (English-only v1)

## HARD CONSTRAINTS

- **Public access, no auth.** The entire site is read-only and publicly accessible — no sign-in, no user data stored, no RLS needed.
- **Single data source.** The ingested JSON array is the sole data truth for contractor listings. The educational hub content is static markup.
- **AI calls are server-side only.** Gemini API key never reaches the client. Two server endpoints: one for PDF ingestion (operator-only, not exposed publicly), one for search-query translation (called by the frontend search bar).
- **Per-user search cap.** A basic rate limit on the search-translation endpoint (e.g. 30 requests/hour per IP) to stay within Gemini Free Tier limits.
- **Containerized for Cloud Run.** Repo includes a working Dockerfile; the app runs as a single container serving both frontend and API.
- **TanStack Start.** Frontend is built with TanStack Start (React, file-based routing, SSR-capable).
- **Safety tier badges.** Each card displays exactly one of two badges — OSH Star or OSH Gold Star — derived from the ingested data.
- **Contact actions.** Every card has a `tel:` link and a WhatsApp `https://wa.me/<number>` link. If a phone number is missing from the source data, the card omits both actions and shows "Contact unavailable."
