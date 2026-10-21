# Registro de cambios

Qué cambia en cada versión de los datos. Para fijar una versión, usa `@vX.Y.Z` en lugar de `@main` en la URL (ver [Versiones y compatibilidad](README.md#-versiones-y-compatibilidad)).

## 0.4.0 · 2026-10-21

### Fuente nueva

- **H**: [«Cómo identificar tarjetas bancarias en Cuba por sus dígitos»](https://www.lahabana.gob.cu/post_detalles/es/29956/como-identificar-tarjetas-bancarias-en-cuba-por-sus-digitos), del Portal del Ciudadano de La Habana. Reproduce la nota de BANDEC (fuente **B**), que hasta ahora no tenía enlace, así que ahora todos los prefijos de esa nota citan una fuente oficial con URL. Gracias a [@livegnik97](https://github.com/livegnik97) ([#11](https://github.com/qvapay/cuban_cards_prefixes/issues/11)).

### Datos nuevos

- `9200`: confirmada en BANDEC por [@rblez](https://github.com/rblez) ([#9](https://github.com/qvapay/cuban_cards_prefixes/issues/9)) y en Banco Metropolitano por [@earlyhp-qvapay](https://github.com/earlyhp-qvapay) ([#14](https://github.com/qvapay/cuban_cards_prefixes/issues/14)), que además cuenta que son las antiguas tarjetas en CUC convertidas a CUP; queda anotado a la espera de otra fuente.
- `9205`: Ahorro, confirmada también en BPA por [@aalvarezcbr](https://github.com/aalvarezcbr) ([#12](https://github.com/qvapay/cuban_cards_prefixes/issues/12)).
- `9224`: confirmada en Banco Metropolitano por [@vcarv7](https://github.com/vcarv7) ([#10](https://github.com/qvapay/cuban_cards_prefixes/issues/10)).
- `9227`: confirmada en Banco Metropolitano por [@Chichimokers](https://github.com/Chichimokers) ([#8](https://github.com/qvapay/cuban_cards_prefixes/issues/8)).
- `9250`: BANDEC la incluye en su nota junto a la `9228` (fuente **H**), así que pasa a estar confirmada en BANDEC.
- `9240`: la nota de BANDEC también la llama «Tropical»; queda en las notas.

Casi todos estos reportes llegaron desde el [Explorador de tarjetas cubanas](https://rblez.github.io/explorador-tarjetas-cubanas/) de [@rblez](https://github.com/rblez), que consume este catálogo en vivo y permite reportar un prefijo con un clic.

### Compatibilidad

- Los patrones no cambian: ya aceptaban cualquier banco RED para cualquier producto RED.

## 0.3.1 · 2026-10-21

### Datos nuevos

- `9205`: Ahorro, confirmada también en Banco Metropolitano con una tarjeta real. Gracias a [@xero-q](https://github.com/xero-q) ([#18](https://github.com/qvapay/cuban_cards_prefixes/issues/18)), que la reportó desde el [Explorador de tarjetas cubanas](https://rblez.github.io/explorador-tarjetas-cubanas/).

### Compatibilidad

- Los patrones no cambian: ya aceptaban cualquier banco RED para cualquier producto RED.

## 0.3.0 · 2026-10-21

### Novedades

- **Variantes por los dígitos 5–6**: campo opcional `variants` en `prefixes.json` para los productos que comparten los 4 primeros dígitos. En `validators.json` llegan el mapa `variants` y el patrón `patterns.clasica_empresarial`. Es el primer pull request de la comunidad que se integra: gracias a [@Chichimokers](https://github.com/Chichimokers) ([#7](https://github.com/qvapay/cuban_cards_prefixes/pull/7)).
- `976004`: Clásica Empresarial de FINCIMEX. CIMEX confirma el producto (fuente nueva **CE**). El prefijo sale de la lógica de Transfermóvil que analizó [@livegnik97](https://github.com/livegnik97) ([#5](https://github.com/qvapay/cuban_cards_prefixes/issues/5)) y falta confirmarlo con una tarjeta.
- `976003`: la Clásica, reportada en el [#5](https://github.com/qvapay/cuban_cards_prefixes/issues/5) y por [@drlorente97](https://github.com/drlorente97) ([#6](https://github.com/qvapay/cuban_cards_prefixes/pull/6)).
- FINCIMEX (Clásica) en el formulario de issues.

### Compatibilidad

- Los patrones que ya existían no cambian: `patterns.clasica` sigue aceptando todas las `9760`, incluida la `976004`.

## 0.2.0 · 2026-10-21

### Cambia lo que aceptan los patrones

- **Banco Metropolitano**: su código pasa de `95··` (parcial) a `9598`. `patterns.any`, `red`, `cup`, `usd`, `usd_mlc` e `issuers.METROPOLITANO` ya no aceptan otros dígitos 7–8 después del `95`. Gracias a [@armandofcom](https://github.com/armandofcom) ([#3](https://github.com/qvapay/cuban_cards_prefixes/issues/3)) y a [@Y4S3L23](https://github.com/Y4S3L23) ([#4](https://github.com/qvapay/cuban_cards_prefixes/issues/4)).

### Datos nuevos

- `9234`: Nómina, confirmada en BANDEC y en Banco Metropolitano ([#1](https://github.com/qvapay/cuban_cards_prefixes/issues/1), [#4](https://github.com/qvapay/cuban_cards_prefixes/issues/4)).
- `9238`: Ahorro, confirmada en BPA ([#2](https://github.com/qvapay/cuban_cards_prefixes/issues/2)).
- Fuente nueva **F**: un hilo de Kubaforum con los códigos de BANDEC, BPA y Banco Metropolitano ([#3](https://github.com/qvapay/cuban_cards_prefixes/issues/3)).

## 0.1.0 · 2026-10-20

- Primera versión: 27 prefijos, 5 emisores y validadores generados.
