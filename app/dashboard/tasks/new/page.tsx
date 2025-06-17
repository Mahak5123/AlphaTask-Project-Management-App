"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

interface Project {
  id: string
  name: string
  created_by: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function NewTask() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("To Do")
  const [dueDate, setDueDate] = useState("")
  const [projectId, setProjectId] = useState("")
  const [assigneeId, setAssigneeId] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [currentUser, setCurrentUser] = useState<{ id: string; isCreator: boolean } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user from localStorage
        const userData = localStorage.getItem("user")
        if (!userData) {
          router.push("/login")
          return
        }

        const user = JSON.parse(userData)
        setCurrentUser(user)

        const supabase = createClient()

        // Fetch projects
        // If user is creator, fetch all projects
        // If not, fetch only projects where they are assigned tasks
        let projectsQuery = supabase.from("projects").select("id, name, created_by").order("name")

        if (!user.isCreator) {
          // For non-creators, we need to get projects where they have assigned tasks
          const { data: userTaskProjects } = await supabase
            .from("tasks")
            .select("project_id")
            .eq("assigned_to", user.id)

          if (userTaskProjects && userTaskProjects.length > 0) {
            const projectIds = userTaskProjects.map((task) => task.project_id)
            projectsQuery = projectsQuery.in("id", projectIds)
          } else {
            // If no tasks are assigned, show no projects
            setProjects([])
            setUsers([])
            setLoading(false)
            return
          }
        }

        const { data: projectsData, error: projectsError } = await projectsQuery

        if (projectsError) throw projectsError
        setProjects(projectsData || [])

        // Fetch users (only if user is creator)
        if (user.isCreator) {
          const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("id, name, email")
            .order("name")

          if (usersError) throw usersError
          setUsers(usersData || [])
        }
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      if (!title) {
        throw new Error("Task title is required")
      }

      if (!projectId) {
        throw new Error("Please select a project")
      }

      const supabase = createClient()

      // Check if user is the creator of the selected project
      if (currentUser && !currentUser.isCreator) {
        const { data: project } = await supabase.from("projects").select("created_by").eq("id", projectId).single()

        if (project && project.created_by !== currentUser.id) {
          throw new Error("You can only create tasks for projects you created")
        }
      }

      // Create task
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert([
          {
            title,
            description,
            status,
            due_date: dueDate || null,
            project_id: projectId,
            assigned_to: assigneeId || null,
          },
        ])
        .select()
        .single()

      if (taskError) throw taskError

      // Redirect to project page
      router.push(`/dashboard/projects/${projectId}`)
    } catch (err: any) {
      console.error("Error creating task:", err)
      setError(err.message || "Failed to create task")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  // If user is not a creator and has no projects, show access denied
  if (!currentUser?.isCreator && projects.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to create tasks. Only project creators can create tasks.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Create New Task</h1>

      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
          <CardDescription>Enter the details for your new task</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="new-task-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select value={projectId} onValueChange={setProjectId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Do">To Do</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date</Label>
                <Input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              {currentUser?.isCreator && (
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assign To</Label>
                  <Select value={assigneeId} onValueChange={setAssigneeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" form="new-task-form" disabled={submitting}>
            {submitting ? "Creating..." : "Create Task"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
