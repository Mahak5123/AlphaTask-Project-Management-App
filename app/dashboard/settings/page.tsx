"use client"

import { useEffect, useState, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { User, Settings, Lock, Mail, UserCircle, Shield } from "lucide-react"

interface UserProfile {
  id: string
  name: string
  email: string
  passcode: string
  created_at: string
  is_creator: boolean
}

export default function AccountSettings() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Profile form states
  const [displayName, setDisplayName] = useState("")
  const [emailAddress, setEmailAddress] = useState("")
  const [profileSubmitting, setProfileSubmitting] = useState(false)
  const [profileMessage, setProfileMessage] = useState("")
  const [profileMessageType, setProfileMessageType] = useState<"success" | "error" | "">("")

  // Security form states
  const [currentKey, setCurrentKey] = useState("")
  const [newAccessKey, setNewAccessKey] = useState("")
  const [verifyAccessKey, setVerifyAccessKey] = useState("")
  const [securitySubmitting, setSecuritySubmitting] = useState(false)
  const [securityMessage, setSecurityMessage] = useState("")
  const [securityMessageType, setSecurityMessageType] = useState<"success" | "error" | "">("")

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const storedUser = localStorage.getItem("user")
        if (!storedUser) return

        const userData = JSON.parse(storedUser)
        const supabase = createClient()

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userData.id)
          .single()
        
        if (error) throw error

        setUserProfile(data)
        setDisplayName(data.name)
        setEmailAddress(data.email)
      } catch (error) {
        console.error("Failed to load user profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserProfile()
  }, [])

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (!userProfile) return

    setProfileSubmitting(true)
    setProfileMessage("")
    setProfileMessageType("")

    try {
      if (!displayName.trim() || !emailAddress.trim()) {
        throw new Error("Display name and email are required fields")
      }

      const supabase = createClient()
      const { error } = await supabase
        .from("users")
        .update({ 
          name: displayName.trim(), 
          email: emailAddress.trim() 
        })
        .eq("id", userProfile.id)
      
      if (error) throw error

      // Update local storage
      const storedData = JSON.parse(localStorage.getItem("user") || "{}")
      localStorage.setItem("user", JSON.stringify({ 
        ...storedData, 
        name: displayName.trim(), 
        email: emailAddress.trim() 
      }))

      setUserProfile(prev => prev ? { 
        ...prev, 
        name: displayName.trim(), 
        email: emailAddress.trim() 
      } : null)

      setProfileMessage("Your profile has been updated successfully!")
      setProfileMessageType("success")
    } catch (error: any) {
      setProfileMessage(error.message || "Profile update failed. Please try again.")
      setProfileMessageType("error")
    } finally {
      setProfileSubmitting(false)
    }
  }

  const handleSecurityUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (!userProfile) return

    setSecuritySubmitting(true)
    setSecurityMessage("")
    setSecurityMessageType("")

    try {
      if (!currentKey || !newAccessKey || !verifyAccessKey) {
        throw new Error("All security fields must be filled")
      }

      if (newAccessKey !== verifyAccessKey) {
        throw new Error("New access keys don't match")
      }

      if (currentKey !== userProfile.passcode) {
        throw new Error("Current access key is invalid")
      }

      if (newAccessKey.length < 6) {
        throw new Error("New access key must be at least 6 characters")
      }

      const supabase = createClient()
      const { error } = await supabase
        .from("users")
        .update({ passcode: newAccessKey })
        .eq("id", userProfile.id)
      
      if (error) throw error

      setUserProfile(prev => prev ? { ...prev, passcode: newAccessKey } : null)
      setCurrentKey("")
      setNewAccessKey("")
      setVerifyAccessKey("")
      setSecurityMessage("Access key updated successfully!")
      setSecurityMessageType("success")
    } catch (error: any) {
      setSecurityMessage(error.message || "Security update failed. Please try again.")
      setSecurityMessageType("error")
    } finally {
      setSecuritySubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-t-transparent border-[#22d3ee] rounded-full animate-spin"></div>
          <p className="text-slate-300">Loading your settings...</p>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
        <Card className="w-full max-w-md backdrop-blur-md bg-white/10 border border-white/20 text-white shadow-2xl rounded-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <CardTitle className="text-red-400">Access Denied</CardTitle>
            <CardDescription className="text-slate-300">
              Unable to retrieve your account information. Please sign in again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#22d3ee]/20 rounded-full mb-6">
            <Settings className="w-10 h-10 text-[#22d3ee]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Account Settings
          </h1>
          <p className="text-slate-400 text-lg">
            Manage your personal information and security preferences
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Profile Management Card */}
          <Card className="bg-slate-800/50 border-slate-700/50 text-white shadow-xl rounded-2xl backdrop-blur-sm hover:bg-slate-800/60 transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#22d3ee]/20 rounded-lg">
                  <UserCircle className="w-6 h-6 text-[#22d3ee]" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">Personal Information</CardTitle>
                  <CardDescription className="text-slate-400">
                    Update your display name and contact details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <form id="profile-form" onSubmit={handleProfileUpdate} className="space-y-6">
                {profileMessage && (
                  <Alert className={profileMessageType === "success" ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}>
                    <AlertDescription className={profileMessageType === "success" ? "text-green-400" : "text-red-400"}>
                      {profileMessage}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Label htmlFor="display-name" className="text-slate-200 font-medium">
                    Display Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input 
                      id="display-name" 
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:ring-[#22d3ee] focus:border-[#22d3ee] pl-10" 
                      placeholder="Enter your display name"
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email-address" className="text-slate-200 font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input 
                      id="email-address" 
                      type="email" 
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:ring-[#22d3ee] focus:border-[#22d3ee] pl-10" 
                      placeholder="Enter your email address"
                      value={emailAddress} 
                      onChange={(e) => setEmailAddress(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
              </form>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                form="profile-form" 
                disabled={profileSubmitting} 
                className="w-full bg-[#22d3ee] text-black hover:bg-[#0ec2da] font-semibold py-3 transition-all duration-200 hover:scale-105"
              >
                {profileSubmitting ? "Updating Profile..." : "Save Profile Changes"}
              </Button>
            </CardFooter>
          </Card>

          {/* Security Management Card */}
          <Card className="bg-slate-800/50 border-slate-700/50 text-white shadow-xl rounded-2xl backdrop-blur-sm hover:bg-slate-800/60 transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Lock className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">Security Settings</CardTitle>
                  <CardDescription className="text-slate-400">
                    Change your account access key for enhanced security
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <form id="security-form" onSubmit={handleSecurityUpdate} className="space-y-6">
                {securityMessage && (
                  <Alert className={securityMessageType === "success" ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}>
                    <AlertDescription className={securityMessageType === "success" ? "text-green-400" : "text-red-400"}>
                      {securityMessage}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Label htmlFor="current-key" className="text-slate-200 font-medium">
                    Current Access Key
                  </Label>
                  <Input 
                    id="current-key" 
                    type="password" 
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:ring-amber-400 focus:border-amber-400" 
                    placeholder="Enter your current access key"
                    value={currentKey} 
                    onChange={(e) => setCurrentKey(e.target.value)} 
                    required 
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="new-key" className="text-slate-200 font-medium">
                    New Access Key
                  </Label>
                  <Input 
                    id="new-key" 
                    type="password" 
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:ring-amber-400 focus:border-amber-400" 
                    placeholder="Create a new access key"
                    value={newAccessKey} 
                    onChange={(e) => setNewAccessKey(e.target.value)} 
                    required 
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="verify-key" className="text-slate-200 font-medium">
                    Confirm New Access Key
                  </Label>
                  <Input 
                    id="verify-key" 
                    type="password" 
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:ring-amber-400 focus:border-amber-400" 
                    placeholder="Confirm your new access key"
                    value={verifyAccessKey} 
                    onChange={(e) => setVerifyAccessKey(e.target.value)} 
                    required 
                  />
                </div>
              </form>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                form="security-form" 
                disabled={securitySubmitting} 
                className="w-full bg-amber-500 text-black hover:bg-amber-400 font-semibold py-3 transition-all duration-200 hover:scale-105"
              >
                {securitySubmitting ? "Updating Security..." : "Update Access Key"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Account Info Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 text-slate-400 text-sm">
            <Shield className="w-4 h-4" />
            <span>
              Account created: {new Date(userProfile.created_at).toLocaleDateString()}
              {userProfile.is_creator && " • Creator Account"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}