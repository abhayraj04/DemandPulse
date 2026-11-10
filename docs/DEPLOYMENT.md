# DemandVision Pro — GitHub & Render Deployment Guide

This guide provides step-by-step instructions to push **DemandVision Pro** to **GitHub** and deploy it as a high-performance, single-instance web service on **Render** (Free or Starter tier), as well as via Docker or other cloud providers.

---

## 1. Architecture: Single Web Service Deployment

DemandVision Pro compiles the React 18 / TypeScript frontend into static production assets (`frontend/dist`), which are mounted and served directly through FastAPI:

```
[Browser / Mobile Client]
          │
          │ HTTPS (Port 443 / $PORT)
          ▼
[Render Web Service Instance]
          │
          ▼
[FastAPI / Uvicorn Server]
    ├── /api/*              ──> REST Endpoints (Forecasting, Analytics, Inventory)
    ├── /api/docs           ──> Interactive OpenAPI Swagger UI
    ├── /assets/*           ──> Compiled Vite Static Assets (JS / CSS)
    └── /* (SPA Fallback)   ──> React index.html Single-Page App
```

**Benefits of Single-Service Deployment:**
- **Zero CORS Configuration**: API and frontend share the exact same origin.
- **Single Free-Tier Host**: Avoids managing multiple hosting platforms (e.g. Vercel + Render).
- **Synchronized Deployments**: Frontend and backend are versioned, tested, and deployed atomically.

---

## 2. Step 1: Push Repository to GitHub

### 1. Initialize & Verify Local Git State
```bash
# Verify working tree is clean
git status

# If needed, add any uncommitted files
git add .
git commit -m "feat: complete DemandVision Pro ready for deployment"
```

### 2. Create a New GitHub Repository
1. Navigate to [github.com/new](https://github.com/new).
2. Set the repository name to `DemandVision-Pro` (or `DemandVision-AI`).
3. Set visibility to **Public** (recommended for portfolio demonstration) or **Private**.
4. Leave *"Initialize this repository with a README"* **unchecked** (we already have a complete README).
5. Click **Create repository**.

### 3. Push to GitHub
```bash
# Rename branch to main if not already
git branch -M main

# Add your GitHub remote URL (replace YOUR-USERNAME with your GitHub handle)
git remote add origin https://github.com/YOUR-USERNAME/DemandVision-Pro.git

# Push all code to GitHub
git push -u origin main
```

> **Automated CI**: Once pushed, GitHub Actions (`.github/workflows/ci.yml`) will automatically trigger, installing dependencies, building the React application, and executing all 16 backend unit tests.

---

## 3. Step 2: Deploy to Render (2 Methods)

### Method A: One-Click Render Blueprint (Recommended)
1. Sign in to [dashboard.render.com](https://dashboard.render.com) using your GitHub account.
2. Click **New +** in the top-right corner and select **Blueprint**.
3. Connect your `DemandVision-Pro` repository.
4. Render will automatically detect [`render.yaml`](../render.yaml), configure the Python 3.11 + Node.js 20 environment, run `build.sh`, and launch Uvicorn.
5. Click **Apply**. Within 3–4 minutes, your service will be live at `https://demandvision-pro.onrender.com`!

### Method B: Manual Web Service Setup
If you prefer configuring the Web Service manually:
1. On Render Dashboard, click **New +** -> **Web Service**.
2. Select your `DemandVision-Pro` repository.
3. Configure the following fields:
   - **Name**: `demandvision-pro`
   - **Region**: `Oregon (US West)` or `Frankfurt (EU)`
   - **Branch**: `main`
   - **Root Directory**: *(leave blank for repository root)*
   - **Runtime**: `Python`
   - **Build Command**: `bash build.sh`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
4. Under **Environment Variables**, add:
   - `PYTHON_VERSION` = `3.11.8`
   - `NODE_VERSION` = `20.11.0`
   - `ENVIRONMENT` = `production`
   - `DEBUG` = `false`
5. Click **Create Web Service**.

---

## 4. Alternative: Deploy via Docker (Render / Fly.io / Railway / Local)

A production multi-stage [`Dockerfile`](../Dockerfile) is included.

### Test Locally via Docker:
```bash
# Build the container image
docker build -t demandvision-pro .

# Run the container mapping port 8000
docker run -p 8000:8000 demandvision-pro
```
Open `http://localhost:8000` to interact with the containerized application.

### Deploy Docker on Render:
1. When creating a Web Service on Render, choose **Docker** instead of Python.
2. Render will automatically build the `Dockerfile` and deploy the service.

---

## 5. Free-Tier Operational Notes & Optimizations

1. **Cold Starts**:
   - Render's free tier spins down services after 15 minutes of inactivity.
   - The first request after a sleep takes ~30–45 seconds to spin up the container.
   - **Optimization Built In**: DemandVision Pro loads cleaned transaction records into memory in **under 0.5 seconds** during server startup. Once awake, all endpoints respond in 15–80ms.
2. **RAM Footprint (512 MB Limit)**:
   - Data types are downcasted (`int16` for IDs, `float32` for sales quantities).
   - The entire 913,000-row DataFrame occupies only ~32 MB of RAM, leaving over 400 MB of headroom for XGBoost training and inference.
