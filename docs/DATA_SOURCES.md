# Data sources, provenance and freshness

This project uses multiple evidence types. The application displays the source type and timestamp so that a live API response is not confused with a downloaded snapshot.

| Source | Use | Freshness | Caution |
|---|---|---|---|
| `threatcluster/threat-incident-clusters` | Incident summary retrieval and case-study selection | Periodic Hugging Face snapshot; selected notebook revision notes 2026-09-06 | Publisher-generated cluster summaries; verify key claims against linked reporting. |
| `threatcluster/cve-exploitation-signals` | CVE, CVSS, KEV and exploit-field lookup | Periodic snapshot; selected revision notes 2026-09-06 | Not a live vulnerability database. |
| `threatcluster/ransomware-leak-site-victims` | Group, named victim, sector and country lookup | Periodic snapshot; selected revision notes 2026-09-06 | A leak-site entry is a criminal group's claim, not independent proof of a confirmed breach, data theft or payment. |
| `reloading0101/threat-intelligence-dataset` | Curated CTI question/answer knowledge | No continuously updated schedule is promised | Treat as secondary curated content; inspect its source fields. |
| `guychuk/cyber-threat-intelligence-reports` | Historical CTI campaign/report archive | Historical/static archive | Not a current threat feed. Check the dataset card for provenance and license. |
| `phishdestroy/destroylist` | Exact phishing/scam domain and URL indicator lookup | Publisher says it syncs hourly; timestamp is read from its source metadata when available | Feed loaded at application startup. A non-match does not prove a domain is benign. |
| ThreatCluster `/search` API | Live incident clusters, entity hits and dark-web results | Queried at question time with a seven-day time window | Requires `THREATCLUSTER_API_KEY`; has credit costs, tier scopes and limited lookback. Results are labelled `[L#]`. |

## Evidence label conventions

- `[S#]`: narrative documents retrieved from selected datasets.
- `[C#]`: named incident records selected from the incident-cluster snapshot.
- `[V#]`: structured CVE record from the CVE snapshot.
- `[R#]`: structured ransomware listing from the victim-claims snapshot.
- `[L#]`: live API result returned at query time by ThreatCluster.

Keep these labels separate in answers, source panels, screenshots and evaluation notes.

## What "live" means in this project

- **Static/historical archive:** stored reports used for historical research.
- **Periodic snapshot:** a published dataset revision generated at a point in time. Downloading it again may retrieve a newer revision if the publisher updates it, but it is not continuously streaming.
- **Frequently refreshed feed:** the PhishDestroy publisher describes an hourly feed update. The app displays the timestamp it can read from the feed metadata.
- **Live API:** the application sends a request when the user submits a CTI query. It is not continuously polling, monitoring or alerting.

## ThreatCluster API usage and limits

The application calls `GET https://threatcluster.io/api/public/v1/search` with a single extracted keyword, `limit=5`, `days=7` and `include_articles=false`. It converts returned cluster/entity/dark-web buckets to traceable documents, retaining the API retrieval time, endpoint, request cost and remaining-credit header when supplied.

Current official documentation describes the free tier as 100 credits/day with a seven-day lookback and the `/search` endpoint as five credits per call. The app caches an identical keyword search for ten minutes inside the running process. This means repeated cached searches do not make a new request, but app restarts clear the cache.

References:
- [ThreatCluster API reference](https://threatcluster.io/about/api-reference)
- [ThreatCluster threats endpoint reference](https://threatcluster.io/about/api-reference/threats)
- [ThreatCluster free API details](https://threatcluster.io/about/free-api)
- [ThreatCluster getting started](https://threatcluster.io/get-started)

## Privacy boundary

For CTI research, the app sends only one selected keyword rather than the full question. Email Triage does not call the live API by default. When the optional email live-enrichment checkbox is enabled, it sends only the first extracted domain; it does not send the message body, sender name, headers or full URL path. Do not submit sensitive domains or email details without authorization.

## Dataset cards and attribution

- https://huggingface.co/datasets/threatcluster/threat-incident-clusters
- https://huggingface.co/datasets/threatcluster/cve-exploitation-signals
- https://huggingface.co/datasets/threatcluster/ransomware-leak-site-victims
- https://huggingface.co/datasets/reloading0101/threat-intelligence-dataset
- https://huggingface.co/datasets/guychuk/cyber-threat-intelligence-reports
- https://huggingface.co/datasets/phishdestroy/destroylist

The selected ThreatCluster dataset cards display CC BY 4.0. The curated CTI Q&A dataset card displays CC BY-NC-SA 4.0. PhishDestroy's current dataset card displays MIT. Verify the current license and attribution on every card before public redistribution; the historical CTI archive's license must be checked separately.

## Academic and operational cautions

A dataset snapshot generation date is not an incident date. Preserve the source-reported incident/record date separately from application retrieval time. Do not describe a ransomware victim listing as confirmed breach evidence without independent corroboration. Never invent victim names, attribution, financial losses, impact or mitigation. If a requested detail is absent from approved evidence, return: "Not found in the selected datasets or live API results."
