"use client"

import { Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { departemenList, statusList } from "@/lib/mock-data"

interface SearchFilterProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  departemen: string
  onDepartemenChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  onReset: () => void
}

export function SearchFilter({
  searchQuery,
  onSearchChange,
  departemen,
  onDepartemenChange,
  status,
  onStatusChange,
  onReset,
}: SearchFilterProps) {
  const hasFilters =
    searchQuery !== "" || departemen !== "Semua" || status !== "Semua"

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
      {/* Search Input */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari nama atau NIP..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-secondary pl-9 text-sm"
        />
      </div>

      {/* Filters - Responsive Grid */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="hidden items-center gap-2 sm:flex">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">Filter:</span>
        </div>

        <Select value={departemen} onValueChange={onDepartemenChange}>
          <SelectTrigger className="w-full bg-secondary text-sm sm:w-40 lg:w-44">
            <SelectValue placeholder="Departemen" />
          </SelectTrigger>
          <SelectContent>
            {departemenList.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full bg-secondary text-sm sm:w-32 lg:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusList.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="w-full text-muted-foreground hover:text-foreground sm:w-auto text-sm"
          >
            <X className="mr-1 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}
