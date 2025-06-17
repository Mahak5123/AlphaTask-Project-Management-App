"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LayoutDashboard, CheckSquare, Users, Settings, LogOut, Menu, X, PlusCircle } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface User {
  id: string
  name: string
  email: string
  isCreator: boolean
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    try {
      setUser(JSON.parse(userData))
    } catch (error) {
      console.error("Failed to parse user data:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#22d3ee] border-t-transparent"></div>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white">
      
      {/* Top Navbar */}
      <div className="flex justify-between items-center h-16 border-b border-[#1e293b] px-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-[#22d3ee]">AlphaTask</h1>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarFallback className="bg-[#1e293b] text-[#22d3ee]">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#0f172a] border-[#1e293b] text-white">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{user?.name}</p>
              </div>
              <DropdownMenuItem onClick={handleLogout} className="hover:bg-[#1e293b] text-red-400">
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="md:hidden">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Sidebar on mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#0f172a] pt-16">
          <div className="flex flex-col p-4 space-y-4">
            {renderNavLinks(user, pathname)}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 flex-col border-r border-[#1e293b] bg-[#0b1324]">
          <div className="flex flex-col p-4 space-y-4">
            {renderNavLinks(user, pathname)}
          </div>
        </div>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )

  function renderNavLinks(user: User | null, pathname: string) {
    const linkClass = (path: string) =>
      `w-full justify-start ${pathname === path ? "bg-[#1e293b] text-[#22d3ee]" : ""}`

    return (
      <>
        <Link href="/dashboard">
          <Button variant="ghost" className={linkClass("/dashboard")}>
            <LayoutDashboard className="mr-2 h-5 w-5" />
            Overview
          </Button>
        </Link>
        <Link href="/dashboard/tasks">
          <Button variant="ghost" className={linkClass("/dashboard/tasks")}>
            <CheckSquare className="mr-2 h-5 w-5" />
            My Tasks
          </Button>
        </Link>
        <Link href="/dashboard/projects/new">
          <Button variant="ghost" className={linkClass("/dashboard/projects/new")}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Project
          </Button>
        </Link>
        {user?.isCreator && (
          <Link href="/dashboard/members">
            <Button variant="ghost" className={linkClass("/dashboard/members")}>
              <Users className="mr-2 h-5 w-5" />
              Collaborators
            </Button>
          </Link>
        )}
        <Link href="/dashboard/settings">
          <Button variant="ghost" className={linkClass("/dashboard/settings")}>
            <Settings className="mr-2 h-5 w-5" />
            Preferences
          </Button>
        </Link>
      </>
    )
  }
}
