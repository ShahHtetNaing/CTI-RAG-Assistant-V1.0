# Hugging Face Spaces deployment guide

This repository supports two deployment paths:

1. **Google Colab:** run `notebooks/CTI_RAG_Assistant.ipynb` with a compatible GPU.
2. **Hugging Face Spaces:** deploy the standalone Gradio application from the `spaces/` directory.

The Spaces app is a separate entry point because Hugging Face Spaces expects `app.py`, a root-level `requirements.txt` and Space metadata in the root `README.md`. The files in `spaces/` are already prepared for that layout.

## 1. Confirm Gemma access

1. Sign in to Hugging Face.
2. Open the [Gemma 2 2B Instruct model page](https://huggingface.co/google/gemma-2-2b-it).
3. Review and accept Google's Gemma terms.
4. Create a Hugging Face access token with read access.

## 2. Create a Gradio Space

1. Create a new Space at [Hugging Face New Space](https://huggingface.co/new-space).
2. Choose **Gradio** as the SDK and a name such as `cti-rag-assistant`.
3. Select a compatible GPU. The included metadata recommends `a10g-small`; the recommendation does not allocate the hardware automatically.
4. Create the Space.

## 3. Push the `spaces/` folder contents

Clone the newly created Space repository, then copy the contents of this project's `spaces/` directory into the clone. For example, from the project root:

```bash
git clone https://huggingface.co/spaces/YOUR-HF-USERNAME/cti-rag-assistant hf-space
cp spaces/app.py spaces/README.md spaces/requirements.txt hf-space/
cd hf-space
git add app.py README.md requirements.txt
git commit -m "Deploy CTI RAG assistant"
git push
```

On Windows PowerShell, use `Copy-Item` instead of `cp`:

```powershell
git clone https://huggingface.co/spaces/YOUR-HF-USERNAME/cti-rag-assistant hf-space
Copy-Item .\spaces\app.py, .\spaces\README.md, .\spaces\requirements.txt .\hf-space\
Set-Location .\hf-space
git add app.py README.md requirements.txt
git commit -m "Deploy CTI RAG assistant"
git push
```

Replace the example username and Space name with your own.

## 4. Add secrets in Space settings

Under **Settings → Variables and secrets → Secrets**, add:

| Secret name | Purpose |
|---|---|
| `HF_TOKEN` | Read access to the gated Gemma model repository |
| `THREATCLUSTER_API_KEY` | Enables optional live ThreatCluster search |

Do not add either secret to `README.md`, `app.py`, `requirements.txt`, GitHub, notebook output or screenshots. The application reads secrets from environment variables at runtime.

## 5. Confirm the Space starts

The first build downloads Python dependencies, Hugging Face datasets, the embedding model and Gemma weights. Check the Space's **Logs** tab if startup fails. Common issues:

- Gemma access not accepted, or the `HF_TOKEN` secret is missing/invalid.
- No CUDA GPU selected. This app intentionally requires GPU for the existing 4-bit NF4 model loader.
- Not enough available RAM, GPU RAM or temporary disk space during the initial downloads and vector-index construction.
- A dependency build failure. Review the first failing package in Space logs before changing versions.

## 6. Verify live API integration

1. Confirm `THREATCLUSTER_API_KEY` exists as a Space secret.
2. Open the app's **CTI Research** tab and leave the live API checkbox enabled.
3. Ask a query containing a distinctive threat name or category.
4. Expand **Sources, dataset citations and retrieved evidence**.
5. Confirm live records are marked `[L#]`, show the API endpoint and fetch time, and report request cost/remaining credits.

The free API tier is documented as 100 credits/day with a seven-day lookback. `/search` costs five credits per call. The app caches a repeated keyword search for ten minutes while its process remains running. API availability, scopes, quotas and pricing may change; recheck the [ThreatCluster API reference](https://threatcluster.io/about/api-reference).

For privacy, CTI Research sends one extracted keyword. Email Triage defaults to no live API request; the optional checkbox sends only the first extracted domain, never the message body or full email.

## 7. Keep Colab and Spaces aligned

When changing retrieval, prompts or source handling:

- Update `notebooks/CTI_RAG_Assistant.ipynb` and `spaces/app.py` together.
- Keep source labels distinct: `[S#]`/`[C#]`/`[V#]`/`[R#]` are selected dataset records; `[L#]` is live ThreatCluster API data.
- Test the notebook and the Space independently. A notebook run does not prove that the Space runtime works.
