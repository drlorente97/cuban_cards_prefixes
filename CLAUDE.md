# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A data repository, not an application: an open catalog of Cuban bank card prefixes (product, currency and bank behind the first 4–8 digits of a card) plus regex validators derived from it. It has zero dependencies, needs only Node (CI uses 22), and has no tests beyond the build's own checks. Consumers fetch the JSON files directly from jsDelivr/GitHub `@main`, so whatever lands on `main` is effectively published.

## Commands

```sh
npm run build   # regenerate validators.json and the generated README sections from prefixes.json
npm run check   # fail if prefixes.json is inconsistent or validators.json/README.md are stale (what CI runs)
```

## Data flow

`prefixes.json` is the **only hand-edited source of truth**. `scripts/build.mjs` reads it and:

1. **Validates consistency**: 4-digit unique prefixes, RED prefixes start with `structure.RED[0].value` (`92`), currency is `CUP`/`USD`, CUP is never `mlc_backed`, and every `issuers`/`sources` id referenced exists.
2. **Generates `validators.json`**: anchored regexes under `patterns` (`any`, `red`, `cup`, `usd`, `usd_mlc`, plus one key per non-RED product, named after its `product` lowercased with accents removed and spaces as `_`, e.g. `Clásica` → `clasica`, `AIS USD` → `ais_usd`) and under `issuers` (one per issuer with a `network` and a `code`). Every network in `structure` (`RED` 92, `AIS` 95, `CLASICA` 97) gets the same shape: network digits 1–2 + product digits 3–4 + bank `code` (digits 5–6) + `smpe` (digits 7–9) + remaining digits. A missing or partial `smpe` is padded with `[0-9]`. Products with `exclusive: true` (the Tropical, `9240`) only match their own `issuers`. It also writes `networks`: per network code, its products (currency, bank codes where they exist) and its banks (id, `smpe`), so consumers can check each element on its own. Patterns use `[0-9]`, not `\d`, on purpose (non-ASCII digits in Python and other engines).
3. **Self-tests** the generated regexes against synthetic Luhn-valid numbers for every product × bank combination, plus negative cases.
4. **Rewrites README.md** between `<!-- name:start -->` / `<!-- name:end -->` markers for `badges`, `banks`, `prefixes` and `sources`. Never hand-edit inside those markers. The build fails if a marker pair is missing.

Never edit `validators.json` by hand. After changing `prefixes.json` or `build.mjs`, run `npm run build` and commit the regenerated files together.

## Things that are not wired to the build

- `schema.json` (JSON Schema 2020-12 for `prefixes.json`) is **not** validated by the build. If you add or change fields in `prefixes.json`, update the schema by hand.
- The JS/Python/PHP samples in the README's "Validar un número" section and the Quick start are hand-written and use `validators.json` keys (`normalize.strip_pattern`, `patterns.*`, `issuers.*`). Renaming a key or a product name (which renames its pattern key) breaks them and external consumers.
- The bank dropdown in `.github/ISSUE_TEMPLATE/prefijo.yml` and the `issuerName` display map in `build.mjs` (special-cases `METROPOLITANO`) are maintained by hand when issuers change.

## Data conventions

- Every prefix and issuer must cite at least one id from the `sources` list at the end of `prefixes.json`. Unknown values are `null` (e.g. `product`, `mlc_backed`) rather than guessed. Contradictions between sources go in `notes`.
- `issuers` on a prefix means banks where a source *confirms* that product, not every bank that could issue it. The regexes accept any bank of the product's network unless the prefix has `exclusive: true`.
- Card structure: 1–2 network, 3–4 product, 5–6 bank, 7–9 SMPE (interbank suffix, fixed per bank; not part of the bank code), 10–15 sequential, 16 Luhn. Product `60` is USD on both AIS and Clásica.
- All content, notes, build messages and the README are in Spanish (the README has a short English summary at the end). Keep new text in Spanish.
- Never write a full card number anywhere (data, commits, issues, examples). Use at most the first 8 digits, or synthetic numbers like those the self-test generates.
