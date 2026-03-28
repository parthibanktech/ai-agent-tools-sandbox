# AI Agents Learning Project - Architecture & Usage
*Created by Parthiban*

> **Educational Note:** This project was built strictly for educational purposes to help you understand every important topic related to AI agents. It serves as a living curriculum, progressively bringing concepts to life.

## 🎓 Educational Notes: Important Topics of Agents

This codebase is a hands-on guide to the evolution from simple chat to autonomous agents. Here are the core concepts demonstrated:

### 1. LLM Superpowers & Limitations (Modules 1-3)
LLMs are remarkable reasoning engines, but they have a fundamental "blind spot" — they cannot natively perform precise math, know current real-time events, or retrieve post-training factual data reliably. An AI agent solves this by extending the LLM's capabilities so it can interact with the outside world.

### 2. Tool Calling / Function Calling (Modules 4-5)
Tool Calling is the critical bridge acting as the agent's "hands." You provide the LLM with a JSON schema defining available tools (like `calculator`, `wikipedia`, or `web_search`). Instead of responding with plain text, the LLM autonomously responds with a structured JSON object indicating exactly which tool to execute and what arguments to pass to it.

### 3. The ReAct Pattern: Reasoning + Acting (Module 6-7)
ReAct is the fundamental loop of agentic behavior. The agent doesn't simply call a tool once and quit; it operates in a continuous loop:
* **Thought:** The LLM analyzes the current state and decides what to do next.
* **Action:** Fast execution of a chosen tool (e.g., fetching a stock price).
* **Observation:** The actual result of the tool is fed back into the LLM context.
* *The LLM then starts the loop again until it decides it has the full Final Answer.*

```text
  [ User ] 
     │
     ▼
  [ Next.js Backend ]  ◄══════════════════════════════════════╗
     │                                                        ║
     ├── 1. Send Prompt & History -> [ OpenAI LLM ]           ║
     │                                  │                     ║
     │   ┌──────────────────────────────┘                     ║  The 
     │   ▼                                                    ║  ReAct 
     ├── 2. LLM responds: "Call Tool (Calculate)"             ║  Loop 
     │                                                        ║  (repeats)
     ├── 3. Execute tool locally -> [ Utilities / API ]       ║
     │                                  │                     ║
     │   ┌──────────────────────────────┘                     ║
     │   ▼                                                    ║
     └── 4. Append tool result to history ════════════════════╝
     │
     ▼
  [ User ] (AI Streams the Final Answer)
```

### 4. Graph-based Orchestration / LangGraph (Module 8)
Advanced agents move beyond simple `while` loops. They organize logic into explicit State Machines (directed cyclic graphs). Nodes represent actions (executing tools, formatting outputs, or hitting the LLM), and conditional edges dynamically route the state based on the LLM's decisions. This is the foundation of robust, production-ready, self-correcting agents.

---

## Core Architecture & Custom Agent Tools

* **Language:** Built in 100% native TypeScript/JavaScript to demonstrate AI principles without Python dependencies.
* **AI Integration:** Direct OpenAI Node.js SDK (We purposefully avoid heavy frameworks like LangChain so the exact API JSON payloads, tool calling parameters, and loop mechanics remain transparent and easy to learn).

### 1. Custom Agent Tools (`lib/core_tools/`)
This curriculum heavily emphasizes building tools from scratch. These algorithms act as the literal "hands" of the AI agent, extending its core capabilities:
* **`calculator.ts`**: A mathematical execution tool that uses Regex parameter validation and safe, isolated Javascript environment execution to feed highly precise calculations back to the LLM.
* **`wikipedia.ts`**: A programmatic data retrieval tool hooked into Wikipedia's REST API for answering strictly factual, historical queries.
* **`webSearch.ts`**: A real-time observation tool relying on the Tavily API to fetch current news, bypassing the LLM's inherently stale training-data cutoff.

### 2. The Orchestration Engine
The agent's logic progresses drastically as you move through the codebase:
* **Primitive Forcing**: The codebase demonstrates forcefully binding a single tool (the Calculator) directly into the LLM payload so the AI is forced to output functional JSON.
* **Autonomous Selection**: The engine moves to `tool_choice: "auto"`, providing the LLM with an array of tools so it can autonomously categorize the query and route it to Wikipedia OR Search.
* **Simulated Graph Execution**: The most advanced state-machine logic in the codebase explicitly tracks up to 5 loop iterations (`Thought -> Action -> Observation`). It maintains conversation state asynchronously and recursively triggers Tools until the LLM breaks the loop with a 'Final Answer'.

---

## Running the Codebase

### Prerequisites
* Node.js (v18+)
* **OPENAI_API_KEY**: Required for all LLM access.
* **TAVILY_API_KEY**: Optional, required only for the Web Search features in advanced modules.

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup your Environment:**
   Create a `.env.local` file at the root:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key
   TAVILY_API_KEY=tvly-your-tavily-api-key
   ```

3. **Start the Educational Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to start your learning journey!
