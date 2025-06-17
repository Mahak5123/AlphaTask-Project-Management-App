-- Create project_members table if it doesn't exist
-- Note: This table uses a composite primary key (project_id, user_id) instead of an id column
CREATE TABLE IF NOT EXISTS project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- Enable RLS on project_members table
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Create policies for project_members
CREATE POLICY "Allow public read access to project_members" ON project_members FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert to project_members" ON project_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow individual update to project_members" ON project_members FOR UPDATE USING (true);
CREATE POLICY "Allow individual delete from project_members" ON project_members FOR DELETE USING (true);
