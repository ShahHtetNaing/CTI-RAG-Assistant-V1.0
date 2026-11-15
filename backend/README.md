# Extracted CTI RAG engine and API

`rag_engine.py` is extracted from the selected notebook code cells. `api.py` is a thin FastAPI adapter that calls the existing `process_soc_query()` function; it does not implement a second RAG pipeline.

See `../docs/ARCHITECTURE.md` for Colab startup and Vercel configuration. Do not deploy this backend to Vercel; it needs the Colab GPU runtime.
