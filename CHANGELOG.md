# Registro de cambios

Qué cambia en cada versión de los datos. Para fijar una versión, usa `@vX.Y.Z` en lugar de `@main` en la URL (ver [Versiones y compatibilidad](README.md#-versiones-y-compatibilidad)).

## 0.8.0 · 2026-10-29

Este fork pasa a su propio modelo y deja de ser compatible con el repositorio original.

### Cambia el formato y lo que aceptan los patrones

- **`issuers[].code`** tiene 2 dígitos (dígitos 5–6: `06`, `12`, `95`, `04`, `03`, `02`) y el SMPE (dígitos 7–9) va aparte en `smpe`, obligatorio y `null` si no se conoce.
- **`network`** pasa a ser `RED` (`92`), `AIS` (`95`) o `CLASICA` (`97`). Antes la Clásica y las AIS eran `null`. `structure` describe las tres.
- **Los patrones exigen el SMPE** del banco: `9205 0699 0000 0000` ya no pasa; `9205 0699 9000 0001` sí. Los patrones por banco usan los 9 dígitos conocidos.
- **`exclusive`**: la Tropical (`9240`) solo existe en BANDEC, y `patterns.any` y `usd` no la aceptan en otro banco.
- La Clásica (`9760`) y las AIS (`9550`, `9560`) siguen su red: `patterns.clasica` y `patterns.ais_*` aceptan los bancos de su red y las variantes (`976004`) como antes.

### Datos nuevos

- **`validators.networks`**: cada elemento por separado (red, productos con moneda y bancos, bancos con SMPE) para validar uno contra otro y decir cuál falla.
- Emisores `FINCIMEX` (`03`, SMPE `900`) y `AIS` (`02`, SMPE `90·`) con red propia.
- El README explica cada elemento por separado, con el diagrama y la tabla de validación y `explain()` en el ejemplo de JavaScript. La tabla de bancos muestra red, código y SMPE.
- Formulario de issues: pide los 9 primeros dígitos.

## 0.7.1 · 2026-10-29

### Datos nuevos

- `9236`: cuentas corrientes y asociadas a créditos y consumos específicos en pesos (CUP), típica de líneas de crédito y subsidios estatales a personas naturales (reporte directo).

### Compatibilidad

- `patterns.any` y `patterns.cup` aceptan ahora la `9236` con cualquier banco RED.

## 0.7.0 · 2026-10-29

### Datos nuevos

- Fuente nueva **O**: la tabla de cuentas bancarias fiscales (CBF) publicada por la cuenta oficial de la ONAT.
- `9200` pasa a «Ahorro» y `9202` a «Estímulo».
- Campo opcional `fiscal` en los prefijos: `true` en `9212`, `9213` y `9226`. En el README se marcan con 🧾.
- Notas de la ONAT en `9200`, `9204`, `9224`, `9227` y `9235`. La `9227` tiene dos usos: nómina y nómina de artistas, que es fiscal.

## 0.6.0 · 2026-10-29

### Datos nuevos

- Campo opcional `smpe` en `issuers`: los dígitos 7–9 de cada banco (BANDEC `999`, BPA `997`, Banco Metropolitano `987`). El build comprueba que sus dos primeros dígitos coinciden con los dos últimos de `code`. Los patrones no cambian: todavía no exigen el dígito 9.
- La tabla de bancos del README muestra los dígitos 7–9.
- Fuente nueva **S**: titulares que dan los dígitos 7–9 de cada banco.

## 0.5.2 · 2026-10-21

### Datos nuevos

- `9212`: Trabajadores por cuenta propia (TCP), confirmada también en Banco Metropolitano por un titular (reporte directo).

### Compatibilidad

- Los patrones no cambian: ya aceptaban cualquier banco RED para cualquier producto RED.

## 0.5.1 · 2026-10-21

### Datos nuevos

- `9204`: Nómina, fondos, ahorro, confirmada también en BPA por un titular con su tarjeta (reporte directo).

### Compatibilidad

- Los patrones no cambian: ya aceptaban cualquier banco RED para cualquier producto RED.

## 0.5.0 · 2026-10-21

### Cambia lo que aceptan los patrones

- **Tropical (`9240`)**: pasa a ser un prepago en USD **sin** respaldo en MLC (`mlc_backed: false`, producto «Prepago en USD»). `patterns.usd_mlc` ya no la acepta; `patterns.usd` y `patterns.any` la siguen aceptando. Fuente nueva **D** (Directorio Cubano, 2025, con información de BANDEC). La nota de BANDEC (fuentes **B** y **H**) la agrupaba con las de respaldo en MLC; la contradicción queda en las notas.
- **AIS**: `patterns.any`, `cup` y `usd` aceptan ahora las tarjetas AIS.

### Datos nuevos

- Emisor **AIS** (American International Services, de CIMEX) y sus tarjetas `9550` (CUP) y `9560` (USD), con `network: null` como la Clásica: sus dígitos 5–8 no son un código de banco. Fuentes nuevas **A** (Cimex responde sobre las AIS, Directorio Cubano, 2020) y **FX** (aviso oficial de FINCIMEX sobre el paso de las AIS en CUC a CUP).
- Claves nuevas `patterns.ais_cup` y `patterns.ais_usd`.
- El formulario de issues añade AIS.
- Gracias a [@drlorente97](https://github.com/drlorente97) ([#16](https://github.com/qvapay/cuban_cards_prefixes/pull/16), continuación del [#6](https://github.com/qvapay/cuban_cards_prefixes/pull/6)).

### Build

- El build falla si un prefijo que no es RED no tiene producto o si dos claves de patrón coinciden, y autocomprueba que cada producto que no es RED cumple solo su patrón, no cumple `red`, y cumple `cup` o `usd` según su moneda.
- `npm test` ejecuta los ejemplos JavaScript y PHP del README contra los JSON locales, y `npm run check` lo incluye en CI. Los ejemplos lanzan un error si `kind` no es una clave de `patterns`: antes aceptaban cualquier número con un `kind` desconocido. Gracias a [@ecejas](https://github.com/ecejas) ([#21](https://github.com/qvapay/cuban_cards_prefixes/pull/21)).

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

### Distribución

- Cada push a `main` purga la caché de jsDelivr, así que `@main` refleja los cambios en minutos en lugar de hasta 12 horas.

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
