## Secrets

This repository may contain secrets, but for now only local ones have been
used, since the project is not deployed. These are local PostgreSQL
credentials, kept in a `.env` file that is gitignored. The exposure is low:
the platform only calls public, read-only exchange APIs, so no sensitive
exchange keys live in the project.

Secret detection was done from three angles:
- Gitleaks scan of the working tree and the full git history.
- Verification that no `.env` file was ever committed, on any branch.
- Keyword search across the history (apiKey, secret, password, exchange names).

No findings. A Gitleaks scan now runs in CI on every push and pull request to
catch any secret introduced in future development.