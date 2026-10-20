# Research Persona Atlas

A local-first research-style reflection tool comparing actual behavior over the last six months with preferred work patterns for the next six months.

The app has 36 dual-response questions, 12 continuous dimensions, 16 design prototypes, gap explanations, a directed path explorer, and PNG card export. It is not a validated psychometric instrument, an ability ranking, or a diagnosis.

## Run

Serve this folder with `python -m http.server 4173 --bind 127.0.0.1`, then visit http://127.0.0.1:4173.

With Node 22+, run `npm ci`, `npm run check`, `npm test`, and `npm run build`. Developer-only dependencies provide ESLint, TypeScript checkJs and DOM tests; the runtime needs no installed dependencies. Production files are copied to dist.

Raw JavaScript, SVG and Canvas keep the application independent of remote services. Answers stay in localStorage; clearing assessment data is available in the UI. Optional background is excluded from exported cards.

Dimension scores are (mean − 1) × 25. Prototype similarity is 100 minus root-mean-square distance. All prototypes and directed transition rules are inspectable. Scores are not probabilities or population percentiles.

Configure repositoryUrl and publicUrl in config.js before publication. The Pages workflow validates and builds pull requests and deploys main after repository Pages is configured to GitHub Actions. Publication requires the owner's confirmation. No public demo is currently available.

Browser acceptance, product screenshots and full release verification remain outstanding. See [Chinese README](README.md), [progress](PROGRESS.md), [contribution guide](CONTRIBUTING.md) and [license](LICENSE).
