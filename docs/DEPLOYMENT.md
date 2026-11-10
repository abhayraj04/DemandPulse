# Render Deployment & Production Operations Guide
## DemandVision AI: Single Web Service Deployment Architecture

This guide explains how DemandVision AI is deployed to **Render** as a single, cost-effective web service on the Free Tier.

---

### 1. Architecture Overview

Rather than running separate frontend (e.g. Vercel) and backend (e.g. Render) services—which introduces CORS configuration issues, multiple hosting bills, and complex environment synchronization—DemandVision AI compiles the React frontend into static assets that are served directly through FastAPI:

```
[Browser]
   │
   ▼
[Render Single Web Service] (Port: $PORT)
   │
   ▼
[FastAPI / Uvicorn Server]
   ├── /api/*          ──> REST API Endpoints (JSON)
   ├── /assets/*       ──> Compiled Vite Static Assets (JS / CSS / SVG)
   └── /* (Catch-all)  ──> React index.html SPA Fallback
```

---

### 2. Configuration Files

1. **`build.sh`**:
   Automates the end-to-end build on Render:
   ```bash
   #!/usr/bin/env bash
   set -e
   pip install --upgrade pip
   pip install -r requirements.txt
   cd frontend
   npm ci || npm install
   npm run build
   cd ..
   ```

2. **`render.yaml`**:
   Declarative Infrastructure-as-Code for Render:
   ```yaml
   services:
     - type: web
       name: demandvision-ai
       env: python
       region: oregon
       plan: free
       buildCommand: bash build.sh
       startCommand: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
       envVars:
         - key: PYTHON_VERSION
           value: 3.11.8
         - key: NODE_VERSION
           value: 20.11.0
         - key: ENVIRONMENT
           value: production
         - key: DEBUG
           value: false
   ```

---

### 3. Step-by-Step Render Deployment Guide

1. **Push Repository to GitHub**:
   Ensure all changes are committed and pushed to your GitHub repository:
   ```bash
   git add .
   git commit -m "feat: complete DemandVision AI platform"
   git push origin main
   ```

2. **Log In to Render**:
   - Go to [https://render.com](https://render.com) and sign in with GitHub.
   - Click **New +** -> **Web Service**.
   - Select your `DemandVision-AI` repository.

3. **Configure Service Details**:
   - **Name**: `demandvision-ai`
   - **Environment**: `Python`
   - **Region**: `Oregon (US West)` (or closest region)
   - **Branch**: `main`
   - **Build Command**: `bash build.sh`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`

4. **Environment Variables**:
   Under the **Environment Variables** tab, verify:
   - `PYTHON_VERSION`: `3.11.8`
   - `NODE_VERSION`: `20.11.0`
   - `ENVIRONMENT`: `production`

5. **Deploy**:
   Click **Create Web Service**. Render will execute `build.sh`, compile the React frontend into `frontend/dist`, and launch FastAPI with Uvicorn. Once active, your platform is live at `https://demandvision-ai.onrender.com`!

---

### 4. Handling Render Free-Tier Limitations

1. **Cold Starts**:
   Render free web services spin down after 15 minutes of inactivity. The first incoming request will take ~40 seconds while the container awakens.
   - *Design Mitigation*: The backend loads cleaned dataset data into memory during startup in under 0.5 seconds, ensuring that once the container is awake, all user interactions and forecast calculations are fast.
2. **Memory Footprint**:
   Free tier containers are limited to 512 MB RAM.
   - *Design Mitigation*: Store IDs and Item IDs are typed as `int16`, and sales quantities as `float32`. The entire 913,000-row DataFrame consumes approximately 30 MB of memory, well within limits.
