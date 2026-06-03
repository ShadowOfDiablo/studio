#!/usr/bin/env node
// Build gradinko and copy its dist/ into studio/public/template/.
// This makes the public site's bundle the live-preview target and the
// export-bundle source — single source of truth.

import { execSync } from 'node:child_process'
import { cpSync, rmSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { resolve, dirname, relative, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const studioRoot = resolve(__dirname, '..')
const gradinkoRoot = resolve(studioRoot, '..', 'gradinko')
const templateDir = resolve(studioRoot, 'public', 'template')

if (!existsSync(gradinkoRoot)) {
  console.error(`gradinko not found at ${gradinkoRoot}`)
  process.exit(1)
}

console.log('→ building gradinko…')
execSync('npm run build', { cwd: gradinkoRoot, stdio: 'inherit' })

console.log(`→ copying gradinko/dist → ${templateDir}`)
rmSync(templateDir, { recursive: true, force: true })
mkdirSync(templateDir, { recursive: true })
cpSync(resolve(gradinkoRoot, 'dist'), templateDir, { recursive: true })

// Write a manifest listing every file in the template, so the in-browser
// exporter can fetch them without needing a directory listing endpoint.
function walk(dir, base = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const rel = relative(base, full).replaceAll('\\', '/')
    if (statSync(full).isDirectory()) walk(full, base, out)
    else out.push(rel)
  }
  return out
}

const files = walk(templateDir).filter(f => f !== 'manifest.json')
writeFileSync(join(templateDir, 'manifest.json'), JSON.stringify(files, null, 2))
console.log(`✓ template ready (${files.length} files)`)
