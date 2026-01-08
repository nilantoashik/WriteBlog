# 🚀 Supabase Setup Guide for WriteBlog

Your blog now supports **Supabase** database! Follow these steps to set it up.

## Current Status
✅ All files have been updated with Supabase support
✅ Database adapter created (works with both Supabase and localStorage)
✅ Authentication ready for Supabase
✅ Automatic fallback to localStorage if Supabase not configured

---

## Step 1: Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub or email
4. Click **"New Project"**
5. Fill in:
   - **Name:** WriteBlog
   - **Database Password:** (save this password!)
   - **Region:** Choose closest to you
   - **Plan:** Free
6. Click **"Create new project"** (takes ~2 minutes)

---

## Step 2: Get Your Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

---

## Step 3: Update Configuration

1. Open `supabase-config.js` in your project
2. Replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## Step 4: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Paste this SQL and click **"Run"**:

```sql
-- Create users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    bio TEXT DEFAULT 'No bio yet',
    avatar TEXT,
    cover_photo TEXT,
    theme TEXT DEFAULT 'blue',
    social_provider TEXT,
    following JSONB DEFAULT '[]'::jsonb,
    followers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE posts (
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

-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('posts', 'posts', true);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view all profiles"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid()::text = id::text);

-- Create policies for posts table
CREATE POLICY "Anyone can view posts"
    ON posts FOR SELECT
    USING (true);

CREATE POLICY "Users can create posts"
    ON posts FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own posts"
    ON posts FOR UPDATE
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own posts"
    ON posts FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- Create storage policies
CREATE POLICY "Anyone can view avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view covers"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'covers');

CREATE POLICY "Authenticated users can upload covers"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'covers' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view post images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload post images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');
```

---

## Step 5: Enable Social Login (Optional)

### For Google Login:
1. Go to **Authentication** → **Providers**
2. Click **Google**
3. Enable it
4. Add your **Client ID** and **Client Secret** from [Google Cloud Console](https://console.cloud.google.com)
5. Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### For GitHub Login:
1. Go to **Authentication** → **Providers**
2. Click **GitHub**
3. Enable it
4. Add your **Client ID** and **Client Secret** from [GitHub OAuth Apps](https://github.com/settings/developers)
5. Add callback URL: `https://your-project.supabase.co/auth/v1/callback`

---

## Step 6: Test It!

1. Open your blog: `login.html`
2. Create an account
3. Check Supabase dashboard → **Table Editor** → **users** (your account should appear!)
4. Create a post
5. Check **Table Editor** → **posts** (your post should appear!)

---

## ✅ You're Done!

Your blog now uses a real database! 

### What Works Now:
- ✓ Real-time data across devices
- ✓ Secure authentication
- ✓ Google/GitHub OAuth login
- ✓ Image storage in cloud
- ✓ Data persists forever (not browser-only)
- ✓ Automatic fallback to localStorage if offline

### Checking Storage Mode:
Open browser console (F12) and look for:
- ✓ `Supabase initialized successfully` = Using Supabase
- ⚠️ `Using localStorage fallback` = Using local storage

---

## Troubleshooting

**Problem:** "Using localStorage fallback"
- **Fix:** Update credentials in `supabase-config.js`

**Problem:** "Failed to initialize Supabase"
- **Fix:** Check your internet connection and credentials

**Problem:** Can't create posts
- **Fix:** Make sure you ran the SQL queries in Step 4

**Problem:** Images not uploading
- **Fix:** Check that storage buckets were created in Step 4

---

## Free Tier Limits

- ✓ 500MB database
- ✓ 1GB file storage  
- ✓ 50,000 monthly active users
- ✓ 2GB bandwidth per month

**More than enough for a personal blog!**

---

Need help? Check [Supabase Docs](https://supabase.com/docs) or ask me!
