// Run this with: node scripts/test-db-connection.js
require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

async function testConnection() {
  console.log("Testing Supabase connection...")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables:")
    console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl)
    console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", !!supabaseKey)
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test a simple query
    const { data, error } = await supabase.from("users").select("count")

    if (error) {
      console.error("Database query error:", error)

      // Check if the table exists
      console.log("Checking if tables exist...")
      const { data: tables, error: tablesError } = await supabase
        .from("pg_tables")
        .select("tablename")
        .eq("schemaname", "public")

      if (tablesError) {
        console.error("Error checking tables:", tablesError)
      } else {
        console.log("Available tables:", tables)
      }
    } else {
      console.log("Connection successful!")
      console.log("Query result:", data)
    }
  } catch (err) {
    console.error("Connection error:", err)
  }
}

testConnection()
