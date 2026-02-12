"use client"

import { useState } from "react"
import {
  GripVertical,
  Pencil,
  Trash2,
  Check,
  Clock,
  Circle,
  ChevronDown,
  Play,
  Square,
  Timer,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Task, TaskStatus, Priority } from "@/lib/store"

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; icon: typeof Check; className: string }
> = {
  pending: {
    label: "Pending",
    icon: Circle,
    className: "text-red-400",
  },
  "in-progress": {
    label: "In Progress",
    icon: Clock,
    className: "text-yellow-400",
  },
  completed: {
    label: "Completed",
    icon: Check,
    className: "text-emerald-400",
  },
}

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  high: { label: "High", className: "bg-red-500/15 text-red-400 border-red-500/20" },
  medium: {
    label: "Med",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  },
  low: {
    label: "Low",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  },
}

interface TaskItemProps {
  task: Task
  onUpdate: (task: Task) => void
  onDelete: (id: string) => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  categoryColor?: string
  onTimerToggle: (id: string) => void
}

export function TaskItem({
  task,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  categoryColor,
  onTimerToggle,
}: TaskItemProps) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const statusConfig = STATUS_CONFIG[task.status]
  const StatusIcon = statusConfig.icon
  const priorityConfig = PRIORITY_CONFIG[task.priority]

  function handleSave() {
    if (editTitle.trim()) {
      onUpdate({ ...task, title: editTitle.trim() })
    }
    setEditing(false)
  }

  function cycleStatus() {
    const order: TaskStatus[] = ["pending", "in-progress", "completed"]
    const idx = order.indexOf(task.status)
    onUpdate({ ...task, status: order[(idx + 1) % order.length] })
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(e)
      }}
      onDrop={onDrop}
      className={cn(
        "group flex items-center gap-3 rounded-xl border bg-card p-3 transition-all hover:shadow-md",
        task.status === "completed" && "opacity-60"
      )}
    >
      <button
        className="cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Status button */}
      <button
        onClick={cycleStatus}
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          task.status === "completed"
            ? "border-emerald-400 bg-emerald-400/20"
            : task.status === "in-progress"
            ? "border-yellow-400 bg-yellow-400/10"
            : "border-muted-foreground/30"
        )}
        aria-label={`Status: ${statusConfig.label}. Click to change.`}
      >
        {task.status === "completed" && (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        )}
        {task.status === "in-progress" && (
          <Clock className="h-3.5 w-3.5 text-yellow-400" />
        )}
      </button>

      {/* Title / Edit */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="h-8 text-sm"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "text-sm font-medium truncate",
                task.status === "completed" && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </span>
            {categoryColor && task.category && (
              <span
                className="shrink-0 inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: categoryColor }}
                title={task.category}
              />
            )}
          </div>
        )}
      </div>

      {/* Priority */}
      <span
        className={cn(
          "hidden sm:inline-flex shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
          priorityConfig.className
        )}
      >
        {priorityConfig.label}
      </span>

      {/* Timer */}
      <button
        onClick={() => onTimerToggle(task.id)}
        className={cn(
          "hidden sm:flex items-center gap-1 rounded-md px-2 py-1 text-xs font-mono transition-colors",
          task.timerRunning
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label={task.timerRunning ? "Stop timer" : "Start timer"}
      >
        {task.timerRunning ? (
          <Square className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
        <span>{formatTime(task.timerSeconds)}</span>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            setEditTitle(task.title)
            setEditing(true)
          }}
          aria-label="Edit task"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
