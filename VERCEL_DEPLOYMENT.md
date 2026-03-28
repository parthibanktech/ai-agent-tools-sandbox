# Vercel Deployment Guide

Deploying this AI Agent Sandbox to Vercel is the fastest and most highly optimized route since the platform natively supports Next.js Serverless API Routes and streaming responses automatically.

## 1. Preparing the Codebase

Before you deploy to Vercel, there is a local development workaround you should revert in `next.config.ts`. 

1. Open `next.config.ts`
2. **Remove** the line `distDir: ".next_dev",`
3. Commit this change to your repository.

*(Vercel builds on Linux, so it does not experience the Windows/VS Code file-locking bug we encountered locally and expects the standard `.next` output directory).*

## 2. Deploying via the Vercel Dashboard

1. **Push your code to GitHub:** Ensure your repository is pushed to your main branch.
2. Go to [Vercel.com](https://vercel.com/) and log in (authenticating with your GitHub account makes it easiest).
3. Click **"Add New..."** > **"Project"**.
4. Important: Find your GitHub repository in the list and click **"Import"**.
5. Vercel will automatically detect that it is a **Next.js** framework project. Leave the default build and install commands as they are.

## 3. Configuring Environment Variables

Before you click Deploy, expand the **"Environment Variables"** drawer. You must add the secret keys that allow your agents to communicate with external APIs:

| KEY NAME         | VALUE REGION             |
|------------------|--------------------------|
| `OPENAI_API_KEY` | `sk-...` (Your OpenAI key)|
| `TAVILY_API_KEY` | `tvly-...` (Optional)     |

## 4. Launch

Click **Deploy**!

Vercel will perform the build step exactly as we've tested locally. It spins up all of your logic inside the `app/api/...` folders (such as `/api/langgraph` and `/api/agent`) as highly scalable, fast serverless functions. 

Within minutes, your project will be live with an automatically generated, secure HTTPS URL!
