"use client"

import { useState, useEffect, useCallback } from "react"
import { type AppData, loadData, saveData } from "@/lib/store"

export function useStore() {
  const [data, setData] = useState<AppData | null>(null)

  useEffect(() => {
    setData(loadData())
  }, [])

  const update = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      if (!prev) return prev
      const next = updater(prev)
      saveData(next)
      return next
    })
  }, [])

  return { data, update }
}
