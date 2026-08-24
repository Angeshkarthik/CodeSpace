# CodeSpace — Local Offline-First Architecture

CodeSpace is a strictly local, offline-first IDE. All code execution, static complexity analysis, tracing, benchmarking, version comparison, and practice tracking run completely on your machine.

---

## Execution Architecture

```
User → CodeSpace UI → /api/execute → ExecutionManager → LocalExecutionProvider → Local OS Compilers/Interpreters
```

CodeSpace executes code using native system tools available on your system via `LocalExecutionProvider`:
- **Python**: `python` / `python3` interpreter
- **C / C++**: `gcc` / `g++` compiler
- **Java**: `javac` compiler & `java` runtime

No Docker, Piston, or external remote code execution containers are required.

---

## Core Features & Offline Availability

| Feature | Execution Backend | External Network Required? |
| :--- | :--- | :--- |
| **Code Execution** | `LocalExecutionProvider` via `/api/execute` | ❌ No |
| **Test Case Runner** | Batch execution via `/api/execute` | ❌ No |
| **Static Analysis** | `Analyzer.ts` (Deterministic AST parsing & regex engine) | ❌ No |
| **Execution Trace** | Local trace providers (`CTraceProvider`, `PythonTraceProvider`, `JavaTraceProvider`) | ❌ No |
| **Benchmark Tool** | `BenchmarkRunner.ts` (Sequential local timing stats) | ❌ No |
| **Version History & Compare** | `HistoryManager.ts` & `CompareManager.ts` via Dexie IndexedDB | ❌ No |
| **Practice Mode** | `PracticeManager.ts` & Dexie IndexedDB | ❌ No |
| **AI Explain & AI Review** | `/api/ai/explain` & `/api/ai/review` (Server API routes) | 🌐 Only if AI API Key configured |

---

## AI Features Configuration (Optional)

AI-assisted Code Review and Code Explanation features run via server-side API routes using standard provider environment variables:

```bash
# In .env.local:
GEMINI_API_KEY=your_gemini_key_here
# Or:
OPENAI_API_KEY=your_openai_key_here
CLAUDE_API_KEY=your_claude_key_here
```

All other core features are 100% offline-ready out of the box.
