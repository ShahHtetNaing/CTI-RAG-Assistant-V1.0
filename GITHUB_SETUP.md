# GitHub setup checklist

## 1. Create the repository

1. Sign in to GitHub.
2. Select **New repository**.
3. Suggested name: `cyber-threat-intelligence-rag-assistant`.
4. Description: `Evidence-grounded CTI research and preliminary phishing email triage using Gemma 2, ChromaDB and Gradio.`
5. Set visibility to **Private** while developing. You can make it public later if your lecturer permits.
6. Do not initialise with a README if you are uploading this prepared folder, because it already contains one.

## 2. Review before uploading

- [ ] Open the notebook and confirm no Hugging Face token, API key, password or private email is present.
- [ ] Do not upload downloaded datasets, model weights, ChromaDB persistence folders or Colab cache.
- [ ] Keep the notebook outputs cleared before committing.
- [ ] Check that the dataset licences permit your intended use and attribution.
- [ ] Add your own name/student details only if you are comfortable and your course requires them.
- [ ] Keep real organisation, patient, employee and customer information out of the repository.

## 3. Upload using Git

Download and extract the project ZIP. Open a terminal in the extracted folder and run:

```bash
git init
git add README.md .gitignore .env.example requirements.txt notebooks docs spaces GITHUB_SETUP.md
git status
git commit -m "Initial CTI RAG assistant project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/cyber-threat-intelligence-rag-assistant.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username and use the repository URL GitHub provides.

If Git asks you to authenticate, use GitHub's supported browser sign-in or a personal access token. Never paste a token into the repository or commit history.

## 4. Upload through the GitHub website instead

1. Open your new repository.
2. Choose **Add file → Upload files**.
3. Upload the contents of the extracted project folder (not the ZIP itself).
4. Add a commit message such as `Initial project upload`.
5. Select **Commit changes**.

For a notebook and documentation, the website upload is sufficient. Git is better for later version control.

## 5. Recommended repository structure

```text
cyber-threat-intelligence-rag-assistant/
├── README.md
├── requirements.txt
├── .gitignore
├── .env.example
├── GITHUB_SETUP.md
├── notebooks/
│   └── CTI_RAG_Assistant.ipynb
├── spaces/
│   ├── app.py
│   ├── README.md
│   └── requirements.txt
└── docs/
    ├── DATA_SOURCES.md
    ├── GITHUB_SETUP.md
    ├── HF_SPACES_DEPLOYMENT.md
    └── VALIDATION_STATUS.md
```

## 6. After uploading

- Open the notebook in GitHub and check that it renders.
- Copy the repository URL into your assessment report.
- Add a short project description and relevant topics: `rag`, `cyber-threat-intelligence`, `gradio`, `chromadb`, `gemma`, `phishing-detection`.
- Commit future improvements with meaningful messages.
- Do not describe the project as continuous or always-on CTI monitoring: the ThreatCluster API is queried only when a user submits a request, and the live service still needs to be verified with your own API key.
