# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A data repository, not an application: an open catalog of Cuban bank card prefixes (product, currency and bank behind the first 4–8 digits of a card) plus regex validators derived from it. It has zero package dependencies and builds with Node (CI uses 22). Node's built-in test runner tests the README's JavaScript and PHP examples; PHP tests skip locally if PHP is unavailable but are required in CI. Consumers fetch the JSON files directly from jsDelivr/GitHub `@main`, so whatever lands on `main` is effectively published.

## Commands

```sh
npm run build   # regenerate validators.json and the generated README sections from prefixes.json
npm run check   # check data consistency and generated files, then run the tests (what CI runs)
npm test        # test the README's JavaScript/PHP examples with local JSON fixtures, without network access
```

## Data flow

`prefixes.json` is the **only hand-edited source of truth**. `scripts/build.mjs` reads it and:

1. **Validates consistency**: 4-digit unique prefixes, RED prefixes start with `structure.RED[0].value` (`92`), currency is `CUP`/`USD`, CUP is never `mlc_backed`, and every `issuers`/`sources` id referenced exists.
2. **Generates `validators.json`**: anchored regexes under `patterns` (`any`, `red`, `cup`, `usd`, `usd_mlc`, plus one key per non-RED product, named after its `product` lowercased with accents removed and spaces turned into `_`, e.g. `Clásica` → `clasica`, and one per variant whose product differs from its parent's, e.g. `Clásica Empresarial` → `clasica_empresarial`), under `issuers` (one per RED bank with a `code`) and under `variants` (6-digit prefix → `product`, `aliases`, `issuers`). RED patterns are `92` + product digits 3–4 + bank code (digits 5–8) + remaining digits. A bank `code` shorter than 4 digits is a partial code and gets padded with `[0-9]`. Patterns use `[0-9]`, not `\d`, on purpose (non-ASCII digits in Python and other engines).
3. **Self-tests** the generated regexes against synthetic Luhn-valid numbers for every product × bank combination, plus negative cases.
4. **Rewrites README.md** between `<!-- name:start -->` / `<!-- name:end -->` markers for `badges`, `banks`, `prefixes` and `sources`. Never hand-edit inside those markers. The build fails if a marker pair is missing.

Never edit `validators.json` by hand. After changing `prefixes.json` or `build.mjs`, run `npm run build` and commit the regenerated files together.

## Things that are not wired to the build

- `schema.json` (JSON Schema 2020-12 for `prefixes.json`) is **not** validated by the build. If you add or change fields in `prefixes.json`, update the schema by hand.
- The JS/Python/PHP samples in the README's "Validar un número" section and the Quick start are hand-written and use `validators.json` keys (`normalize.strip_pattern`, `patterns.*`, `issuers.*`). `npm test` extracts the JS and PHP ones from the README and runs them against the local JSON, so a broken sample fails CI; the Python one is not tested. Renaming a key or a product name (which renames its pattern key) breaks them and external consumers.
- The bank dropdown in `.github/ISSUE_TEMPLATE/prefijo.yml` and the `issuerName` display map in `build.mjs` (special-cases `METROPOLITANO`) are maintained by hand when issuers change.

## Versioning and contributors

- Consumers read the JSON files straight from `@main`. Never change the format or meaning of an existing field, nor rename or remove a `validators.json` key, without a major version and a notice. Add new things as optional fields or new keys. A data correction that changes what a pattern accepts is allowed in a minor version, but it must be listed in `CHANGELOG.md`.
- On every data change:
  - Bump `version` in `prefixes.json` and `package.json`, and update `updated_at`.
  - Add a `CHANGELOG.md` entry in Spanish.
  - After pushing, tag the commit `vX.Y.Z`. The README tells consumers to pin `@vX.Y.Z`.
- `CHANGELOG.md` and the README's "Quién ha aportado" table are hand-written. When a contributor's data is integrated:
  - Add them to the table.
  - Credit their issue or PR in the source `notes` and in the changelog.
  - When reusing work from their PR, prefer getting their PR merged over re-implementing it.

## Data conventions

- Every prefix and issuer must cite at least one id from the `sources` list at the end of `prefixes.json`. Unknown values are `null` (e.g. `product`, `mlc_backed`) rather than guessed. Contradictions between sources go in `notes`.
- `issuers` on a prefix means banks where a source *confirms* that product, not every bank that could issue it. The regexes accept any known RED bank for any RED product.
- The Clásica (`9760`, `network: null`) does not follow the RED structure; its digits 5–8 are not a bank code.
- `variants` (optional, only on non-RED prefixes) lists 6-digit prefixes that identify a different product, e.g. `976004` Clásica Empresarial. The parent's pattern still accepts them, so adding a variant never narrows an existing pattern.
- All content, notes, build messages and the README are in Spanish (the README has a short English summary at the end). Keep new text in Spanish.
- Never write a full card number anywhere (data, commits, issues, examples). Use at most the first 8 digits, or synthetic numbers like those the self-test generates.
