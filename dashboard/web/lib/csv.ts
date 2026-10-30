export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false
  const source = text.replace(/^\uFEFF/, "").replace(/^(?:#[^\n]*\n)+/, "")
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"'
          i += 1
        } else quoted = false
      } else field += char
      continue
    }
    if (char === '"') quoted = true
    else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else if (char !== "\r") field += char
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  const kept = rows.filter((cells) => cells.some((cell) => cell.trim() !== ""))
  if (!kept.length) return []
  const header = kept[0].map((cell) => cell.trim().toLowerCase())
  return kept.slice(1).map((cells) => {
    const record: Record<string, string> = {}
    header.forEach((key, index) => {
      record[key] = (cells[index] || "").trim()
    })
    return record
  })
}

export function num(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null
  const parsed = Number(value.replace(/,/g, ""))
  return Number.isFinite(parsed) ? parsed : null
}
