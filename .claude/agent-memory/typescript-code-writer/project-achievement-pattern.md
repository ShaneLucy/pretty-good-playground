---
name: project-achievement-pattern
description: Achievement detection is split into focused helpers called from detectAchievements in progress.ts
metadata:
  type: project
---

Achievements in `src/lib/server/progress.ts` follow a layered detection pattern:

- Each "family" of achievements gets its own pure function: `detectChallengeTypeAchievements`, `detectChapterAchievements`, `detectNightOwlAchievement`, `detectParanoidComplimentAchievement`
- Each returns `string[]` (the IDs earned, or `[]`)
- `detectAchievements` is the single aggregation point that calls them all and merges results
- Achievement IDs are named constants at module scope (e.g. `NIGHT_OWL_ACHIEVEMENT = "night_owl"`)
- The `has(id)` guard pattern (checking `prev.achievements.includes(id)`) is used inside each helper to prevent re-awarding

**Why:** Keeps individual detectors short and testable without needing to run the full completeChallenge pipeline.

**How to apply:** When adding a new achievement, write a focused `detectXyzAchievement` helper, add its named string constant, and call it from `detectAchievements`.
