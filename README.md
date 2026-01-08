# WriteBlog 📝

A modern, responsive blog platform with social features built with HTML, CSS, JavaScript, and Supabase.

## ✨ Features

- 🔐 **Authentication**: Email/password + Social login (Google/GitHub)
- 📱 **Responsive Design**: Works perfectly on all devices
- 💾 **Cloud Database**: Supabase backend with localStorage fallback
- 👤 **User Profiles**: Customizable avatars, cover photos, and bios
- 📊 **Analytics**: Track your post engagement
- 🔖 **Bookmarks**: Save your favorite posts
- 🔍 **Explore**: Discover new users and content
- 📈 **Trending**: See what's popular
- 🎨 **Beautiful UI**: Premium gradient design with glassmorphism

## 🚀 Live Demo

Visit: `https://YOUR_USERNAME.github.io/writeblog/login.html` (replace YOUR_USERNAME with your GitHub username)

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Hosting**: GitHub Pages
- **Fonts**: Inter, Playfair Display
- **Icons**: Font Awesome 6.4.0

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/writeblog.git
cd writeblog
```

2. Open `login.html` in your browser or use a local server:
```bash
python -m http.server 8080
```

3. Configure Supabase (optional):
   - Create a Supabase account at [supabase.com](https://supabase.com)
   - Create a new project
   - Update credentials in `supabase-config.js`
   - Follow instructions in `SUPABASE_SETUP.md`

## 🔧 Configuration

### Supabase Setup (Required for Production)

1. Create account and project on [Supabase](https://supabase.com)
2. Get your credentials from Settings → API
3. Update `supabase-config.js`:
```javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```
4. Run SQL queries from `SUPABASE_SETUP.md` to create tables
5. Configure OAuth providers (optional)

### GitHub Pages Deployment

1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: main / (root)
4. Save

Your site will be available at: `https://YOUR_USERNAME.github.io/REPO_NAME/login.html`

## 📁 Project Structure

```
writeblog/
├── login.html          # Login page
├── register.html       # Registration page
├── feed.html          # Home feed
├── explore.html       # User discovery
├── trending.html      # Trending posts
├── bookmarks.html     # Saved posts
├── profile.html       # User profile
├── styles.css         # Main stylesheet
├── script.js          # Core functionality
├── supabase-config.js # Supabase configuration
├── db-adapter.js      # Database adapter
└── SUPABASE_SETUP.md  # Setup guide
```

## 🎨 Features in Detail

### Authentication
- Email/password authentication
- Google OAuth integration
- GitHub OAuth integration
- Persistent sessions

### User Profiles
- Customizable profile avatar
- Cover photo upload
- Bio and personal information
- Follow/unfollow system
- Post analytics

### Content Management
- Create rich text posts
- Add images to posts
- Tag posts
- Like and comment system
- Bookmark posts

### Social Features
- Follow users
- Explore page to discover content
- Trending algorithm
- User search and filtering

## 🔐 Security

- Row Level Security (RLS) in Supabase
- Secure authentication with JWT tokens
- Password hashing (when using Supabase)
- OAuth 2.0 integration

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## 🤝 Contributing

Contributions are welcome! Feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Font Awesome](https://fontawesome.com) - Icons
- [Google Fonts](https://fonts.google.com) - Typography

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

Made with ❤️ by WriteBlog Contributors
