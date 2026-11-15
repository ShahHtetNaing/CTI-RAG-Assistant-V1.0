# Extraction and preservation notes

- Original notebook copied unchanged: `notebooks/CTI_RAG_Assistant.ipynb`
- Source notebook SHA-256: `224056cd8ed4754117c485bb071d46350a51e0239031371f7a3136d98ce23ca3`
- Extracted source cells: 11, 14, 17, 20, 23, 24, and the processing/citation section of cell 30.
- `backend/rag_engine.py` retains the notebook's dataset loading, dataset catalogue, document creation, ChromaDB, BM25, Gemma 2 2B NF4 configuration, prompt templates, structured CVE/ransomware retrieval, case-study routing, email indicators, PhishDestroy checks, ThreatCluster API connector, citation functions, evidence gate, abstention logic and `process_soc_query()` implementation.
- The Gradio UI construction and Gradio progress callback are not part of the extracted engine. The only adaptation to `process_soc_query()` is replacing the Gradio progress default with an optional no-op callback so the same function can be called by FastAPI.
- `backend/api.py` is a thin adapter. It calls `rag_engine.process_soc_query()` for both CTI research and email triage. It does not contain an alternative prompt, retriever or generator.
- Static syntax checks passed for the extracted engine and API. This does not verify dependency installation, Colab GPU availability, dataset downloads, Gemma model access or live inference. Those must be tested in the user's Colab account.
