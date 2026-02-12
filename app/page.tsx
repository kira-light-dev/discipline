"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TaskItem } from "@/components/dashboard/task-item"
import { DailyStats } from "@/components/dashboard/daily-stats"
import { useStore } from "@/hooks/use-store"
import {
  type Task,
  type Priority,
  getTodayString,
  generateId,
  getDailyRecord,
  saveDailyRecord,
} from "@/lib/store"

export default function DashboardPage() {
  const { data, update } = useStore()
  const [newTitle, setNewTitle] = useState("")
  const [newPriority, setNewPriority] = useState<Priority>("medium")
  const [newCategory, setNewCategory] = useState("")
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const today = getTodayString()
  const record = data ? getDailyRecord(data, today) : { date: today, tasks: [] }

  const hasRunning = record.tasks.some((t) => t.timerRunning)

  useEffect(() => {
    if (!data) return
    if (hasRunning) {
      timerRef.current = setInterval(() => {
        update((prev) => {
          const rec = getDailyRecord(prev, today)
          const tasks = rec.tasks.map((t) =>
            t.timerRunning ? { ...t, timerSeconds: t.timerSeconds + 1 } : t
          )
          return saveDailyRecord(prev, { ...rec, tasks })
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [data, hasRunning, today, update])

  function addTask() {
    if (!newTitle.trim() || !data) return
    const task: Task = {
      id: generateId(),
      title: newTitle.trim(),
      status: "pending",
      category: newCategory || (data.categories[0]?.name ?? ""),
      priority: newPriority,
      createdAt: new Date().toISOString(),
      timerSeconds: 0,
      timerRunning: false,
    }
    const updated = { ...record, tasks: [...record.tasks, task] }
    update((prev) => saveDailyRecord(prev, updated))
    setNewTitle("")
  }

  function updateTask(task: Task) {
    if (!data) return
    const tasks = record.tasks.map((t) => (t.id === task.id ? task : t))
    update((prev) => saveDailyRecord(prev, { ...record, tasks }))
  }

  function deleteTask(id: string) {
    if (!data) return
    const tasks = record.tasks.filter((t) => t.id !== id)
    update((prev) => saveDailyRecord(prev, { ...record, tasks }))
  }

  function handleDrop(dropIdx: number) {
    if (dragIdx === null || dragIdx === dropIdx || !data) return
    const tasks = [...record.tasks]
    const [moved] = tasks.splice(dragIdx, 1)
    tasks.splice(dropIdx, 0, moved)
    update((prev) => saveDailyRecord(prev, { ...record, tasks }))
    setDragIdx(null)
  }

  function toggleTimer(id: string) {
    if (!data) return
    const tasks = record.tasks.map((t) =>
      t.id === id ? { ...t, timerRunning: !t.timerRunning } : t
    )
    update((prev) => saveDailyRecord(prev, { ...record, tasks }))
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const catColorMap: Record<string, string> = {}
  data.categories.forEach((c) => {
    catColorMap[c.name] = c.color
  })

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight text-balance">
          Daily Dashboard
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <time dateTime={today}>
            {new Date(today + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-2 rounded-xl border bg-card p-3">
        <Input
          placeholder="Add a new task..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
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
            value={newPriority}
            onValueChange={(v) => setNewPriority(v as Priority)}
          >
            <SelectTrigger className="w-[100px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addTask} className="h-10 shrink-0">
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>

      <section aria-label="Today's tasks" className="space-y-2">
        {record.tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-12">
            <p className="text-sm text-muted-foreground">
              No tasks yet. Add one above to get started.
            </p>
          </div>
        ) : (
          record.tasks.map((task, i) => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onDragStart={() => setDragIdx(i)}
              onDragOver={() => {}}
              onDrop={() => handleDrop(i)}
              categoryColor={catColorMap[task.category]}
              onTimerToggle={toggleTimer}
            />
          ))
        )}
      </section>

      <section aria-label="Daily analytics">
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Daily Analytics
        </h2>
        <DailyStats tasks={record.tasks} categories={data.categories} />
      </section>
    </div>
  )
}
