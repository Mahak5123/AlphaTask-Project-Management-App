"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

export default function Login() {
  const [email, setEmail] = useState("")
  const [passcode, setPasscode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!email || !passcode) {
        throw new Error("Email and passcode are required")
      }

      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("passcode", passcode)
        .single()

      if (fetchError || !data) {
        if (process.env.NODE_ENV === "development" && email === "test@example.com" && passcode === "test") {
          localStorage.setItem("user", JSON.stringify({
            id: "test-user-id",
            name: "Test User",
            email: "test@example.com",
            isCreator: true,
          }))
          router.push("/dashboard")
          return
        }
        throw new Error("Invalid email or passcode")
      }

      localStorage.setItem("user", JSON.stringify({
        id: data.id,
        name: data.name,
        email: data.email,
        isCreator: data.is_creator,
      }))

      router.push("/dashboard")
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Failed to login. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-4">
      <Card className="w-full max-w-md shadow-2xl bg-white/10 backdrop-blur-md border border-white/10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-3xl font-extrabold text-[#22d3ee]">AlphaTask</h1>
          </div>
          <CardTitle className="text-2xl text-center text-slate-100">Welcome Back</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Enter your email and passcode to sign in
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-100">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passcode" className="text-slate-100">Passcode</Label>
              <Input
                id="passcode"
                type="password"
                placeholder="Enter your passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-[#22d3ee] text-black hover:bg-[#0ec2da]" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <div className="text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#22d3ee] hover:underline">
              Register
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
