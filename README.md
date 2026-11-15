# shamli-lab
Applications in the use of the Shamli family

Live: https://itzikshamli.github.io/shamli-lab/

- `learning-lab/` — learning games for kids
  - `fun-with-math/` — counting, more/less, matching, adding and taking away (iPad, works offline)

See [PLAN.md](PLAN.md) for the plan and decisions.

## Tests
No build step. To check the game logic: `node tests/fun-with-math.test.js`

## Releasing a new version of a game
Bump `CACHE_VERSION` in the game's `sw.js` and `APP_VERSION` in its `app.js` (they must match), so the iPad picks up the new files.
