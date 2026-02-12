"use client"

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { Task, CategoryTag } from "@/lib/store"

interface DailyStatsProps {
  tasks: Task[]
  categories: CategoryTag[]
}

export function DailyStats({ tasks, categories }: DailyStatsProps) {
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === "completed").length
  const inProgress = tasks.filter((t) => t.status === "in-progress").length
  const pending = tasks.filter((t) => t.status === "pending").length
  const score = total > 0 ? Math.round((completed / total) * 100) : 0

  const statusData = [
    { name: "Completed", value: completed, color: "#22c55e" },
    { name: "In Progress", value: inProgress, color: "#eab308" },
    { name: "Pending", value: pending, color: "#ef4444" },
  ].filter((d) => d.value > 0)

  const categoryMap: Record<string, number> = {}
  tasks.forEach((t) => {
    const cat = t.category || "Uncategorized"
    categoryMap[cat] = (categoryMap[cat] || 0) + 1
  })
  const categoryData = Object.entries(categoryMap).map(([name, count]) => {
    const catTag = categories.find((c) => c.name === name)
    return { name, count, fill: catTag?.color || "#6366f1" }
  })

  if (total === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-full flex items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-10">
          <p className="text-sm text-muted-foreground">
            Add tasks to see your daily analytics
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Productivity Score Ring */}
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Productivity Score
        </p>
        <div className="relative h-32 w-32">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 263.9} 263.9`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{score}%</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {completed}/{total} tasks done
        </p>
      </div>

      {/* Status Breakdown */}
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Status Breakdown
        </p>
        <ResponsiveContainer width="100%" height={130}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
              dataKey="value"
              strokeWidth={0}
            >
              {statusData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(217, 33%, 17%)",
                border: "1px solid hsl(217, 33%, 25%)",
                borderRadius: "8px",
                color: "hsl(210, 40%, 98%)",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-1">
          {statusData.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-[10px] text-muted-foreground">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Bar Chart */}
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-5 sm:col-span-2 lg:col-span-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          By Category
        </p>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={categoryData} barSize={20}>
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(217, 33%, 17%)",
                  border: "1px solid hsl(217, 33%, 25%)",
                  borderRadius: "8px",
                  color: "hsl(210, 40%, 98%)",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground">No data</p>
        )}
      </div>
    </div>
  )
}
