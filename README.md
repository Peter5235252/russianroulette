# Russian Roulette: Abyss

A dark, turn-based solo survival duel for one player against a computer-controlled Dealer. The game builds on the Russian roulette premise with a randomized cylinder, health, tactical items, a blood-funded market, and a 3D horror atmosphere.

## Play in your browser

[Play the WebAssembly-powered browser version](https://peter5235252.github.io/russianroulette/). The game runs directly in a modern browser; no desktop launcher or separate game download is required.

## How the game works

- Each round loads a six-chamber cylinder with **1–5 live rounds** and the remaining chambers blank. The live rounds are shuffled through the cylinder.
- On your turn, choose to shoot yourself or the Dealer. A live round deals 35 base damage; shooting yourself doubles that damage, and items can modify damage or protection.
- A blank shot at yourself keeps your turn. A blank shot at the Dealer passes the turn.
- Earn blood currency by damaging the Dealer and spend it in the Black Market. The 11-item pool includes chamber inspection, shell ejection, healing, protection, and damage boosts.
- Defeat the Dealer to finish a round. The Tutorial teaches the rules, items, market, probability, and surrender option.

### Difficulty modes

| Mode | Player start | Dealer start | Cylinder information |
| --- | --- | --- | --- |
| Tutorial | Guided setup | Scripted walkthrough | Demonstrates the rules |
| Normal | 100 HP, 3 items | 100 HP, 3 items | Shows live and blank counts |
| Hard | 75 HP, 2 items | 125 HP, 4 items | Shows remaining chamber count only |
| Very Hard | 50 HP, 1 item | 150 HP, 5 items | Hides the cylinder HUD |
| Nightmare | 30 HP, no items | 200 HP, 6 items | Shows deceptive cylinder counts |

### Keyboard shortcuts

| Action | Keys |
| --- | --- |
| Shoot yourself | `S` or `←` |
| Shoot the Dealer | `D` or `→` |
| Use an item in slots 1–8 | `1`–`8` |
| Open the market/shop view | `Q` or `↑` / `↓` |
| Confirm / primary action | `Space` or `Enter` |
| Open or close settings | `Tab` or `Esc` |

Mouse and gamepad input are also supported. Gamepad mode, vibration, and additional control hints are available in Settings.

## How it runs

- **React and TypeScript** render the interface and manage the game flow. **Vite** builds the browser app; Tailwind CSS and Motion handle styling and animation.
- The 3D arena is rendered with **Three.js**. It prefers WebGPU and can fall back to WebGL when WebGPU or a compatible adapter is unavailable.
- Selected core rules—round generation, shot damage, and item effects—are implemented in **Rust** and compiled to **WebAssembly** with `wasm-pack` and `wasm-bindgen`. The turn flow and interface remain in TypeScript. See [`src/wasm/gameCore.ts`](src/wasm/gameCore.ts) and [`wasm/src/lib.rs`](wasm/src/lib.rs).
- Settings are persisted in browser storage. Sound effects use browser audio playback and several samples are loaded from external Freesound and Pixabay URLs, so audio may be unavailable if those hosts are blocked.

## GitHub Pages and the optional AI Dealer

The [GitHub Pages workflow](.github/workflows/deploy-pages.yml) builds the WebAssembly module and static site on pushes to `main`, then publishes `dist/site`. Vite uses `/russianroulette/` as the project-site base path.

The Settings screen also offers optional Gemini, ChatGPT/OpenAI, Claude, and Grok decision providers. Those requests use the Express API in [`server.ts`](server.ts). GitHub Pages serves only the static site and does not run that Express server, so the public Pages version uses the built-in local tactical Dealer when the API endpoint is unavailable. Provider-backed decisions require a running Express backend and a provider API key; an API key is not needed to play the game.

## Run locally

Requirements: Node.js 22, Rust/Cargo, the `wasm32-unknown-unknown` Rust target, and `wasm-pack`.

```sh
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
npm ci
npm run dev
```

`npm run dev` builds the WebAssembly module and starts the Vite/Express development server at `http://localhost:3000`. `npm run build` builds the WebAssembly module and production frontend; the Pages workflow sets `GITHUB_PAGES=true` to produce the site under `dist/site`.

## License

Unless otherwise stated, the original project code and documentation in this repository are licensed under the [MIT License](LICENSE). Third-party dependencies and externally hosted media remain under their respective licenses. The audio URLs in `src/audio.ts` point to external samples and do not relicense those recordings; check each source listing for its terms and attribution requirements.
