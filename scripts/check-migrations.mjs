import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'supabase/migrations'
const files = readdirSync(dir).filter((name) => name.endsWith('.sql')).sort()
const seen = new Map()

for (const file of files) {
  const match = file.match(/^(\d{14})_/)
  if (!match) {
    console.error(`Invalid Supabase migration filename: ${file}`)
    process.exitCode = 1
    continue
  }
  const version = match[1]
  const previous = seen.get(version)
  if (previous) {
    console.error(`Duplicate Supabase migration version ${version}: ${previous} and ${file}`)
    process.exitCode = 1
  } else {
    seen.set(version, file)
  }
}

if (process.exitCode) process.exit(process.exitCode)

console.log(`Migration filename validation passed: ${files.length} unique versions in ${dir}`)
