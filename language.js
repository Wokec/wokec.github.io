// Language management
class LanguageManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('vibly_language') || 'tr';
        this.translations = {
            tr: {
                // Auth
                choose_language: 'Dil Seçin',
                connect_share_vibe: 'Bağlan, Paylaş, Yaşa',
                welcome_back: 'Hoş Geldin',
                email: 'E-posta',
                password: 'Şifre',
                sign_in: 'Giriş Yap',
                no_account: 'Hesabın yok mu?',
                sign_up: 'Kayıt ol',
                join_vibly: 'Vibly\'ye Katıl',
                username: 'Kullanıcı adı',
                display_name: 'Görünen ad',
                create_account: 'Hesap Oluştur',
                have_account: 'Zaten hesabın var mı?',
                
                // Navigation
                home: 'Ana Sayfa',
                explore: 'Keşfet',
                reels: 'Reels',
                create: 'Oluştur',
                tweets: 'Tweet',
                messages: 'Mesaj',
                profile: 'Profil',
                
                // Content
                your_story: 'Hikayen',
                trending: 'Trend',
                recent: 'Son',
                popular: 'Popüler',
                new_tweet: 'Yeni Tweet',
                new_chat: 'Yeni Sohbet',
                create_post: 'Gönderi Oluştur',
                cancel: 'İptal',
                reel: 'Reel',
                post: 'Gönderi',
                story: 'Hikaye',
                tweet: 'Tweet',
                whats_on_mind: 'Aklından ne geçiyor?',
                add_media: 'Medya Ekle',
                publish: 'Yayınla',
                type_message: 'Mesaj yaz...',
                send: 'Gönder',
                recording: 'Kaydediliyor...',
                
                // Actions
                like: 'Beğen',
                comment: 'Yorum',
                share: 'Paylaş',
                follow: 'Takip Et',
                following: 'Takip Ediliyor',
                edit_profile: 'Profili Düzenle',
                logout: 'Çıkış Yap',
                
                // Messages
                login_success: 'Başarıyla giriş yapıldı!',
                register_success: 'Hesap başarıyla oluşturuldu!',
                post_published: 'Gönderi yayınlandı!',
                story_published: 'Hikaye yayınlandı!',
                tweet_published: 'Tweet yayınlandı!',
                comment_posted: 'Yorum gönderildi!',
                message_sent: 'Mesaj gönderildi!',
                follow_success: 'Takip edildi!',
                unfollow_success: 'Takip bırakıldı!',
                profile_updated: 'Profil güncellendi!',
                
                // Errors
                fill_all_fields: 'Lütfen tüm alanları doldurun',
                invalid_email: 'Geçerli bir e-posta girin',
                invalid_credentials: 'Geçersiz e-posta veya şifre',
                username_taken: 'Bu kullanıcı adı alınmış',
                email_taken: 'Bu e-posta zaten kayıtlı',
                password_short: 'Şifre en az 6 karakter olmalı',
                login_required: 'Giriş yapmanız gerekiyor',
                
                // Time
                just_now: 'şimdi',
                minutes_ago: 'dakika önce',
                hours_ago: 'saat önce',
                days_ago: 'gün önce',
                
                // Counts
                views: 'görüntülenme',
                likes: 'beğeni',
                comments: 'yorum',
                followers: 'takipçi',
                following_count: 'takip',
                posts: 'gönderi'
            },
            en: {
                // Auth
                choose_language: 'Choose Language',
                connect_share_vibe: 'Connect, Share, Vibe',
                welcome_back: 'Welcome Back',
                email: 'Email',
                password: 'Password',
                sign_in: 'Sign In',
                no_account: 'Don\'t have an account?',
                sign_up: 'Sign up',
                join_vibly: 'Join Vibly',
                username: 'Username',
                display_name: 'Display Name',
                create_account: 'Create Account',
                have_account: 'Already have an account?',
                
                // Navigation
                home: 'Home',
                explore: 'Explore',
                reels: 'Reels',
                create: 'Create',
                tweets: 'Tweets',
                messages: 'Messages',
                profile: 'Profile',
                
                // Content
                your_story: 'Your Story',
                trending: 'Trending',
                recent: 'Recent',
                popular: 'Popular',
                new_tweet: 'New Tweet',
                new_chat: 'New Chat',
                create_post: 'Create Post',
                cancel: 'Cancel',
                reel: 'Reel',
                post: 'Post',
                story: 'Story',
                tweet: 'Tweet',
                whats_on_mind: 'What\'s on your mind?',
                add_media: 'Add Media',
                publish: 'Publish',
                type_message: 'Type a message...',
                send: 'Send',
                recording: 'Recording...',
                
                // Actions
                like: 'Like',
                comment: 'Comment',
                share: 'Share',
                follow: 'Follow',
                following: 'Following',
                edit_profile: 'Edit Profile',
                logout: 'Logout',
                
                // Messages
                login_success: 'Successfully logged in!',
                register_success: 'Account created successfully!',
                post_published: 'Post published!',
                story_published: 'Story published!',
                tweet_published: 'Tweet published!',
                comment_posted: 'Comment posted!',
                message_sent: 'Message sent!',
                follow_success: 'Now following!',
                unfollow_success: 'Unfollowed!',
                profile_updated: 'Profile updated!',
                
                // Errors
                fill_all_fields: 'Please fill in all fields',
                invalid_email: 'Please enter a valid email',
                invalid_credentials: 'Invalid email or password',
                username_taken: 'Username already taken',
                email_taken: 'Email already registered',
                password_short: 'Password must be at least 6 characters',
                login_required: 'Please log in',
                
                // Time
                just_now: 'just now',
                minutes_ago: 'minutes ago',
                hours_ago: 'hours ago',
                days_ago: 'days ago',
                
                // Counts
                views: 'views',
                likes: 'likes',
                comments: 'comments',
                followers: 'followers',
                following_count: 'following',
                posts: 'posts'
            }
        };
        
        this.init();
    }
    
    init() {
        this.updateLanguage();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Language selector buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.language-btn')) {
                const lang = e.target.closest('.language-btn').dataset.lang;
                this.setLanguage(lang);
            }
        });
        
        // Language toggle in header
        const languageToggle = document.getElementById('language-toggle');
        if (languageToggle) {
            languageToggle.addEventListener('click', () => {
                this.toggleLanguage();
            });
        }
    }
    
    setLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('vibly_language', lang);
        this.updateLanguage();
        
        // Hide language selector
        document.getElementById('language-selector').classList.add('hidden');
        
        // Show auth screen
        setTimeout(() => {
            document.getElementById('auth-screen').classList.remove('hidden');
        }, 300);
    }
    
    toggleLanguage() {
        const newLang = this.currentLanguage === 'tr' ? 'en' : 'tr';
        this.setLanguage(newLang);
    }
    
    updateLanguage() {
        const elements = document.querySelectorAll('[data-tr], [data-en]');
        elements.forEach(element => {
            const key = element.getAttribute(`data-${this.currentLanguage}`);
            if (key && this.translations[this.currentLanguage][key]) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = this.translations[this.currentLanguage][key];
                } else {
                    element.textContent = this.translations[this.currentLanguage][key];
                }
            }
        });
    }
    
    t(key) {
        return this.translations[this.currentLanguage][key] || key;
    }
    
    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// Create global language instance
const language = new LanguageManager();