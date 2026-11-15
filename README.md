# shamli-lab
Applications in the use of the Shamli family

Live: https://itzikshamli.github.io/shamli-lab/

- `green-scientist/` — המדען הירוק: weekly science-class modules for parents and kids (Hebrew)
- `learning-lab/` — learning games for kids
  - `fun-with-math/` — counting, more/less, matching, adding and taking away (iPad, works offline)

See [PLAN.md](PLAN.md) for the plan and decisions.

## Tests
No build step. To check:
- `node tests/fun-with-math.test.js`
- `node tests/green-scientist.test.js`

## Releasing a new version of a game
Bump `CACHE_VERSION` in the game's `sw.js` and `APP_VERSION` in its `app.js` (they must match), so the iPad picks up the new files.
