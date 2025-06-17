import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create a singleton Supabase client
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

export const createClient = () => {
  if (supabaseClient) return supabaseClient

  // Make sure we're using the correct environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
    })
    throw new Error("Missing Supabase environment variables")
  }

  try {
    console.log("Creating Supabase client with URL:", supabaseUrl)
    supabaseClient = createSupabaseClient(supabaseUrl, supabaseKey)
    return supabaseClient
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    throw error
  }
}
