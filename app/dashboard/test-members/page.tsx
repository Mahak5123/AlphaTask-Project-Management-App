"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function TestMembersPage() {
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const fetchCollaborators = async () => {
      const { data, error } = await supabase
        .from("collaborators")
        .select("*")

      console.log("📦 Fetched Collaborators:", data)
      if (error) console.error("❌ Supabase Error:", error)

      setData(data || [])
      setError(error)
    }

    fetchCollaborators()
  }, [])

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔍 Test: Supabase Collaborators</h1>

      {error && (
        <div className="text-red-600 font-semibold">
          ❌ Error: {error.message}
        </div>
      )}

      {data.length === 0 ? (
        <p className="text-gray-500">No collaborators found.</p>
      ) : (
        <ul className="list-disc pl-6 space-y-1">
          {data.map((c) => (
            <li key={c.id}>
              <strong>{c.name || c.email || "Unnamed"}</strong> — ID: {c.id}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
