"use client"

import { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts"
import { TrendingUp, Calendar, Flame, Award } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/hooks/use-store"
import {
  getLast30DaysScores,
  getDailyRecord,
  getProductivityScore,
  getStreak,
} from "@/lib/store"

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(217, 33%, 17%)",
  border: "1px solid hsl(217, 33%, 25%)",
  borderRadius: "8px",
  color: "hsl(210, 40%, 98%)",
  fontSize: "12px",
}

export default function AnalyticsPage() {
  const { data } = useStore()

  const analytics = useMemo(() => {
    if (!data) return null

    const scores = getLast30DaysScores(data)
    const today = new Date()

    // Weekly averages (last 4 weeks)
    const weeklyAvgs: { week: string; avg: number }[] = []
    for (let w = 3; w >= 0; w--) {
      let total = 0
      let count = 0
      for (let d = 0; d < 7; d++) {
        const date = new Date(today)
        date.setDate(date.getDate() - w * 7 - d)
        const dateStr = date.toISOString().split("T")[0]
        const rec = getDailyRecord(data, dateStr)
        if (rec.tasks.length > 0) {
          total += getProductivityScore(rec)
          count++
        }
      }
      weeklyAvgs.push({
        week: `Week ${4 - w}`,
        avg: count > 0 ? Math.round(total / count) : 0,
      })
    }

    // Monthly average
    const monthScores = scores.filter((s) => s.score > 0)
    const monthlyAvg =
      monthScores.length > 0
        ? Math.round(
            monthScores.reduce((a, b) => a + b.score, 0) / monthScores.length
          )
        : 0

    // Activity heatmap (last 90 days)
    const heatmapData: { date: string; score: number; dayOfWeek: number }[] = []
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split("T")[0]
      const rec = getDailyRecord(data, dateStr)
      heatmapData.push({
        date: dateStr,
        score: getProductivityScore(rec),
        dayOfWeek: d.getDay(),
      })
    }

    // Insights
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const dayScores: Record<number, { total: number; count: number }> = {}
    for (let i = 0; i < 7; i++) dayScores[i] = { total: 0, count: 0 }
    scores.forEach((s) => {
      const d = new Date(s.date + "T12:00:00").getDay()
      if (s.score > 0) {
        dayScores[d].total += s.score
        dayScores[d].count++
      }
    })
    let bestDay = 0
    let bestDayAvg = 0
    Object.entries(dayScores).forEach(([day, v]) => {
      const avg = v.count > 0 ? v.total / v.count : 0
      if (avg > bestDayAvg) {
        bestDayAvg = avg
        bestDay = Number(day)
      }
    })

    // Longest streak from habits
    let longestStreak = 0
    data.routineHabits.forEach((h) => {
      const s = getStreak(h.id, data.routineCompletions, h)
      if (s.longest > longestStreak) longestStreak = s.longest
    })

    // Weekly completion rate
    let weekCompleted = 0
    let weekTotal = 0
    for (let d = 0; d < 7; d++) {
      const date = new Date(today)
      date.setDate(date.getDate() - d)
      const dateStr = date.toISOString().split("T")[0]
      const rec = getDailyRecord(data, dateStr)
      weekTotal += rec.tasks.length
      weekCompleted += rec.tasks.filter((t) => t.status === "completed").length
    }
    const weeklyRate = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0

    return {
      scores,
      weeklyAvgs,
      monthlyAvg,
      heatmapData,
      bestDayName: dayNames[bestDay],
      bestDayAvg: Math.round(bestDayAvg),
      longestStreak,
      weeklyRate,
    }
  }, [data])

  if (!data || !analytics) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  function getHeatColor(score: number): string {
    if (score === 0) return "bg-secondary"
    if (score < 30) return "bg-emerald-900/50"
    if (score < 60) return "bg-emerald-700/60"
    if (score < 80) return "bg-emerald-500/70"
    return "bg-emerald-400"
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight text-balance">
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your productivity trends over time
        </p>
      </header>

      {/* Insight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex flex-col items-center rounded-xl border bg-card p-4">
          <TrendingUp className="h-5 w-5 text-primary mb-1" />
          <span className="text-2xl font-bold text-foreground">{analytics.monthlyAvg}%</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
            Monthly Avg
          </span>
        </div>
        <div className="flex flex-col items-center rounded-xl border bg-card p-4">
          <Calendar className="h-5 w-5 text-emerald-400 mb-1" />
          <span className="text-2xl font-bold text-foreground">{analytics.bestDayName}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
            Best Day
          </span>
        </div>
        <div className="flex flex-col items-center rounded-xl border bg-card p-4">
          <Award className="h-5 w-5 text-yellow-400 mb-1" />
          <span className="text-2xl font-bold text-foreground">{analytics.weeklyRate}%</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
            Weekly Rate
          </span>
        </div>
        <div className="flex flex-col items-center rounded-xl border bg-card p-4">
          <Flame className="h-5 w-5 text-orange-400 mb-1" />
          <span className="text-2xl font-bold text-foreground">{analytics.longestStreak}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
            Longest Streak
          </span>
        </div>
      </div>

      {/* Productivity Line Chart */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Daily Productivity Score (Last 30 Days)
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={analytics.scores}>
            <XAxis
              dataKey="date"
              tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: string) => {
                const d = new Date(v + "T12:00:00")
                return `${d.getMonth() + 1}/${d.getDate()}`
              }}
              interval={4}
            />
            <YAxis
              tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#6366f1" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Averages */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Weekly Average Completion
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={analytics.weeklyAvgs} barSize={36}>
            <XAxis
              dataKey="week"
              tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="avg" radius={[8, 8, 0, 0]}>
              {analytics.weeklyAvgs.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.avg >= 70 ? "#22c55e" : entry.avg >= 40 ? "#eab308" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Activity Heatmap */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Activity Heatmap (Last 90 Days)
        </h2>
        <div className="overflow-x-auto">
          <div className="grid grid-flow-col auto-cols-[14px] gap-[3px]" style={{ gridTemplateRows: "repeat(7, 14px)" }}>
            {analytics.heatmapData.map((d, i) => (
              <div
                key={d.date}
                className={cn(
                  "rounded-sm transition-colors",
                  getHeatColor(d.score)
                )}
                title={`${d.date}: ${d.score}%`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] text-muted-foreground">Less</span>
          <div className="flex gap-[3px]">
            {["bg-secondary", "bg-emerald-900/50", "bg-emerald-700/60", "bg-emerald-500/70", "bg-emerald-400"].map(
              (c) => (
                <div key={c} className={cn("h-3 w-3 rounded-sm", c)} />
              )
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  )
}
