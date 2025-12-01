import path from "node:path"
import fs from "node:fs/promises"
import * as XLSX from "xlsx"

const OUTPUT_DIR = path.resolve("public/templates")
const TEMPLATE_PATH = path.join(OUTPUT_DIR, "members-import-template.xlsx")

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
}

function createTemplateWorkbook() {
  const headers = ["Full Name", "Email", "Phone Number", "Department", "Role", "Status"]
  const instructions = [
    "FirstName LastName",
    "name@example.com",
    "08123456789",
    '"X RPL / X DKV / X TKJ"',
    "User / Petugas / No Role",
    "Active / Inactive",
  ]

  const worksheet = XLSX.utils.aoa_to_sheet([headers, instructions])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template")
  return workbook
}

async function generateTemplate() {
  await ensureOutputDir()
  const workbook = createTemplateWorkbook()
  XLSX.writeFile(workbook, TEMPLATE_PATH)
  console.log(`Members template generated at ${TEMPLATE_PATH}`)
}

generateTemplate().catch((error) => {
  console.error("Failed to generate members template:", error)
  process.exitCode = 1
})

