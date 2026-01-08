# 🚀 GitHub Upload Instructions

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and login
2. Click the **"+"** icon (top right) → **"New repository"**
3. Fill in:
   - **Repository name:** `writeblog` (or your preferred name)
   - **Description:** "Modern responsive blog platform with Supabase integration"
   - **Visibility:** Public (required for GitHub Pages)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **"Create repository"**

## Step 2: Push Code to GitHub

Copy and run these commands in PowerShell (replace YOUR_USERNAME with your GitHub username):

```powershell
cd g:\Projects\WriteBlog

# Set your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/writeblog.git

# Rename branch to main (if needed)
git branch -M main

# Push code
git push -u origin main
```

If prompted for credentials:
- **Username:** Your GitHub username
- **Password:** Your GitHub Personal Access Token (not your password!)
  - Get token from: https://github.com/settings/tokens
  - Click "Generate new token (classic)"
  - Select scopes: `repo`
  - Copy and save the token

## Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top navigation)
3. Scroll down and click **Pages** (left sidebar)
4. Under "Source":
   - Branch: **main**
   - Folder: **/ (root)**
5. Click **Save**
6. Wait 2-3 minutes for deployment

## Step 4: Access Your Site

Your site will be available at:
```
https://YOUR_USERNAME.github.io/writeblog/login.html
```

## Step 5: Update Supabase for Production

After your site is live, update OAuth redirect URLs in Supabase:

1. Go to: https://app.supabase.com/project/kyggzxfypudtbmgtemgj/auth/url-configuration

2. Add these URLs:
   - **Site URL:** `https://YOUR_USERNAME.github.io/writeblog`
   - **Redirect URLs:** `https://YOUR_USERNAME.github.io/writeblog/**`

3. Update Google OAuth (if configured):
   - Authorized JavaScript origins: `https://YOUR_USERNAME.github.io`
   - Authorized redirect URIs: `https://kyggzxfypudtbmgtemgj.supabase.co/auth/v1/callback`

4. Update GitHub OAuth (if configured):
   - Homepage URL: `https://YOUR_USERNAME.github.io/writeblog`
   - Authorization callback URL: `https://kyggzxfypudtbmgtemgj.supabase.co/auth/v1/callback`

## 🎉 Done!

Your WriteBlog platform is now live and accessible to everyone!

## 📝 Future Updates

To update your site after making changes:

```powershell
cd g:\Projects\WriteBlog
git add .
git commit -m "Description of changes"
git push
```

GitHub Pages will automatically rebuild (takes 2-3 minutes).

## ⚠️ Important Notes

1. **First page to visit:** Add `/login.html` to the URL
2. **HTTPS:** GitHub Pages provides free SSL automatically
3. **Custom domain:** You can add a custom domain in repository settings
4. **Supabase credentials:** Already configured in your code
5. **Storage:** Uses Supabase cloud database (no GitHub Pages limitations)

## 🔒 Security

Your Supabase credentials are in the code, which is safe because:
- They're "anon public" keys (designed to be public)
- Row Level Security (RLS) protects your data
- Authentication still required for all operations

## 🆘 Troubleshooting

**404 Error?**
- Add `/login.html` to the end of your URL
- Wait 2-3 minutes after enabling Pages

**OAuth not working?**
- Check Supabase redirect URLs are updated
- Check OAuth app settings match new domain

**Styles not loading?**
- Clear browser cache (Ctrl + Shift + R)
- Check repository is public

## 📱 Share Your Site

Share this URL with anyone:
```
https://YOUR_USERNAME.github.io/writeblog/login.html
```

Enjoy your live blog platform! 🎊
