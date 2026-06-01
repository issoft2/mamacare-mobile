Architecting a transition from a single-pregnancy tracking application to a multi-lifecycle ecosystem requires a zero-downtime database migration and an adaptable frontend state machine. If not handled with extreme care, updating the core data schema can cause API crashes for existing active users.

This document now includes a repo-specific implementation flow for the mobile Expo Router app and TypeScript API layer.

High level architecture overview:
We are moving from a Flat User Model to a Scoped Lifecycle Model.

[Before]  User (1) ───> Has exactly One Pregnancy Data Scope (Properties on User Table)

[After]   User (1) ───┮───> (Has Many) Pregnancies Lifecycle Records (Distinct Table Rows)
                      ├───> [Pregnancy ID: 101] -> Status: "archived" (First Child)
                      └───> [Pregnancy ID: 202] -> Status: "active"   (Current Journey)


TODO:

You are an expert Frontend Engineer and Mobile UI Architect. Your task is to refactor our application's global state and layout architecture to accommodate a user managing subsequent pregnancy journeys over time, ensuring a smooth transition experience.

Please review the frontend architecture (`app/(tabs)/profile.tsx`, core state machines, and dashboard layout routing rules) and implement the following features:

### 1. Global State Management Update
* **Refactor Journey States:** Stop tracking pregnancy-related values as flat global primitives such as `currentWeek`, `dueDate`, or `gestationalWeek` directly in UI state.
* **Implement Unified `activePregnancy`:** Add a lifecycle object with fields such as:
  * `id: string`
  * `status: "active" | "archived" | "completed"`
  * `estimatedDueDate: string`
  * `babyNickname?: string`
  * `gestationalWeek?: number`
* **Allow null when no journey exists:** `activePregnancy === null` must indicate the user has no current active pregnancy configured.

### 2. Dashboard Guard Injection
* **Guard placement:** Implement the dashboard guard in `app/(tabs)/_layout.tsx`, which wraps the Home/Symptoms/Chat/Tracker/Profile tabs.
* **Conditional routing:** On render, if `activePregnancy` exists, render tabs normally. If `activePregnancy === null`, redirect to a new pregnancy onboarding route.
* **Smooth onboarding path:** If the backend reports no active journey, route users to `/onboarding/new-pregnancy` rather than allowing them to stay in the main tracker/dashboard flow.

### 3. Profile Screen Submenu Additions (`app/(tabs)/profile.tsx`)
* **Add a `Pregnancy history` row:** Add a left-aligned label exactly `Pregnancy history` in sentence case, with a right-facing chevron icon.
* **Add a `Start a new pregnancy` CTA row:** Add a CTA action row labeled exactly `Start a new pregnancy` in sentence case.
* **Confirmation modal:** Tapping the CTA should show an alert with this message:
    > "Starting a new journey will safely archive your current week data and chat histories into your profile records, allowing you to begin a fresh milestone tracker. Would you like to continue, mama?"
* **Backend trigger:** Confirming the action should call `POST /api/v1/pregnancies/new` and refresh the app state on success.
* **Cache invalidation:** On successful creation, invalidate React Query cache keys for pregnancy-related data, profile, tracker, symptoms, and chat to ensure the app reloads clean state.
* **Pregnancy history screen:** Add a new read-only screen at `app/(tabs)/profile/history.tsx` (or equivalent) that renders archived pregnancy rows showing baby nickname and delivery date in sentence case.

### 4. Implementation flow for this repo
1. **Extend types** in `packages/types/src/profile.ts` or a new `packages/types/src/pregnancy.ts`:
   * `Pregnancy`
   * `PregnancyStatus`
   * `PregnancyHistoryItem`
   * optional `active_pregnancy` union on backend response objects
2. **Add frontend API hooks** in `packages/api/src/profile.ts`:
   * `useActivePregnancy()` for the current active journey
   * `usePregnancyHistory()` for archived journeys
   * `useStartNewPregnancy()` for `POST /pregnancies/new`
3. **Add layout guard** in `app/(tabs)/_layout.tsx`:
   * read `activePregnancy` from the new hook
   * if `activePregnancy === null`, redirect to `/onboarding/new-pregnancy`
   * otherwise render the existing `Tabs` structure
4. **Update profile screen** in `app/(tabs)/profile.tsx`:
   * add `Pregnancy history`
   * add `Start a new pregnancy`
   * show confirmation dialog and trigger the mutation
   * invalidate queries and refresh state after success
5. **Add screens**:
   * `app/(tabs)/profile/history.tsx` for archived pregnancies
   * `app/onboarding/new-pregnancy.tsx` for the entry flow when no active pregnancy exists
6. **Preserve current behavior during rollout**:
   * keep `useProfile()` working
   * preserve existing profile-based gating until the lifecycle model is fully wired

### 5. Backend coordination notes
* Confirm whether `activePregnancy` will come from `/profile` or a dedicated `/pregnancies/active` endpoint.
* Confirm the exact request/response contract for `POST /api/v1/pregnancies/new`.
* Confirm the archived pregnancy payload shape for the history screen.

---
**Execution Instructions:** Use this document as the implementation roadmap. Start with type and API hook changes, then add the dashboard guard, then update `app/(tabs)/profile.tsx`, and finally add the new onboarding/history screens.
