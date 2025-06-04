-- Create jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    market_id INT NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    modality TEXT NOT NULL CHECK (modality IN ('remote', 'hybrid', 'on-site')),
    location TEXT, -- Nullable if modality is 'remote'
    employment_type TEXT NOT NULL CHECK (employment_type IN ('full-time', 'freelance', 'internship', 'project-based')),
    contact_info TEXT NOT NULL,
    publisher_name TEXT NOT NULL,
    publisher_position TEXT,
    publisher_company TEXT,
    authorized_to_publish BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the jobs table
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view all jobs
CREATE POLICY "Authenticated users can view all jobs"
ON jobs FOR SELECT
TO authenticated
USING (true);

-- Policy for authenticated users to create jobs
CREATE POLICY "Authenticated users can create jobs"
ON jobs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND authorized_to_publish = true);

-- Policy for job owners to update their own jobs
CREATE POLICY "Job owners can update their own jobs"
ON jobs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for job owners to delete their own jobs
CREATE POLICY "Job owners can delete their own jobs"
ON jobs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
