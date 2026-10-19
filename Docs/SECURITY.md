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

## Software Composition Analysis (SCA) — dépendances applicatives

### Périmètre et méthode

Les dépendances npm du monorepo sont auditées avec `pnpm audit`. Le point de départ était bruité : `pnpm audit` complet remontait 239 findings. Deux filtres successifs ramènent ce chiffre à ce qui compte réellement :

- `--prod` restreint au périmètre atteignable en runtime et écarte le bruit dev (linter, test runner, outillage de build). On passe de 239 à 175.
- Le tri manuel distingue ensuite dépendance directe et transitive, atteignable et non atteignable. Un CVSS élevé sur une transitive jamais chargée au runtime n'est pas un risque réel ; c'est le contexte d'atteignabilité qui prime, pas la sévérité brute.

### Correction

La montée via les carets (`^`) a résolu l'essentiel automatiquement :

```bash
pnpm audit --prod > audit-avant.txt   # 175
pnpm update --recursive               # ~137 corrigées via carets
pnpm audit --prod > audit-apres.txt   # 38 résiduelles
```

Les 38 résiduelles formaient un unique cluster `next` / `sharp` / `postcss`, bloqué non par une contrainte de majeure mais par un pin exact (sans caret) hérité de `create-next-app` dans `apps/dashboard/package.json`. Diagnostic : `pnpm view next version` renvoyait 16.4.2 (toujours en 16.x, donc pas de breaking change). Correction en ajoutant le caret :

```json
"next": "^16.2.0",
"eslint-config-next": "^16.2.0"
```

puis `pnpm update next eslint-config-next --recursive`. `sharp` et `postcss` sont tombés avec `next` qui les tire. Résultat : **0 vulnérabilité** sur le périmètre `--prod`.

### CI

Le workflow `.github/workflows/sca.yml` bloque toute PR introduisant une vulnérabilité `high` ou `critical` sur le périmètre runtime :

```yaml
- run: pnpm install --frozen-lockfile
- run: pnpm audit --prod --audit-level=high
```

`--prod` cible le runtime atteignable, `--audit-level=high` traite `moderate` comme informatif et bloque sur `high`/`critical`, `--frozen-lockfile` audite l'arbre exact du lockfile plutôt qu'une résolution improvisée. Dependabot complète ce contrôle : là où la CI est une barrière bloquante à l'entrée, Dependabot surveille en continu et propose des PRs de montée.

---

## Scan de conteneurs — images Docker

### Méthode

Les images sont scannées avec Trivy sur l'image **buildée** (pas sur le Dockerfile), ce qui donne les CVE réelles des paquets installés plutôt qu'une simple analyse de configuration :

```bash
trivy image --severity HIGH,CRITICAL <image>:latest
```

Leçon structurante retenue lors du premier scan : corriger les dépendances dans le repo ne corrige pas les images déjà construites. Une image est un artefact figé ; elle n'intègre un correctif SCA qu'après un rebuild. Le premier scan remontait les anciennes versions (next 16.2.0 et son cluster de criticals) parce que l'image datait d'avant le nettoyage des dépendances. Après `docker compose build`, ces findings disparaissent.

### Grille de lecture d'un scan de conteneur

Trois questions, dans l'ordre, pour trier tout finding :

1. **Est-ce dans la couche OS Alpine ?** (ex. `libcrypto3`, `libssl3`) → corrigé par un rebuild sur une base à jour, ou par `apk upgrade` au build. Ne dépend ni du package.json ni du lockfile.
2. **Est-ce dans mon `node_modules` applicatif ?** (ex. `next`, `multer`, `protobufjs`) → géré par le lockfile ; un rebuild suffit dès lors que le SCA a déjà corrigé la source. Une transitive encore bloquée en amont relève d'un override ou de l'attente d'un correctif parent.
3. **Est-ce dans le npm/pnpm embarqué de l'image de base** (`usr/local/lib/node_modules/...`, ex. `tar`, `ip-address`) ? → ni atteignable par mon application, ni installé par mon projet, ni présent dans mon lockfile. Ne se corrige qu'avec la version de l'image de base.

### Durcissement appliqué

Chaque Dockerfile épingle la base à un digest (build reproductible, montée de version explicite) et patche la couche OS au build :

```dockerfile
FROM node:20.19-alpine3.23@sha256:b4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293
RUN apk upgrade --no-cache
```

`apk upgrade` met à jour les paquets système Alpine ; les 4 CVE openssl de la couche OS passent ainsi à 0 sans toucher au code. `--no-cache` évite de laisser l'index des paquets dans l'image.

### Risque résiduel assumé

`apk upgrade` corrige la couche Alpine, pas les paquets npm/pnpm embarqués dans l'image Node de base. Ces findings (catégorie 3 ci-dessus) ne sont pas atteignables par l'application, ne sont pas sous le contrôle du projet, et ne se résolvent qu'en montant la version de l'image de base. Ils sont donc assumés comme risque résiduel hérité de la base, et traités par des rebuilds réguliers sur une image de base à jour — le mainteneur de l'image de base porte cette part de la sécurité, pas le projet.