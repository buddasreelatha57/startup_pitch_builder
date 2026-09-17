# Startup Pitch Builder

Pitchcraft turns a startup concept into an editable, investor-ready 10-slide pitch. The local demo is fully usable without cloud credentials and mirrors the production pipeline through clear service boundaries.

## What is included

- Premium React + TypeScript workspace with landing page, authentication, dashboard, project wizard, reference upload, and editor.
- Express TypeScript REST API with JWT authorization, validation, isolated project access, PDF-only upload checks, and structured errors.
- Exactly ten validated pitch slides, evidence labels, assumptions, editable titles, and slide-level AI refinement.
- Reference upload/index status and RAG-ready source attribution. The local adapter records retrieved document names; production adapters belong behind the same service contract.

## Architecture

`React UI → Express API → Project/Document stores → RAG retrieval adapter → Gemini generation adapter → validated slide schema`

The local development adapter never presents unprovided revenue, customers, market data, partnerships, or team claims as facts. They are marked **Not provided** or **Assumption required**.

## Run locally

1. Copy `.env.example` to `.env` in the workspace root (or `backend/.env` when running the backend from its directory).
2. Run `npm install` in the root, `frontend`, and `backend` folders.
3. Run `npm run dev` from the root.
4. Open the Vite URL (normally `http://localhost:5173`). The API runs on port `4000`.

Register an account, create a project (try **FarmConnect AI**, AgriTech, India), upload PDF reference decks, and generate the ten-slide pitch.

## Run with Docker

Copy the environment template to `backend/.env`, add your MongoDB and Google Cloud credentials, then build and run the container:

```powershell
docker build -t startup-pitch-builder .
docker run --env-file backend/.env -p 4000:4000 startup-pitch-builder
```

Open `http://localhost:4000`. The container builds and serves the frontend and API together.

## Google Cloud setup

Set the values in `.env` and authenticate the backend with Application Default Credentials (`gcloud auth application-default login`) or a service account. With `GOOGLE_GENAI_USE_ENTERPRISE=true`, Gemini uses Vertex AI in the configured project and location. Reference PDFs are uploaded to `gs://{GCS_BUCKET}/users/{userId}/projects/{projectId}/references/`.

Vertex Vector Search also requires `VERTEX_DEPLOYED_INDEX_ID`; the supplied `VERTEX_VECTOR_INDEX_ENDPOINT` identifies the endpoint but is not enough to query a deployed index. Once both values are configured, pitch generation requests an embedding and retrieves up to three nearest reference neighbors.

## API

`POST /api/auth/register`, `POST /api/auth/login`, `GET|POST /api/projects`, `GET /api/projects/:id`, `POST /api/projects/:id/references`, `POST /api/projects/:id/generate`, `GET /api/projects/:id/pitch`, `PUT /api/projects/:id/slides/:slideId`, and `POST /api/projects/:id/slides/:slideId/improve`.

## Next production integrations

MongoDB now stores users and project history. Set `MONGODB_URI` and `MONGODB_DB` in `backend/.env`; passwords are hashed with bcrypt and project pitch edits persist across restarts. Keep the MongoDB URI out of Git and rotate the database password if it has been shared outside your trusted environment.
