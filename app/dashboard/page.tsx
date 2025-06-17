"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { PlusCircle, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { ConfigNotice } from "@/components/config-notice"

interface Project {
  id: string
  name: string
  description: string
  created_at: string
  created_by: string
}

interface Task {
  id: string
  title: string
  status: string
  project_name: string
  due_date: string | null
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: string; isCreator: boolean } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = localStorage.getItem("user")
        if (!userData) return

        const user = JSON.parse(userData)
        setCurrentUser(user)

        const supabase = createClient()
        let projectsData: Project[] = []

        if (user.isCreator) {
          const { data } = await supabase
            .from("projects")
            .select("*")
            .eq("created_by", user.id)
            .order("created_at", { ascending: false })
            .limit(5)
          projectsData = data || []
        } else {
          const { data: memberProjects } = await supabase
            .from("project_members")
            .select(`project_id, projects(*)`)
            .eq("user_id", user.id)

          if (memberProjects) {
            projectsData = memberProjects
              .map((mp: any) => mp.projects)
              .filter(Boolean)
              .slice(0, 5)
          }
        }

        setProjects(projectsData)

        let tasksData: any[] = []

        if (user.isCreator) {
          const { data } = await supabase
            .from("tasks")
            .select(`id, title, status, due_date, projects(name)`)
            .in("project_id", projectsData.map((p) => p.id))
            .order("due_date", { ascending: true })
            .limit(10)

          tasksData = data || []
        } else {
          const projectIds = projectsData.map((p) => p.id)
          if (projectIds.length > 0) {
            const { data } = await supabase
              .from("tasks")
              .select(`id, title, status, due_date, projects(name)`)
              .in("project_id", projectIds)
              .order("due_date", { ascending: true })
              .limit(10)
            tasksData = data || []
          }
        }

        setTasks(
          tasksData.map((task: any) => ({
            ...task,
            project_name: task.projects?.name || "Unknown Project",
          }))
        )
      } catch (error) {
        console.error("Error:", error)
        setProjects([])
        setTasks([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-400" />
      case "in progress":
        return <Clock className="h-5 w-5 text-yellow-400" />
      case "blocked":
        return <AlertCircle className="h-5 w-5 text-red-400" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date"
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#22d3ee] border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {projects.length === 0 && tasks.length === 0 && <ConfigNotice />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        {currentUser?.isCreator && (
          <Link href="/dashboard/projects/new" className="mt-4 sm:mt-0">
            <Button className="border-[#22d3ee] text-[#22d3ee] hover:bg-[#164e63]">
              <PlusCircle className="mr-2 h-4 w-4" /> New Project
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title={currentUser?.isCreator ? "My Projects" : "Projects I'm In"} count={projects.length} />
        <StatCard title="Total Tasks" count={tasks.length} />
        <StatCard title="Completed Tasks" count={tasks.filter(t => t.status.toLowerCase() === "completed").length} />
        <StatCard title="In Progress" count={tasks.filter(t => t.status.toLowerCase() === "in progress").length} />
      </div>

      <Tabs defaultValue="projects" className="text-white">
        <TabsList className="bg-[#1e293b] border border-[#334155]">
          <TabsTrigger value="projects">Recent Projects</TabsTrigger>
          <TabsTrigger value="tasks">Recent Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          {projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="bg-[#0f172a] border-[#22d3ee] text-white">
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2 text-[#94a3b8]">
                      {project.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between">
                    <div className="text-sm text-[#94a3b8]">
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </div>
                    <Link href={`/dashboard/projects/${project.id}`}>
                      <Button variant="outline" className="border-[#22d3ee] text-[#22d3ee]" size="sm">
                        View
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState text={currentUser?.isCreator ? "No projects yet" : "No projects assigned"} />
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          {tasks.length > 0 ? (
            <div className="rounded-md border border-[#22d3ee]">
              <div className="grid grid-cols-12 border-b bg-[#1e293b] p-4 font-medium text-white">
                <div className="col-span-5">Task</div>
                <div className="col-span-3">Project</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Due Date</div>
              </div>
              {tasks.map((task) => (
                <div key={task.id} className="grid grid-cols-12 items-center p-4 hover:bg-[#1e293b]">
                  <div className="col-span-5 font-medium">{task.title}</div>
                  <div className="col-span-3 text-sm text-[#94a3b8]">{task.project_name}</div>
                  <div className="col-span-2 flex items-center">
                    {getStatusIcon(task.status)}
                    <span className="ml-2 text-sm">{task.status}</span>
                  </div>
                  <div className="col-span-2 text-sm text-[#94a3b8]">{formatDate(task.due_date)}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No tasks found" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({ title, count }: { title: string; count: number }) {
  return (
    <Card className="bg-[#0f172a] border-[#22d3ee] text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[#94a3b8]">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{count}</div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="bg-[#0f172a] border-[#22d3ee] text-white">
      <CardContent className="flex flex-col items-center justify-center py-10">
        <p className="mb-4 text-center text-[#94a3b8]">{text}</p>
      </CardContent>
    </Card>
  )
}
