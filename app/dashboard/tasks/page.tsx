"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { PlusCircle, CheckCircle2, Clock, AlertCircle, Calendar, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface Task {
  id: string
  title: string
  description: string
  status: string
  due_date: string | null
  project_id: string
  assigned_to: string | null
  created_at: string
  project: { name: string; id: string }
  assigned_user?: { name: string; email: string }
}

interface UserType {
  id: string
  isCreator: boolean
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const userData = localStorage.getItem("user")
        if (!userData) return

        const user: UserType = JSON.parse(userData)
        setCurrentUser(user)

        const supabase = createClient()

        const projectIds = user.isCreator
          ? (await supabase.from("projects").select("id").eq("created_by", user.id)).data?.map(p => p.id) || []
          : (await supabase.from("project_members").select("project_id").eq("user_id", user.id)).data?.map(mp => mp.project_id) || []

        if (projectIds.length === 0) {
          setTasks([])
          return
        }

        const { data, error } = await supabase
          .from("tasks")
          .select("*, project:projects(name, id), assigned_user:users(name, email)")
          .in("project_id", projectIds)
          .order("due_date", { ascending: true, nullsLast: true })

        if (error) throw error
        setTasks(data || [])
      } catch (err) {
        console.error("Error fetching tasks:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase()
    if (s === "completed") return <CheckCircle2 className="h-4 w-4 text-green-400" />
    if (s === "in progress") return <Clock className="h-4 w-4 text-yellow-400" />
    if (s === "blocked") return <AlertCircle className="h-4 w-4 text-red-400" />
    return <Clock className="h-4 w-4 text-gray-400" />
  }

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase()
    if (s === "completed") return "bg-green-500 text-white"
    if (s === "in progress") return "bg-yellow-400 text-black"
    if (s === "blocked") return "bg-red-500 text-white"
    return "bg-slate-500 text-white"
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date"
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day(s)`
    if (diffDays === 0) return "Due today"
    if (diffDays === 1) return "Due tomorrow"
    return `Due in ${diffDays} day(s)`
  }

  const getDateColor = (dateString: string | null) => {
    if (!dateString) return "text-gray-400"
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "text-red-400"
    if (diffDays === 0) return "text-orange-400"
    if (diffDays <= 3) return "text-yellow-400"
    return "text-gray-400"
  }

  const filterTasks = (type: string) => {
    if (type === "all") return tasks
    if (type === "my-tasks") return tasks.filter(t => t.assigned_to === currentUser?.id)
    return tasks.filter(t => t.status.toLowerCase() === type)
  }

  const tabs = ["all", "my-tasks", "to do", "in progress", "completed", "blocked"]

  const metrics = useMemo(() => ({
    total: tasks.length,
    "my-tasks": tasks.filter(t => t.assigned_to === currentUser?.id).length,
    "to do": tasks.filter(t => t.status.toLowerCase() === "to do").length,
    "in progress": tasks.filter(t => t.status.toLowerCase() === "in progress").length,
    completed: tasks.filter(t => t.status.toLowerCase() === "completed").length,
    blocked: tasks.filter(t => t.status.toLowerCase() === "blocked").length,
  }), [tasks, currentUser])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#22d3ee] border-t-transparent"></div>
      </div>
    )
  }

  if (!currentUser) return null

  return (
    <div className="space-y-8 bg-gradient-to-br from-[#0f172a] to-[#1e293b] min-h-screen p-8 text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tasks</h1>
        {currentUser.isCreator && (
          <Link href="/dashboard/projects/new">
            <Button className="bg-cyan-400 hover:bg-cyan-300 text-black">
              <PlusCircle className="mr-2 h-4 w-4" /> New Project
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(metrics).map(([label, count]) => (
          <Card key={label} className="bg-[#1e293b] border border-[#334155] rounded-2xl shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 capitalize">{label.replace("-", " ")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-[#1e293b] border border-[#334155] rounded-xl p-1 flex flex-wrap justify-center gap-2">
          {tabs.map(tab => (
            <TabsTrigger key={tab} value={tab} className="text-white data-[state=active]:bg-cyan-400 data-[state=active]:text-black rounded-md px-4 py-2 capitalize">
              {tab.replace("-", " ")}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab} value={tab}>
            {filterTasks(tab).length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filterTasks(tab).map(task => (
                  <Card key={task.id} className="bg-[#1e293b] border border-[#334155] hover:border-cyan-400 transition-all rounded-xl shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-semibold">{task.title}</CardTitle>
                          <CardDescription className="text-blue-400 text-sm">
                            <Link href={`/dashboard/projects/${task.project.id}`} className="hover:underline">{task.project.name}</Link>
                          </CardDescription>
                        </div>
                        <Badge className={`${getStatusColor(task.status)} rounded-full px-3 py-1 text-xs`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(task.status)} {task.status}
                          </span>
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {task.description && (
                        <p className="text-sm text-gray-400">{task.description}</p>
                      )}
                      <div className="flex flex-col gap-2 text-sm">
                        {task.due_date && (
                          <div className={`flex items-center gap-1 ${getDateColor(task.due_date)}`}>
                            <Calendar className="h-4 w-4" /> {formatDate(task.due_date)}
                          </div>
                        )}
                        {task.assigned_user && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <User className="h-4 w-4" /> {task.assigned_user.name}
                          </div>
                        )}
                      </div>
                      <div className="pt-4 flex justify-end">
                        <Link href={`/dashboard/projects/${task.project.id}`}>
                          <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300">View</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <p>No tasks found.</p>
                {currentUser.isCreator && (
                  <Link href="/dashboard/projects/new">
                    <Button className="mt-4 bg-cyan-400 text-black">
                      <PlusCircle className="mr-2 h-4 w-4" /> Create First Project
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
