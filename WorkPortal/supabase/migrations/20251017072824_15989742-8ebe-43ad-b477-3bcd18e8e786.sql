-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('client', 'freelancer');

-- Create enum for project status
CREATE TYPE project_status AS ENUM ('open', 'in_progress', 'in_review', 'completed', 'cancelled');

-- Create enum for deliverable status
CREATE TYPE deliverable_status AS ENUM ('pending', 'submitted', 'approved', 'revision_requested');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[],
  hourly_rate DECIMAL(10,2),
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(10,2),
  status project_status DEFAULT 'open',
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create deliverables table
CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  status deliverable_status DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  feedback TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Clients can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = client_id
  );

CREATE POLICY "Clients can update their projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Freelancers can update assigned projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = freelancer_id);

-- Deliverables policies
CREATE POLICY "Project members can view deliverables"
  ON deliverables FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = deliverables.project_id
      AND (projects.client_id = auth.uid() OR projects.freelancer_id = auth.uid())
    )
  );

CREATE POLICY "Freelancers can create deliverables"
  ON deliverables FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = freelancer_id);

CREATE POLICY "Freelancers can update their deliverables"
  ON deliverables FOR UPDATE
  TO authenticated
  USING (auth.uid() = freelancer_id);

CREATE POLICY "Clients can update deliverable status"
  ON deliverables FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = deliverables.project_id
      AND projects.client_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Project members can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = messages.project_id
      AND (projects.client_id = auth.uid() OR projects.freelancer_id = auth.uid())
    )
  );

CREATE POLICY "Project members can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = messages.project_id
      AND (projects.client_id = auth.uid() OR projects.freelancer_id = auth.uid())
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = messages.project_id
      AND (projects.client_id = auth.uid() OR projects.freelancer_id = auth.uid())
    )
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Invoices policies
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = freelancer_id);

CREATE POLICY "Clients can create invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id);

-- Create storage bucket for deliverables
INSERT INTO storage.buckets (id, name, public)
VALUES ('deliverables', 'deliverables', false);

-- Storage policies
CREATE POLICY "Users can upload deliverables"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'deliverables' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own deliverables"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'deliverables' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Project members can view deliverables"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'deliverables');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;