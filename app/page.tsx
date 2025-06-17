import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0f172a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0f172a] shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#22d3ee]">AlphaTask</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" className="border-[#22d3ee] text-[#22d3ee] hover:bg-[#22d3ee] hover:text-black">
                Secure Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-[#22d3ee] text-black hover:bg-[#0ec2da]">
                Launch Your Workspace
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-24 bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
          <div className="container text-center">
            <h1 className="text-5xl font-bold leading-tight tracking-tight mb-6">
              The AI-Powered Project Management Platform{" "}
              <span className="text-[#22d3ee]">for the Next Generation.</span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-slate-400 mb-10">
              Driven by intelligent automation. Build, collaborate, and deliver faster with adaptive workflows, smart recommendations, and real-time insights.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 bg-[#22d3ee] text-black hover:bg-[#0ec2da]">
                  Launch Your Workspace <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" className="h-12 px-8 bg-white text-black">
                   Secure Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-[#0f172a] py-20">
          <div className="container">
            <h2 className="text-4xl font-bold text-center mb-16 text-white">AI-Enhanced Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { icon: "🤖", title: "Smart Task Hub", desc: "AI-powered task suggestions and prioritization.", bg: "bg-orange-500/20" },
                { icon: "📊", title: "Real-Time Analytics", desc: "Instant insights & adaptive dashboards.", bg: "bg-blue-500/20" },
                { icon: "👥", title: "Collaboration Intelligence", desc: "AI-powered team sync & communication.", bg: "bg-pink-500/20" },
                { icon: "📈", title: "Predictive Roadmaps", desc: "Anticipate project risks & deadlines with AI.", bg: "bg-green-500/20" },
                { icon: "⏰", title: "Smart Reminders", desc: "AI learns and optimizes your task schedules.", bg: "bg-purple-500/20" },
                { icon: "🔒", title: "AI Security Layer", desc: "Proactive threat detection & data protection.", bg: "bg-red-500/20" }
              ].map((feature, idx) => (
                <div key={idx} className="text-center p-6 rounded-xl border border-white/10 shadow-md transition hover:scale-[1.03] hover:shadow-xl bg-white/10 backdrop-blur-md">
                  <div className={`mx-auto mb-5 w-16 h-16 flex items-center justify-center rounded-full text-3xl ${feature.bg}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-sm text-slate-300">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0f172a] border-t border-white/10 py-10">
        <div className="container mx-auto flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="mb-6 md:mb-0">
            <h1 className="text-2xl font-extrabold text-[#22d3ee]">AlphaTask</h1>
            <p className="mt-2 text-sm text-slate-400">Empowering Teams with Artificial Intelligence.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-slate-400">
            <Link href="#" className="hover:text-white">About Us</Link>
            <Link href="#" className="hover:text-white">Features</Link>
            <Link href="#" className="hover:text-white">Privacy Policy</Link>
            <Link href="#" className="hover:text-white">Blog</Link>
            <Link href="#" className="hover:text-white">Contact Us</Link>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-4 text-center text-xs text-slate-500">
          © 2025 AlphaTask. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
