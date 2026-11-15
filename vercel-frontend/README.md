# CTI Intelligence Workspace — Vercel Frontend

A responsive static HTML/CSS/JavaScript interface for the CP5403 CTI RAG assistant. It is based on the actual workflow and evidence sources described in `notebooks/CTI_RAG_Assistant.ipynb`.

## What is included

- CTI research and email-triage modes
- Optional live ThreatCluster evidence toggle
- Explicit separation of dataset, archive, feed and live API provenance
- Results panel with answer text, citations, source records and timing metadata
- Responsive analyst dashboard layout
- Demo mode, clearly labelled as a non-connected preview
- API mode for a backend implementing the JSON contract below

## Deploy to Vercel

1. Copy the contents of this `vercel-frontend` folder into the root of a GitHub repository, or set this folder as the Vercel project's **Root Directory**.
2. Import the GitHub repository into Vercel.
3. No build command is required. The site is plain HTML, CSS and browser JavaScript.
4. The entry point is `index.html`.
5. Deploy. The first deployment runs in **demo mode** and does not contact the model, Hugging Face datasets, PhishDestroy or ThreatCluster.

## Enable a backend

Edit `config.js`:

```js
window.CTI_CONFIG = {
  mode: "api",
  apiBaseUrl: "https://YOUR-BACKEND-HOST",
  researchPath: "/api/cti/research",
  triagePath: "/api/cti/triage",
  timeoutMs: 180000
};
```

`apiBaseUrl` must point to a backend you control. Do not put Hugging Face tokens or the ThreatCluster API key in `config.js`, HTML, CSS or browser JavaScript. Secrets belong in the backend's secret/environment settings.

### API request contract

CTI research request:

```json
{
  "question": "What documented incidents affected healthcare?",
  "include_live_api": true
}
```

Email triage request:

```json
{
  "email_text": "Subject: ... From: ... Message body ...",
  "include_live_api": false
}
```

Expected JSON response (both endpoints):

```json
{
  "answer": "Markdown-formatted answer with inline evidence citations.",
  "sources": [
    {
      "label": "S1",
      "kind": "DATASET",
      "title": "Incident record title",
      "source_channel": "threatcluster/threat-incident-clusters",
      "record_date": "2026-09-06",
      "source_url": "https://...",
      "excerpt": "Short retrieved evidence excerpt"
    },
    {
      "label": "L1",
      "kind": "LIVE API",
      "title": "Live record title",
      "source_channel": "ThreatCluster live API",
      "fetched_at": "2026-11-11T00:00:00Z",
      "source_url": "https://...",
      "excerpt": "Short API evidence excerpt"
    }
  ],
  "live_status": "Live API queried; result provenance and timestamp shown above.",
  "meta": {
    "retrieval_seconds": 1.4,
    "generation_seconds": 9.2,
    "total_seconds": 10.6,
    "evidence_count": 2
  }
}
```

`source_url` may be omitted when the original source URL is not supplied. Keep `S#`, `C#`, `V#`, `R#` and `L#` labels aligned with the notebook's source channels. Live API records must remain clearly distinguished from static datasets.

## Important architecture note

Vercel hosts the frontend. It does **not** run the Gemma 2 2B 4-bit model or automatically execute the Colab notebook. The existing Gradio notebook is a prototype runtime, not yet a stable JSON API. To use API mode, expose the notebook's `process_soc_query()` workflow through a backend service that implements the JSON routes above, or build and deploy an equivalent API on a persistent GPU-capable host. A temporary Colab runtime/share link is not a production backend.

The notebook's live ThreatCluster key and Hugging Face token must be held by that backend, never by this frontend.

## Evidence and privacy notes

- The UI reflects the notebook's strict grounding rule: only selected dataset records and separately labelled live ThreatCluster records can support factual answers.
- Ransomware leak-site victim entries represent group claims, not independently verified incidents.
- A PhishDestroy non-match is not proof that an email or domain is safe.
- For optional email enrichment, the backend should send only an extracted domain to the live API, never the pasted email text, consistent with the notebook's privacy boundary.
- Timing and evidence values are displayed from backend response metadata; the frontend does not fabricate model progress or source counts.

## Reference design

This is an independently implemented SOC-style interface using a dark navy palette, emerald accent, responsive left navigation, analytical cards and evidence traceability. The supplied reference URL could not be fetched by the build environment, so exact visual matching has not yet been verified. A screenshot of that site can be used for a closer visual pass.
