# Team ALMOND Integration and Release Checklist

Use this checklist for Sprint 2 integration PRs, the final demo candidate, and project handoff.

## 1. Branch and ownership

- [ ] Work is on a feature or integration branch, not directly on main.
- [ ] The branch includes the latest approved main changes.
- [ ] Changed files follow the agreed role ownership boundaries.
- [ ] Breaking contract changes have owner and consumer approval.
- [ ] Package and lockfile changes are coordinated by Role 1.
- [ ] No unrelated editor, generated, or assistant files are included.

## 2. Dependencies and automated quality

- [ ] `npm ci` succeeds.
- [ ] `npx expo install --check` passes.
- [ ] `npx expo-doctor` has no blocking issue.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run lint` passes.
- [ ] `npm test` passes.
- [ ] `npm audit --audit-level=high` has no high or critical finding.
- [ ] `git diff --check` passes.
- [ ] GitHub Actions Quality Gate is green.

## 3. Environment and security

- [ ] `.env.example` uses mock mode and blank credentials.
- [ ] `.env.local` is ignored by Git.
- [ ] `.env.local` is excluded from the Docker build context.
- [ ] Git tracks no private environment file.
- [ ] Tracked files contain no Azure key or other credential.
- [ ] Logs, screenshots, PRs, and test fixtures contain no credential.
- [ ] Docker receives local values at runtime, not through build arguments.
- [ ] Invalid speech configuration fails clearly.
- [ ] Azure mode never silently falls back to mock mode.

## 4. Routes and integration boundaries

- [ ] Home uses the canonical `/` route.
- [ ] Activities use the generic `/activity/[id]` route.
- [ ] Activity IDs 1 through 5 are supported.
- [ ] Invalid activity IDs fail safely.
- [ ] Reports use the canonical `/report` route.
- [ ] Pages consume `appRoutes`.
- [ ] Routes contain no scoring, reward, report, or animation policy.
- [ ] Cross-role imports use canonical public exports.

## 5. Docker acceptance

- [ ] A clean checkout can create `.env.local` from `.env.example`.
- [ ] `docker compose config` succeeds.
- [ ] `docker compose up --build` succeeds.
- [ ] The container becomes healthy.
- [ ] Chrome opens `http://localhost:8081`.
- [ ] No personal LAN IP is required.
- [ ] Mock mode works with blank Azure values.
- [ ] Authorised Azure testing uses only a private local key.
- [ ] `docker compose down` stops the containers.

## 6. Functional regression

- [ ] Home loads without an error.
- [ ] Activity navigation loads the generic activity surface.
- [ ] Back, Skip, Replay, clue, microphone, and completion paths do not crash.
- [ ] Rapid actions do not duplicate attempts, progress, or rewards.
- [ ] Coins are granted only after Activities 1, 3, and 5.
- [ ] Reload, resume, and reset behaviour are verified.
- [ ] Parent and therapist reports use the same persisted session.
- [ ] Screen and exported report values match.
- [ ] Mock data is distinguishable from live-session data.
- [ ] No backend, authentication, Supabase connection, or LLM was introduced.

## 7. Visual and accessibility evidence

- [ ] Phone, tablet, and Chrome web layouts were checked.
- [ ] Both 3:2 and 5:4 scenes were checked.
- [ ] Activity 4 matches the approved client original; its visible pumpkin
  placards are intentional.
- [ ] Touch targets and focus states remain usable.
- [ ] Important images and controls have accessible labels.
- [ ] Reduced-motion behaviour remains understandable.
- [ ] Role 2 records Docker Chrome and native-target mascot evidence.
- [ ] The selected mascot renderer has no seam, drift, or anchor jump.

## 8. PR evidence

- [ ] The PR explains user-visible and technical changes.
- [ ] Verification commands and results are listed.
- [ ] Visual evidence is attached when relevant.
- [ ] Known limitations are stated.
- [ ] Affected owners or consumers reviewed the changes.
- [ ] Requested changes and merge conflicts are resolved.

## 9. Final release and handoff

- [ ] The release candidate is tested from a clean checkout.
- [ ] Mock and authorised live-demo paths are recorded.
- [ ] Final automated and manual evidence is stored.
- [ ] The release commit and demo version are recorded.
- [ ] The Azure demo key is deleted or invalidated.
- [ ] Local copies of the retired key are removed.
- [ ] Generated bundles and caches containing the key are removed.
- [ ] Local containers are stopped.
- [ ] No credential remains in Git history, logs, screenshots, or documents.
- [ ] Handoff instructions contain no retired credential.
