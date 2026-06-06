Frontend Work Required
Short answer: yes, the frontend needs to add a new screen + adapt three places where "pregnancy state" was previously implicit on the user profile. Here's the contract and a checklist.

1. New API endpoint
POST /profile/pregnancies
Auth: Authorization: Bearer <clerk_jwt> (same as every other profile route)

Request body

interface PregnancyCreateRequest {
  baby_nickname?: string;          // default "My Baby" if omitted
  estimated_due_date?: string;     // ISO date "YYYY-MM-DD"
  lmp_date?: string;               // ISO date "YYYY-MM-DD"
  conception_date?: string;        // ISO date "YYYY-MM-DD"
  gestational_week?: number;       // integer 0–42
  is_multiple_gestation?: boolean; // default false
}


Response (201 Created)
interface PregnancyResponse {
  id: string;                          // uuid
  user_id: string;                     // uuid
  status: "active" | "completed" | "archived";
  baby_nickname: string;
  pregnancy_number: number;            // 1, 2, 3...
  gestational_week: number | null;
  estimated_due_date: string | null;   // ISO date, decrypted server-side
  lmp_date: string | null;             // ISO date, decrypted server-side
  conception_date: string | null;      // ISO date
  is_multiple_gestation: boolean;
  started_at: string;                  // ISO datetime
  ended_at: string | null;             // ISO datetime
  created_at: string;
  updated_at: string;
}


2. UI changes needed
A. New "Start a new pregnancy" flow
Where: Profile or Settings → "Pregnancies" section.

Trigger copy suggestion: Primary CTA on the active-pregnancy card → "Log a new pregnancy" (only visible if the current pregnancy is past its EDD, or always under a "more" menu).

Form fields

Baby nickname (text, default "My Baby")
EDD (date picker) — or LMP (date picker) — or conception date. At least one helps prefill gestational_week.
Gestational week (number, optional, auto-derived if EDD given)
Multiple gestation? (toggle, default off)
Warning copy:

"Starting a new pregnancy will close out {previous_nickname} as completed. You can still view its history under Past Pregnancies. Continue?"

B. "Past pregnancies" list (new screen)
You don't have a GET /profile/pregnancies route yet (see "Backend follow-ups" below). For now you can ship the create flow alone, and add the list view once that endpoint exists.

C. Pregnancy-scoped data is now implicit
You don't need to send pregnancy_id on any existing request. The backend resolves the current active pregnancy server-side for every write (symptoms, kicks, hydration, sleep, mood, folic acid, chat, appointments). So:

✅ No changes needed to existing POSTs for trackers/chat/appointments.
⚠️ Caching: If you cache "this week's symptoms" or "appointment list" client-side keyed by user, also key by current_pregnancy_id so switching pregnancies doesn't leak data across them. Easiest is to invalidate all such caches after a successful create-pregnancy call.
3. Recommended client code
TypeScript types (drop into types/pregnancy.ts)


export type PregnancyStatus = "active" | "completed" | "archived";

export interface Pregnancy {
  id: string;
  user_id: string;
  status: PregnancyStatus;
  baby_nickname: string;
  pregnancy_number: number;
  gestational_week: number | null;
  estimated_due_date: string | null;
  lmp_date: string | null;
  conception_date: string | null;
  is_multiple_gestation: boolean;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePregnancyInput {
  baby_nickname?: string;
  estimated_due_date?: string;
  lmp_date?: string;
  conception_date?: string;
  gestational_week?: number;
  is_multiple_gestation?: boolean;
}

React Query mutation example
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreatePregnancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePregnancyInput): Promise<Pregnancy> => {
      const res = await api.post("/profile/pregnancies", input);
      return res.data;
    },
    onSuccess: () => {
      // The previous active pregnancy is now completed server-side;
      // and all subsequent reads should reflect the new active pregnancy.
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["pregnancies"] });
      qc.invalidateQueries({ queryKey: ["symptoms"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["chat"] });
      qc.invalidateQueries({ queryKey: ["trackers"] });
    },
  });
}

// GET /profile/pregnancies            -> Pregnancy[]
// GET /profile/pregnancies/current    -> Pregnancy        (404 if none active)
// PATCH /profile/pregnancies/{id}     -> Pregnancy
// GET /profile/pregnancies/{id}/summary -> PregnancySummary

export interface PregnancyUpdateInput {
  baby_nickname?: string;
  estimated_due_date?: string;
  lmp_date?: string;
  conception_date?: string;
  gestational_week?: number;
  is_multiple_gestation?: boolean;
  status?: "active" | "completed" | "archived";
}

export interface PregnancySummary {
  pregnancy: Pregnancy;
  total_symptoms: number;
  total_appointments: number;
  total_kick_sessions: number;
  total_hydration_logs: number;
  total_sleep_logs: number;
  total_mood_logs: number;
  total_folic_acid_logs: number;
  total_chat_sessions: number;
}

---

## Implementation Plan — June 2026

This plan tracks all concrete frontend changes needed to fully implement the pregnancy feature update.
Work is ordered by dependency (types → API layer → context → screens → polish).

---

### Phase 1 — Type layer (`packages/types`)

#### 1.1 Expand `packages/types/src/pregnancy.ts`
The current `Pregnancy` interface is missing several fields the backend now returns.
Add all new fields and add `CreatePregnancyInput` / `UpdatePregnancyInput` / `PregnancySummary`.

**File:** `packages/types/src/pregnancy.ts`

```diff
 export interface Pregnancy {
   id: UUID;
   user_id?: UUID;
   status: PregnancyStatus;
   estimated_due_date: ISODateString;
   baby_nickname?: string | null;
   gestational_week?: number | null;
   delivery_date?: ISODateString | null;
   created_at?: ISODateString;
   updated_at?: ISODateString;
+  pregnancy_number?: number;
+  lmp_date?: ISODateString | null;
+  conception_date?: ISODateString | null;
+  is_multiple_gestation?: boolean;
+  started_at?: ISODateString;
+  ended_at?: ISODateString | null;
 }

+export interface CreatePregnancyInput {
+  baby_nickname?: string;
+  estimated_due_date?: string;
+  lmp_date?: string;
+  conception_date?: string;
+  gestational_week?: number;
+  is_multiple_gestation?: boolean;
+}
+
+export type UpdatePregnancyInput = Partial<CreatePregnancyInput> & {
+  status?: PregnancyStatus;
+};
+
+export interface PregnancySummary {
+  pregnancy: Pregnancy;
+  total_symptoms: number;
+  total_appointments: number;
+  total_kick_sessions: number;
+  total_hydration_logs: number;
+  total_sleep_logs: number;
+  total_mood_logs: number;
+  total_folic_acid_logs: number;
+  total_chat_sessions: number;
+}
```

Make sure `packages/types/src/index.ts` exports everything (it already re-exports `./pregnancy`).

---

### Phase 2 — API layer (`packages/api`)

#### 2.1 Add new hooks to `packages/api/src/profile.ts`

The existing `useStartNewPregnancy` hits `/pregnancies/new` (POST, no body) — which is a temporary
shortcut. Replace / supplement it with the full `useCreatePregnancy` that hits `POST /profile/pregnancies`
with the rich `CreatePregnancyInput` body described in the spec.

Also add:
- `useGetPregnancies()` — `GET /profile/pregnancies` → `Pregnancy[]`
- `useUpdatePregnancy(id)` — `PATCH /profile/pregnancies/{id}` → `Pregnancy`
- `useGetPregnancySummary(id)` — `GET /profile/pregnancies/{id}/summary` → `PregnancySummary`

Add a dedicated `pregnancyKeys` query-key factory (parallel to `profileKeys`) so all pregnancy
queries can be invalidated together.

**Additions to `packages/api/src/profile.ts`:**

```ts
// ── query key factory ────────────────────────────────────────────────────────
export const pregnancyKeys = {
  all:     ["pregnancy"] as const,
  list:    () => [...pregnancyKeys.all, "list"] as const,
  active:  () => [...pregnancyKeys.all, "active"] as const,
  history: () => [...pregnancyKeys.all, "history"] as const,
  detail:  (id: string) => [...pregnancyKeys.all, id] as const,
  summary: (id: string) => [...pregnancyKeys.all, id, "summary"] as const,
};

// ── hooks ────────────────────────────────────────────────────────────────────
export function useCreatePregnancy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePregnancyInput) =>
      apiRequest<Pregnancy>("/profile/pregnancies", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pregnancyKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      queryClient.invalidateQueries({ queryKey: ["tracker"] });
      queryClient.invalidateQueries({ queryKey: ["symptoms"] });
      queryClient.invalidateQueries({ queryKey: ["chat"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useGetPregnancies() {
  return useQuery({
    queryKey: pregnancyKeys.list(),
    queryFn: () => apiRequest<Pregnancy[]>("/profile/pregnancies"),
    retry: false,
  });
}

export function useUpdatePregnancy(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePregnancyInput) =>
      apiRequest<Pregnancy>(`/profile/pregnancies/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pregnancyKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useGetPregnancySummary(id: string) {
  return useQuery({
    queryKey: pregnancyKeys.summary(id),
    queryFn: () => apiRequest<PregnancySummary>(`/profile/pregnancies/${id}/summary`),
    enabled: !!id,
  });
}
```

Also import `CreatePregnancyInput`, `UpdatePregnancyInput`, `PregnancySummary` from `@safeborn/types` at the top.

#### 2.2 Update `useActivePregnancy` and `usePregnancyHistory` query keys

Currently they use raw string arrays `["pregnancy", "active"]` and `["pregnancy", "history"]`.
Switch them to use the new `pregnancyKeys` factory so invalidation is consistent:

```diff
-  queryKey: ["pregnancy", "active"],
+  queryKey: pregnancyKeys.active(),

-  queryKey: ["pregnancy", "history"],
+  queryKey: pregnancyKeys.history(),
```

Update `useStartNewPregnancy` invalidations to match:

```diff
-  queryClient.invalidateQueries({ queryKey: ["pregnancy", "active"] });
-  queryClient.invalidateQueries({ queryKey: ["pregnancy", "history"] });
+  queryClient.invalidateQueries({ queryKey: pregnancyKeys.all });
```

#### 2.3 Export new symbols from `packages/api/src/index.ts`

`index.ts` already re-exports `./profile` with `export * from "./profile"`, so new exports are
picked up automatically — no change needed, but verify after adding.

---

### Phase 3 — Context layer (`lib/pregnancyState.tsx`)

#### 3.1 Expose `refetchActive` and `refetchHistory` separately (optional, nice-to-have)

The current `refetch` function calls both `refetch` methods together. If the new "start pregnancy"
form only needs to refresh the active pregnancy query, callers should be able to do so without
also refetching the full history list. Add separate refetch methods:

```diff
 interface PregnancyStateContextValue {
   activePregnancy: Pregnancy | null | undefined;
   pregnancyHistory: Pregnancy[] | undefined;
   isLoading: boolean;
   isError: boolean;
   refetch: () => void;
+  refetchActive: () => void;
 }
```

---

### Phase 4 — Screens

#### 4.1 Upgrade `app/onboarding/new-pregnancy.tsx`

**Current state:** One-tap screen with no form — calls `useStartNewPregnancy()` (no body).

**Target state:** A proper multi-field form using the new `useCreatePregnancy` hook with:
- Baby nickname text input (default placeholder "My Baby")
- EDD date picker (most important field)
- LMP date picker (alternative to EDD — only show one at a time with a toggle)
- Gestational week number input (auto-derived from EDD when provided, but editable)
- Multiple gestation toggle (default off)
- Warning copy when an active pregnancy already exists (shown via `usePregnancyState`)
- Submit calls `useCreatePregnancy().mutateAsync(formData)` then `router.replace("/tabs/home")`

```
┌──────────────────────────────────────────────┐
│ 🌸  New pregnancy journey                    │
│                                              │
│  Baby nickname (optional)                    │
│  [ My Baby _________________________ ]       │
│                                              │
│  When are you due?        [Use LMP instead ▾]│
│  [ EDD date picker _________________ ]       │
│                                              │
│  Gestational week (auto-calculated)          │
│  [ 12 _______________________________ ]      │
│                                              │
│  Multiple gestation?   [ OFF ]               │
│                                              │
│  ⚠️  Warning box (if active pregnancy exists)│
│                                              │
│  [ Begin this journey ]                      │
│  [ Not ready yet ]                           │
└──────────────────────────────────────────────┘
```

#### 4.2 `app/profile/history.tsx` — minor additions

The card UI and layout is already built. Add:

- **Tap-to-expand** on past pregnancy cards → navigate to a future `/profile/pregnancy/[id]` detail
  route (or show an in-line summary panel using `useGetPregnancySummary`).
- Show `pregnancy_number` (e.g. "Pregnancy #2") in the card header label when available.
- Show `is_multiple_gestation` indicator (e.g. twin emoji or badge) on the card if true.
- Hook up `useGetPregnancies` instead of `usePregnancyHistory` (which hits `/pregnancies` — the old
  route). The new route is `/profile/pregnancies`. Keep the old hook as a fallback while the backend
  migration is in flight, controlled by a simple feature flag constant.

#### 4.3 New screen: `app/profile/pregnancy/[id].tsx` (detail + summary)

A detail screen showing a single past pregnancy with its summary stats.

```
┌──────────────────────────────────────────────┐
│ ← Pregnancy #1 · "Nova"                      │
│   Completed · Delivered 14 Mar 2025          │
│                                              │
│ ── Journey summary ───────────────────────── │
│  💬 Chat sessions     12                     │
│  🤒 Symptoms logged   47                     │
│  📅 Appointments       8                     │
│  💧 Hydration logs    90                     │
│  😴 Sleep logs        88                     │
│  😊 Mood logs         62                     │
│  💊 Folic acid logs   84                     │
│  👶 Kick sessions     31                     │
└──────────────────────────────────────────────┘
```

Uses `useGetPregnancySummary(id)` from Phase 2.4.
Route param `id` from `useLocalSearchParams()`.

---

### Phase 5 — Cache invalidation audit

After `useCreatePregnancy` succeeds, ALL of the following query keys must be invalidated so
pregnancy-scoped data does not leak across records:

| Query key              | Hook                       | Reason                          |
|------------------------|----------------------------|---------------------------------|
| `pregnancyKeys.all`    | new pregnancy factory      | active + history + list         |
| `profileKeys.all`      | `profileKeys`              | gestational_week on profile     |
| `["tracker"]`          | tracker hooks              | hydration, sleep, folic, kicks  |
| `["symptoms"]`         | symptom hooks              | per-pregnancy symptom log       |
| `["chat"]`             | chat hooks                 | chat sessions are pregnancy-scoped |
| `["appointments"]`     | appointment hooks          | profile appointments            |

This is already correctly implemented in the `useCreatePregnancy` example in Phase 2.1.
Cross-check that `useStartNewPregnancy` (the old hook) does the same — it currently misses
`["appointments"]`. Fix that while migrating.

---

### Phase 6 — Navigation & routing wiring

| Route                             | Status    | Action                                    |
|-----------------------------------|-----------|-------------------------------------------|
| `/onboarding/new-pregnancy`       | ✅ exists  | Upgrade form (Phase 4.1)                 |
| `/profile/history`                | ✅ exists  | Minor card enhancements (Phase 4.2)      |
| `/profile/pregnancy/[id]`         | ❌ missing | Create file + dynamic route (Phase 4.3)  |

In `app/profile/history.tsx`, add `onPress` to past pregnancy cards:
```ts
router.push(`/profile/pregnancy/${item.id}`);
```

---

### Phase 7 — QA checklist

- [ ] No active pregnancy → redirected to `/onboarding/new-pregnancy`
- [ ] New pregnancy form submits successfully with EDD only
- [ ] New pregnancy form submits successfully with LMP only (EDD auto-derived)
- [ ] Previous active pregnancy is shown as `completed` in history after new one starts
- [ ] History screen shows correct `pregnancy_number` label
- [ ] Multiple gestation badge renders when `is_multiple_gestation = true`
- [ ] Tapping a past pregnancy card opens detail screen
- [ ] Detail screen renders all `PregnancySummary` stats
- [ ] All tracker/symptom/chat data resets after new pregnancy (cache invalidation)
- [ ] `usePregnancyState` correctly returns `null` when no active pregnancy
- [ ] TypeScript compiles with zero errors across `packages/types`, `packages/api`, `app/`

---

### Dependency order (summary)

```
Phase 1 (types)
  └── Phase 2 (API hooks)
        └── Phase 3 (context)
              ├── Phase 4.1 (onboarding screen upgrade)
              ├── Phase 4.2 (history screen additions)
              └── Phase 4.3 (new detail screen)
                    └── Phase 5 (cache audit)
                          └── Phase 6 (routing wiring)
                                └── Phase 7 (QA)
```