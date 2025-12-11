import path from "node:path"
import fs from "node:fs/promises"
import * as XLSX from "xlsx"

const OUTPUT_DIR = path.resolve("public/templates")
const TEMPLATE_PATH = path.join(OUTPUT_DIR, "finger-import-template.xlsx")

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
}

function createTemplateWorkbook() {
  const headers = [
    "Nama Depan",
    "Nama Belakang",
    "Nomor Telepon",
    "Departemen",
    "Status",
  ]

  const instructions = [
    "Contoh: Budi",
    "Contoh: Santoso",
    "Contoh: 08123456789",
    "Contoh: X-RPL/Divisi 2",
    "true",
  ]

  const worksheet = XLSX.utils.aoa_to_sheet([headers, instructions])

  worksheet["!cols"] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 22 },
    { wch: 12 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template")
  return workbook
}

async function generateTemplate() {
  await ensureOutputDir()
  const workbook = createTemplateWorkbook()
  XLSX.writeFile(workbook, TEMPLATE_PATH)
  console.log(`Fingerprint template generated at ${TEMPLATE_PATH}`)
}

generateTemplate().catch((error) => {
  console.error("Failed to generate fingerprint template:", error)
  process.exitCode = 1
})

