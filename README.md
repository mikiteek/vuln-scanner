# Vulnerability Scanner API (GitHub repo → Trivy report)

NestJS service that:
- clones GitHub repository
- scans it with Trivy
- parses generated Trivy report
- stores **critical** vulnerabilities.

High-level behavior:

1. `POST /api/scan` enqueues a scan job and returns a `scanId`.
2. A Bull worker clones the repo (child process), runs Trivy (child process), parses the JSON report, and stores results in MongoDB.
3. `GET /api/scan/:scanId` returns the current status + critical vulnerabilities (when finished).

## Requirements

- Node.js (18+ recommended)
- Docker + Docker Compose (plugin: `docker compose`)
- `git` installed (used to clone repositories)

## Docker-compose dependencies

This project uses `docker-compose.yml` for:

- **MongoDB** (scan persistence)
- **Redis** (Bull queue backend)
- **Trivy** image (invoked on-demand via `docker compose run ... trivy`)

Important: Trivy is not a long-running service here; the app runs Trivy as a one-off container per scan.

## Quickstart (local dev)

### 1) Start dependencies

```bash
docker compose up -d mongodb redis

# optional (pull Trivy image ahead of time)
docker compose pull trivy
```

### 2) Configure environment

Create a `.env` in the project root:

```bash
# required
DB_URI=mongodb://localhost:27017/scanner

# optional (defaults shown)
APP_PORT=3000
LOG_LEVEL=info
REDIS_HOST=localhost
REDIS_PORT=6379
```

Notes:

- If you run the Nest app on your host (recommended for dev), use `localhost` in `DB_URI`/`REDIS_HOST`.
- If you later containerize the Nest app, `DB_URI`/`REDIS_HOST` must use compose service names (`mongodb`, `redis`).

### 3) Install and run

```bash
npm install
npm run start:dev
```

Server defaults to `http://localhost:3000`.

## API

Base URL: `http://localhost:${APP_PORT:-3000}`

### `POST /api/scan/`

Enqueue a scan for a repository.

Request body:

```json
{
	"repoUrl": "https://github.com/mikiteek/NodeGoat"
}
```

Response: `202 Accepted`

```json
{
	"id": "65b2c4f3a1c2d3e4f5678901",
	"status": "Queued",
	"repoUrl": "https://github.com/mikiteek/NodeGoat",
	"criticalVulnerabilities": []
}
```

Validation:

- `repoUrl` must be a string with length 10..300.
- The scanner only supports `https://github.com/<owner>/<repo>` URLs (validated during cloning).

### `GET /api/scan/:scanId`

Fetch current scan status and results.

Response: `200 OK`

```json
{
	"id": "65b2c4f3a1c2d3e4f5678901",
	"status": "Scanning",
	"repoUrl": "https://github.com/mikiteek/NodeGoat",
	"criticalVulnerabilities": []
}
```

If the scan exists and has finished successfully, `status` is `Finished` and `criticalVulnerabilities` contains Trivy vulnerability objects.

If the scan does not exist: `404 Not Found`.

### Error format

Errors are returned as JSON (via a global exception filter), for example:

```json
{
	"statusCode": 400,
	"timestamp": "2026-02-01T12:00:00.000Z",
	"error": "Bad Request Exception",
	"path": "/api/scan",
	"messages": ["repoUrl must be longer than or equal to 10 characters"]
}
```

## Architecture

Core components:

- **HTTP API**: `ScanController` exposes endpoints under `/api/scan`.
- **Service layer**: `ScanService` creates a scan record and enqueues a Bull job.
- **Queue**: Bull queue `scan` (Redis-backed) processes jobs asynchronously.
- **Worker**: `ScanProcessor` handles `scan-repo` jobs.
- **Persistence**: MongoDB collection `scans` stores `repoUrl`, `status`, and `criticalVulnerabilities`.

Scan pipeline (happy path):

1. Store scan document with status `Queued`
2. Enqueue Bull job `{ scanId, repoUrl }`
3. Worker updates status to `Scanning`
4. Clone repo into `./tmp/<repo>_<timestamp>/`
5. Run Trivy `fs` scan via `docker compose run trivy ...` and write JSON report into `./tmp/scanner-reports/report_<scanId>.json`
6. Stream-parse the report and keep only vulnerabilities with `Severity=CRITICAL`
7. Store critical vulnerabilities in MongoDB
8. Update status to `Finished`
9. Cleanup cloned repo + report file

Statuses:

- `Queued` → `Scanning` → `Finished`
- Any error in cloning/scanning/parsing results in `Failed`

## Operational notes / limitations

- Repos: only `https://github.com/...` is supported by the clone helper.
- Private repos: authentication is not implemented (no token/SSH flow); scans will fail if the repo cannot be cloned anonymously.
- Trivy: requires the Docker daemon to be running and accessible to the Node process.
- Output: only **critical** vulnerabilities are stored/returned.

## Useful scripts

```bash
npm run start:dev     # watch mode
npm run build         # build to dist/
npm run start:prod    # run dist/main
npm run lint
npm run test
npm run test:e2e
```
