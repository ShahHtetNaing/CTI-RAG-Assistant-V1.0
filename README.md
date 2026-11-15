# CTI RAG Assistant

A Google Colab-powered Cyber Threat Intelligence RAG assistant with a separate Vercel HTML/CSS/JavaScript interface.

## Architecture

- `notebooks/CTI_RAG_Assistant.ipynb`: original academic notebook, retained unchanged.
- `backend/rag_engine.py`: extracted implementation of the notebook's RAG pipeline.
- `backend/api.py`: thin FastAPI adapter that calls the extracted `process_soc_query()` function.
- `backend/Colab_API_Startup.ipynb`: Colab startup workflow for the API and temporary HTTPS tunnel.
- `vercel-frontend/`: static analyst dashboard for Vercel.

## Run

1. Clone this repository into Google Colab at `/content/CTI-RAG-Assistant`.
2. Open `backend/Colab_API_Startup.ipynb` and run its cells in order.
3. Copy the temporary `trycloudflare.com` HTTPS URL printed by the final cell.
4. Deploy `vercel-frontend/` from this same GitHub repository on Vercel (Framework Preset `Other`, Root Directory `vercel-frontend`, Build Command blank, Output Directory `.`).
5. Open the Vercel website, submit a question, and paste the Colab API URL when prompted.

Keep Colab running while using the site. The temporary tunnel changes after a runtime restart. The demo API has no user authentication; anyone who knows the URL can use the GPU. Do not process confidential emails.

## Secrets

Set `HF_TOKEN` and optionally `THREATCLUSTER_API_KEY` in Colab Secrets. Never put them in GitHub, Vercel frontend files or browser JavaScript.

See `docs/ARCHITECTURE.md` and `docs/EXTRACTION_NOTES.md`.
