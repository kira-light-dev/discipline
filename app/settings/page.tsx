"use client"

import { useRef, useState } from "react"
import { useTheme } from "next-themes"
import {
  Sun,
  Moon,
  Trash2,
  Download,
  Upload,
  Plus,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useStore } from "@/hooks/use-store"
import { clearAllData, exportData, importData, type CategoryTag } from "@/lib/store"

const PRESET_COLORS = [
  "#6366f1",
  "#22c55e",
  "#eab308",
  "#3b82f6",
  "#ef4444",
  "#ec4899",
  "#f97316",
  "#14b8a6",
  "#8b5cf6",
  "#64748b",
]

export default function SettingsPage() {
  const { data, update } = useStore()
  const { theme, setTheme } = useTheme()
  const fileRef = useRef<HTMLInputElement>(null)
  const [newCatName, setNewCatName] = useState("")
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0])

  function handleExport() {
    const json = exportData()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `disciplineos-backup-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Data exported successfully")
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = ev.target?.result as string
        const imported = importData(json)
        update(() => imported)
        toast.success("Data imported successfully")
      } catch {
        toast.error("Invalid file format")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  function handleClear() {
    clearAllData()
    window.location.reload()
  }

  function addCategory() {
    if (!newCatName.trim() || !data) return
    if (data.categories.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      toast.error("Category already exists")
      return
    }
    update((prev) => ({
      ...prev,
      categories: [...prev.categories, { name: newCatName.trim(), color: newCatColor }],
    }))
    setNewCatName("")
    toast.success("Category added")
  }

  function removeCategory(name: string) {
    if (!data) return
    update((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.name !== name),
    }))
    toast.success("Category removed")
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6 space-y-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight text-balance">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your preferences and data
        </p>
      </header>

      {/* Appearance */}
      <section className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Appearance
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <Moon className="h-5 w-5 text-primary" />
            ) : (
              <Sun className="h-5 w-5 text-yellow-500" />
            )}
            <Label htmlFor="theme-toggle" className="text-sm text-foreground">
              Dark Mode
            </Label>
          </div>
          <Switch
            id="theme-toggle"
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </div>
      </section>

      {/* Categories */}
      <section className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Categories
        </h2>
        <div className="flex flex-wrap gap-2">
          {data.categories.map((cat) => (
            <div
              key={cat.name}
              className="group flex items-center gap-2 rounded-lg border bg-secondary/50 px-3 py-1.5"
            >
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-sm text-foreground">{cat.name}</span>
              <button
                onClick={() => removeCategory(cat.name)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove ${cat.name}`}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="New category name"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
            className="flex-1 h-9"
          />
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewCatColor(color)}
                  className={cn(
                    "h-6 w-6 rounded-full transition-transform",
                    newCatColor === color && "ring-2 ring-foreground ring-offset-2 ring-offset-card scale-110"
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            <Button size="sm" onClick={addCategory} className="h-9">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Data Management
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={handleExport} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            aria-label="Import data file"
          />
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your tasks, habits, streaks,
                and settings. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClear}>
                Delete Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  )
}
