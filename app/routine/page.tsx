"use client"

import { useState } from "react"
import {
  Plus,
  Flame,
  Trophy,
  Target,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useStore } from "@/hooks/use-store"
import {
  type RoutineFrequency,
  type RoutineHabit,
  getTodayString,
  generateId,
  getStreak,
} from "@/lib/store"

export default function RoutinePage() {
  const { data, update } = useStore()
  const [newTitle, setNewTitle] = useState("")
  const [newFrequency, setNewFrequency] = useState<RoutineFrequency>("daily")
  const [newCategory, setNewCategory] = useState("")

  const today = getTodayString()

  function addHabit() {
    if (!newTitle.trim() || !data) return
    const habit: RoutineHabit = {
      id: generateId(),
      title: newTitle.trim(),
      frequency: newFrequency,
      category: newCategory || (data.categories[0]?.name ?? ""),
      createdAt: today,
    }
    update((prev) => ({
      ...prev,
      routineHabits: [...prev.routineHabits, habit],
    }))
    setNewTitle("")
  }

  function deleteHabit(id: string) {
    if (!data) return
    update((prev) => ({
      ...prev,
      routineHabits: prev.routineHabits.filter((h) => h.id !== id),
      routineCompletions: prev.routineCompletions.filter(
        (c) => c.habitId !== id
      ),
    }))
  }

  function toggleCompletion(habitId: string) {
    if (!data) return
    const existing = data.routineCompletions.find(
      (c) => c.habitId === habitId && c.date === today
    )
    if (existing) {
      update((prev) => ({
        ...prev,
        routineCompletions: prev.routineCompletions.filter(
          (c) => !(c.habitId === habitId && c.date === today)
        ),
      }))
    } else {
      update((prev) => ({
        ...prev,
        routineCompletions: [
          ...prev.routineCompletions,
          { habitId, date: today },
        ],
      }))
    }
  }

  function isCompletedToday(habitId: string): boolean {
    if (!data) return false
    return data.routineCompletions.some(
      (c) => c.habitId === habitId && c.date === today
    )
  }

  function isRelevantToday(habit: RoutineHabit): boolean {
    if (habit.frequency === "daily") return true
    const day = new Date().getDay()
    return day >= 1 && day <= 5
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const todayHabits = data.routineHabits.filter(isRelevantToday)
  const completedCount = todayHabits.filter((h) =>
    isCompletedToday(h.id)
  ).length
  const totalCount = todayHabits.length

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight text-balance">
          Recurring Routine
        </h1>
        <p className="text-sm text-muted-foreground">
          Build habits with daily consistency tracking
        </p>
      </header>

      {/* Summary Cards */}
      {totalCount > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-xl border bg-card p-4">
            <Target className="h-5 w-5 text-primary mb-1" />
            <span className="text-2xl font-bold text-foreground">
              {completedCount}/{totalCount}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
              Today
            </span>
          </div>
          <div className="flex flex-col items-center rounded-xl border bg-card p-4">
            <Flame className="h-5 w-5 text-orange-400 mb-1" />
            <span className="text-2xl font-bold text-foreground">
              {Math.max(
                ...data.routineHabits.map(
                  (h) =>
                    getStreak(h.id, data.routineCompletions, h).current
                ),
                0
              )}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
              Best Streak
            </span>
          </div>
          <div className="flex flex-col items-center rounded-xl border bg-card p-4">
            <Trophy className="h-5 w-5 text-yellow-400 mb-1" />
            <span className="text-2xl font-bold text-foreground">
              {totalCount > 0
                ? Math.round((completedCount / totalCount) * 100)
                : 0}
              %
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
              Today Rate
            </span>
          </div>
        </div>
      )}

      {/* Add Habit Form */}
      <div className="flex flex-col sm:flex-row gap-2 rounded-xl border bg-card p-3">
        <Input
          placeholder="Add a new habit..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addHabit()}
          className="flex-1 h-10"
        />
        <div className="flex gap-2">
          <Select value={newCategory} onValueChange={setNewCategory}>
            <SelectTrigger className="w-[130px] h-10">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {data.categories.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={newFrequency}
            onValueChange={(v) => setNewFrequency(v as RoutineFrequency)}
          >
            <SelectTrigger className="w-[120px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekdays">Weekdays</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addHabit} className="h-10 shrink-0">
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>

      {/* Habit List */}
      <section aria-label="Habits" className="space-y-2">
        {data.routineHabits.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-12">
            <p className="text-sm text-muted-foreground">
              No habits yet. Add one above to start building streaks.
            </p>
          </div>
        ) : (
          data.routineHabits.map((habit) => {
            const completed = isCompletedToday(habit.id)
            const relevant = isRelevantToday(habit)
            const streak = getStreak(
              habit.id,
              data.routineCompletions,
              habit
            )
            const catTag = data.categories.find(
              (c) => c.name === habit.category
            )

            return (
              <div
                key={habit.id}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border bg-card p-3 transition-all hover:shadow-md",
                  !relevant && "opacity-50"
                )}
              >
                {/* Toggle */}
                <button
                  onClick={() => toggleCompletion(habit.id)}
                  disabled={!relevant}
                  className="shrink-0 transition-transform hover:scale-110"
                  aria-label={
                    completed ? "Mark incomplete" : "Mark complete"
                  }
                >
                  {completed ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground/40" />
                  )}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium truncate",
                        completed &&
                          "line-through text-muted-foreground"
                      )}
                    >
                      {habit.title}
                    </span>
                    {catTag && (
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: catTag.color }}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {habit.frequency}
                    </span>
                    {!relevant && (
                      <span className="text-[10px] text-muted-foreground">
                        (not today)
                      </span>
                    )}
                  </div>
                </div>

                {/* Streak Info */}
                <div className="hidden sm:flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-orange-400">
                    <Flame className="h-3.5 w-3.5" />
                    <span className="font-semibold">
                      {streak.current}
                    </span>
                    <span className="text-muted-foreground">streak</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Trophy className="h-3.5 w-3.5" />
                    <span className="font-semibold">
                      {streak.longest}
                    </span>
                    <span className="text-muted-foreground">best</span>
                  </div>
                  <div className="text-muted-foreground">
                    {streak.consistency}% consistency
                  </div>
                </div>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={() => deleteHabit(habit.id)}
                  aria-label="Delete habit"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
