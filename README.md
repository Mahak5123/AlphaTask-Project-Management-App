# AlphaTask
A Jira-like project management application with a custom passcode authentication system.

## 🚀 Live Demo
**[Click to View Live Application ](https://project-management-app-alpha-task-dx4fhymkw.vercel.app/)**



## Features
- **Passcode Authentication**: Users register with email and name, and receive a generated passcode  
- **Project Management**: Create and manage projects with tasks  
- **Task Management**: Create, assign, and track tasks with status updates  
- **Team Management**: Project creators can add team members  

## Tech Stack
- Next.js  
- React  
- Tailwind CSS  
- Supabase (PostgreSQL database)  
- shadcn/ui components  

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd AlphaTask
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up Supabase database
- Create a new project at [supabase.com](https://supabase.com)
- Run the SQL schema from `/database/schema.sql` in your Supabase SQL editor

### 5. Install shadcn/ui
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card dialog table badge select textarea toast form alert
```

### 6. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add your environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Mahak5123/Project-Management-App---AlphaTask)
