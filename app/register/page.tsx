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
import { generatePasscode } from "@/lib/utils"

export default function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [accessKey, setAccessKey] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!name || !email) {
        throw new Error("Full name and email address are required")
      }

      const newAccessKey = generatePasscode()
      setAccessKey(newAccessKey)

      const supabase = createClient()

      const { data: existingUsers, error: countError } = await supabase.from("users").select("count").single()

      if (countError) {
        throw countError
      }

      const isCreator = !existingUsers || existingUsers.count === 0

      const { error: insertError, data: insertData } = await supabase
        .from("users")
        .insert([
          {
            name,
            email,
            passcode: newAccessKey,
            is_creator: isCreator,
          },
        ])
        .select()

      if (insertError) {
        throw insertError
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.")
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
          <CardTitle className="text-2xl text-center text-slate-100">Join AlphaTask</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Complete the form below to create your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert className="bg-green-50/10 border-green-200/20">
                <AlertDescription className="text-green-400">
                  Registration completed! Your unique access key is:
                </AlertDescription>
              </Alert>
              <div className="p-4 bg-white/10 rounded-md text-center text-slate-100">
                <p className="text-2xl font-mono tracking-wider">{accessKey}</p>
              </div>
              <p className="text-sm text-slate-400 text-center">
                Store this access key safely. You'll need it for future logins.
              </p>
              <Button className="w-full bg-[#22d3ee] text-black hover:bg-[#0ec2da]" onClick={() => router.push("/login")}>
                Proceed to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-100">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Type your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-100">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Type your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-[#22d3ee] text-black hover:bg-[#0ec2da]" disabled={loading}>
                {loading ? "Setting up your account..." : "Create Account"}
              </Button>
            </form>
          )}
        </CardContent>

        {!success && (
          <CardFooter className="flex justify-center">
            <div className="text-sm text-slate-400">
              Have an account already?{" "}
              <Link href="/login" className="text-[#22d3ee] hover:underline">
                Sign in here
              </Link>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}