import path from "node:path"
import { fileURLToPath } from "node:url"
import XLSX from "xlsx"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const headers = [
  "Full Name",
  "Email",
  "Phone Number",
  "Department",
  "Role",
  "Status",
]

const instructions = [
  "FirstName LastName",
  "name@example.com",
  "08123456789",
  "Contoh: X RPL / X DKV / X TKJ",
  "User / Petugas",
  "Active / Inactive",
]

const worksheetData = [headers, instructions]
const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

const workbook = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(workbook, worksheet, "Members Import")

const outputPath = path.resolve(
  __dirname,
  "../public/templates/members-import-template.xlsx",
)

XLSX.writeFile(workbook, outputPath, { bookType: "xlsx" })

console.log(`Template generated at ${outputPath}`)

