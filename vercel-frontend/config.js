/**
 * Vercel frontend configuration.
 * Leave apiBaseUrl blank to be prompted for the temporary Colab tunnel URL.
 * Never put HF_TOKEN or THREATCLUSTER_API_KEY here.
 */
window.CTI_CONFIG = {
  mode: "api",
  apiBaseUrl: "",
  researchPath: "/api/cti/research",
  triagePath: "/api/cti/triage",
  timeoutMs: 240000
};
