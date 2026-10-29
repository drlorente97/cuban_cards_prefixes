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
// Red → sus dígitos 1–2
const netCode = (n) => data.structure[n][0].value
const fail = (msg) => errors.push(msg)

// --- Consistencia de prefixes.json -------------------------------------------------------
const issuerIds = new Set(data.issuers.map(i => i.id))
const sourceIds = new Set(data.sources.map(s => s.id))
const seen = new Set()
for (const p of data.prefixes) {
  if (!/^\d{4}$/.test(p.prefix)) fail(`${p.prefix}: el prefijo debe tener 4 dígitos`)
  if (seen.has(p.prefix)) fail(`${p.prefix}: prefijo duplicado`)
  seen.add(p.prefix)
  if (!data.structure[p.network]) fail(`${p.prefix}: red desconocida ${p.network}`)
  else if (!p.prefix.startsWith(netCode(p.network))) fail(`${p.prefix}: un prefijo ${p.network} empieza por ${netCode(p.network)}`)
  if (!['CUP', 'USD'].includes(p.currency)) fail(`${p.prefix}: moneda desconocida ${p.currency}`)
  if (p.currency === 'CUP' && p.mlc_backed) fail(`${p.prefix}: una tarjeta en CUP no puede tener respaldo en MLC`)
  for (const id of p.issuers) if (!issuerIds.has(id)) fail(`${p.prefix}: banco desconocido ${id}`)
  if (p.exclusive && !p.issuers.length) fail(`${p.prefix}: un producto exclusivo necesita sus bancos en issuers`)
  if (!p.sources.length) fail(`${p.prefix}: sin fuentes`)
  for (const id of p.sources) if (!sourceIds.has(id)) fail(`${p.prefix}: fuente desconocida ${id}`)
  if (p.fiscal !== undefined && typeof p.fiscal !== 'boolean') fail(`${p.prefix}: fiscal debe ser true o false`)
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
  if (i.network !== null && !data.structure[i.network]) fail(`${i.id}: red desconocida ${i.network}`)
  if (i.code !== null && !/^\d{2}$/.test(i.code)) fail(`${i.id}: el código debe tener 2 dígitos`)
  if (i.smpe !== null && (!i.code || !/^\d{2,3}$/.test(i.smpe))) fail(`${i.id}: el SMPE debe tener 2 o 3 dígitos y un código de banco`)
  for (const id of i.sources) if (!sourceIds.has(id)) fail(`${i.id}: fuente desconocida ${id}`)
}

// --- Patrones ----------------------------------------------------------------------------
// [0-9] y no \d: en Python 3 y en otros motores \d también acepta dígitos no ASCII.
const D = (n) => n === 1 ? '[0-9]' : `[0-9]{${n}}`
const LEN = data.card_length
const networks = Object.keys(data.structure)
const issuersOf = (n) => data.issuers.filter(i => i.network === n && i.code)
// Dígitos 5–9: banco + SMPE; la parte del SMPE que no se conoce acepta cualquier dígito
const issuerPart = (i) => i.code + (i.smpe ?? '') + (5 - i.code.length - (i.smpe ?? '').length ? D(5 - i.code.length - (i.smpe ?? '').length) : '')
const issuerAlt = (list) => list.length === 1 ? issuerPart(list[0]) : `(?:${list.map(issuerPart).join('|')})`
const productAlt = (list) => list.length === 1 ? list[0].prefix.slice(2) : `(?:${list.map(p => p.prefix.slice(2)).join('|')})`
// Bancos en los que existe un producto: los suyos si es exclusivo; si no, todos los de la red
const banksOf = (p) => issuersOf(p.network).filter(i => !p.exclusive || p.issuers.includes(i.id))
// Patrones de una red: red + producto + banco + SMPE + consecutivo y dígito de control.
// Los productos exclusivos van aparte, cada uno con sus bancos.
const net = (n, products, issuers = issuersOf(n)) => {
  const list = products.filter(p => p.network === n)
  const open = list.filter(p => !p.exclusive)
  const groups = [[open, issuers], ...list.filter(p => p.exclusive).map(p => [[p], issuers.filter(i => p.issuers.includes(i.id))])]
  return groups.filter(([ps, is]) => ps.length && is.length).map(([ps, is]) => `${netCode(n)}${productAlt(ps)}${issuerAlt(is)}${D(LEN - 9)}`)
}
const anchor = (parts) => {
  const list = parts.flat().filter(Boolean)
  return list.length === 1 ? `^${list[0]}$` : `^(?:${list.join('|')})$`
}
// Variantes de un producto que no es RED (p. ej. 976004, Clásica Empresarial): el prefijo de 6 dígitos y cualquier cuenta
const variantAlts = (products) => products.flatMap(p => (p.variants ?? []).map(v => `${v.prefix}${D(LEN - 6)}`))
const all = (products) => anchor([...networks.map(n => net(n, products)), variantAlts(products)])

const prefixes = data.prefixes
const nonRed = prefixes.filter(p => p.network !== 'RED')
const keyOf = (product) => product.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '_')
const productKey = (p) => keyOf(p.product)
for (const p of nonRed) if (!p.product) fail(`${p.prefix}: un prefijo que no es RED necesita producto (da nombre a su patrón)`)
const baseKeys = new Set(['any', 'red', 'cup', 'usd', 'usd_mlc'])
const patternKeys = []
const claim = (key, prefix) => { if (baseKeys.has(key) || patternKeys.includes(key)) fail(`${prefix}: la clave de patrón ${key} está repetida`); patternKeys.push(key) }
const variantPatterns = {}
const variantMap = {}
for (const p of nonRed) {
  claim(productKey(p), p.prefix)
  for (const v of p.variants ?? []) {
    variantMap[v.prefix] = { product: v.product, aliases: v.aliases, issuers: p.issuers }
    if (keyOf(v.product) === productKey(p)) continue
    claim(keyOf(v.product), v.prefix)
    variantPatterns[keyOf(v.product)] = anchor([`${v.prefix}${D(LEN - 6)}`])
  }
}
const codedIssuers = data.issuers.filter(i => i.network && i.code)

const validators = {
  generated_from: 'prefixes.json',
  version: data.version,
  updated_at: data.updated_at,
  card_length: LEN,
  luhn: data.check_digit === 'luhn',
  normalize: { strip_pattern: `[${data.normalize.strip.map(c => c === ' ' ? '\\s' : `\\${c}`).join('')}]`, digits_pattern: `^[0-9]{${LEN}}$` },
  patterns: {
    any: all(prefixes),
    red: anchor([net('RED', prefixes)]),
    cup: all(prefixes.filter(p => p.currency === 'CUP')),
    usd: all(prefixes.filter(p => p.currency === 'USD')),
    usd_mlc: all(prefixes.filter(p => p.currency === 'USD' && p.mlc_backed === true)),
    ...Object.fromEntries(nonRed.map(p => [productKey(p), anchor([net(p.network, [p]), variantAlts([p])])])),
    ...variantPatterns,
  },
  issuers: Object.fromEntries(codedIssuers.map(i => [i.id, anchor([net(i.network, prefixes, [i])])])),
  // Cada elemento por separado, para validar uno contra otro y decir cuál falla
  networks: Object.fromEntries(networks.map(n => [netCode(n), {
    name: n,
    products: Object.fromEntries(prefixes.filter(p => p.network === n).map(p => [p.prefix.slice(2), {
      currency: p.currency,
      mlc_backed: p.mlc_backed,
      issuers: banksOf(p).map(i => i.code),
    }])),
    issuers: Object.fromEntries(issuersOf(n).map(i => [i.code, { id: i.id, smpe: i.smpe }])),
  }])),
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
const known = (i) => i.code + (i.smpe ?? '')
const re = Object.fromEntries(Object.entries({ ...validators.patterns, ...validators.issuers }).map(([k, v]) => [k, new RegExp(v)]))
const expect = (num, key, want, why) => { if (re[key].test(num) !== want) fail(`autocomprobación: ${key} ${want ? 'debería' : 'no debería'} aceptar ${why}`) }

for (const p of prefixes) for (const i of banksOf(p)) {
  const num = fill(p.prefix + known(i))
  expect(num, 'any', true, `${p.prefix} de ${i.id}`)
  expect(num, i.id, true, `${p.prefix} de ${i.id}`)
  expect(num, 'cup', p.currency === 'CUP', `${p.prefix}`)
  expect(num, 'usd', p.currency === 'USD', `${p.prefix}`)
  expect(num, 'usd_mlc', p.currency === 'USD' && p.mlc_backed === true, `${p.prefix}`)
  if (p.network !== 'RED') expect(num, productKey(p), true, `${p.prefix} de ${i.id}`)
}
const bandec = data.issuers.find(i => i.id === 'BANDEC')
for (const p of nonRed) for (const v of p.variants ?? []) {
  expect(fill(v.prefix), 'any', true, `${v.prefix} (variante de ${p.prefix})`)
  expect(fill(v.prefix), keyOf(v.product), true, v.prefix)
  expect(fill(v.prefix), productKey(p), true, `${v.prefix} (variante de ${p.prefix})`)
  expect(fill(v.prefix), 'red', false, `${v.prefix}, que no es RED`)
}
expect(fill('9205' + '77'), 'any', false, 'un banco desconocido')
for (const i of codedIssuers.filter(i => i.smpe)) expect(fill(prefixes.find(p => p.network === i.network).prefix + i.code + '000'), i.id, false, `un SMPE que no es el de ${i.id}`)
expect(fill('9299' + known(bandec)), 'any', false, 'un producto desconocido')
expect(fill('9305' + known(bandec)), 'any', false, 'una red desconocida')
expect(fill('9550' + known(bandec)), 'any', false, 'un banco de otra red')
expect(fill('9205' + known(bandec)).slice(1), 'any', false, '15 dígitos')
for (const p of prefixes.filter(p => p.exclusive)) for (const i of issuersOf(p.network).filter(i => !p.issuers.includes(i.id))) {
  expect(fill(p.prefix + known(i)), 'any', false, `${p.prefix} de ${i.id}, que es exclusivo de ${p.issuers.join(', ')}`)
}

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
  return `| **\`${p.prefix}\`** | ${product}${p.fiscal ? ' 🧾' : ''}${mark ? ` ${mark}` : ''} | ${p.issuers.map(id => issuerName[id]).join(', ') || '—'} | ${sourceIds.map(id => short[id]).join(' · ')} |`
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

const NET_NAME = { RED: 'RED', AIS: 'AIS', CLASICA: 'Clásica' }
const bankRow = (i) => {
  const code = i.code ? `\`${i.code}\`` : '—'
  const smpe = i.smpe ? `\`${i.smpe}${'·'.repeat(3 - i.smpe.length)}\`${i.smpe.length < 3 ? ' (parcial)' : ''}` : '—'
  const pattern = i.network && i.code ? `\`issuers.${i.id}\`` : '—'
  const red = i.network ? `${NET_NAME[i.network] ?? i.network} \`${netCode(i.network)}\`` : '—'
  const label = i.name.includes(issuerName[i.id]) ? `**${i.name}**` : `**${issuerName[i.id]}** · ${i.name}`
  return `| ${label} | ${red} | ${code} | ${smpe} | ${pattern} |`
}
const bankTable = ['| Banco | Red | Código | SMPE | Patrón |', '|---|:-:|:-:|:-:|---|', ...data.issuers.map(bankRow)].join('\n')

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
  console.log(`✓ validators.json y README.md generados (${data.prefixes.length} prefijos, ${codedIssuers.length} emisores, ${networks.length} redes)`)
}
