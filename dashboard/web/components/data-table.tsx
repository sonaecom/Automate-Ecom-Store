import type { ReactNode } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function DataTable({
  columns,
  rows,
  onRow,
}: {
  columns: Array<{ key: string; label: string; align?: "right" | "left" }>
  rows: Array<Record<string, ReactNode> & { id: string }>
  onRow?: (id: string) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key} className={column.align === "right" ? "text-right" : undefined}>
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-muted-foreground">
              Không có dòng trong bộ lọc này.
            </TableCell>
          </TableRow>
        ) : rows.map((row) => (
          <TableRow
            key={row.id}
            className={onRow ? "cursor-pointer" : undefined}
            onClick={onRow ? () => onRow(row.id) : undefined}
          >
            {columns.map((column) => (
              <TableCell
                key={column.key}
                className={column.align === "right" ? "text-right tabular-nums" : "tabular-nums"}
              >
                {row[column.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
