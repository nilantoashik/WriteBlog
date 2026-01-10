// ========================================
// Data Storage and State Management
// ========================================

let currentUser = null;
let viewingUser = null; // user currently being viewed on profile page
let allUsers = [];
let allPosts = [];

// Username utilities
function normalizeUsernameInput(value, fallback = 'user') {
    const base = (value || fallback || 'user')
        .toLowerCase()
        .replace(/[^a-z0-9._]/g, '')
        .replace(/\.{2,}/g, '.')
        .replace(/_{2,}/g, '_')
        .replace(/^\.+|\.+$/g, '')
        .replace(/^_+|_+$/g, '');
    return base.length >= 3 ? base : `${base}user`.slice(0, Math.max(3, base.length + 4));
}

function generateUniqueUsername(base, excludeUserId = null) {
    let candidate = base || 'user';
    let counter = 1;
    while (allUsers.some(u => u.username === candidate && u.id !== excludeUserId)) {
        candidate = `${base}${counter}`;
        counter += 1;
    }
    return candidate;
}

function ensureUserHasUsername(user) {
    const normalized = normalizeUsernameInput(user.username || user.name || 'user');
    user.username = generateUniqueUsername(normalized, user.id);
    return user;
}

// Initialize data from localStorage
function initializeData() {
    // Primary keys
    let storedUsers = localStorage.getItem('blogUsers');
    const storedPosts = localStorage.getItem('blogPosts');
    const storedCurrentUser = localStorage.getItem('currentUser');

    // Migrate from legacy key 'users' if present
    if (!storedUsers) {
        const legacyUsers = localStorage.getItem('users');
        if (legacyUsers) {
            storedUsers = legacyUsers;
            localStorage.setItem('blogUsers', legacyUsers);
            localStorage.removeItem('users');
        }
    }
    
    try {
        if (storedUsers) {
            allUsers = JSON.parse(storedUsers).map(u => ensureUserHasUsername(u));
        }
    } catch (e) {
        console.warn('Resetting users due to parse error', e.message);
        allUsers = [];
        localStorage.removeItem('blogUsers');
    }
    
    try {
        if (storedPosts) {
            allPosts = JSON.parse(storedPosts);
        }
    } catch (e) {
        console.warn('Resetting posts due to parse error', e.message);
        allPosts = [];
        localStorage.removeItem('blogPosts');
    }
    
    try {
        if (storedCurrentUser) {
            currentUser = ensureUserHasUsername(JSON.parse(storedCurrentUser));
        }
    } catch (e) {
        console.warn('Resetting currentUser due to parse error', e.message);
        currentUser = null;
        localStorage.removeItem('currentUser');
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('blogUsers', JSON.stringify(allUsers));
    localStorage.setItem('blogPosts', JSON.stringify(allPosts));
    if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
}

// Save and set current user
function saveCurrentUser(user) {
    currentUser = ensureUserHasUsername(user);
    saveData();
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get default avatar
function getDefaultAvatar(name) {
    const colors = ['4A90E2', '2ECC71', '9B59B6', 'E67E22', 'E74C3C'];
    const initial = name ? name[0].toUpperCase() : '?';
    const color = colors[Math.floor(Math.random() * colors.length)];
    return `https://ui-avatars.com/api/?name=${initial}&background=${color}&color=fff&size=200`;
}

// ========================================
// Authentication Functions
// ========================================

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const user = allUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        saveData();
        showNotification('Welcome back, ' + user.name + '!', 'success');
        setTimeout(() => {
            window.location.href = 'feed.html';
        }, 500);
    } else {
        showNotification('Invalid email or password', 'error');
    }
}

function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('regName').value;
    const usernameInput = document.getElementById('regUsername')?.value || '';
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const bio = document.getElementById('regBio').value;
    
    // Check if email already exists
    if (allUsers.find(u => u.email === email)) {
        showNotification('Email already registered', 'error');
        return;
    }
    
    const normalizedUsername = normalizeUsernameInput(usernameInput || name);
    if (allUsers.some(u => u.username === normalizedUsername)) {
        showNotification('Username already taken', 'error');
        return;
    }
    const newUser = {
        id: generateId(),
        name: name,
        username: normalizedUsername,
        email: email,
        password: password,
        bio: bio || 'No bio yet',
        avatar: getDefaultAvatar(name),
        following: [],
        followers: [],
        theme: 'blue',
        createdAt: new Date().toISOString()
    };
    
    allUsers.push(newUser);
    currentUser = newUser;
    saveData();
    showNotification('Account created successfully!', 'success');
    setTimeout(() => {
        window.location.href = 'feed.html';
    }, 500);
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showNotification('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    }
}

// Social Login Handler
async function handleSocialLogin(provider) {
    try {
        // Check if Supabase is configured and initialized
        const hasSupabase = (typeof isSupabaseConfigured !== 'undefined' && isSupabaseConfigured()) && 
                           (typeof supabase !== 'undefined' && supabase !== null);
        
        if (!hasSupabase) {
            // Fallback to simulated login
            const providerNames = {
                'google': 'Google',
                'github': 'GitHub'
            };
            
            const providerName = providerNames[provider];
            const userName = prompt(`Enter your name for ${providerName} login:`);
            
            if (!userName) {
                showNotification('Login cancelled', 'info');
                return;
            }
            
            const userEmail = prompt(`Enter your email for ${providerName} login:`);
            
            if (!userEmail || !userEmail.includes('@')) {
                showNotification('Valid email required', 'error');
                return;
            }
            
            // Check if user already exists
            let user = allUsers.find(u => u.email === userEmail);
            
            if (!user) {
                // Create new user via social login
                const normalizedUsername = generateUniqueUsername(normalizeUsernameInput(userName, userName));
                user = {
                    id: generateId(),
                    name: userName,
                    username: normalizedUsername,
                    email: userEmail,
                    password: generateId(), // Random password for social accounts
                    bio: `Joined via ${providerName}`,
                    avatar: getDefaultAvatar(userName),
                    following: [],
                    followers: [],
                    theme: 'blue',
                    socialProvider: provider,
                    createdAt: new Date().toISOString()
                };
                
                allUsers.push(user);
            }
            
            // Save and login (use primary storage keys)
            currentUser = user;
            saveData();
            
            showNotification(`Welcome, ${user.name}!`, 'success');
            
            setTimeout(() => {
                window.location.href = 'feed.html';
            }, 500);
            return;
        }
        
        // Use real Supabase OAuth - check if providers are enabled
        console.log('Starting OAuth flow for:', provider);
        showNotification('Redirecting to ' + provider + '...', 'info');
        
        let result;
        if (provider === 'google') {
            result = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/feed.html'
                }
            });
        } else if (provider === 'github') {
            result = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: window.location.origin + '/feed.html'
                }
            });
        }
        
        if (result && result.error) {
            throw result.error;
        }
        
        // OAuth will redirect, so this code may not execute
        console.log('OAuth initiated successfully');
        
    } catch (error) {
        console.error('Social login error:', error);
        let errorMsg = 'Social login failed. ';
        
        // Provide more specific error messages
        if (error.message) {
            if (error.message.includes('not enabled')) {
                errorMsg = 'This OAuth provider is not enabled in Supabase. Please enable it in your Supabase dashboard under Authentication → Providers.';
            } else if (error.message.includes('redirect')) {
                errorMsg = 'OAuth redirect URL not configured. Please add ' + window.location.origin + ' to allowed URLs in Supabase.';
            } else {
                errorMsg += error.message;
            }
        } else {
            errorMsg += 'Please check Supabase OAuth configuration.';
        }
        
        showNotification(errorMsg, 'error');
    }
}

function showApp() {
    const authSection = document.getElementById('authSection');
    const appSection = document.getElementById('appSection');
    
    if (authSection) authSection.style.display = 'none';
    if (appSection) appSection.style.display = 'block';
    
    // Apply user theme
    document.body.className = 'theme-' + (currentUser?.theme || 'blue');
    
    // Update navigation user info
    const navUserName = document.getElementById('navUserName');
    const navUserAvatar = document.getElementById('navUserAvatar');
    if (navUserName) navUserName.textContent = currentUser.name;
    if (navUserAvatar) navUserAvatar.src = currentUser.avatar;
    
    // Update sidebar user info
    updateSidebarInfo();
    
    // Load feed by default
    showFeed();
}

// ========================================
// Navigation Functions
// ========================================

function setActiveNav(section) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    const sectionElement = document.getElementById(section);
    if (sectionElement) {
        sectionElement.style.display = 'block';
    }
}

function showFeed() {
    const feedSection = document.getElementById('feedSection');
    if (feedSection) {
        setActiveNav('feedSection');
        const navLink = document.querySelector('[onclick="showFeed()"]');
        if (navLink) navLink.classList.add('active');
        loadFeed();
    } else {
        // Navigate to feed page if not on single-page app
        window.location.href = 'feed.html';
    }
}

function showExplore() {
    const exploreSection = document.getElementById('exploreSection');
    if (exploreSection) {
        setActiveNav('exploreSection');
        const navLink = document.querySelector('[onclick="showExplore()"]');
        if (navLink) navLink.classList.add('active');
        loadExplore();
    } else {
        window.location.href = 'explore.html';
    }
}

function showCreatePost() {
    // Open the create post modal instead of navigating to a section
    const modal = document.getElementById('createPostModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } else {
        console.error('Create post modal not found');
    }
}

function showProfile() {
    const profileSection = document.getElementById('profileSection');
    if (profileSection) {
        setActiveNav('profileSection');
        const navLink = document.querySelector('[onclick="showProfile()"]');
        if (navLink) navLink.classList.add('active');
        loadProfile();
    } else {
        window.location.href = 'profile.html';
    }
}

// ========================================
// Feed Functions
// ========================================

function loadFeed() {
    const feedContainer = document.getElementById('feedPosts');
    if (!feedContainer) return;
    
    // Get posts from followed users and own posts
    const followingIds = [...currentUser.following, currentUser.id];
    const feedPosts = allPosts
        .filter(post => followingIds.includes(post.userId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (feedPosts.length === 0) {
        feedContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                <i class="fas fa-rss" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
                <h3>Your feed is empty</h3>
                <p>Follow other users to see their posts here, or create your first post!</p>
                <button class="btn btn-primary" onclick="showExplore()" style="margin-top: 20px;">Explore Users</button>
            </div>
        `;
        return;
    }
    
    feedContainer.innerHTML = feedPosts.map(post => createPostCard(post)).join('');
}

function createPostCard(post) {
    const author = allUsers.find(u => u.id === post.userId);
    if (!author) return '';
    
    const postDate = new Date(post.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    return `
        <div class="post-card">
            <div class="post-header">
                <img src="${author.avatar}" alt="${author.name}" class="post-avatar">
                <div class="post-author-info">
                    <span class="post-author-name">${author.name}</span>
                    <span class="post-date">${postDate}</span>
                </div>
            </div>
            <h3 class="post-title">${post.title}</h3>
            <p class="post-content">${post.content}</p>
            ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image" onerror="this.style.display='none'">` : ''}
            ${post.link ? `<a href="${post.link}" target="_blank" class="post-link"><i class="fas fa-external-link-alt"></i> Visit Link</a>` : ''}
            ${post.tags && post.tags.length > 0 ? `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag">#${tag.trim()}</span>`).join('')}
                </div>
            ` : ''}
            <div class="post-actions">
                <div class="post-action">
                    <i class="fas fa-heart"></i>
                    <span>Like</span>
                </div>
                <div class="post-action">
                    <i class="fas fa-comment"></i>
                    <span>Comment</span>
                </div>
                <div class="post-action">
                    <i class="fas fa-share"></i>
                    <span>Share</span>
                </div>
                ${post.userId === currentUser.id ? `
                    <div class="post-action" onclick="deletePost('${post.id}')">
                        <i class="fas fa-trash"></i>
                        <span>Delete</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ========================================
// Explore Functions
// ========================================

function loadExplore() {
    const exploreContainer = document.getElementById('exploreUsers');
    if (!exploreContainer) return;
    
    // Show all users except current user
    const otherUsers = allUsers.filter(u => u.id !== currentUser.id);
    
    if (otherUsers.length === 0) {
        exploreContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-muted); grid-column: 1/-1;">
                <i class="fas fa-users" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
                <h3>No users to explore yet</h3>
                <p>You're the first one here! Share your blog with others.</p>
            </div>
        `;
        return;
    }
    
    exploreContainer.innerHTML = otherUsers.map(user => createUserCard(user)).join('');
}

function createUserCard(user) {
    const isFollowing = currentUser.following.includes(user.id);
    const userPosts = allPosts.filter(p => p.userId === user.id).length;
    
    return `
        <div class="user-card">
            <img src="${user.avatar}" alt="${user.name}" class="user-card-avatar">
            <h3 class="user-card-name">${user.name}</h3>
            <p class="user-card-handle">@${user.username}</p>
            <p class="user-card-bio">${user.bio}</p>
            <div class="user-card-stats">
                <div class="user-stat">
                    <span class="user-stat-number">${userPosts}</span>
                    <span class="user-stat-label">Posts</span>
                </div>
                <div class="user-stat">
                    <span class="user-stat-number">${user.followers.length}</span>
                    <span class="user-stat-label">Followers</span>
                </div>
                <div class="user-stat">
                    <span class="user-stat-number">${user.following.length}</span>
                    <span class="user-stat-label">Following</span>
                </div>
            </div>
            <div class="user-card-actions">
                <button class="btn btn-secondary" onclick="viewUserProfile('${user.id}')">
                    <i class="fas fa-user"></i>
                    <span>View Profile</span>
                </button>
                <button class="btn ${isFollowing ? 'btn-following' : 'btn-primary'} btn-follow" 
                        onclick="toggleFollow('${user.id}')">
                    ${isFollowing ? 'Following' : 'Follow'}
                </button>
            </div>
        </div>
    `;
}

function searchUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const otherUsers = allUsers.filter(u => u.id !== currentUser.id);
    
    const filteredUsers = otherUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.bio.toLowerCase().includes(searchTerm) ||
        (`@${user.username}`).toLowerCase().includes(searchTerm)
    );
    
    const exploreContainer = document.getElementById('exploreUsers');
    if (!exploreContainer) return;
    
    if (filteredUsers.length === 0) {
        exploreContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-muted); grid-column: 1/-1;">
                <i class="fas fa-search" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
                <h3>No users found</h3>
                <p>Try searching with a different term.</p>
            </div>
        `;
        return;
    }
    
    exploreContainer.innerHTML = filteredUsers.map(user => createUserCard(user)).join('');
}

function toggleFollow(userId) {
    const targetUser = allUsers.find(u => u.id === userId);
    if (!targetUser) return;
    
    const isFollowing = currentUser.following.includes(userId);
    
    if (isFollowing) {
        // Unfollow
        currentUser.following = currentUser.following.filter(id => id !== userId);
        targetUser.followers = targetUser.followers.filter(id => id !== currentUser.id);
        showNotification('Unfollowed ' + targetUser.name, 'success');
    } else {
        // Follow
        currentUser.following.push(userId);
        targetUser.followers.push(currentUser.id);
        showNotification('Now following ' + targetUser.name, 'success');
    }
    
    saveData();
    loadExplore();
}

// ========================================
// Create Post Functions
// ========================================

function handleCreatePost(event) {
    event.preventDefault();
    
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const image = document.getElementById('postImage').value;
    const link = document.getElementById('postLink').value;
    const tags = document.getElementById('postTags').value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    
    const newPost = {
        id: generateId(),
        userId: currentUser.id,
        title: title,
        content: content,
        image: image,
        link: link,
        tags: tags,
        createdAt: new Date().toISOString()
    };
    
    allPosts.unshift(newPost);
    saveData();
    
    clearPostForm();
    showNotification('Post published successfully!', 'success');
    showFeed();
}

// Make handleCreatePost globally accessible
window.handleCreatePost = handleCreatePost;

function clearPostForm() {
    const postTitle = document.getElementById('postTitle');
    const postContent = document.getElementById('postContent');
    const postImage = document.getElementById('postImage');
    const postLink = document.getElementById('postLink');
    const postTags = document.getElementById('postTags');
    const tagInput = document.getElementById('tagInput');
    
    if (postTitle) postTitle.value = '';
    if (postContent) postContent.value = '';
    if (postImage) postImage.value = '';
    if (postLink) postLink.value = '';
    if (postTags) postTags.value = '';
    if (tagInput) tagInput.value = '';
}

function loadProfile() {
    // Determine which user to view (supports profile.html?user=<id>)
    const params = new URLSearchParams(window.location.search);
    const userIdParam = params.get('user');
    viewingUser = currentUser;
    if (userIdParam) {
        const found = allUsers.find(u => u.id === userIdParam);
        if (found) viewingUser = found;
    }
    const isOwnProfile = viewingUser.id === currentUser.id;

    // Apply theme
    document.body.className = 'theme-blue';
    
    // Update nav info (check if elements exist first)
    const navUserName = document.getElementById('navUserName');
    const navUserAvatar = document.getElementById('navUserAvatar');
    const mobileUserAvatar = document.getElementById('mobileUserAvatar');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserEmail = document.getElementById('sidebarUserEmail');
    const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
    
    if (navUserName) navUserName.textContent = currentUser.name;
    if (navUserAvatar) navUserAvatar.src = currentUser.avatar;
    if (mobileUserAvatar) mobileUserAvatar.src = currentUser.avatar;
    if (sidebarUserName) sidebarUserName.textContent = currentUser.name;
    if (sidebarUserEmail) sidebarUserEmail.textContent = currentUser.email;
    if (sidebarUserAvatar) sidebarUserAvatar.src = currentUser.avatar;

    // Profile header for viewed user
    const profileName = document.getElementById('profileName');
    const profileHandle = document.getElementById('profileHandle');
    const profileEmail = document.getElementById('profileEmail');
    const profileBio = document.getElementById('profileBio');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileCover = document.getElementById('profileCover');
    const profileCoverImage = document.getElementById('profileCoverImage');
    
    if (profileName) profileName.textContent = viewingUser.name;
    if (profileHandle) profileHandle.textContent = '@' + viewingUser.username;
    if (profileEmail) profileEmail.textContent = viewingUser.email || '';
    if (profileBio) profileBio.textContent = viewingUser.bio;
    if (profileAvatar) profileAvatar.src = viewingUser.avatar;
    
    if (profileCover) profileCover.style.display = viewingUser.coverPhoto ? 'none' : 'block';
    if (profileCoverImage) {
        profileCoverImage.style.display = viewingUser.coverPhoto ? 'block' : 'none';
        profileCoverImage.style.backgroundImage = viewingUser.coverPhoto ? `url(${viewingUser.coverPhoto})` : 'none';
        if (viewingUser.coverPhoto) {
            profileCoverImage.style.backgroundSize = 'cover';
            profileCoverImage.style.backgroundPosition = 'center';
        } else {
            profileCoverImage.style.backgroundImage = '';
        }
    }
    
    // Update stats
    const userPosts = allPosts.filter(p => p.userId === viewingUser.id);
    const postCount = document.getElementById('postCount');
    const followerCount = document.getElementById('followerCount');
    const followingCount = document.getElementById('followingCount');
    
    if (postCount) postCount.textContent = userPosts.length;
    if (followerCount) followerCount.textContent = viewingUser.followers.length;
    if (followingCount) followingCount.textContent = viewingUser.following.length;
    
    // Toggle profile actions (edit vs follow)
    const editBtn = document.getElementById('editProfileButton');
    const followBtn = document.getElementById('profileFollowButton');
    if (editBtn && followBtn) {
        if (isOwnProfile) {
            editBtn.style.display = 'inline-flex';
            followBtn.style.display = 'none';
        } else {
            editBtn.style.display = 'none';
            followBtn.style.display = 'inline-flex';
            const isFollowing = currentUser.following.includes(viewingUser.id);
            followBtn.className = `btn ${isFollowing ? 'btn-following' : 'btn-primary'}`;
            const icon = followBtn.querySelector('i');
            const label = followBtn.querySelector('span');
            if (icon && label) {
                icon.className = isFollowing ? 'fas fa-user-check' : 'fas fa-user-plus';
                label.textContent = isFollowing ? 'Following' : 'Follow';
            }
        }
    }
    
    // Load user's posts
    const userPostsContainer = document.getElementById('userPosts');
    if (!userPostsContainer) return;
    
    if (userPosts.length === 0) {
        userPostsContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                <i class="fas fa-pen" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
                <h3>No posts yet</h3>
                <p>${isOwnProfile ? 'Start sharing your thoughts with the world!' : 'This user has not posted yet.'}</p>
                ${isOwnProfile ? '<button class="btn btn-primary" onclick="showCreatePost()" style="margin-top: 20px;">Create Post</button>' : ''}
            </div>
        `;
        return;
    }
    
    const sortedPosts = userPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    userPostsContainer.innerHTML = sortedPosts.map(post => createPostCard(post)).join('');
}

function handleProfileFollow() {
    if (!viewingUser || viewingUser.id === currentUser.id) return;
    toggleFollow(viewingUser.id);
    loadProfile();
}

function viewUserProfile(userId) {
    window.location.href = `profile.html?user=${userId}`;
}
window.handleProfileFollow = handleProfileFollow;
window.viewUserProfile = viewUserProfile;

function showEditProfile() {
    const modal = document.getElementById('editProfileModal');
    const editName = document.getElementById('editName');
    const editUsername = document.getElementById('editUsername');
    const editBio = document.getElementById('editBio');
    const editAvatar = document.getElementById('editAvatar');
    const editAvatarPreview = document.getElementById('editAvatarPreview');
    const editCover = document.getElementById('editCover');
    const editCoverPreview = document.getElementById('editCoverPreview');
    
    if (modal) modal.style.display = 'flex';
    if (editName) editName.value = currentUser.name;
    if (editUsername) editUsername.value = currentUser.username;
    if (editBio) editBio.value = currentUser.bio;
    if (editAvatar) editAvatar.value = currentUser.avatar;
    if (editAvatarPreview) editAvatarPreview.src = currentUser.avatar;
    
    // Set cover photo
    if (currentUser.coverPhoto) {
        if (editCover) editCover.value = currentUser.coverPhoto;
        if (editCoverPreview) editCoverPreview.style.backgroundImage = `url(${currentUser.coverPhoto})`;
    }
}

function handleCoverUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Cover image size should be less than 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;
        currentUser.coverPhoto = base64Image;
        const profileCoverImage = document.getElementById('profileCoverImage');
        if (profileCoverImage) {
            profileCoverImage.style.backgroundImage = `url(${base64Image})`;
            profileCoverImage.style.backgroundSize = 'cover';
            profileCoverImage.style.backgroundPosition = 'center';
        }
        saveData();
        showNotification('Cover photo updated!', 'success');
    };
    reader.readAsDataURL(file);
}

function handleCoverModalUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Cover image size should be less than 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;
        const editCoverPreview = document.getElementById('editCoverPreview');
        const editCover = document.getElementById('editCover');
        if (editCoverPreview) editCoverPreview.style.backgroundImage = `url(${base64Image})`;
        if (editCover) editCover.value = base64Image;
        showNotification('Cover image uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error');
        return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showNotification('Image size should be less than 2MB', 'error');
        return;
    }
    
    // Read file and convert to base64
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;
        const editAvatarPreview = document.getElementById('editAvatarPreview');
        const editAvatar = document.getElementById('editAvatar');
        if (editAvatarPreview) editAvatarPreview.src = base64Image;
        if (editAvatar) editAvatar.value = base64Image;
        showNotification('Image uploaded successfully!', 'success');
    };
    reader.onerror = function() {
        showNotification('Error reading image file', 'error');
    };
    reader.readAsDataURL(file);
}

function closeEditProfile() {
    const modal = document.getElementById('editProfileModal');
    if (modal) modal.style.display = 'none';
}

function handleUpdateProfile(event) {
    event.preventDefault();
    
    const newName = document.getElementById('editName').value;
    const newUsernameInput = document.getElementById('editUsername')?.value || '';
    const newBio = document.getElementById('editBio').value;
    const newAvatar = document.getElementById('editAvatar').value;
    const newCover = document.getElementById('editCover').value;

    const normalizedUsername = normalizeUsernameInput(newUsernameInput || newName);
    if (normalizedUsername.length < 3) {
        showNotification('Username must be at least 3 characters', 'error');
        return;
    }
    if (allUsers.some(u => u.username === normalizedUsername && u.id !== currentUser.id)) {
        showNotification('Username already taken', 'error');
        return;
    }
    
    currentUser.name = newName;
    currentUser.username = normalizedUsername;
    currentUser.bio = newBio;
    if (newAvatar) {
        currentUser.avatar = newAvatar;
    }
    if (newCover) {
        currentUser.coverPhoto = newCover;
    }
    currentUser.theme = 'blue'; // Always use Ocean Blue
    
    saveData();
    closeEditProfile();
    
    // Apply Ocean Blue theme
    document.body.className = 'theme-blue';
    
    // Update UI (check if elements exist first)
    const navUserName = document.getElementById('navUserName');
    const navUserAvatar = document.getElementById('navUserAvatar');
    if (navUserName) navUserName.textContent = newName;
    if (navUserAvatar) navUserAvatar.src = currentUser.avatar;
    
    // Update sidebar info
    updateSidebarInfo();
    
    loadProfile();
    showNotification('Profile updated successfully!', 'success');
}

// Update avatar preview when URL input changes
function updateAvatarPreviewFromUrl() {
    const urlInput = document.getElementById('editAvatar');
    const preview = document.getElementById('editAvatarPreview');
    if (urlInput && preview && urlInput.value) {
        preview.src = urlInput.value;
    }
}

// ========================================
// Utility Functions
// ========================================

function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.classList.add('hiding');
        setTimeout(() => existing.remove(), 300);
    }
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${icons[type] || icons.info}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('hiding');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Close modal when clicking outside
window.onclick = function(event) {
    const editModal = document.getElementById('editProfileModal');
    const createModal = document.getElementById('createPostModal');
    
    if (event.target === editModal) {
        closeEditProfile();
    }
    if (event.target === createModal) {
        closeCreatePost();
    }
};

// ========================================
// Initialize App
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeData();
    
    // If no current user, show auth
    if (!currentUser) {
        document.getElementById('authSection').style.display = 'flex';
        document.getElementById('appSection').style.display = 'none';
    }
});

// Add some demo data if database is empty
if (allUsers.length === 0) {
    // Create demo users
    const demoUsers = [
        {
            id: generateId(),
            name: 'Sarah Johnson',
            username: 'sarahjohnson',
            email: 'sarah@example.com',
            password: 'demo123',
            bio: 'Travel blogger & photographer 📸 | Exploring the world one destination at a time',
            avatar: getDefaultAvatar('Sarah Johnson'),
            following: [],
            followers: [],
            theme: 'blue',
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: generateId(),
            name: 'Mike Chen',
            username: 'mikechen',
            email: 'mike@example.com',
            password: 'demo123',
            bio: 'Tech enthusiast | Software developer | Coffee addict ☕',
            avatar: getDefaultAvatar('Mike Chen'),
            following: [],
            followers: [],
            theme: 'purple',
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: generateId(),
            name: 'Emma Davis',
            username: 'emmadavis',
            email: 'emma@example.com',
            password: 'demo123',
            bio: 'Wellness coach | Yoga instructor 🧘‍♀️ | Living mindfully',
            avatar: getDefaultAvatar('Emma Davis'),
            following: [],
            followers: [],
            theme: 'green',
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    allUsers = demoUsers;
    
    // Create demo posts
    const demoPosts = [
        {
            id: generateId(),
            userId: demoUsers[0].id,
            title: 'Amazing Sunset in Santorini',
            content: 'Just witnessed the most breathtaking sunset in Santorini! The way the sun dips into the Aegean Sea, painting the white-washed buildings in golden hues, is simply magical. If you ever get a chance to visit Greece, this island should be on top of your list!',
            image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800',
            link: '',
            tags: ['travel', 'greece', 'photography'],
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: generateId(),
            userId: demoUsers[1].id,
            title: 'Getting Started with Web Development',
            content: 'Are you interested in learning web development? Here are my top 5 tips for beginners: 1) Start with HTML & CSS basics 2) Learn JavaScript fundamentals 3) Build small projects 4) Join coding communities 5) Never stop learning! Remember, everyone starts somewhere. The key is consistency and practice.',
            image: '',
            link: 'https://developer.mozilla.org',
            tags: ['tech', 'webdev', 'learning'],
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: generateId(),
            userId: demoUsers[2].id,
            title: 'Morning Meditation Routine',
            content: 'Starting your day with meditation can transform your entire day. I practice for just 10 minutes each morning, focusing on breath awareness and gratitude. The mental clarity and peace I feel afterwards carries me through even the busiest days. What\'s your morning routine like?',
            image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
            link: '',
            tags: ['wellness', 'meditation', 'mindfulness'],
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    allPosts = demoPosts;
    saveData();
}

// ========================================
// Professional Enhancements
// ========================================

// Hide loading screen
window.addEventListener('load', () => {
    const loading = document.getElementById('loadingScreen');
    if (loading) {
        setTimeout(() => {
            loading.classList.add('hidden');
            setTimeout(() => loading.style.display = 'none', 350);
        }, 500);
    }
});

// Mobile menu toggle
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

// Enhanced navigation with active states (overrides earlier simpler version)
function setActiveNav(sectionId) {
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.mobile-nav-link').forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(sec => sec.style.display = 'none');
    
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) sectionElement.style.display = 'block';
    
    const targetLink = document.querySelector(`[onclick*="${sectionId.replace('Section', '')}"]`);
    if (targetLink) targetLink.classList.add('active');
}

// Trending posts
function showTrending() {
    setActiveNav('trendingSection');
    const container = document.getElementById('trendingPosts');
    if (!container) return;
    
    const sortedPosts = [...allPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
    if (sortedPosts.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);"><i class="fas fa-fire" style="font-size:64px;margin-bottom:20px;opacity:0.3;"></i><h3>No trending posts yet</h3><p>Be the first to create content!</p></div>';
    } else {
        container.innerHTML = sortedPosts.map(post => createPostCard(post)).join('');
    }
}

// Bookmarks functionality
let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');

function showBookmarks() {
    setActiveNav('bookmarksSection');
    const container = document.getElementById('bookmarksPosts');
    if (!container) return;
    
    const bookmarkedPosts = allPosts.filter(p => bookmarks.includes(p.id));
    if (bookmarkedPosts.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);"><i class="fas fa-bookmark" style="font-size:64px;margin-bottom:20px;opacity:0.3;"></i><h3>No bookmarks yet</h3><p>Save posts to read them later!</p></div>';
    } else {
        container.innerHTML = bookmarkedPosts.map(post => createPostCard(post)).join('');
    }
}

// Feed filtering
let currentFilter = 'all';
function filterFeed(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    loadFeed();
}

// User filtering
let currentUserFilter = 'all';
function filterUsers(filter) {
    currentUserFilter = filter;
    document.querySelectorAll('.chip').forEach(chip => chip.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    loadExplore();
}

// Search clear button
function clearSearch() {
    document.getElementById('searchInput').value = '';
    loadExplore();
}

// Enhanced tag input
let currentTags = [];
function handleTagInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = event.target;
        const tag = input.value.trim();
        if (tag && !currentTags.includes(tag)) {
            currentTags.push(tag);
            renderTags();
            input.value = '';
        }
    }
}

function renderTags() {
    const container = document.getElementById('tagsContainer');
    if (!container) return;
    
    container.innerHTML = currentTags.map(tag => `
        <span class="tag-item">
            ${tag}
            <button type="button" onclick="removeTag('${tag}')">
                <i class="fas fa-times"></i>
            </button>
        </span>
    `).join('');
}

function removeTag(tag) {
    currentTags = currentTags.filter(t => t !== tag);
    renderTags();
}

// Make tag functions globally accessible
window.handleTagInput = handleTagInput;
window.renderTags = renderTags;
window.removeTag = removeTag;

// Modal control functions
function openCreatePost() {
    const modal = document.getElementById('createPostModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } else {
        console.error('Create post modal not found');
    }
}

function closeCreatePost() {
    const modal = document.getElementById('createPostModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        clearPostForm();
    }
}

// Make functions globally accessible
window.openCreatePost = openCreatePost;
window.closeCreatePost = closeCreatePost;

// Image preview
function previewImage(urlOrEvent) {
    // Handle both direct URL string and input event
    let url;
    if (typeof urlOrEvent === 'string') {
        url = urlOrEvent;
    } else {
        url = document.getElementById('postImage').value;
    }
    const preview = document.getElementById('imagePreview');
    if (url && preview) {
        preview.style.display = 'block';
        const img = preview.querySelector('img');
        if (img) img.src = url;
    }
}

function removeImagePreview() {
    const postImage = document.getElementById('postImage');
    const imagePreview = document.getElementById('imagePreview');
    if (postImage) postImage.value = '';
    if (imagePreview) imagePreview.style.display = 'none';
}

// Make image functions globally accessible
window.previewImage = previewImage;
window.removeImagePreview = removeImagePreview;

// Character counters
document.addEventListener('DOMContentLoaded', () => {
    const titleInput = document.getElementById('postTitle');
    const contentInput = document.getElementById('postContent');
    
    if (titleInput) {
        titleInput.addEventListener('input', (e) => {
            const count = e.target.value.length;
            const counter = document.getElementById('titleCount');
            if (counter) counter.textContent = count;
        });
    }
    
    if (contentInput) {
        contentInput.addEventListener('input', (e) => {
            const count = e.target.value.length;
            const counter = document.getElementById('contentCount');
            if (counter) counter.textContent = count;
        });
    }
    
    // Password strength indicator
    const passwordInput = document.getElementById('regPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            const strengthBar = document.querySelector('.strength-bar');
            if (strengthBar) {
                const strength = calculatePasswordStrength(password);
                strengthBar.style.width = `${strength}%`;
            }
        });
    }
    
    // Avatar URL input listener
    const avatarUrlInput = document.getElementById('editAvatar');
    if (avatarUrlInput) {
        avatarUrlInput.addEventListener('input', (e) => {
            const preview = document.getElementById('editAvatarPreview');
            if (preview && e.target.value) {
                preview.src = e.target.value;
            }
        });
    }
    
    // Cover URL input listener
    const coverUrlInput = document.getElementById('editCover');
    if (coverUrlInput) {
        coverUrlInput.addEventListener('input', (e) => {
            const preview = document.getElementById('editCoverPreview');
            if (preview && e.target.value) {
                preview.style.backgroundImage = `url(${e.target.value})`;
            }
        });
    }
});

function calculatePasswordStrength(password) {
    let strength = 0;
    if (password.length >= 6) strength += 30;
    if (password.length >= 10) strength += 20;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
}

// Profile tabs
function showProfileTab(tabName, evt) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    // Use passed event or global event
    const targetEvent = evt || event;
    if (targetEvent && targetEvent.target) {
        targetEvent.target.classList.add('active');
    }
    
    const tabElement = document.getElementById(`profile${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`);
    if (tabElement) tabElement.style.display = 'block';
}

// Update sidebar user info
function updateSidebarInfo() {
    if (currentUser) {
        const sidebarUserName = document.getElementById('sidebarUserName');
        const sidebarUserEmail = document.getElementById('sidebarUserEmail');
        const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
        const mobileUserAvatar = document.getElementById('mobileUserAvatar');
        
        if (sidebarUserName) sidebarUserName.textContent = currentUser.name;
        if (sidebarUserEmail) sidebarUserEmail.textContent = currentUser.email;
        if (sidebarUserAvatar) sidebarUserAvatar.src = currentUser.avatar;
        if (mobileUserAvatar) mobileUserAvatar.src = currentUser.avatar;
    }
}

// Delete post function
function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    const postIndex = allPosts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
        allPosts.splice(postIndex, 1);
        saveData();
        showNotification('Post deleted successfully!', 'success');
        
        // Refresh the current view
        if (typeof loadFeed === 'function') loadFeed();
        if (typeof loadProfile === 'function') loadProfile();
    }
}
window.deletePost = deletePost;

// Enhanced handleCreatePost wrapper that includes tags
window.handleCreatePost = function(event) {
    event.preventDefault();
    
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const image = document.getElementById('postImage').value;
    const link = document.getElementById('postLink').value;
    
    const newPost = {
        id: generateId(),
        userId: currentUser.id,
        title: title,
        content: content,
        image: image,
        link: link,
        tags: currentTags,
        createdAt: new Date().toISOString()
    };
    
    allPosts.unshift(newPost);
    saveData();
    
    clearPostForm();
    currentTags = [];
    if (typeof renderTags === 'function') renderTags();
    closeCreatePost();
    showNotification('Post published successfully!', 'success');
    if (typeof loadFeed === 'function') loadFeed();
};

// Enhanced clearPostForm that resets tags and image preview
const originalClearPostFormFn = clearPostForm;
function enhancedClearPostForm() {
    originalClearPostFormFn();
    currentTags = [];
    if (typeof renderTags === 'function') renderTags();
    const preview = document.getElementById('imagePreview');
    if (preview) preview.style.display = 'none';
}
window.clearPostForm = enhancedClearPostForm;

// Export all necessary functions to window for HTML onclick handlers
window.showTrending = showTrending;
window.showBookmarks = showBookmarks;
window.filterFeed = filterFeed;
window.filterUsers = filterUsers;
window.clearSearch = clearSearch;
window.toggleMobileMenu = toggleMobileMenu;
window.showFeed = showFeed;
window.showExplore = showExplore;
window.showProfile = loadProfile;
window.showCreatePost = showCreatePost;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.showEditProfile = showEditProfile;
window.closeEditProfile = closeEditProfile;
window.handleUpdateProfile = handleUpdateProfile;
window.toggleFollow = toggleFollow;
window.searchUsers = searchUsers;
window.handleCoverUpload = handleCoverUpload;
window.handleCoverModalUpload = handleCoverModalUpload;
window.handleAvatarUpload = handleAvatarUpload;
window.showProfileTab = showProfileTab;
window.handleSocialLogin = handleSocialLogin;
window.showLogin = showLogin;
window.showRegister = showRegister;
window.showNotification = showNotification;

console.log('✓ WriteBlog Professional Edition Loaded');
