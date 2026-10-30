"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function TrendChart({
  title,
  description,
  data,
  currency,
}: {
  title: string
  description: string
  data: Array<{ date: string; sales: number }>
  currency: string
}) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Chuyển sang tiền gốc để xem xu hướng. Nguyên tệ không cộng khác nhau.</CardDescription>
        </CardHeader>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ sales: { label: `Doanh thu ${currency}`, color: "var(--chart-1)" } }}
          className="aspect-auto h-56 min-h-56 w-full [&_.recharts-responsive-container]:h-56 [&_.recharts-responsive-container]:min-h-56"
        >
          <AreaChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area dataKey="sales" stroke="var(--color-sales)" fill="var(--color-sales)" fillOpacity={0.2} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
