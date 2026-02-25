"use client"

import { useState, type ReactNode } from "react"
import { BottomNav } from "./bottom-nav"
import { MobileHeader } from "./mobile-header"

interface MobileLayoutProps {
  children: ReactNode
  title: string
}

export function MobileLayout({ children, title }: MobileLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MobileHeader title={title} />
      <main className="flex-1 overflow-auto px-4 pb-20 pt-4">{children}</main>
      <BottomNav />
    </div>
  )
}
