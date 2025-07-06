// Enhanced storage service with admin system and reports
class StorageService {
    constructor() {
        this.initializeMockData();
    }

    // Users
    saveUser(user) {
        const users = this.getUsers();
        const existingIndex = users.findIndex(u => u.id === user.id);
        
        if (existingIndex >= 0) {
            users[existingIndex] = user;
        } else {
            users.push(user);
        }
        
        localStorage.setItem('vibly_users', JSON.stringify(users));
    }

    getUsers() {
        const users = localStorage.getItem('vibly_users');
        return users ? JSON.parse(users) : [];
    }

    getUserById(id) {
        const users = this.getUsers();
        return users.find(u => u.id === id) || null;
    }

    getUserByEmail(email) {
        const users = this.getUsers();
        return users.find(u => u.email === email) || null;
    }

    getUserByUsername(username) {
        const users = this.getUsers();
        return users.find(u => u.username === username) || null;
    }

    // Posts
    savePosts(posts) {
        localStorage.setItem('vibly_posts', JSON.stringify(posts));
    }

    getPosts() {
        const posts = localStorage.getItem('vibly_posts');
        return posts ? JSON.parse(posts) : [];
    }

    savePost(post) {
        const posts = this.getPosts();
        const existingIndex = posts.findIndex(p => p.id === post.id);
        
        if (existingIndex >= 0) {
            posts[existingIndex] = post;
        } else {
            posts.unshift(post);
        }
        
        this.savePosts(posts);
    }

    deletePost(postId) {
        const posts = this.getPosts();
        const filteredPosts = posts.filter(p => p.id !== postId);
        this.savePosts(filteredPosts);
    }

    getPostsByUserId(userId) {
        const posts = this.getPosts();
        return posts.filter(p => p.userId === userId);
    }

    getPostsByType(type) {
        const posts = this.getPosts();
        return posts.filter(p => p.type === type);
    }

    // Comments
    saveComments(comments) {
        localStorage.setItem('vibly_comments', JSON.stringify(comments));
    }

    getComments() {
        const comments = localStorage.getItem('vibly_comments');
        return comments ? JSON.parse(comments) : [];
    }

    saveComment(comment) {
        const comments = this.getComments();
        comments.push(comment);
        this.saveComments(comments);
    }

    getCommentsByPostId(postId) {
        const comments = this.getComments();
        return comments.filter(c => c.postId === postId);
    }

    // Chats
    saveChats(chats) {
        localStorage.setItem('vibly_chats', JSON.stringify(chats));
    }

    getChats() {
        const chats = localStorage.getItem('vibly_chats');
        return chats ? JSON.parse(chats) : [];
    }

    saveChat(chat) {
        const chats = this.getChats();
        const existingIndex = chats.findIndex(c => c.id === chat.id);
        
        if (existingIndex >= 0) {
            chats[existingIndex] = chat;
        } else {
            chats.push(chat);
        }
        
        this.saveChats(chats);
    }

    getChatsByUserId(userId) {
        const chats = this.getChats();
        return chats.filter(c => c.participants.includes(userId));
    }

    // Messages
    saveMessages(messages) {
        localStorage.setItem('vibly_messages', JSON.stringify(messages));
    }

    getMessages() {
        const messages = localStorage.getItem('vibly_messages');
        return messages ? JSON.parse(messages) : [];
    }

    saveMessage(message) {
        const messages = this.getMessages();
        messages.push(message);
        this.saveMessages(messages);
        
        // Update chat's last message
        const chats = this.getChats();
        const chatIndex = chats.findIndex(c => c.id === message.chatId);
        if (chatIndex >= 0) {
            chats[chatIndex].lastMessage = message;
            chats[chatIndex].updatedAt = message.createdAt;
            this.saveChats(chats);
        }
    }

    getMessagesByChatId(chatId) {
        const messages = this.getMessages();
        return messages.filter(m => m.chatId === chatId);
    }

    // Reports
    saveReports(reports) {
        localStorage.setItem('vibly_reports', JSON.stringify(reports));
    }

    getReports() {
        const reports = localStorage.getItem('vibly_reports');
        return reports ? JSON.parse(reports) : [];
    }

    saveReport(report) {
        const reports = this.getReports();
        reports.push(report);
        this.saveReports(reports);
    }

    // Auth
    setCurrentUser(user) {
        localStorage.setItem('vibly_current_user', JSON.stringify(user));
    }

    getCurrentUser() {
        const user = localStorage.getItem('vibly_current_user');
        return user ? JSON.parse(user) : null;
    }

    clearCurrentUser() {
        localStorage.removeItem('vibly_current_user');
    }

    // Algorithm data
    getUserInteractions(userId) {
        const interactions = localStorage.getItem(`vibly_interactions_${userId}`);
        return interactions ? JSON.parse(interactions) : {
            likes: [],
            comments: [],
            shares: [],
            views: [],
            follows: []
        };
    }

    saveUserInteraction(userId, type, targetId) {
        const interactions = this.getUserInteractions(userId);
        if (!interactions[type].includes(targetId)) {
            interactions[type].push(targetId);
            localStorage.setItem(`vibly_interactions_${userId}`, JSON.stringify(interactions));
        }
    }

    // Activity Log
    saveActivityLog(log) {
        const logs = this.getActivityLogs();
        logs.push(log);
        localStorage.setItem('vibly_activity_logs', JSON.stringify(logs));
    }

    getActivityLogs() {
        const logs = localStorage.getItem('vibly_activity_logs');
        return logs ? JSON.parse(logs) : [];
    }

    // Initialize with enhanced mock data including admin accounts
    initializeMockData() {
        if (this.getUsers().length === 0) {
            const mockUsers = [
                // Super Admin
                {
                    id: 'superadmin1',
                    username: 'vibly_admin',
                    email: 'admin@vibly.com',
                    displayName: 'Vibly Admin',
                    avatar: Utils.getDefaultAvatar('vibly_admin'),
                    bio: '🔥 Vibly Super Admin | Platform Yöneticisi',
                    followers: [],
                    following: [],
                    verified: false,
                    isAdmin: true,
                    isSuperAdmin: true,
                    isPremium: true,
                    isBanned: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
                },
                // Admin Accounts
                {
                    id: 'admin1',
                    username: 'moderator1',
                    email: 'mod1@vibly.com',
                    displayName: 'Moderatör Ali',
                    avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?w=150&h=150&fit=crop&crop=face',
                    bio: '⚡ Platform Moderatörü | Topluluk Yöneticisi',
                    followers: [],
                    following: [],
                    verified: false,
                    isAdmin: true,
                    isSuperAdmin: false,
                    isPremium: true,
                    isBanned: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 300).toISOString(),
                },
                {
                    id: 'admin2',
                    username: 'moderator2',
                    email: 'mod2@vibly.com',
                    displayName: 'Moderatör Ayşe',
                    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=150&h=150&fit=crop&crop=face',
                    bio: '🛡️ İçerik Moderatörü | Güvenlik Uzmanı',
                    followers: [],
                    following: [],
                    verified: false,
                    isAdmin: true,
                    isSuperAdmin: false,
                    isPremium: true,
                    isBanned: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 280).toISOString(),
                },
                {
                    id: 'admin3',
                    username: 'moderator3',
                    email: 'mod3@vibly.com',
                    displayName: 'Moderatör Mehmet',
                    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=150&h=150&fit=crop&crop=face',
                    bio: '🔍 Kalite Kontrol Uzmanı | İçerik Denetleyicisi',
                    followers: [],
                    following: [],
                    verified: false,
                    isAdmin: true,
                    isSuperAdmin: false,
                    isPremium: true,
                    isBanned: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 260).toISOString(),
                },
                {
                    id: 'admin4',
                    username: 'moderator4',
                    email: 'mod4@vibly.com',
                    displayName: 'Moderatör Fatma',
                    avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?w=150&h=150&fit=crop&crop=face',
                    bio: '📊 Veri Analisti | Kullanıcı Deneyimi Uzmanı',
                    followers: [],
                    following: [],
                    verified: false,
                    isAdmin: true,
                    isSuperAdmin: false,
                    isPremium: true,
                    isBanned: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 240).toISOString(),
                },
                {
                    id: 'admin5',
                    username: 'moderator5',
                    email: 'mod5@vibly.com',
                    displayName: 'Moderatör Can',
                    avatar: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?w=150&h=150&fit=crop&crop=face',
                    bio: '🎯 Topluluk Yöneticisi | Etkinlik Koordinatörü',
                    followers: [],
                    following: [],
                    verified: false,
                    isAdmin: true,
                    isSuperAdmin: false,
                    isPremium: true,
                    isBanned: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 220).toISOString(),
                },
                {
                    id: 'admin6',
                    username: 'moderator6',
                    email: 'mod6@vibly.com',
                    displayName: 'Moderatör Zeynep',
                    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=150&h=150&fit=crop&crop=face',
                    bio: '💬 İletişim Uzmanı | Kullanıcı Desteği',
                    followers: [],
                    following: [],
                    verified: false,
                    isAdmin: true,
                    isSuperAdmin: false,
                    isPremium: true,
                    isBanned: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
                },
                // Regular Users
                {
                    id: 'user1',
                    username: 'alex_vibes',
                    email: 'alex@example.com',
                    displayName: 'Alex Johnson',
                    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=150&h=150&fit=crop&crop=face',
                    bio: '🌟 İçerik üreticisi | 📸 Fotoğraf tutkunu | ✨ İyi vibeler yayıyorum',
                    followers: ['user2', 'user3', 'user4', 'user5'],
                    following: ['user2', 'user6'],
                    verified: false,
                    isAdmin: false,
                    isSuperAdmin: false,
                    isPremium: true,
                    isBanned: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
                },
                {
                    id: 'user2',
                    username: 'sarah_creates',
                    email: 'sarah@example.com',
                    displayName: 'Sarah Miller',
                    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=150&h=150&fit=crop&crop=face',
                    bio: '🎨 Dijital sanatçı | 🎵 Müzik aşığı | 💫 En iyi halimle yaşıyorum',
                    followers: ['user1', 'user3', 'user4'],
                    following: ['user1', 'user3', 'user5'],
                    verified: false,
                    isAdmin: false,
                    isSuperAdmin: false,
                    isPremium: false,
                    isBanned: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
                },
                {
                    id: 'user3',
                    username: 'mike_adventures',
                    email: 'mike@example.com',
                    displayName: 'Mike Chen',
                    avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?w=150&h=150&fit=crop&crop=face',
                    bio: '🏔️ Macera arayıcısı | 📱 Teknoloji meraklısı | 🌍 Dünya gezgini',
                    followers: ['user1', 'user2'],
                    following: ['user1', 'user2', 'user4'],
                    verified: false,
                    isAdmin: false,
                    isSuperAdmin: false,
                    isPremium: false,
                    isBanned: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
                },
                {
                    id: 'user4',
                    username: 'emma_lifestyle',
                    email: 'emma@example.com',
                    displayName: 'Emma Wilson',
                    avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?w=150&h=150&fit=crop&crop=face',
                    bio: '💄 Güzellik uzmanı | 🥗 Sağlıklı yaşam | 💪 Fitness motivasyonu',
                    followers: ['user1', 'user2', 'user5'],
                    following: ['user1', 'user3'],
                    verified: false,
                    isAdmin: false,
                    isSuperAdmin: false,
                    isPremium: true,
                    isBanned: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
                },
                {
                    id: 'user5',
                    username: 'david_tech',
                    email: 'david@example.com',
                    displayName: 'David Rodriguez',
                    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=150&h=150&fit=crop&crop=face',
                    bio: '💻 Yazılım geliştirici | 🚀 Startup kurucusu | 🎮 Oyun tutkunu',
                    followers: ['user2', 'user4'],
                    following: ['user1', 'user2', 'user3'],
                    verified: false,
                    isAdmin: false,
                    isSuperAdmin: false,
                    isPremium: false,
                    isBanned: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
                },
                {
                    id: 'user6',
                    username: 'lisa_food',
                    email: 'lisa@example.com',
                    displayName: 'Lisa Park',
                    avatar: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?w=150&h=150&fit=crop&crop=face',
                    bio: '👩‍🍳 Şef | 🍰 Tatlı uzmanı | 📚 Yemek kitabı yazarı',
                    followers: ['user1', 'user3', 'user4'],
                    following: ['user2', 'user5'],
                    verified: false,
                    isAdmin: false,
                    isSuperAdmin: false,
                    isPremium: true,
                    isBanned: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
                }
            ];
            
            mockUsers.forEach(user => this.saveUser(user));
        }

        if (this.getPosts().length === 0) {
            const mockPosts = [
                // Reels
                {
                    id: 'reel1',
                    userId: 'user1',
                    type: 'reel',
                    content: 'Günbatımı vibes! 🌅 Bu manzara karşısında nasıl sakin kalınır?',
                    mediaUrl: 'https://images.pexels.com/photos/3778876/pexels-photo-3778876.jpeg?w=400&h=600&fit=crop',
                    thumbnailUrl: 'https://images.pexels.com/photos/3778876/pexels-photo-3778876.jpeg?w=300&h=400&fit=crop',
                    likes: ['user2', 'user3', 'user4', 'user5'],
                    comments: [],
                    shares: 12,
                    views: 1247,
                    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                },
                {
                    id: 'reel2',
                    userId: 'user2',
                    type: 'reel',
                    content: 'Yeni sanat projem! 🎨 Ne düşünüyorsunuz?',
                    mediaUrl: 'https://images.pexels.com/photos/1267338/pexels-photo-1267338.jpeg?w=400&h=600&fit=crop',
                    thumbnailUrl: 'https://images.pexels.com/photos/1267338/pexels-photo-1267338.jpeg?w=300&h=400&fit=crop',
                    likes: ['user1', 'user3', 'user6'],
                    comments: [],
                    shares: 8,
                    views: 892,
                    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
                },
                {
                    id: 'reel3',
                    userId: 'user3',
                    type: 'reel',
                    content: 'Dağ zirvesinden manzara! 🏔️ #adventure',
                    mediaUrl: 'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?w=400&h=600&fit=crop',
                    thumbnailUrl: 'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?w=300&h=400&fit=crop',
                    likes: ['user1', 'user2', 'user4'],
                    comments: [],
                    shares: 15,
                    views: 1534,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
                },
                
                // Regular Posts
                {
                    id: 'post1',
                    userId: 'user4',
                    type: 'post',
                    content: 'Bugünkü makeup look! ✨ Hangi renk daha güzel sizce?',
                    mediaUrl: 'https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?w=500&h=500&fit=crop',
                    thumbnailUrl: 'https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?w=300&h=300&fit=crop',
                    likes: ['user1', 'user2', 'user5', 'user6'],
                    comments: [],
                    shares: 6,
                    views: 743,
                    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
                },
                {
                    id: 'post2',
                    userId: 'user5',
                    type: 'post',
                    content: 'Yeni projemde çalışıyorum! 💻 Kod yazmak ne kadar keyifli',
                    mediaUrl: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?w=500&h=400&fit=crop',
                    thumbnailUrl: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?w=300&h=240&fit=crop',
                    likes: ['user1', 'user3'],
                    comments: [],
                    shares: 3,
                    views: 456,
                    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
                },
                
                // Tweets
                {
                    id: 'tweet1',
                    userId: 'user1',
                    type: 'tweet',
                    content: 'Bazen hayat seni şaşırtır, bazen sen hayatı şaşırtırsın. Bugün ikincisi olsun! 🌟 #motivation #goodvibes',
                    likes: ['user2', 'user3', 'user4', 'user5', 'user6'],
                    comments: [],
                    shares: 18,
                    views: 2341,
                    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
                },
                {
                    id: 'tweet2',
                    userId: 'user2',
                    type: 'tweet',
                    content: 'Sanat, ruhun dilidir. Bugün hangi dilde konuştunuz? 🎨✨',
                    likes: ['user1', 'user4', 'user6'],
                    comments: [],
                    shares: 7,
                    views: 892,
                    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
                },
                {
                    id: 'tweet3',
                    userId: 'user6',
                    type: 'tweet',
                    content: 'Yemek yapmak sevgidir, paylaşmak mutluluktur. Bugün kime sevgi pişirdiniz? 👩‍🍳❤️',
                    likes: ['user1', 'user2', 'user3', 'user4'],
                    comments: [],
                    shares: 12,
                    views: 1456,
                    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
                },
                
                // Stories
                {
                    id: 'story1',
                    userId: 'user1',
                    type: 'story',
                    content: 'Stüdyodan hızlı bir güncelleme! 🎵',
                    mediaUrl: 'https://images.pexels.com/photos/1813515/pexels-photo-1813515.jpeg?w=400&h=600&fit=crop',
                    thumbnailUrl: 'https://images.pexels.com/photos/1813515/pexels-photo-1813515.jpeg?w=300&h=400&fit=crop',
                    likes: ['user2', 'user3'],
                    comments: [],
                    shares: 2,
                    views: 234,
                    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 23).toISOString(),
                },
                {
                    id: 'story2',
                    userId: 'user4',
                    type: 'story',
                    content: 'Sabah rutini ✨',
                    mediaUrl: 'https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?w=400&h=600&fit=crop',
                    thumbnailUrl: 'https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?w=300&h=400&fit=crop',
                    likes: ['user1', 'user5'],
                    comments: [],
                    shares: 1,
                    views: 156,
                    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 22).toISOString(),
                }
            ];
            
            mockPosts.forEach(post => this.savePost(post));
        }

        // Initialize some comments
        if (this.getComments().length === 0) {
            const mockComments = [
                {
                    id: 'comment1',
                    userId: 'user2',
                    postId: 'reel1',
                    content: 'Harika bir manzara! 😍',
                    likes: ['user1'],
                    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
                },
                {
                    id: 'comment2',
                    userId: 'user3',
                    postId: 'reel1',
                    content: 'Bu nerede çekildi?',
                    likes: [],
                    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
                },
                {
                    id: 'comment3',
                    userId: 'user1',
                    postId: 'tweet1',
                    content: 'Çok doğru söylüyorsun! 👏',
                    likes: ['user2', 'user4'],
                    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
                }
            ];
            
            mockComments.forEach(comment => this.saveComment(comment));
        }

        // Initialize some chats
        if (this.getChats().length === 0) {
            const mockChats = [
                {
                    id: 'chat1',
                    participants: ['user1', 'user2'],
                    lastMessage: {
                        id: 'msg1',
                        userId: 'user2',
                        content: 'Yeni projen nasıl gidiyor?',
                        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
                    },
                    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
                },
                {
                    id: 'chat2',
                    participants: ['user1', 'user3'],
                    lastMessage: {
                        id: 'msg2',
                        userId: 'user1',
                        content: 'Fotoğrafların çok güzel!',
                        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
                    },
                    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
                }
            ];
            
            mockChats.forEach(chat => this.saveChat(chat));
        }
    }
}

// Create global instance
const storage = new StorageService();