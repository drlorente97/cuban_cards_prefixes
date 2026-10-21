// Genera validators.json y las tablas del README a partir de prefixes.json. Sin dependencias.
//   node scripts/build.mjs           escribe validators.json y README.md
//   node scripts/build.mjs --check   falla si prefixes.json es inconsistente o algo generado está desactualizado
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const data = JSON.parse(fs.readFileSync(path.join(root, 'prefixes.json'), 'utf8'))
const outPath = path.join(root, 'validators.json')
const check = process.argv.includes('--check')

const errors = []
const fail = (msg) => errors.push(msg)

// --- Consistencia de prefixes.json -------------------------------------------------------
const issuerIds = new Set(data.issuers.map(i => i.id))
const sourceIds = new Set(data.sources.map(s => s.id))
const seen = new Set()
for (const p of data.prefixes) {
  if (!/^\d{4}$/.test(p.prefix)) fail(`${p.prefix}: el prefijo debe tener 4 dígitos`)
  if (seen.has(p.prefix)) fail(`${p.prefix}: prefijo duplicado`)
  seen.add(p.prefix)
  if (p.network === 'RED' && !p.prefix.startsWith(data.structure.RED[0].value)) fail(`${p.prefix}: un prefijo RED empieza por ${data.structure.RED[0].value}`)
  if (!['CUP', 'USD'].includes(p.currency)) fail(`${p.prefix}: moneda desconocida ${p.currency}`)
  if (p.currency === 'CUP' && p.mlc_backed) fail(`${p.prefix}: una tarjeta en CUP no puede tener respaldo en MLC`)
  for (const id of p.issuers) if (!issuerIds.has(id)) fail(`${p.prefix}: banco desconocido ${id}`)
  if (!p.sources.length) fail(`${p.prefix}: sin fuentes`)
  for (const id of p.sources) if (!sourceIds.has(id)) fail(`${p.prefix}: fuente desconocida ${id}`)
  if (p.network === 'RED' && p.variants?.length) fail(`${p.prefix}: variants solo se usa en productos que no siguen la estructura RED`)
  for (const v of p.variants ?? []) {
    if (!/^\d{6}$/.test(v.prefix)) fail(`${v.prefix}: el prefijo de una variante debe tener 6 dígitos`)
    else if (!v.prefix.startsWith(p.prefix)) fail(`${v.prefix}: una variante de ${p.prefix} empieza por ${p.prefix}`)
    if (seen.has(v.prefix)) fail(`${v.prefix}: prefijo o variante duplicada`)
    seen.add(v.prefix)
    if (!v.product) fail(`${v.prefix}: la variante necesita producto`)
    if (!Array.isArray(v.aliases)) fail(`${v.prefix}: aliases debe ser una lista`)
    if (!Array.isArray(v.sources) || !v.sources.length) fail(`${v.prefix}: variante sin fuentes`)
    for (const id of v.sources ?? []) if (!sourceIds.has(id)) fail(`${v.prefix}: fuente desconocida ${id}`)
  }
}
for (const i of data.issuers) {
  if (i.code !== null && !/^\d{2,4}$/.test(i.code)) fail(`${i.id}: el código debe tener de 2 a 4 dígitos`)
  for (const id of i.sources) if (!sourceIds.has(id)) fail(`${i.id}: fuente desconocida ${id}`)
}

// --- Patrones ----------------------------------------------------------------------------
// [0-9] y no \d: en Python 3 y en otros motores \d también acepta dígitos no ASCII.
const D = (n) => `[0-9]{${n}}`
const LEN = data.card_length
const redIssuers = data.issuers.filter(i => i.network === 'RED' && i.code)
const issuerAlt = (list) => `(?:${list.map(i => i.code + (i.code.length < 4 ? D(4 - i.code.length) : '')).join('|')})`
const productAlt = (list) => `(?:${list.map(p => p.prefix.slice(2)).join('|')})`
const red = (products, issuers = redIssuers) => products.length ? `92${productAlt(products)}${issuerAlt(issuers)}${D(LEN - 8)}` : null
const other = (products) => products.map(p => `${p.prefix}${D(LEN - 4)}`)
const anchor = (parts) => {
  const list = parts.flat().filter(Boolean)
  return list.length === 1 ? `^${list[0]}$` : `^(?:${list.join('|')})$`
}
const productKey = (product) => product.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '_')

const redProducts = data.prefixes.filter(p => p.network === 'RED')
const nonRed = data.prefixes.filter(p => p.network !== 'RED')
const by = (fn) => ({ red: redProducts.filter(fn), other: nonRed.filter(fn) })
const group = ({ red: r, other: o }) => anchor([red(r), other(o)])

for (const p of nonRed) if (!p.product) fail(`${p.prefix}: un prefijo que no es RED necesita producto (da nombre a su patrón)`)
const nonRedKeys = nonRed.map(p => productKey(p.product ?? ''))
nonRedKeys.forEach((k, i) => { if (nonRedKeys.indexOf(k) !== i || ['any', 'red', 'cup', 'usd', 'usd_mlc'].includes(k)) fail(`la clave de patrón ${k} está repetida`) })

const cup = by(p => p.currency === 'CUP')
const usd = by(p => p.currency === 'USD')
const usdMlc = by(p => p.currency === 'USD' && p.mlc_backed === true)

// Patrones propios de las variantes de un producto no RED (p. ej. 976004, Clásica empresarial).
// La variante que comparte producto con su prefijo (976003) ya la cubre el patrón del prefijo.
const baseKeys = new Set(['any', 'red', 'cup', 'usd', 'usd_mlc', ...nonRed.map(p => productKey(p.product))])
const variantPatterns = {}
const variantMap = {}
for (const p of nonRed) for (const v of p.variants ?? []) {
  variantMap[v.prefix] = { product: v.product, aliases: v.aliases, issuers: p.issuers }
  const key = productKey(v.product)
  if (key === productKey(p.product)) continue
  if (baseKeys.has(key) || key in variantPatterns) { fail(`${v.prefix}: la clave de patrón ${key} está repetida`); continue }
  variantPatterns[key] = anchor([`${v.prefix}${D(LEN - v.prefix.length)}`])
}

const validators = {
  generated_from: 'prefixes.json',
  version: data.version,
  updated_at: data.updated_at,
  card_length: LEN,
  luhn: data.check_digit === 'luhn',
  normalize: { strip_pattern: `[${data.normalize.strip.map(c => c === ' ' ? '\\s' : `\\${c}`).join('')}]`, digits_pattern: `^[0-9]{${LEN}}$` },
  patterns: {
    any: group({ red: redProducts, other: nonRed }),
    red: anchor([red(redProducts)]),
    cup: group(cup),
    usd: group(usd),
    usd_mlc: group(usdMlc),
    ...Object.fromEntries(nonRed.map(p => [productKey(p.product), anchor([other([p])])])),
    ...variantPatterns,
  },
  issuers: Object.fromEntries(redIssuers.map(i => [i.id, anchor([red(redProducts, [i])])])),
  variants: variantMap,
}

// --- Autocomprobación con números sintéticos ---------------------------------------------
const luhnOk = (n) => {
  let sum = 0
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i])
    if (i % 2) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  return sum % 10 === 0
}
const withCheck = (body) => { for (let d = 0; d < 10; d++) if (luhnOk(body + d)) return body + d }
const fill = (start) => withCheck(start.padEnd(LEN - 1, '0'))
const re = Object.fromEntries(Object.entries({ ...validators.patterns, ...validators.issuers }).map(([k, v]) => [k, new RegExp(v)]))
const expect = (num, key, want, why) => { if (re[key].test(num) !== want) fail(`autocomprobación: ${key} ${want ? 'debería' : 'no debería'} aceptar ${why}`) }

for (const p of redProducts) for (const i of redIssuers) {
  const num = fill(p.prefix + i.code)
  expect(num, 'any', true, `${p.prefix} de ${i.id}`)
  expect(num, i.id, true, `${p.prefix} de ${i.id}`)
  expect(num, 'cup', p.currency === 'CUP', `${p.prefix}`)
  expect(num, 'usd', p.currency === 'USD', `${p.prefix}`)
  expect(num, 'usd_mlc', p.currency === 'USD' && p.mlc_backed === true, `${p.prefix}`)
}
for (const p of nonRed) expect(fill(p.prefix), 'any', true, p.prefix)
expect(fill('9205' + '7777'), 'any', false, 'un banco desconocido')
expect(fill('9299' + redIssuers[0].code), 'any', false, 'un producto desconocido')
expect(fill('9205' + redIssuers[0].code).slice(1), 'any', false, '15 dígitos')
for (const p of nonRed) {
  const key = productKey(p.product)
  expect(fill(p.prefix), key, true, p.prefix)
  for (const o of nonRed.filter(o => o !== p)) expect(fill(o.prefix), key, false, o.prefix)
  expect(fill(p.prefix), 'red', false, `${p.prefix}, que no es RED`)
  expect(fill(p.prefix), 'cup', p.currency === 'CUP', p.prefix)
  expect(fill(p.prefix), 'usd', p.currency === 'USD', p.prefix)
}

// La Clásica (976003) la cubre el patrón del prefijo; 976004, el de su variante.
expect(fill('976003'), 'clasica', true, '976003 (Clásica)')
expect(fill('976004'), 'clasica', true, '976004 (Clásica empresarial)')
expect(fill('976004'), 'clasica_empresarial', true, '976004')
expect(fill('976003'), 'clasica_empresarial', false, '976003')

// --- Tablas del README (entre marcadores <!-- nombre:start --> y <!-- nombre:end -->) -----
const REPO = 'https://github.com/qvapay/cuban_cards_prefixes'
const short = Object.fromEntries(data.sources.map(s => [s.id, s.short]))
const issuerName = Object.fromEntries(data.issuers.map(i => [i.id, i.id === 'METROPOLITANO' ? 'Metropolitano' : i.id]))
const askLink = (prefix) => `[¿la tienes?](${REPO}/issues/new?template=prefijo.yml&prefix=${prefix})`
const badge = (label, value, color) => `![${label}](https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(value)}-${color})`

const groups = [
  { title: '🇨🇺 Pesos cubanos (CUP)', match: p => p.currency === 'CUP' },
  { title: '💵 USD con respaldo en MLC', match: p => p.currency === 'USD' && p.mlc_backed === true },
  { title: '💳 USD', match: p => p.currency === 'USD' && p.mlc_backed !== true },
]
const SUP = ['¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']
const prefixRow = (p, mark) => {
  const variants = p.variants?.length ? ` · ${p.variants.map(v => `\`${v.prefix}\` ${v.product}`).join(' / ')}` : ''
  const product = p.product
    ? p.product + (p.aliases.length ? ` · «${p.aliases.join('», «')}»` : '') + variants
    : `_Sin identificar_ · ${askLink(p.prefix)}`
  const sourceIds = [...new Set([...p.sources, ...(p.variants ?? []).flatMap(v => v.sources)])]
  return `| **\`${p.prefix}\`** | ${product}${mark ? ` ${mark}` : ''} | ${p.issuers.map(id => issuerName[id]).join(', ') || '—'} | ${sourceIds.map(id => short[id]).join(' · ')} |`
}
const prefixTables = groups.map(g => {
  const list = data.prefixes.filter(g.match)
  if (!list.length) return null
  const marks = new Map(list.filter(p => p.notes).map((p, i) => [p.prefix, SUP[i] ?? `(${i + 1})`]))
  const notes = list.filter(p => p.notes).map(p => `> ${marks.get(p.prefix)} **\`${p.prefix}\`**: ${p.notes}`)
  return [
    `### ${g.title}`,
    '',
    '| Prefijo | Producto | Confirmado en | Fuentes |',
    '|:-:|---|---|:-:|',
    ...list.map(p => prefixRow(p, marks.get(p.prefix))),
    ...(notes.length ? ['', notes.join('\n>\n')] : []),
  ].join('\n')
}).filter(Boolean).join('\n\n')

const bankRow = (i) => {
  const code = i.code ? `\`${i.code}${'·'.repeat(4 - i.code.length)}\`${i.code.length < 4 ? ' (parcial)' : ''}` : '—'
  const pattern = i.network === 'RED' && i.code ? `\`issuers.${i.id}\`` : data.prefixes.filter(p => p.network !== 'RED' && p.issuers.includes(i.id)).map(p => `\`patterns.${Object.keys(validators.patterns).find(k => validators.patterns[k] === anchor([other([p])]))}\``).join(', ') || '—'
  const label = i.name.includes(issuerName[i.id]) ? `**${i.name}**` : `**${issuerName[i.id]}** · ${i.name}`
  return `| ${label} | ${code} | ${pattern} |`
}
const bankTable = ['| Banco | Dígitos 5–8 | Patrón |', '|---|:-:|---|', ...data.issuers.map(bankRow)].join('\n')

const sourcesTable = ['| | Fuente | Qué aporta |', '|:-:|---|---|', ...data.sources.map(s => `| **${s.short}** | ${s.url ? `[${s.title}](${s.url})` : s.title} | ${s.notes ?? ''} |`)].join('\n')

const badges = [
  badge('prefijos', String(data.prefixes.length), '0ea5e9'),
  badge('emisores', String(data.issuers.length), '6366f1'),
  badge('versión', data.version, '22c55e'),
  badge('dependencias', '0', 'f59e0b'),
  `[${badge('licencia', 'MIT', '64748b')}](LICENSE)`,
  `[![check](${REPO}/actions/workflows/check.yml/badge.svg)](${REPO}/actions/workflows/check.yml)`,
].join(' ')

const readmePath = path.join(root, 'README.md')
const renderReadme = (text) => {
  const sections = { badges, banks: bankTable, prefixes: prefixTables, sources: sourcesTable }
  let out = text
  for (const [name, body] of Object.entries(sections)) {
    const re = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`)
    if (!re.test(out)) { fail(`README.md: faltan los marcadores <!-- ${name}:start/end -->`); continue }
    out = out.replace(re, `$1\n${body}\n$2`)
  }
  return out
}
const readme = fs.readFileSync(readmePath, 'utf8')
const newReadme = renderReadme(readme)

// --- Salida ------------------------------------------------------------------------------
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`)
  process.exit(1)
}
const json = JSON.stringify(validators, null, 2) + '\n'
if (check) {
  const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : ''
  const stale = [current !== json && 'validators.json', readme !== newReadme && 'README.md'].filter(Boolean)
  if (stale.length) {
    console.error(`✗ ${stale.join(' y ')} desactualizado: corre \`npm run build\``)
    process.exit(1)
  }
  console.log('✓ prefixes.json consistente; validators.json y README.md al día')
} else {
  fs.writeFileSync(outPath, json)
  fs.writeFileSync(readmePath, newReadme)
  console.log(`✓ validators.json y README.md generados (${data.prefixes.length} prefijos, ${redIssuers.length} bancos RED)`)
}
