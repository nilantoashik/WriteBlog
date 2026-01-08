-- WriteBlog Database Setup
-- Run this complete script in Supabase SQL Editor

-- Create posts table (users table already exists)
CREATE TABLE IF NOT EXISTS posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    link TEXT,
    likes JSONB DEFAULT '[]'::jsonb,
    comments JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their profile" ON users;
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- Create policies for users table (allow public access for now)
CREATE POLICY "Users can view all profiles"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their profile"
    ON users FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (true);

-- Create policies for posts table (allow public access for now)
CREATE POLICY "Anyone can view posts"
    ON posts FOR SELECT
    USING (true);

CREATE POLICY "Users can create posts"
    ON posts FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own posts"
    ON posts FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete own posts"
    ON posts FOR DELETE
    USING (true);
