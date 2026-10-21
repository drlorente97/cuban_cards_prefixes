<div align="center">

<img src="assets/anatomy.svg" alt="Anatomía de una tarjeta cubana: red, producto y moneda, banco, SMPE, consecutivo y dígito de control" width="100%">

# Prefijos de tarjetas cubanas

**Qué producto, qué moneda y qué banco hay detrás de cada tarjeta cubana.**<br>
Un catálogo abierto, con sus fuentes, y validadores listos para usar en cualquier lenguaje.

<!-- badges:start -->
![prefijos](https://img.shields.io/badge/prefijos-29-0ea5e9) ![emisores](https://img.shields.io/badge/emisores-6-6366f1) ![versión](https://img.shields.io/badge/versi%C3%B3n-0.2.0-22c55e) ![dependencias](https://img.shields.io/badge/dependencias-0-f59e0b) [![licencia](https://img.shields.io/badge/licencia-MIT-64748b)](LICENSE) [![check](https://github.com/qvapay/cuban_cards_prefixes/actions/workflows/check.yml/badge.svg)](https://github.com/qvapay/cuban_cards_prefixes/actions/workflows/check.yml)
<!-- badges:end -->

[Inicio rápido](#-inicio-rápido) · [Anatomía](#-anatomía-de-una-tarjeta) · [Bancos](#-bancos) · [Prefijos](#-prefijos) · [Validar](#-validar-un-número) · [Formato](#-formato-de-los-datos) · [Contribuir](#-contribuir) · [English](#-english)

</div>

---

## ✨ Para qué sirve

- **Validar formularios.** Rechaza al momento un número que no es una tarjeta cubana o que tiene un dígito mal tecleado.
- **Decir qué tarjeta es mientras se escribe.** En cuanto se teclea el banco ya puedes mostrar «Tarjeta en CUP · BANDEC · Ahorro», y si algo no cuadra, decir qué parte está mal.
- **Evitar envíos a la tarjeta equivocada.** Distingue CUP, USD con respaldo en MLC y USD (Clásica, Tropical, AIS) antes de mandar el dinero.
- **Sin dependencias, en cualquier lenguaje.** Son dos ficheros JSON y unas expresiones regulares.
- **Con fuentes.** Cada prefijo dice de dónde sale, y lo que no está confirmado se marca como tal.

> [!NOTE]
> No es una fuente oficial de ningún banco. Es un catálogo comunitario: verifica los datos antes de usarlos para mover dinero.

## ⚡ Inicio rápido

Los datos se pueden usar directamente desde la CDN de jsDelivr, que admite CORS y sirve también en el navegador, o desde GitHub:

```text
https://cdn.jsdelivr.net/gh/qvapay/cuban_cards_prefixes@main/validators.json
https://cdn.jsdelivr.net/gh/qvapay/cuban_cards_prefixes@main/prefixes.json
https://raw.githubusercontent.com/qvapay/cuban_cards_prefixes/main/prefixes.json
```

```js
const v = await fetch('https://cdn.jsdelivr.net/gh/qvapay/cuban_cards_prefixes@main/validators.json').then(r => r.json())

const n = '9205 0699 9000 0001'.replace(new RegExp(v.normalize.strip_pattern, 'g'), '')

new RegExp(v.patterns.cup).test(n)     // true: es una tarjeta en CUP
new RegExp(v.issuers.BANDEC).test(n)   // true: es de BANDEC
// Falta el dígito de control: ver «Validar un número»
```

`@main` siempre trae la última versión. Para fijar una, cambia `@main` por un commit o una etiqueta.

| Fichero | Qué contiene |
|---|---|
| [`prefixes.json`](prefixes.json) | El catálogo: estructura del número, bancos, prefijos con su producto y su moneda, y fuentes. Es el único fichero que se edita a mano. |
| [`validators.json`](validators.json) | Generado a partir del catálogo: expresiones regulares por moneda, por red y por banco, y cada elemento por separado (`networks`) para validar uno a uno. |
| [`schema.json`](schema.json) | El esquema de `prefixes.json` (JSON Schema 2020-12). |

## 🔢 Anatomía de una tarjeta

Las tarjetas cubanas tienen 16 dígitos, repartidos en seis elementos:

| Dígitos | Elemento | Ejemplo |
|:-:|---|---|
| 1–2 | **Red** | `92` |
| 3–4 | **Producto** | `05` |
| 5–6 | **Banco** | `06` |
| 7–9 | **SMPE** | `999` |
| 10–15 | Consecutivo | |
| 16 | Dígito de control [Luhn](https://es.wikipedia.org/wiki/Algoritmo_de_Luhn) (ISO/IEC 7812) | |

Cada elemento depende del anterior: el producto y el banco dependen de la red, y el SMPE depende del banco.

### Red

La red a la que pertenece la tarjeta. Su código siempre empieza por 9.

| Red | Código | Productos | Bancos |
|---|:-:|---|---|
| **RED** | `92` | Los de [Prefijos](#-prefijos): CUP, USD con respaldo en MLC y la Tropical en USD | BANDEC, BPA, Metropolitano, BICSA |
| **AIS** | `95` | `50` CUP, `60` USD | AIS |
| **Clásica** | `97` | `60` USD | FINCIMEX |

### Producto

Qué tarjeta es y en qué moneda. **Un mismo código puede significar cosas distintas en cada red**: `50` es USD con respaldo en MLC en RED, pero CUP en AIS. Por eso el producto siempre se lee junto con la red, y la combinación de los dos es el **prefijo** (`9205`, `9550`…) que cataloga este repositorio.

### Banco

El banco o la entidad que emite la tarjeta. Cada banco pertenece a una sola red. Un producto suele existir en todos los bancos de su red; la excepción es la Tropical (`9240`), que solo emite BANDEC.

### SMPE

Sufijo de la red interbancaria. **No forma parte del código del banco**, pero cada banco tiene siempre el mismo, así que sirve para confirmarlo: un número de BANDEC sigue siempre con `999`. Los códigos y los SMPE de cada banco están en la tabla de [Bancos](#-bancos).

## 🏦 Bancos

<!-- banks:start -->
| Banco | Red | Código | SMPE | Patrón |
|---|:-:|:-:|:-:|---|
| **BANDEC** · Banco de Crédito y Comercio | RED `92` | `06` | `999` | `issuers.BANDEC` |
| **BPA** · Banco Popular de Ahorro | RED `92` | `12` | `997` | `issuers.BPA` |
| **Banco Metropolitano** | RED `92` | `95` | `987` | `issuers.METROPOLITANO` |
| **BICSA** · Banco Internacional de Comercio S.A. | RED `92` | `04` | — | `issuers.BICSA` |
| **FINCIMEX** · Financiera CIMEX S.A. | Clásica `97` | `03` | `900` | `issuers.FINCIMEX` |
| **AIS** · American International Services | AIS `95` | `02` | `90·` (parcial) | `issuers.AIS` |
<!-- banks:end -->

## 📋 Prefijos

Un prefijo es la red más el producto. Cada uno dice qué tarjeta es, en qué moneda y en qué bancos está confirmada.

<!-- prefixes:start -->
### 🇨🇺 Pesos cubanos (CUP)

| Prefijo | Producto | Confirmado en | Fuentes |
|:-:|---|---|:-:|
| **`9200`** | _Sin identificar_ · [¿la tienes?](https://github.com/qvapay/cuban_cards_prefixes/issues/new?template=prefijo.yml&prefix=9200) ¹ | — | C |
| **`9202`** | _Sin identificar_ · [¿la tienes?](https://github.com/qvapay/cuban_cards_prefixes/issues/new?template=prefijo.yml&prefix=9202) | — | C |
| **`9204`** | Nómina, fondos, ahorro | BANDEC | B · C |
| **`9205`** | Ahorro | BANDEC | B · C |
| **`9206`** | Jubilación | BANDEC | B · C |
| **`9210`** | Colaboradores | BANDEC | B · C · T |
| **`9211`** | Colaboradores | BANDEC | B · C · T |
| **`9212`** | Trabajadores por cuenta propia (TCP) | BANDEC | B · C |
| **`9213`** | Trabajadores por cuenta propia (TCP) | BANDEC | B · C |
| **`9216`** | Subsidios | BANDEC | B · C |
| **`9224`** | Nómina, fondos, ahorro | BANDEC | B · C |
| **`9227`** | Nómina, fondos, ahorro | BANDEC | B · C |
| **`9233`** | MIPYMES / cooperativas no agropecuarias | BANDEC | B · C |
| **`9234`** | _Sin identificar_ · [¿la tienes?](https://github.com/qvapay/cuban_cards_prefixes/issues/new?template=prefijo.yml&prefix=9234) | — | C |
| **`9237`** | Agricultores / usufructuarios | BANDEC | B · C |
| **`9238`** | _Sin identificar_ · [¿la tienes?](https://github.com/qvapay/cuban_cards_prefixes/issues/new?template=prefijo.yml&prefix=9238) | — | C |
| **`9244`** | _Sin identificar_ · [¿la tienes?](https://github.com/qvapay/cuban_cards_prefixes/issues/new?template=prefijo.yml&prefix=9244) | — | C |
| **`9248`** | _Sin identificar_ · [¿la tienes?](https://github.com/qvapay/cuban_cards_prefixes/issues/new?template=prefijo.yml&prefix=9248) | — | C |
| **`9550`** | AIS CUP | AIS | S |

> ¹ **`9200`**: El catálogo comunitario la describe como «Tarjeta en CUP», sin propósito concreto.

### 💵 USD con respaldo en MLC

| Prefijo | Producto | Confirmado en | Fuentes |
|:-:|---|---|:-:|
| **`9225`** | Ahorro de personas naturales | BANDEC | B · C |
| **`9226`** | TCP / productores agropecuarios | BANDEC | B · C |
| **`9228`** | Cooperativas / MIPYMES | BANDEC | B · C |
| **`9229`** | Otras entidades ¹ | BANDEC | B · C |
| **`9235`** | Ahorro de personas naturales | BANDEC | B · C |
| **`9245`** | _Sin identificar_ · [¿la tienes?](https://github.com/qvapay/cuban_cards_prefixes/issues/new?template=prefijo.yml&prefix=9245) | — | C |
| **`9250`** | Cooperativas / MIPYMES | — | C |

> ¹ **`9229`**: El catálogo comunitario la describe como «Personas jurídicas».

### 💳 USD

| Prefijo | Producto | Confirmado en | Fuentes |
|:-:|---|---|:-:|
| **`9240`** | Ahorro de personas naturales · «Tropical» ¹ | BANDEC | B · C · S |
| **`9760`** | Clásica | FINCIMEX | C · S |
| **`9560`** | AIS USD | AIS | S |

> ¹ **`9240`**: Es USD, no MLC (confirmado por titulares), aunque BANDEC la agrupa con las tarjetas en USD con respaldo en MLC. El catálogo comunitario la llama «Tropical». Solo existe en BANDEC.
<!-- prefixes:end -->

**Confirmado en** son los bancos en los que una fuente confirma ese producto. No es una lista cerrada: el mismo producto puede existir en otros bancos, y los validadores lo aceptan en cualquier banco de su red. La excepción es la Tropical (`9240`), que solo existe en BANDEC. Las letras de **Fuentes** se explican en [Fuentes](#-fuentes).

## ✅ Validar un número

Se valida un elemento cada vez, en orden, y cada uno contra los anteriores. El primero que falla es el que hay que corregir, y se puede avisar mientras el usuario escribe.

| | Elemento | Es válido si… | Ejemplo que falla | Por qué |
|:-:|---|---|---|---|
| 1 | Red | es `92`, `95` o `97` | `93 …` | No es una red |
| 2 | Producto | existe en esa red | `95 05 …` | `05` es un producto de RED, no de AIS |
| 3 | Banco | es de esa red y, si el producto es exclusivo, de sus bancos | `92 05 03 …`<br>`92 40 12 …` | `03` es de la Clásica<br>La Tropical solo es de BANDEC |
| 4 | SMPE | es el de ese banco | `92 05 06 987 …` | `987` es el de Metropolitano |
| 5 | Luhn | el dígito de control cuadra | un dígito mal tecleado | |

Para validar un número completo:

1. **Normaliza** el número: quita lo que indica `normalize.strip_pattern`.
2. **Compara** con un patrón de `validators.json`. Los patrones hacen los pasos 1 a 4 de una vez; para saber cuál falla, usa `validators.networks` (ver `explain` en el ejemplo de JavaScript).
3. **Comprueba el dígito de control** Luhn. Una expresión regular no puede hacerlo, pero son pocas líneas de código.

| Patrón | Acepta |
|---|---|
| `patterns.any` | Cualquier tarjeta cubana del catálogo |
| `patterns.red` | Cualquier tarjeta de la red RED |
| `patterns.cup` | Tarjetas en CUP |
| `patterns.usd` | Tarjetas en USD: con respaldo en MLC, Tropical, Clásica y AIS USD |
| `patterns.usd_mlc` | Tarjetas en USD con respaldo en MLC |
| `patterns.clasica` | Tarjeta Clásica |
| `patterns.ais_cup`, `patterns.ais_usd` | Tarjetas AIS en CUP y en USD |
| `issuers.<BANCO>` | Tarjetas de ese banco o emisora |

Los patrones usan `[0-9]` en lugar de `\d`, porque en Python y en otros motores `\d` también acepta dígitos que no son ASCII. Funcionan igual en JavaScript, Python, PHP, Java, Go, Dart y Ruby.

<details open>
<summary><b>JavaScript</b></summary>

```js
const BASE = 'https://cdn.jsdelivr.net/gh/qvapay/cuban_cards_prefixes@main'
const [catalog, v] = await Promise.all(
  ['prefixes.json', 'validators.json'].map(f => fetch(`${BASE}/${f}`).then(r => r.json()))
)

const luhn = (n) => {
  let sum = 0
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i])
    if (i % 2) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  return sum % 10 === 0
}

const normalize = (raw) => String(raw ?? '').replace(new RegExp(v.normalize.strip_pattern, 'g'), '')

// kind: any | red | cup | usd | usd_mlc | clasica | ais_cup | ais_usd
const isCubanCard = (raw, kind = 'any') => {
  const n = normalize(raw)
  return new RegExp(v.patterns[kind]).test(n) && luhn(n)
}

// { prefix, currency, mlc_backed, product, bank } o null
const describe = (raw) => {
  const n = normalize(raw)
  if (!isCubanCard(n)) return null
  const p = catalog.prefixes.find(p => p.prefix === n.slice(0, 4))
  const bank = Object.keys(v.issuers).find(id => new RegExp(v.issuers[id]).test(n)) ?? p.issuers[0] ?? null
  return { prefix: p.prefix, currency: p.currency, mlc_backed: p.mlc_backed, product: p.product, bank }
}

describe('9205 0699 9000 0001')
// { prefix: '9205', currency: 'CUP', mlc_backed: false, product: 'Ahorro', bank: 'BANDEC' }

// Primer elemento que falla con lo que se lleva escrito, o null. Sirve mientras se escribe.
const explain = (raw) => {
  const n = normalize(raw)
  const net = v.networks[n.slice(0, 2)]
  if (n.length >= 2 && !net) return 'red'
  const product = net?.products[n.slice(2, 4)]
  if (n.length >= 4 && !product) return 'producto'
  const bank = n.slice(4, 6)
  if (n.length >= 6 && !product.issuers.includes(bank)) return 'banco'
  const smpe = net?.issuers[bank]?.smpe ?? ''
  if (n.length > 6 && !smpe.startsWith(n.slice(6, 6 + smpe.length))) return 'smpe'
  if (n.length === 16 && !luhn(n)) return 'luhn'
  return null
}

explain('9205 06')    // null
explain('9205 0698')  // 'smpe'
```

</details>

<details>
<summary><b>Python</b></summary>

```python
import json, re, urllib.request

BASE = 'https://cdn.jsdelivr.net/gh/qvapay/cuban_cards_prefixes@main'

def load(name):
    with urllib.request.urlopen(f'{BASE}/{name}') as r:
        return json.load(r)

catalog, v = load('prefixes.json'), load('validators.json')

def luhn(n):
    total = 0
    for i, ch in enumerate(reversed(n)):
        d = int(ch)
        if i % 2:
            d = d * 2 - 9 if d > 4 else d * 2
        total += d
    return total % 10 == 0

def normalize(raw):
    return re.sub(v['normalize']['strip_pattern'], '', str(raw or ''))

def is_cuban_card(raw, kind='any'):
    n = normalize(raw)
    return re.match(v['patterns'][kind], n) is not None and luhn(n)

def describe(raw):
    n = normalize(raw)
    if not is_cuban_card(n):
        return None
    p = next(p for p in catalog['prefixes'] if p['prefix'] == n[:4])
    bank = next((bank for bank, pattern in v['issuers'].items() if re.match(pattern, n)), None)
    return {
        'prefix': p['prefix'],
        'currency': p['currency'],
        'mlc_backed': p['mlc_backed'],
        'product': p['product'],
        'bank': bank or next(iter(p['issuers']), None),
    }

describe('9205 0699 9000 0001')
# {'prefix': '9205', 'currency': 'CUP', 'mlc_backed': False, 'product': 'Ahorro', 'bank': 'BANDEC'}
```

</details>

<details>
<summary><b>PHP</b></summary>

```php
<?php
$base = 'https://cdn.jsdelivr.net/gh/qvapay/cuban_cards_prefixes@main';
$v = json_decode(file_get_contents("$base/validators.json"), true);

function luhn(string $n): bool {
    $sum = 0;
    foreach (array_reverse(str_split($n)) as $i => $ch) {
        $d = (int) $ch;
        if ($i % 2) { $d *= 2; if ($d > 9) $d -= 9; }
        $sum += $d;
    }
    return $sum % 10 === 0;
}

function normalizeCard(string $raw, array $v): string {
    return preg_replace('/' . $v['normalize']['strip_pattern'] . '/', '', $raw);
}

// $kind: any | red | cup | usd | usd_mlc | clasica
function isCubanCard(string $raw, array $v, string $kind = 'any'): bool {
    $n = normalizeCard($raw, $v);
    return preg_match('/' . $v['patterns'][$kind] . '/', $n) === 1 && luhn($n);
}

// 'BANDEC' | 'BPA' | 'METROPOLITANO' | 'BICSA' | null
function bankOf(string $raw, array $v): ?string {
    $n = normalizeCard($raw, $v);
    if (!isCubanCard($n, $v, 'red')) return null;
    foreach ($v['issuers'] as $id => $pattern) {
        if (preg_match('/' . $pattern . '/', $n) === 1) return $id;
    }
    return null;
}

var_dump(isCubanCard('9205 0699 9000 0001', $v, 'cup')); // bool(true)
var_dump(bankOf('9205-0699-9000-0001', $v));             // string(6) "BANDEC"
```

</details>

## 📦 Formato de los datos

Cada prefijo de `prefixes.json` tiene esta forma:

```json
{
  "prefix": "9240",
  "network": "RED",
  "currency": "USD",
  "mlc_backed": false,
  "product": "Ahorro de personas naturales",
  "aliases": ["Tropical"],
  "issuers": ["BANDEC"],
  "exclusive": true,
  "sources": ["bandec_post", "community_catalog", "smpe_report"],
  "notes": "Es USD, no MLC (confirmado por titulares), aunque BANDEC la agrupa con las tarjetas en USD con respaldo en MLC. El catálogo comunitario la llama «Tropical». Solo existe en BANDEC."
}
```

| Campo | Qué es |
|---|---|
| `prefix` | Red y producto |
| `network` | Red de la tarjeta: `RED` (`92`), `AIS` (`95`) o `CLASICA` (`97`) |
| `currency` | `CUP` o `USD` |
| `mlc_backed` | `true` si es USD con respaldo en MLC, como lo llama BANDEC. `null` si no se sabe |
| `product` | Producto o propósito. `null` si todavía no se ha identificado |
| `aliases` | Otros nombres con los que se conoce |
| `issuers` | Bancos en los que una fuente confirma el producto |
| `sources` | Fuentes de ese dato (lista `sources` al final del fichero) |
| `notes` | Aclaraciones y contradicciones entre fuentes |
| `exclusive` | Opcional. `true` si el producto solo existe en los bancos de `issuers` (la Tropical) |

En `issuers`, `code` es el código del banco y `smpe` su SMPE. Si `smpe` está incompleto, el resto todavía no se conoce; si es `null`, no se conoce.

`validators.networks` tiene lo mismo separado por elemento: por cada red, sus productos (moneda y bancos en los que existen) y sus bancos (con su SMPE).

## 📚 Fuentes

<!-- sources:start -->
| | Fuente | Qué aporta |
|:-:|---|---|
| **B** | ¿Sabías que los dígitos de tu tarjeta Bandec revelan su propósito? | Publicación atribuida a BANDEC sobre el producto de sus tarjetas. |
| **C** | Cuban Bank Card Prefixes v1.0.0 (2026-06-20) | Catálogo comunitario. Para la estructura del número cita el documento «Tomo 2 Digital». |
| **T** | Titulares de tarjeta | Titulares que confirman tarjetas BANDEC (06·999) y BPA (12·997) y tarjetas BANDEC 9210 y 9211. |
| **S** | Titulares: banco y SMPE | Redes 92 (RED), 95 (AIS) y 97 (Clásica); código de banco y SMPE de cada banco (BANDEC 06·999, BPA 12·997, Metropolitano 95·987, Clásica 03·900, AIS 02·90); productos AIS 50 (CUP) y 60 (USD); la Tropical (9240) es USD sin respaldo en MLC y solo existe en BANDEC. |
| **ISO** | [ISO/IEC 7812-1: números de identificación de tarjetas](https://en.wikipedia.org/wiki/ISO/IEC_7812) | El último dígito de un número de tarjeta es un dígito de control Luhn. |
<!-- sources:end -->

## 🔍 Ayúdanos a completarlo

- El producto de los prefijos marcados como _Sin identificar_ en las tablas.
- El SMPE de BICSA y el último dígito del SMPE de AIS.
- El enlace a la publicación de BANDEC.

¿Tienes una de esas tarjetas o una fuente? [Cuéntanoslo](https://github.com/qvapay/cuban_cards_prefixes/issues/new?template=prefijo.yml).

## 🤝 Contribuir

- **Con un issue**: el formulario de [nuevo prefijo o corrección](https://github.com/qvapay/cuban_cards_prefixes/issues/new?template=prefijo.yml) pide los 9 primeros dígitos, el banco, la moneda, el producto y la fuente.
- **Con un pull request**:
  1. Edita `prefixes.json` y cita la fuente de cada dato: un enlace, un documento o tu propia tarjeta.
  2. Ejecuta `npm run build`. Regenera `validators.json` y las tablas de este README.
  3. Ejecuta `npm run check`. Comprueba que el catálogo es coherente y que lo generado está al día. Lo mismo corre en cada pull request.

> [!WARNING]
> **Nunca publiques un número de tarjeta completo** en un issue, un pull request o un commit. Bastan los 9 primeros dígitos: red, producto, banco y SMPE.

## 🇺🇸 English

<details>
<summary>Summary in English</summary>

An open catalog of **Cuban bank card prefixes**: which product, currency and bank sit behind the first digits of a Cuban card, plus ready-to-use validators for any language.

- [`prefixes.json`](prefixes.json): the catalog (card structure, banks, prefixes and sources). Texts are in Spanish.
- [`validators.json`](validators.json): regular expressions generated from the catalog, by currency (`cup`, `usd`, `usd_mlc`, `clasica`, `ais_cup`, `ais_usd`, `any`) and by bank (`BANDEC`, `BPA`, `METROPOLITANO`, `BICSA`, `FINCIMEX`, `AIS`), plus `networks`, each element on its own to tell which one is wrong.
- [`schema.json`](schema.json): JSON Schema 2020-12 for `prefixes.json`.

Cuban cards have 16 digits: digits 1–2 are the network (`92` RED, `95` AIS, `97` Clásica), 3–4 the product and currency, 5–6 the bank (`06` BANDEC, `12` BPA), 7–9 the SMPE interbank suffix, fixed per bank (`999` BANDEC, `997` BPA), 10–15 a sequential number and 16 a Luhn check digit.

Validation goes element by element (network, product, bank, SMPE, Luhn), each checked against the previous ones. To validate a number: strip spaces, hyphens and dots (`normalize.strip_pattern`), match it against a pattern and check the Luhn digit. See the code samples above.

This is a community catalog, not an official source. Never post a full card number in an issue or pull request: the first 9 digits are enough.

</details>

---

<div align="center">
<sub>Hecho con 💙 por <a href="https://qvapay.com">QvaPay</a> y la comunidad · <a href="LICENSE">Licencia MIT</a></sub>
</div>
