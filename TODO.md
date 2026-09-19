# Surrender Execution — TODO

- [x] Analyze repo (useGameState, Arena3D gun/dealer smile, App HUD)
- [x] Game logic: `surrendered` / `executionWeapon='shotgun'` / `dealerSmirk` state + `surrender()` instant-death flow in `src/hooks/useGameState.ts`
- [x] Logic-based availability: `isSurrenderAvailable` (low-HP thresholds per difficulty + hopeless / one-shot math)
- [x] Plumb props: `src/types.ts`, `src/App.tsx` -> `Arena3D`
- [x] 3D: hyper-realistic shotgun model (same PBR mats as revolver) hidden until surrender
- [x] 3D: player drops revolver (gunGroup -> table drop pose) during surrender
- [x] 3D: dealer sadistic smirk forced (smile factor override, bypass DESPERATE no-smile)
- [x] 3D: surrender execution uses always-live round, amplified muzzle/blood/camera kick
- [x] UI: Surrender button (PLAYER_TURN + grim only) + `F` key + gamepad hint
- [x] Verify: `tsc --noEmit`, `vite build`, in-game flow to GAME_OVER 0 HP
- [x] Commit locally (`10a3bf0`)
- [ ] Push (blocked: no GitHub auth in this shell — run `git push origin main` yourself)
