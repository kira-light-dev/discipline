export type TaskStatus = "pending" | "in-progress" | "completed"
export type Priority = "high" | "medium" | "low"

export interface Task {
  id: string
  title: string
  status: TaskStatus
  category: string
  priority: Priority
  createdAt: string
  timerSeconds: number
  timerRunning: boolean
}

export interface DailyRecord {
  date: string
  tasks: Task[]
}

export type RoutineFrequency = "daily" | "weekdays"

export interface RoutineHabit {
  id: string
  title: string
  frequency: RoutineFrequency
  category: string
  createdAt: string
}

export interface RoutineCompletion {
  habitId: string
  date: string
}

export interface AppData {
  dailyRecords: DailyRecord[]
  routineHabits: RoutineHabit[]
  routineCompletions: RoutineCompletion[]
  categories: CategoryTag[]
  theme: "dark" | "light"
}

export interface CategoryTag {
  name: string
  color: string
}

const STORAGE_KEY = "disciplineos-data"

const DEFAULT_CATEGORIES: CategoryTag[] = [
  { name: "Work", color: "#6366f1" },
  { name: "Health", color: "#22c55e" },
  { name: "Learning", color: "#eab308" },
  { name: "Personal", color: "#3b82f6" },
]

function getDefaultData(): AppData {
  return {
    dailyRecords: [],
    routineHabits: [],
    routineCompletions: [],
    categories: DEFAULT_CATEGORIES,
    theme: "dark",
  }
}

export function loadData(): AppData {
  if (typeof window === "undefined") return getDefaultData()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultData()
    return { ...getDefaultData(), ...JSON.parse(raw) }
  } catch {
    return getDefaultData()
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function clearAllData(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}

export function exportData(): string {
  return JSON.stringify(loadData(), null, 2)
}

export function importData(json: string): AppData {
  const parsed = JSON.parse(json)
  const data = { ...getDefaultData(), ...parsed }
  saveData(data)
  return data
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0]
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

export function getDailyRecord(data: AppData, date: string): DailyRecord {
  return data.dailyRecords.find((r) => r.date === date) || { date, tasks: [] }
}

export function saveDailyRecord(data: AppData, record: DailyRecord): AppData {
  const idx = data.dailyRecords.findIndex((r) => r.date === record.date)
  const newRecords = [...data.dailyRecords]
  if (idx >= 0) {
    newRecords[idx] = record
  } else {
    newRecords.push(record)
  }
  return { ...data, dailyRecords: newRecords }
}

export function getProductivityScore(record: DailyRecord): number {
  if (record.tasks.length === 0) return 0
  const completed = record.tasks.filter((t) => t.status === "completed").length
  return Math.round((completed / record.tasks.length) * 100)
}

export function getStreak(
  habitId: string,
  completions: RoutineCompletion[],
  habit: RoutineHabit
): { current: number; longest: number; consistency: number } {
  const habitCompletions = completions
    .filter((c) => c.habitId === habitId)
    .map((c) => c.date)
    .sort()

  if (habitCompletions.length === 0) return { current: 0, longest: 0, consistency: 0 }

  const today = getTodayString()
  let current = 0
  let longest = 0
  let tempStreak = 0

  const allDates = getRelevantDates(habit)

  for (let i = 0; i < allDates.length; i++) {
    if (habitCompletions.includes(allDates[i])) {
      tempStreak++
      longest = Math.max(longest, tempStreak)
    } else {
      tempStreak = 0
    }
  }

  // current streak: count back from today
  for (let i = allDates.length - 1; i >= 0; i--) {
    if (allDates[i] > today) continue
    if (habitCompletions.includes(allDates[i])) {
      current++
    } else {
      break
    }
  }

  const totalRelevant = allDates.filter((d) => d <= today).length
  const consistency = totalRelevant > 0 ? Math.round((habitCompletions.length / totalRelevant) * 100) : 0

  return { current, longest, consistency: Math.min(consistency, 100) }
}

function getRelevantDates(habit: RoutineHabit): string[] {
  const dates: string[] = []
  const start = new Date(habit.createdAt)
  const end = new Date()
  const current = new Date(start)

  while (current <= end) {
    const day = current.getDay()
    if (habit.frequency === "daily" || (habit.frequency === "weekdays" && day >= 1 && day <= 5)) {
      dates.push(current.toISOString().split("T")[0])
    }
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export function getLast30DaysScores(data: AppData): { date: string; score: number }[] {
  const result: { date: string; score: number }[] = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split("T")[0]
    const record = getDailyRecord(data, dateStr)
    result.push({ date: dateStr, score: getProductivityScore(record) })
  }
  return result
}
