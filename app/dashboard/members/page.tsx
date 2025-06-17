"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { UserPlus, Trash2, Info } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
  id: string
  name: string
  email: string
  is_creator: boolean
  created_at: string
}

interface Project {
  id: string
  name: string
}

interface ProjectMember {
  project_id: string
  user_id: string
  role: string
  added_at: string
  user: User
}

export default function MembersPage() {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreator, setIsCreator] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addedMember, setAddedMember] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; isCreator: boolean } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = localStorage.getItem("user")
        if (!userData) return

        const user = JSON.parse(userData)
        setCurrentUser(user)
        setIsCreator(user.isCreator)

        if (!user.isCreator) {
          setLoading(false)
          return
        }

        const supabase = createClient()
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("id, name")
          .eq("created_by", user.id)
          .order("name")

        if (projectsError) throw projectsError
        setProjects(projectsData || [])

        if (projectsData && projectsData.length > 0) {
          setSelectedProjectId(projectsData[0].id)
          await fetchProjectMembers(projectsData[0].id)
        }
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const fetchProjectMembers = async (projectId: string) => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          project_id,
          user_id,
          role,
          added_at,
          user:users(id, name, email, is_creator)
        `)
        .eq("project_id", projectId)
        .order("added_at", { ascending: false })

      if (error) throw error

      const { data: projectData } = await supabase.from("projects").select("created_by").eq("id", projectId).single()
      if (projectData) {
        const { data: creatorData } = await supabase
          .from("users")
          .select("id, name, email, is_creator")
          .eq("id", projectData.created_by)
          .single()

        if (creatorData) {
          const creatorExists = data?.some((member) => member.user.id === creatorData.id)
          if (!creatorExists) {
            const creatorMember = {
              project_id: projectId,
              user_id: creatorData.id,
              role: "creator",
              added_at: new Date().toISOString(),
              user: creatorData,
            }
            setMembers([creatorMember, ...(data || [])])
            return
          }
        }
      }
      setMembers(data || [])
    } catch (err) {
      console.error("Error fetching project members:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId)
    fetchProjectMembers(projectId)
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      if (!newMemberEmail) {
        setError("Please enter a valid email.")
        return
      }
      if (!selectedProjectId) {
        setError("No project selected.")
        return
      }
      const supabase = createClient()
      const { data: existingUser, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", newMemberEmail)
        .single()

      if (userError || !existingUser) {
        setError("User not found in the system.")
        return
      }

      const { data: existingMember } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", selectedProjectId)
        .eq("user_id", existingUser.id)
        .single()

      if (existingMember) {
        setError("This user already exists in the project.")
        return
      }

      const { error: insertError } = await supabase.from("project_members").insert([
        { project_id: selectedProjectId, user_id: existingUser.id, role: "member" },
      ])

      if (insertError) throw insertError

      await fetchProjectMembers(selectedProjectId)
      setAddedMember(existingUser)
      setDialogOpen(true)
      setNewMemberEmail("")
    } catch (err: any) {
      setError(err.message || "Could not add member.")
    }
  }

  const handleRemoveMember = async (projectId: string, userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return
    try {
      const memberToRemove = members.find((member) => member.user.id === userId)
      if (memberToRemove?.role === "creator") {
        setError("You cannot remove the project owner.")
        return
      }
      const supabase = createClient()
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", userId)

      if (error) throw error
      setMembers(members.filter((m) => !(m.project_id === projectId && m.user_id === userId)))
    } catch (err: any) {
      setError(err.message || "Failed to remove member.")
    }
  }

  if (loading && !members.length) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#020c1b] to-[#0f172a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#38bdf8] border-t-transparent"></div>
      </div>
    )
  }

  if (!isCreator) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#020c1b] to-[#0f172a]">
        <Card className="w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/20 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-[#38bdf8]">Unauthorized Access</CardTitle>
            <CardDescription>Only project owners have permission to manage collaborators.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#020c1b] to-[#0f172a] p-4 text-white">
      <div className="mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#38bdf8] drop-shadow-lg">Team Management</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#38bdf8] drop-shadow-lg">Choose Project</CardTitle>
            <CardDescription>Select a project to modify its team</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedProjectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-full md:w-[300px] bg-white/20 text-white border-white/30">
                <SelectValue placeholder="Pick a project" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f172a] text-white border-white/20">
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#38bdf8]">Invite Member</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMember} className="space-y-4">
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} placeholder="example@domain.com" className="bg-white/20 text-white" />
                </div>
                <Alert className="bg-yellow-200/20 border-yellow-300/20 text-yellow-100 flex items-start gap-3 p-4 w-full rounded-md">
                  <Info className="h-5 w-5 mt-1" />
                  <span>Only <span className="text-[#FFD700] font-bold">existing registered users</span> can be invited.</span>
                </Alert>
              </form>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-[#38bdf8] text-black hover:bg-[#0ea5e9] hover:scale-105 transition-all">
                <UserPlus className="mr-2 h-4 w-4" /> Invite Member
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#38bdf8]">Current Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[350px] overflow-y-auto">
              {members.length > 0 ? members.map((member) => (
                <div key={member.user_id} className="flex justify-between items-center border border-white/20 rounded-lg p-3">
                  <div>
                    <p className="font-medium">{member.user.name}</p>
                    <p className="text-sm text-white/70">{member.user.email}</p>
                    {member.role === "creator" && (
                      <span className="mt-1 inline-block bg-blue-100/20 text-blue-400 text-xs px-2 py-1 font-medium">Owner</span>
                    )}
                  </div>
                  {member.role !== "creator" && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.project_id, member.user.id)}>
                      <Trash2 className="h-5 w-5 text-red-400" />
                    </Button>
                  )}
                </div>
              )) : <p className="text-center text-white/60">No members yet.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0f172a] text-white border border-white/20">
          <DialogHeader>
            <DialogTitle>New Member Added</DialogTitle>
            <DialogDescription>{addedMember?.name} has been successfully added to your team.</DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-white/10 rounded-md">
            <p><b>Name:</b> {addedMember?.name}</p>
            <p><b>Email:</b> {addedMember?.email}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}