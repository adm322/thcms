# Learning Studio — AI-Powered Training Content Generator

## What

Trainer uploads a DOCX/PPTX on the program creation page. MiniMax then:
1. Extracts and chunks the text
2. Generates an **AI slide deck** (structured slides with titles, bullet points, embedded SVG infographics)
3. Generates an **auto-quiz** (MCQ + T/F) from the content
4. Powers a **RAG chat** widget where participants ask questions grounded in the uploaded material

All rendered on a **Learning Studio** page per program, with tabs: **Slides | Quiz | Chat**.

---

## Architecture

```
Trainer uploads DOCX/PPTX
         │
         ▼
  File Parser (mammoth + jszip)
         │ raw text
         ▼
  Text Chunker (500-token chunks, 50-token overlap)
         │
         ├─► Embed chunks (MiniMax emb API) ──► SQLite VSS (v1) ──► Qdrant (prod)
         │
         ├─► MiniMax (slide gen prompt) ──► SVG slides + infographic SVGs
         │
         ├─► MiniMax (quiz gen prompt) ──► Questions → Prisma Quiz + Question
         │
         └─► MiniMax (chat prompt) ──► RAG chat (retrieve top-k chunks → answer)
```

---

## New Prisma Models

```prisma
// ─── Learning Studio ─────────────────────────────────────────

model LearningStudio {
  id        String   @id @default(cuid())
  programId String   @unique
  program   Program  @relation(fields: [programId], references: [id], onDelete: Cascade)

  // Source content
  sourceFileUrl  String?   // uploaded DOCX/PPTX path
  sourceText     String?   // full extracted text (for quick access, no re-parse)

  // AI-generated content
  slidesJson     String?   // JSON array of slide objects
  quizId         String?   // links to existing Quiz model
  generatedAt    DateTime?

  // RAG
  chunksEmbedded Boolean   @default(false)
  embeddedAt     DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model RAGChunk {
  id              String   @id @default(cuid())
  learningStudioId String
  chunkIndex      Int
  content         String   // text chunk
  embedding       String   // base64-encoded float32 array (SQLite v1)
  createdAt       DateTime @default(now())

  @@index([learningStudioId])
}
```

---

## Key Files to Create / Modify

### New files

| File | Purpose |
|------|---------|
| `lib/minimax.ts` | MiniMax API client: chat, embedding, SVG generation |
| `lib/file-parser.ts` | Extract text from DOCX (mammoth) and PPTX (jszip) |
| `lib/chunker.ts` | Split text into overlapping chunks |
| `lib/vector-store.ts` | SQLite VSS insert + query (top-k retrieval) |
| `lib/prompts.ts` | All MiniMax prompt templates (slides, quiz, SVG, chat) |
| `app/api/program/[id]/studio/route.ts` | POST: upload + generate; GET: load studio content |
| `app/api/program/[id]/studio/chat/route.ts` | POST: RAG chat — retrieve chunks → MiniMax → answer |
| `app/api/program/[id]/studio/regenerate/route.ts` | POST: re-run generation |
| `app/program/[id]/studio/page.tsx` | Learning Studio page — tabs: Slides, Quiz, Chat |
| `components/studio/SlideDeck.tsx` | Slide viewer with prev/next, SVG render |
| `components/studio/SlideViewer.tsx` | Single slide renderer — text + SVG infographic |
| `components/studio/SVGInfographic.tsx` | Renders MiniMax-generated SVG content |
| `components/studio/QuizRunner.tsx` | Interactive quiz — MCQ + T/F, score at end |
| `components/studio/RAGChat.tsx` | Chat UI — message history + RAG answer display |
| `app/program/[id]/edit/page.tsx` | Add "Learning Studio" section with file upload |

### Modified files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `LearningStudio`, `RAGChunk` models |
| `lib/ai.ts` | Swap OpenAI → MiniMax; keep existing function signatures |
| `package.json` | Add `mammoth`, `jszip` |
| `next-env.d.ts` | Revert route path (was auto-changed — restore `dev/types/routes.d.ts`) |

---

## Build Order

### Phase 1 — Foundation (no UI yet)

1. **MiniMax client** — `lib/minimax.ts`
   - Chat completions (`abab6.5s-chat` or whichever model)
   - Embeddings (`embo-01`)
   - Add `MINIMAX_API_KEY` + `MINIMAX_BASE_URL` to `.env.local`
   - Keep `lib/ai.ts` function signatures intact, point to MiniMax internally

2. **File parser** — `lib/file-parser.ts`
   - `extractTextFromDOCX(buffer)` → string
   - `extractTextFromPPTX(buffer)` → string (parse XML slides via jszip)
   - Combined `extractText(file: File)` dispatcher

3. **Text chunker** — `lib/chunker.ts`
   - `chunkText(text, chunkSize = 500, overlap = 50)` → `Chunk[]`
   - Metadata: chunk index, source filename

4. **SQLite vector store** — `lib/vector-store.ts`
   - `insertChunks(chunks: Chunk[], studioId: string)` — embed + store as base64 in `RAGChunk`
   - `queryChunks(query: string, studioId: string, topK = 5)` — embed query → cosine sim on stored vectors
   - Pure JS cosine similarity on float32 arrays (stored as base64) — no extension needed for v1

### Phase 2 — AI Generation

5. **Prompts** — `lib/prompts.ts`
   - `buildSlidePrompt(text, slideCount)` → system + user prompt for slide generation
   - `buildQuizPrompt(text, count)` → system + user prompt for MCQ/T-F generation
   - `buildSVGPrompt(topic, slideTitle)` → MiniMax SVG generation (structured SVG XML)
   - `buildChatPrompt(retrievedChunks, question)` → RAG-grounded answer prompt

6. **Studio API** — `app/api/program/[id]/studio/route.ts`
   - `POST` — parse file → chunk → embed → store chunks → generate slides + quiz → save to DB
   - `GET` — load studio content (slides, quiz ID, generatedAt)
   - Handle errors gracefully — partial generation should save what's available

7. **Chat API** — `app/api/program/[id]/studio/chat/route.ts`
   - `POST` — query top-k chunks → build RAG prompt → MiniMax → return answer + sources

### Phase 3 — UI

8. **Learning Studio page** — `app/program/[id]/studio/page.tsx`
   - Layout: header with program title + back link
   - Three tab sections: Slides, Quiz, Chat
   - Loading states for generation in progress

9. **SlideDeck + SlideViewer** — `components/studio/`
   - Slide list sidebar (thumbnails)
   - Main view: title, bullet points, optional SVG infographic block
   - Keyboard nav (← →), progress indicator
   - SVG rendered inline via `dangerouslySetInnerHTML` in an `<svg>` tag

10. **QuizRunner** — `components/studio/QuizRunner.tsx`
    - Fetch quiz via `GET /api/quiz/[id]`
    - Render questions one-by-one or all-at-once
    - Submit → `POST /api/quiz/[id]/submit` → show score
    - Use existing Quiz/Question models if possible, or create standalone quiz

11. **RAGChat** — `components/studio/RAGChat.tsx`
    - Message list with user/AI roles
    - Input field → `POST /api/program/[id]/studio/chat`
    - Show retrieved source snippets below answer (cite which chunks)

12. **Trainer upload UI** — extend `app/program/[id]/edit/page.tsx`
    - "Learning Studio" card with file dropzone
    - Upload button triggers generation
    - Show generation status (queued → processing → done)
    - "Open Learning Studio" link once generated

---

## MiniMax API Details (to verify)

| Capability | API | Notes |
|-----------|-----|-------|
| Chat | `POST /v1/text/chatcompletion_v2` | Need base URL + API key |
| Embedding | `POST /v1/embedding/embedding_api` | `embo-01` model |
| SVG Generation | Via chat with structured SVG output | Prompt asks for `<svg>...</svg>` XML |
| File upload | Pass extracted text directly | No multipart upload needed |

> ⚠️ **Verify these endpoints** against MiniMax docs — base URL, exact path, and model names may differ. Add `MINIMAX_BASE_URL` to `.env.local` and confirm the correct chat model name.

---

## Slide Data Shape (generated by MiniMax)

```typescript
interface Slide {
  index: number;
  title: string;
  bulletPoints: string[];       // 3-5 bullets
  infographic?: {               // optional embedded SVG
    type: "stat" | "list" | "comparison" | "process" | "quote";
    title?: string;
    data: Record<string, any>;  // varies by type
    svgMarkup?: string;         // full SVG XML string from MiniMax
  };
  speakerNotes?: string;
}
```

MiniMax prompt instructs it to output valid, compact SVG markup for each infographic block.

---

## Quiz Data Shape (reuse existing model)

The existing `Quiz` + `Question` models are already in schema. Quiz IDs get stored in `LearningStudio.quizId`. Generation flow:
1. MiniMax returns JSON array of questions
2. Create `Quiz` record (standalone = true)
3. Create `Question` records linked to it
4. Store `quizId` in `LearningStudio`

---

## SQLite v1 Embedding Strategy

- Store float32 array as **base64 string** in `RAGChunk.embedding` column
- At query time: embed text → decode all stored base64 → compute cosine similarity in JS → return top-K
- Works for thousands of chunks on localhost; will be slow for large corpora → Qdrant swap later
- Chunk size: 500 tokens (~2000 chars), 50-token overlap → ~10-20 chunks per typical DOCX

---

## Error Handling

- If MiniMax SVG generation fails → skip infographic, show text-only slide
- If quiz generation fails → save slides, leave `quizId` null, show "Quiz coming soon"
- If embedding fails → skip RAG, disable chat tab
- Partial success is acceptable — don't fail the whole pipeline

---

## Env Vars to Add

```env
MINIMAX_API_KEY=your_key_here
MINIMAX_BASE_URL=https://api.minimax.chat  # verify this
```

---

## Verification

1. Upload a sample DOCX → slides render with SVG infographics
2. Quiz tab shows generated questions, can answer and score
3. Chat tab: ask a question → answer references uploaded content
4. TypeScript: `npx tsc --noEmit` → zero errors
5. DB migration: `npx prisma migrate dev --name add_learning_studio`
