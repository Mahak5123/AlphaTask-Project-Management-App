"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { Sparkles, ArrowLeft } from "lucide-react"

export default function NewProject() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!name) throw new Error("Project name can't be empty")

      const supabase = createClient()
      const userData = localStorage.getItem("user")
      if (!userData) throw new Error("Please log in first")

      const user = JSON.parse(userData)

      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert([
          {
            name,
            description,
            created_by: user.id,
          },
        ])
        .select()
        .single()

      if (projectError) throw projectError

      router.push(`/dashboard/projects/${project.id}`)
    } catch (err: any) {
      setError(err.message || "Something went wrong while creating the project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001524] via-[#001A2E] to-[#001524] relative overflow-hidden">
      {/* Glowing Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#00FFFF] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#00FFFF] rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-1/2 w-60 h-60 bg-[#00FFFF] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-2xl mx-auto">
          <h1 className="mb-10 text-4xl font-bold tracking-tight text-transparent bg-gradient-to-r from-white via-[#00FFFF] to-[#00dddd] bg-clip-text text-center">
            Start a New Project
          </h1>

          <Card className="bg-[#001524]/80 backdrop-blur-xl border border-[#00FFFF]/20 shadow-2xl shadow-black/20 hover:shadow-[#00FFFF]/10 transition-all duration-500">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-[#00FFFF]">Project Info</CardTitle>
              <CardDescription className="text-white/70">
                Fill in your project's details below.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form id="new-project-form" onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Label htmlFor="name" className="text-[#00FFFF] font-medium text-sm uppercase tracking-wider">
                    Project Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Bug Tracker UI"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder-white/50 text-lg h-12 focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/20 transition-all duration-300"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-[#00FFFF] font-medium text-sm uppercase tracking-wider">
                    Project Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe your project"
                    className="min-h-[100px] bg-white/10 border-white/20 text-white placeholder-white/50 resize-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/20 transition-all duration-300"
                  />
                </div>
              </form>
            </CardContent>

            <CardFooter className="flex justify-between pt-4">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex-1 mr-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 h-12 font-medium transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>

              <Button
                type="submit"
                form="new-project-form"
                disabled={loading}
                className="flex-1 bg-[#00FFFF] hover:bg-[#00dddd] text-black font-medium h-12 shadow-lg shadow-[#00FFFF]/25 hover:shadow-[#00FFFF]/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
