// ========================================
// Supabase Configuration
// ========================================

// IMPORTANT: Replace these with your actual Supabase credentials
// Get them from: https://app.supabase.com/project/_/settings/api
const SUPABASE_URL = 'https://kyggzxfypudtbmgtemgj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5Z2d6eGZ5cHVkdGJtZ3RlbWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTgxOTMsImV4cCI6MjA4MzAzNDE5M30.RjxyVR-R0dqMLaJF_ZNaybItVqqmIGwZm0AeqmrOJH4';

// Initialize Supabase client
let supabase = null;

// Check if Supabase credentials are configured
function isSupabaseConfigured() {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
           SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}

// Initialize Supabase
function initSupabase() {
    if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase not configured. Using localStorage fallback.');
        console.warn('To use Supabase, update credentials in supabase-config.js');
        return false;
    }
    
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✓ Supabase initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        return false;
    }
}

// Database Helper Functions
const db = {
    // Users
    async getUsers() {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('users')
            .select('*');
        if (error) throw error;
        return data || [];
    },
    
    async getUserByEmail(email) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },
    
    async createUser(user) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('users')
            .insert([user])
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    
    async updateUser(userId, updates) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    
    // Posts
    async getPosts() {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },
    
    async getPostsByUser(userId) {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },
    
    async createPost(post) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('posts')
            .insert([post])
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    
    async updatePost(postId, updates) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('posts')
            .update(updates)
            .eq('id', postId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    
    async deletePost(postId) {
        if (!supabase) return false;
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId);
        if (error) throw error;
        return true;
    },
    
    // Storage for images
    async uploadImage(file, bucket = 'avatars') {
        if (!supabase) return null;
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);
        if (error) throw error;
        
        const { data: publicUrl } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);
        
        return publicUrl.publicUrl;
    }
};

// Authentication Helper Functions
const auth = {
    async signUp(email, password, metadata = {}) {
        if (!supabase) return null;
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
        if (error) throw error;
        return data;
    },
    
    async signIn(email, password) {
        if (!supabase) return null;
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    },
    
    async signInWithGoogle() {
        if (!supabase) return null;
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/feed.html'
            }
        });
        if (error) throw error;
        return data;
    },
    
    async signInWithGithub() {
        if (!supabase) return null;
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: window.location.origin + '/feed.html'
            }
        });
        if (error) throw error;
        return data;
    },
    
    async signOut() {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },
    
    async getSession() {
        if (!supabase) return null;
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },
    
    async getUser() {
        if (!supabase) return null;
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (typeof window.supabase !== 'undefined') {
            initSupabase();
        } else {
            console.warn('Supabase JS library not loaded. Add the CDN script to your HTML files.');
        }
    });
}
