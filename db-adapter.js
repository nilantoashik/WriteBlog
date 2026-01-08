// ========================================
// Database Adapter - Supports both Supabase and localStorage
// ========================================

// Storage mode: 'supabase' or 'localStorage'
let storageMode = 'localStorage';

// Check which storage to use
function getStorageMode() {
    if (typeof supabase !== 'undefined' && supabase && isSupabaseConfigured()) {
        return 'supabase';
    }
    return 'localStorage';
}

// ========================================
// User Operations
// ========================================

async function getAllUsers() {
    if (getStorageMode() === 'supabase') {
        try {
            return await db.getUsers();
        } catch (error) {
            console.error('Supabase error, falling back to localStorage:', error);
            storageMode = 'localStorage';
        }
    }
    
    // localStorage fallback
    const stored = localStorage.getItem('blogUsers');
    return stored ? JSON.parse(stored) : [];
}

async function getUserByEmail(email) {
    if (getStorageMode() === 'supabase') {
        try {
            return await db.getUserByEmail(email);
        } catch (error) {
            console.error('Supabase error:', error);
            storageMode = 'localStorage';
        }
    }
    
    // localStorage fallback
    const users = await getAllUsers();
    return users.find(u => u.email === email);
}

async function createUser(userData) {
    if (getStorageMode() === 'supabase') {
        try {
            return await db.createUser(userData);
        } catch (error) {
            console.error('Supabase error:', error);
            storageMode = 'localStorage';
        }
    }
    
    // localStorage fallback
    const users = await getAllUsers();
    users.push(userData);
    localStorage.setItem('blogUsers', JSON.stringify(users));
    return userData;
}

async function updateUser(userId, updates) {
    if (getStorageMode() === 'supabase') {
        try {
            return await db.updateUser(userId, updates);
        } catch (error) {
            console.error('Supabase error:', error);
            storageMode = 'localStorage';
        }
    }
    
    // localStorage fallback
    const users = await getAllUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        localStorage.setItem('blogUsers', JSON.stringify(users));
        return users[index];
    }
    return null;
}

// ========================================
// Post Operations
// ========================================

async function getAllPosts() {
    if (getStorageMode() === 'supabase') {
        try {
            return await db.getPosts();
        } catch (error) {
            console.error('Supabase error:', error);
            storageMode = 'localStorage';
        }
    }
    
    // localStorage fallback
    const stored = localStorage.getItem('blogPosts');
    return stored ? JSON.parse(stored) : [];
}

async function getPostsByUser(userId) {
    if (getStorageMode() === 'supabase') {
        try {
            return await db.getPostsByUser(userId);
        } catch (error) {
            console.error('Supabase error:', error);
            storageMode = 'localStorage';
        }
    }
    
    // localStorage fallback
    const posts = await getAllPosts();
    return posts.filter(p => p.userId === userId || p.user_id === userId);
}

async function createPost(postData) {
    if (getStorageMode() === 'supabase') {
        try {
            return await db.createPost(postData);
        } catch (error) {
            console.error('Supabase error:', error);
            storageMode = 'localStorage';
        }
    }
    
    // localStorage fallback
    const posts = await getAllPosts();
    posts.unshift(postData);
    localStorage.setItem('blogPosts', JSON.stringify(posts));
    return postData;
}

async function updatePost(postId, updates) {
    if (getStorageMode() === 'supabase') {
        try {
            return await db.updatePost(postId, updates);
        } catch (error) {
            console.error('Supabase error:', error);
            storageMode = 'localStorage';
        }
    }
    
    // localStorage fallback
    const posts = await getAllPosts();
    const index = posts.findIndex(p => p.id === postId);
    if (index !== -1) {
        posts[index] = { ...posts[index], ...updates };
        localStorage.setItem('blogPosts', JSON.stringify(posts));
        return posts[index];
    }
    return null;
}

async function deletePost(postId) {
    if (getStorageMode() === 'supabase') {
        try {
            return await db.deletePost(postId);
        } catch (error) {
            console.error('Supabase error:', error);
            storageMode = 'localStorage';
        }
    }
    
    // localStorage fallback
    const posts = await getAllPosts();
    const filtered = posts.filter(p => p.id !== postId);
    localStorage.setItem('blogPosts', JSON.stringify(filtered));
    return true;
}

// ========================================
// Session Management
// ========================================

async function saveCurrentUser(user) {
    if (getStorageMode() === 'supabase') {
        // Supabase handles sessions automatically
        return;
    }
    
    // localStorage fallback
    localStorage.setItem('currentUser', JSON.stringify(user));
}

async function getCurrentUser() {
    if (getStorageMode() === 'supabase' && typeof auth !== 'undefined') {
        try {
            const session = await auth.getSession();
            if (session && session.user) {
                // Get full user data from database
                const userData = await getUserByEmail(session.user.email);
                return userData;
            }
        } catch (error) {
            console.error('Supabase session error:', error);
        }
    }
    
    // localStorage fallback
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
}

async function clearCurrentUser() {
    if (getStorageMode() === 'supabase' && typeof auth !== 'undefined') {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Supabase signout error:', error);
        }
    }
    
    // localStorage fallback
    localStorage.removeItem('currentUser');
}

// ========================================
// Image Upload
// ========================================

async function uploadImage(file, bucket = 'avatars') {
    if (getStorageMode() === 'supabase' && typeof db !== 'undefined') {
        try {
            return await db.uploadImage(file, bucket);
        } catch (error) {
            console.error('Supabase upload error:', error);
        }
    }
    
    // localStorage fallback - convert to base64
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
