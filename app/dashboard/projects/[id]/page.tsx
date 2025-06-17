"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { PlusCircle, Trash2, CheckCircle2, Clock, AlertCircle, Lock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  description: string
  status: string
  due_date: string | null
  project_id: string
  assigned_to: string | null
  assigned_user?: {
    name: string
    email: string
  }
}

interface User {
  id: string
  name: string
  email: string
}

export default function ProjectPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskStatus, setNewTaskStatus] = useState("To Do")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [newTaskAssignee, setNewTaskAssignee] = useState("")
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const [currentUser, setCurrentUser] = useState<{ id: string; isCreator: boolean } | null>(null)
  const [isProjectCreator, setIsProjectCreator] = useState(false)
  const [isProjectMember, setIsProjectMember] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if we're on the "new" route - if so, redirect to the new project page
    if (params.id === "new") {
      router.push("/dashboard/projects/new")
      return
    }

    // Get current user from localStorage
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }

    const user = JSON.parse(userData)
    setCurrentUser(user)

    const fetchProjectData = async () => {
      try {
        const supabase = createClient()

        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", params.id)
          .single()

        if (projectError) throw projectError
        setProject(projectData)

        // Check if current user is the project creator
        const isCreator = projectData.created_by === user.id
        setIsProjectCreator(isCreator)

        // Check if current user is a member of this project
        let isMember = isCreator // Creator is always a member
        if (!isCreator) {
          const { data: memberData } = await supabase
            .from("project_members")
            .select("*")
            .eq("project_id", params.id)
            .eq("user_id", user.id)
            .single()

          isMember = !!memberData
        }
        setIsProjectMember(isMember)

        // If user is not creator and not member, they shouldn't see this project
        if (!isCreator && !isMember) {
          throw new Error("You don't have access to this project")
        }

        // Fetch tasks for this project
        // Show all tasks to project members, but only assigned tasks to non-members
        const tasksQuery = supabase
          .from("tasks")
          .select(`
            *,
            assigned_user:users(name, email)
          `)
          .eq("project_id", params.id)

        const { data: tasksData, error: tasksError } = await tasksQuery.order("due_date", { ascending: true })

        if (tasksError) throw tasksError
        setTasks(tasksData || [])

        // Fetch users for assignment (only if user is project creator)
        if (isCreator) {
          const { data: usersData, error: usersError } = await supabase.from("users").select("id, name, email")

          if (usersError) throw usersError
          setUsers(usersData || [])
        }
      } catch (err: any) {
        console.error("Error fetching project data:", err)
        setError(err.message || "Failed to load project")
      } finally {
        setLoading(false)
      }
    }

    fetchProjectData()
  }, [params.id, router])

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      // Only project creator can add tasks
      if (!isProjectCreator) {
        throw new Error("Only the project creator can add tasks")
      }

      if (!newTaskTitle) {
        setError("Task title is required")
        return
      }

      const supabase = createClient()

      // Add new task
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert([
          {
            title: newTaskTitle,
            description: newTaskDescription,
            status: newTaskStatus,
            due_date: newTaskDueDate || null,
            project_id: params.id,
            assigned_to: newTaskAssignee || null,
          },
        ])
        .select()
        .single()

      if (taskError) throw taskError

      // Fetch the assigned user if there is one
      let assignedUser = null
      if (newTaskAssignee) {
        const { data: userData } = await supabase.from("users").select("name, email").eq("id", newTaskAssignee).single()

        assignedUser = userData
      }

      // Add the new task to the list
      setTasks([
        ...tasks,
        {
          ...task,
          assigned_user: assignedUser,
        },
      ])

      // Reset form and close dialog
      setNewTaskTitle("")
      setNewTaskDescription("")
      setNewTaskStatus("To Do")
      setNewTaskDueDate("")
      setNewTaskAssignee("")
      setIsAddTaskDialogOpen(false)
    } catch (err: any) {
      console.error("Error adding task:", err)
      setError(err.message || "Failed to add task")
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    // Only project creator can delete tasks
    if (!isProjectCreator) {
      alert("Only the project creator can delete tasks")
      return
    }

    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      const supabase = createClient()

      // Delete task
      const { error } = await supabase.from("tasks").delete().eq("id", taskId)

      if (error) throw error

      // Update task list
      setTasks(tasks.filter((task) => task.id !== taskId))
    } catch (err: any) {
      console.error("Error deleting task:", err)
      alert("Failed to delete task: " + err.message)
    }
  }

  const handleDeleteProject = async () => {
    // Only project creator can delete the project
    if (!isProjectCreator) {
      alert("Only the project creator can delete this project")
      return
    }

    if (
      !confirm(
        "Are you sure you want to delete this project? This will also delete all tasks associated with this project.",
      )
    )
      return

    try {
      const supabase = createClient()

      // Delete all tasks in this project
      await supabase.from("tasks").delete().eq("project_id", params.id)

      // Delete project
      const { error } = await supabase.from("projects").delete().eq("id", params.id)

      if (error) throw error

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Error deleting project:", err)
      alert("Failed to delete project: " + err.message)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "in progress":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "blocked":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date"
    return new Date(dateString).toLocaleDateString()
  }

  // If we're on the "new" route, we should have been redirected
  if (params.id === "new") {
    return null
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Project Not Found</CardTitle>
            <CardDescription>
              {error || "The project you are looking for does not exist or you don't have access to it."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="mt-1 text-gray-500">
            Created on {new Date(project.created_at).toLocaleDateString()}
            {!isProjectCreator && (
              <span className="ml-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                Member
              </span>
            )}
          </p>
        </div>
        <div className="mt-4 flex space-x-4 sm:mt-0">
          {isProjectCreator ? (
            <>
              <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>Create a new task for this project</DialogDescription>
                  </DialogHeader>
                  <form id="add-task-form" onSubmit={handleAddTask} className="space-y-4">
                    {error && <p className="text-sm font-medium text-red-500">{error}</p>}
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Enter task title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        placeholder="Enter task description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={newTaskStatus} onValueChange={setNewTaskStatus}>
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
                      <div className="space-y-2">
                        <Label htmlFor="due-date">Due Date</Label>
                        <Input
                          id="due-date"
                          type="date"
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assignee">Assign To</Label>
                      <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
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
                  </form>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddTaskDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" form="add-task-form">
                      Add Task
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={handleDeleteProject} className="text-black border-white/30 hover:border-white/50">
  <Trash2 className="mr-2 h-4 w-4 text-black" />
  Delete Project
</Button>


            </>
          ) : (
            <Alert className="w-full md:w-auto">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                You are viewing this project as a team member. Only the project creator can add or delete tasks.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{project.description}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="todo">To Do</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          {renderTaskList(tasks)}
        </TabsContent>
        <TabsContent value="todo" className="space-y-4">
          {renderTaskList(tasks.filter((task) => task.status.toLowerCase() === "to do"))}
        </TabsContent>
        <TabsContent value="in-progress" className="space-y-4">
          {renderTaskList(tasks.filter((task) => task.status.toLowerCase() === "in progress"))}
        </TabsContent>
        <TabsContent value="completed" className="space-y-4">
          {renderTaskList(tasks.filter((task) => task.status.toLowerCase() === "completed"))}
        </TabsContent>
      </Tabs>
    </div>
  )

  function renderTaskList(taskList: Task[]) {
    if (taskList.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="mb-4 text-center text-gray-500">No tasks found</p>
            {isProjectCreator && (
              <Button onClick={() => setIsAddTaskDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Your First Task
              </Button>
            )}
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="rounded-md border">
        <div className="grid grid-cols-12 border-b bg-gray-50 p-4 font-medium">
          <div className="col-span-4">Task</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Due Date</div>
          <div className="col-span-3">Assigned To</div>
          <div className="col-span-1"></div>
        </div>
        {taskList.map((task) => (
          <div key={task.id} className="grid grid-cols-12 items-center p-4 hover:bg-gray-50">
            <div className="col-span-4">
              <p className="font-medium">{task.title}</p>
              {task.description && <p className="mt-1 text-sm text-gray-500 line-clamp-1">{task.description}</p>}
            </div>
            <div className="col-span-2 flex items-center">
              {getStatusIcon(task.status)}
              <span className="ml-2 text-sm">{task.status}</span>
            </div>
            <div className="col-span-2 text-sm text-gray-500">{formatDate(task.due_date)}</div>
            <div className="col-span-3 text-sm">
              {task.assigned_user ? (
                <div>
                  <p>{task.assigned_user.name}</p>
                  <p className="text-gray-500">{task.assigned_user.email}</p>
                </div>
              ) : (
                <span className="text-gray-500">Unassigned</span>
              )}
            </div>
            <div className="col-span-1 flex justify-end">
              {isProjectCreator && (
                <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }
}
