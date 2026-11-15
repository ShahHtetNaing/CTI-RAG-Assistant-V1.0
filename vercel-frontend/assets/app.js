(() => {
  "use strict";
  const config = window.CTI_CONFIG || { mode: "demo", apiBaseUrl: "", researchPath: "/api/cti/research", triagePath: "/api/cti/triage", timeoutMs: 180000 };
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const state = { mode: "research", busy: false };

  const sampleEmail = `Subject: Urgent account suspension\nFrom: Security Team <notice@account-check.example>\n\nYour account will be closed today. Verify your password immediately using https://account-check.example/verify`;

  const el = {
    query: $("#queryInput"), queryLabel: $("#queryLabel"), queryHelp: $("#queryHelp"), badge: $("#inputModeBadge"),
    liveToggle: $("#liveToggle"), privacy: $("#privacyNote"), submit: $("#analyseButton"), submitText: $("#analyseButtonText"),
    char: $("#charCount"), resultsTitle: $("#resultsTitle"), resultStatus: $("#resultStatus"), empty: $("#resultsEmpty"),
    content: $("#resultsContent"), answer: $("#answerText"), sources: $("#sourceList"), sourceCount: $("#sourceCount"),
    liveStatus: $("#liveStatusText"), retrieval: $("#retrievalTime"), generation: $("#generationTime"),
    total: $("#totalTime"), evidence: $("#evidenceCount"), toast: $("#toast")
  };

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }

  // Lightweight safe text formatter: supports basic markdown, but never trusts raw HTML.
  function renderAnswer(value) {
    const safe = escapeHTML(value);
    return safe
      .replace(/^### (.*)$/gm, "<h4>$1</h4>")
      .replace(/^## (.*)$/gm, "<h3>$1</h3>")
      .replace(/^# (.*)$/gm, "<h2>$1</h2>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/^\s*[-*] (.*)$/gm, "<li>$1</li>")
      .replace(/(?:<li>.*<\/li>\s*)+/gs, (list) => `<ul>${list}</ul>`)
      .replace(/\n{2,}/g, "</p><p>")
      .replace(/\n/g, "<br>")
      .replace(/^/, "<p>")
      .replace(/$/, "</p>");
  }

  function toast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("visible");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.toast.classList.remove("visible"), 3200);
  }

  function setMode(mode) {
    state.mode = mode;
    const research = mode === "research";
    $("#researchTab").classList.toggle("selected", research);
    $("#emailTab").classList.toggle("selected", !research);
    $("#researchTab").setAttribute("aria-selected", String(research));
    $("#emailTab").setAttribute("aria-selected", String(!research));
    $("#researchExamples").classList.toggle("hidden", !research);
    $("#emailExamples").classList.toggle("hidden", research);
    el.query.rows = research ? 5 : 8;
    el.queryLabel.textContent = research ? "What would you like to investigate?" : "Paste the suspicious email for analysis";
    el.queryHelp.textContent = research
      ? "Ask about threat actors, malware, vulnerabilities, incidents, targets, impact or documented mitigations."
      : "Include the subject, sender, message body and visible URLs. Remove confidential or personal information first.";
    el.badge.textContent = research ? "RESEARCH MODE" : "EMAIL TRIAGE";
    el.query.placeholder = research
      ? "Example: Give two documented healthcare ransomware incident cases. Include reported impact and response where available..."
      : "Subject: ...\nFrom: ...\n\nPaste the email body and visible URLs here...";
    el.submitText.textContent = research ? "Analyse intelligence query" : "Analyse suspicious email";
    if (!research) el.liveToggle.checked = false;
    el.liveToggle.disabled = false;
    el.privacy.innerHTML = research
      ? "<span>ⓘ</span> Live search sends a short query keyword, not your complete prompt."
      : "<span>ⓘ</span> Email text is not sent to the live API. Optional enrichment sends only an extracted domain.";
    el.char.textContent = `${el.query.value.length} characters`;
    el.query.focus();
  }

  function setBusy(busy) {
    state.busy = busy;
    el.submit.disabled = busy;
    el.submit.classList.toggle("is-busy", busy);
    el.submitText.textContent = busy ? "Analysing evidence…" : (state.mode === "research" ? "Analyse intelligence query" : "Analyse suspicious email");
    if (busy) {
      el.resultStatus.innerHTML = '<span class="loading-ring"></span> PROCESSING REQUEST';
      el.resultsTitle.textContent = "Retrieving and analysing evidence";
      el.empty.classList.remove("hidden");
      el.empty.innerHTML = '<div class="processing-orbit"><span></span><i></i><b></b></div><strong>Working through the evidence</strong><p>The interface is waiting for the configured backend. The model may take a little time to respond.</p>';
      el.content.classList.add("hidden");
    }
  }

  function formatSeconds(value) {
    if (value === undefined || value === null || value === "") return "—";
    const n = Number(value);
    return Number.isFinite(n) ? `${n.toFixed(2)}s` : String(value);
  }

  function displaySources(items) {
    if (!Array.isArray(items) || items.length === 0) {
      el.sources.innerHTML = '<div class="no-sources">No source records were returned by the backend. Check the source panel or backend response.</div>';
      el.sourceCount.textContent = "0 SOURCES";
      return;
    }
    el.sourceCount.textContent = `${items.length} SOURCE${items.length === 1 ? "" : "S"}`;
    el.sources.innerHTML = items.map((source, index) => {
      const label = source.label || source.citation || `S${index + 1}`;
      const title = source.title || source.name || "Untitled evidence record";
      const channel = source.source_channel || source.channel || source.dataset || source.source_dataset || "Source channel not supplied";
      const kind = source.kind || (String(label).startsWith("L") ? "LIVE API" : "DATASET");
      const date = source.record_date || source.fetched_at || source.date || "Date not supplied";
      const url = source.source_url || source.url || source.dataset_url || "";
      const excerpt = source.excerpt || source.evidence || source.summary || "";
      return `<article class="source-result-item"><div class="source-result-top"><span class="citation-badge ${kind.toLowerCase().includes("live") ? "live-citation" : ""}">[${escapeHTML(label)}]</span><span class="source-kind-label">${escapeHTML(kind)}</span></div><strong>${escapeHTML(title)}</strong><small>${escapeHTML(channel)} · ${escapeHTML(date)}</small>${excerpt ? `<p>${escapeHTML(String(excerpt).slice(0, 420))}${String(excerpt).length > 420 ? "…" : ""}</p>` : ""}${url ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener">Open source <b>↗</b></a>` : ""}</article>`;
    }).join("");
  }

  function showResult(payload, demo = false) {
    const answer = typeof payload.answer === "string" ? payload.answer : (payload.output || payload.result || "The backend returned no answer text.");
    const meta = payload.meta || payload.metadata || {};
    const sources = payload.sources || payload.evidence || [];
    const sourcesMarkdown = payload.sources_markdown || "";
    el.resultsTitle.textContent = demo ? "Preview interface response" : "Analysis complete";
    el.resultStatus.innerHTML = demo
      ? '<span class="demo-ring"></span> DEMO PREVIEW'
      : '<span class="completed-ring"></span> COMPLETE';
    el.empty.classList.add("hidden");
    el.content.classList.remove("hidden");
    el.answer.innerHTML = renderAnswer(answer);
    if (sourcesMarkdown) {
      const labels = sourcesMarkdown.match(/\[(?:S|C|V|R|L|IOC)\d+\]/g) || [];
      el.sourceCount.textContent = `${labels.length} CITATION${labels.length === 1 ? "" : "S"}`;
      el.sources.innerHTML = `<div class="source-markdown">${renderAnswer(sourcesMarkdown)}</div>`;
    } else {
      displaySources(sources);
    }
    el.retrieval.textContent = formatSeconds(meta.retrieval_seconds ?? meta.retrieval_time);
    el.generation.textContent = formatSeconds(meta.generation_seconds ?? meta.generation_time);
    el.total.textContent = formatSeconds(meta.total_seconds ?? meta.total_time);
    el.evidence.textContent = String(meta.evidence_count ?? sources.length);
    el.liveStatus.textContent = payload.live_status || (demo ? "Demo mode: no dataset, live feed or model was queried." : "");
  }

  function demoResponse(mode) {
    if (mode === "email") {
      return {
        answer: "**Preview mode only — no email analysis was performed.**\n\nThe interface is ready to display the notebook's preliminary phishing indicators, extracted URLs and domains, PhishDestroy feed matches, contextual CTI evidence and an evidence-based risk assessment.\n\nA real result requires a connected backend. A domain not found in a blocklist must never be treated as proof that an email is safe.",
        sources: [], live_status: "No email text or domain was sent anywhere. Demo mode does not execute feed lookups or model inference."
      };
    }
    return {
      answer: "**Preview mode only — no CTI search was performed.**\n\nThe connected notebook workflow will classify the question, retrieve narrative records through ChromaDB and BM25, query structured CVE or ransomware records when relevant, optionally request separately labelled ThreatCluster live results, and generate a source-bound answer with citations.\n\nWhen the selected evidence does not support a requested fact, the assistant should report that it was not found rather than infer an answer from pretrained model knowledge.",
      sources: [], live_status: "Demo mode: no dataset, live feed, API request or model inference was executed."
    };
  }

  async function callBackend(question) {
    const isResearch = state.mode === "research";
    const path = isResearch ? config.researchPath : config.triagePath;
    let base = String(config.apiBaseUrl || "").trim() || localStorage.getItem("cti_colab_api_url") || "";
    if (!base) {
      base = window.prompt("Paste the HTTPS API URL printed by your running Google Colab session:", "");
      if (!base) throw new Error("No Google Colab API URL was provided.");
      base = base.trim().replace(/\/$/, "");
      localStorage.setItem("cti_colab_api_url", base);
    }
    const url = `${base}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(config.timeoutMs) || 180000);
    const body = isResearch
      ? { question, include_live_api: Boolean(el.liveToggle.checked) }
      : { email_text: question, include_live_api: Boolean(el.liveToggle.checked) };
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || data.error || `Backend error (${response.status})`);
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function runAnalysis() {
    const question = el.query.value.trim();
    if (!question) { toast(state.mode === "research" ? "Enter a CTI question first." : "Paste the suspicious email first."); el.query.focus(); return; }
    if (state.busy) return;
    setBusy(true);
    try {
      let payload;
      if (String(config.mode).toLowerCase() === "api") {
        payload = await callBackend(question);
        if (!payload || typeof payload !== "object") throw new Error("The backend returned an unsupported response.");
        showResult(payload, false);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 650));
        showResult(demoResponse(state.mode), true);
      }
      document.getElementById("resultsPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      const message = error.name === "AbortError" ? "The request timed out. Check that the model backend is running." : error.message;
      showResult({ answer: `**Unable to complete the request.**\n\n${message}\n\nCheck the backend URL, network access and JSON response format, then try again.`, sources: [], live_status: "Backend request failed." }, false);
      toast(message);
    } finally {
      setBusy(false);
    }
  }

  function updateRuntime() {
    const apiMode = String(config.mode).toLowerCase() === "api";
    $("#runtimeLabel").textContent = apiMode ? "Backend mode" : "Demo mode";
    $("#sidebarStatus").textContent = apiMode ? "API configured" : "Preview environment";
    $("#sidebarStatusText").textContent = apiMode ? "Requests route to configured backend" : "Backend connection not configured";
    $("#liveMetricText").textContent = apiMode ? "Available when backend API key is set" : "Requires API connection";
  }

  el.query.addEventListener("input", () => { el.char.textContent = `${el.query.value.length} characters`; });
  el.submit.addEventListener("click", runAnalysis);
  $("#researchTab").addEventListener("click", () => setMode("research"));
  $("#emailTab").addEventListener("click", () => setMode("email"));
  $("#clearInput").addEventListener("click", () => { el.query.value = ""; el.char.textContent = "0 characters"; el.query.focus(); });
  $$(".suggestion-chip[data-example]").forEach((button) => button.addEventListener("click", () => { el.query.value = button.dataset.example; el.char.textContent = `${el.query.value.length} characters`; el.query.focus(); }));
  $("#loadEmailExample").addEventListener("click", () => { setMode("email"); el.query.value = sampleEmail; el.char.textContent = `${el.query.value.length} characters`; });
  $("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  $$("[data-nav]").forEach((link) => link.addEventListener("click", () => {
    $$("[data-nav]").forEach((item) => item.classList.toggle("active", item === link));
    if (link.dataset.nav === "email") setMode("email");
    if (link.dataset.nav === "research") setMode("research");
    $("#sidebar").classList.remove("open");
  }));
  $("#todayLabel").textContent = new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()).toUpperCase();
  $("#startResearch").addEventListener("click", () => setMode("research"));
  updateRuntime();
})();
