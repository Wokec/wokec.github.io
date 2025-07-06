// Real-time system for live updates
class RealTimeManager {
    constructor() {
        this.eventListeners = new Map();
        this.updateQueue = [];
        this.isProcessing = false;
        this.init();
    }

    init() {
        // Simulate real-time updates every 5 seconds
        setInterval(() => {
            this.processUpdateQueue();
        }, 5000);

        // Listen for storage changes
        window.addEventListener('storage', (e) => {
            this.handleStorageChange(e);
        });
    }

    // Subscribe to real-time events
    subscribe(eventType, callback) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType).push(callback);
    }

    // Unsubscribe from events
    unsubscribe(eventType, callback) {
        if (this.eventListeners.has(eventType)) {
            const callbacks = this.eventListeners.get(eventType);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // Broadcast update to all listeners
    broadcastUpdate(eventType, data) {
        this.updateQueue.push({ eventType, data, timestamp: Date.now() });
        
        if (this.eventListeners.has(eventType)) {
            this.eventListeners.get(eventType).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in real-time callback:', error);
                }
            });
        }
    }

    // Process queued updates
    processUpdateQueue() {
        if (this.isProcessing || this.updateQueue.length === 0) return;
        
        this.isProcessing = true;
        
        // Process all queued updates
        while (this.updateQueue.length > 0) {
            const update = this.updateQueue.shift();
            this.handleUpdate(update);
        }
        
        this.isProcessing = false;
    }

    // Handle individual updates
    handleUpdate(update) {
        const { eventType, data } = update;
        
        switch (eventType) {
            case 'new_message':
                this.handleNewMessage(data);
                break;
            case 'new_post':
                this.handleNewPost(data);
                break;
            case 'new_like':
                this.handleNewLike(data);
                break;
            case 'new_comment':
                this.handleNewComment(data);
                break;
            case 'new_follow':
                this.handleNewFollow(data);
                break;
            case 'user_online':
                this.handleUserOnline(data);
                break;
            case 'user_offline':
                this.handleUserOffline(data);
                break;
            case 'profile_updated':
                this.handleProfileUpdate(data);
                break;
            case 'premium_activated':
                this.handlePremiumActivated(data);
                break;
        }
    }

    // Handle storage changes from other tabs
    handleStorageChange(event) {
        if (event.key && event.key.startsWith('vibly_')) {
            const updateType = this.getUpdateTypeFromKey(event.key);
            if (updateType) {
                this.broadcastUpdate(updateType, {
                    key: event.key,
                    oldValue: event.oldValue,
                    newValue: event.newValue
                });
            }
        }
    }

    getUpdateTypeFromKey(key) {
        if (key.includes('messages')) return 'messages_updated';
        if (key.includes('posts')) return 'posts_updated';
        if (key.includes('users')) return 'users_updated';
        if (key.includes('comments')) return 'comments_updated';
        return null;
    }

    // Specific update handlers
    handleNewMessage(data) {
        const { chatId, message } = data;
        
        // Update chat list if visible
        if (window.app && window.app.currentView === 'chat') {
            chatManager.loadChats();
            
            // If in the specific chat, update messages
            if (chatManager.currentChatId === chatId) {
                chatManager.loadMessages(chatId);
            }
        }
        
        // Show notification if not in chat
        if (window.app && window.app.currentView !== 'chat') {
            const sender = storage.getUserById(message.userId);
            if (sender) {
                Utils.showToast(`${sender.displayName}: ${message.content.substring(0, 50)}...`, 'info');
            }
        }
    }

    handleNewPost(data) {
        const { post } = data;
        
        // Refresh feed if visible
        if (window.app && window.app.currentView === 'feed') {
            postsManager.loadFeed();
        }
        
        // Refresh tweets if it's a tweet
        if (post.type === 'tweet' && window.app && window.app.currentView === 'tweets') {
            postsManager.loadTweets();
        }
        
        // Refresh reels if it's a reel
        if (post.type === 'reel' && window.app && window.app.currentView === 'reels') {
            reelsManager.loadReels();
        }
    }

    handleNewLike(data) {
        const { postId, userId } = data;
        const currentUser = auth.getCurrentUser();
        
        // Show notification if someone liked current user's post
        if (currentUser) {
            const post = storage.getPosts().find(p => p.id === postId);
            if (post && post.userId === currentUser.id && userId !== currentUser.id) {
                const liker = storage.getUserById(userId);
                if (liker) {
                    Utils.showToast(`${liker.displayName} gönderinizi beğendi`, 'success');
                }
            }
        }
        
        // Update UI if post is visible
        this.updatePostUI(postId);
    }

    handleNewComment(data) {
        const { postId, comment } = data;
        const currentUser = auth.getCurrentUser();
        
        // Show notification if someone commented on current user's post
        if (currentUser) {
            const post = storage.getPosts().find(p => p.id === postId);
            if (post && post.userId === currentUser.id && comment.userId !== currentUser.id) {
                const commenter = storage.getUserById(comment.userId);
                if (commenter) {
                    Utils.showToast(`${commenter.displayName} gönderinize yorum yaptı`, 'info');
                }
            }
        }
        
        // Update UI if post is visible
        this.updatePostUI(postId);
    }

    handleNewFollow(data) {
        const { followerId, followedId } = data;
        const currentUser = auth.getCurrentUser();
        
        // Show notification if someone followed current user
        if (currentUser && followedId === currentUser.id) {
            const follower = storage.getUserById(followerId);
            if (follower) {
                Utils.showToast(`${follower.displayName} sizi takip etmeye başladı`, 'success');
            }
        }
        
        // Update profile if visible
        if (window.app && window.app.currentView === 'profile') {
            profileManager.loadProfile();
        }
    }

    handleUserOnline(data) {
        const { userId } = data;
        // Update online status indicators
        this.updateUserOnlineStatus(userId, true);
    }

    handleUserOffline(data) {
        const { userId } = data;
        // Update online status indicators
        this.updateUserOnlineStatus(userId, false);
    }

    handleProfileUpdate(data) {
        const { userId } = data;
        
        // Refresh any visible user data
        if (window.app) {
            switch (window.app.currentView) {
                case 'feed':
                    postsManager.loadFeed();
                    break;
                case 'profile':
                    profileManager.loadProfile();
                    break;
                case 'chat':
                    chatManager.loadChats();
                    break;
            }
        }
    }

    handlePremiumActivated(data) {
        const { userId } = data;
        const user = storage.getUserById(userId);
        
        if (user) {
            Utils.showToast(`${user.displayName} premium üye oldu! 🎉`, 'success');
        }
    }

    // Helper methods
    updatePostUI(postId) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const post = storage.getPosts().find(p => p.id === postId);
            if (post) {
                // Update like count
                const likeBtn = postElement.querySelector('.like-btn span');
                if (likeBtn) {
                    likeBtn.textContent = Utils.formatNumber(post.likes.length);
                }
                
                // Update comment count
                const commentBtn = postElement.querySelector('.comment-btn span');
                if (commentBtn) {
                    const comments = storage.getCommentsByPostId(postId);
                    commentBtn.textContent = Utils.formatNumber(comments.length);
                }
            }
        }
    }

    updateUserOnlineStatus(userId, isOnline) {
        const userElements = document.querySelectorAll(`[data-user-id="${userId}"]`);
        userElements.forEach(element => {
            const statusIndicator = element.querySelector('.online-status');
            if (statusIndicator) {
                statusIndicator.classList.toggle('online', isOnline);
                statusIndicator.classList.toggle('offline', !isOnline);
            }
        });
    }

    // Simulate user activity
    simulateActivity() {
        const users = storage.getUsers().filter(u => !u.isAdmin);
        const posts = storage.getPosts();
        
        if (users.length === 0 || posts.length === 0) return;
        
        // Random activity simulation
        const activities = [
            () => this.simulateLike(users, posts),
            () => this.simulateComment(users, posts),
            () => this.simulateFollow(users),
            () => this.simulateMessage(users)
        ];
        
        // Execute random activity
        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        randomActivity();
    }

    simulateLike(users, posts) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomPost = posts[Math.floor(Math.random() * posts.length)];
        
        if (!randomPost.likes.includes(randomUser.id)) {
            randomPost.likes.push(randomUser.id);
            storage.savePost(randomPost);
            
            this.broadcastUpdate('new_like', {
                postId: randomPost.id,
                userId: randomUser.id
            });
        }
    }

    simulateComment(users, posts) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomPost = posts[Math.floor(Math.random() * posts.length)];
        
        const comments = [
            'Harika! 👏',
            'Çok güzel olmuş 😍',
            'Süper! 🔥',
            'Beğendim 👍',
            'Muhteşem! ✨'
        ];
        
        const newComment = {
            id: Utils.generateId(),
            userId: randomUser.id,
            postId: randomPost.id,
            content: comments[Math.floor(Math.random() * comments.length)],
            likes: [],
            createdAt: new Date().toISOString()
        };
        
        storage.saveComment(newComment);
        
        this.broadcastUpdate('new_comment', {
            postId: randomPost.id,
            comment: newComment
        });
    }

    simulateFollow(users) {
        const follower = users[Math.floor(Math.random() * users.length)];
        const followed = users[Math.floor(Math.random() * users.length)];
        
        if (follower.id !== followed.id && !follower.following.includes(followed.id)) {
            follower.following.push(followed.id);
            followed.followers.push(follower.id);
            
            storage.saveUser(follower);
            storage.saveUser(followed);
            
            this.broadcastUpdate('new_follow', {
                followerId: follower.id,
                followedId: followed.id
            });
        }
    }

    simulateMessage(users) {
        const sender = users[Math.floor(Math.random() * users.length)];
        const receiver = users[Math.floor(Math.random() * users.length)];
        
        if (sender.id === receiver.id) return;
        
        const messages = [
            'Merhaba! Nasılsın?',
            'Bugün nasıl geçti?',
            'Yeni gönderini gördüm, çok güzel!',
            'Kahve içmeye ne dersin?',
            'İyi akşamlar! 🌙'
        ];
        
        // Find or create chat
        let chat = storage.getChats().find(c => 
            c.participants.includes(sender.id) && c.participants.includes(receiver.id)
        );
        
        if (!chat) {
            chat = {
                id: Utils.generateId(),
                participants: [sender.id, receiver.id],
                updatedAt: new Date().toISOString()
            };
            storage.saveChat(chat);
        }
        
        const newMessage = {
            id: Utils.generateId(),
            chatId: chat.id,
            userId: sender.id,
            content: messages[Math.floor(Math.random() * messages.length)],
            type: 'text',
            createdAt: new Date().toISOString()
        };
        
        storage.saveMessage(newMessage);
        
        this.broadcastUpdate('new_message', {
            chatId: chat.id,
            message: newMessage
        });
    }

    // Start activity simulation
    startActivitySimulation() {
        // Simulate activity every 30-60 seconds
        setInterval(() => {
            if (Math.random() > 0.3) { // 70% chance
                this.simulateActivity();
            }
        }, Math.random() * 30000 + 30000);
    }
}

// Create global real-time manager
const realTimeManager = new RealTimeManager();

// Start activity simulation when app loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        realTimeManager.startActivitySimulation();
    }, 10000); // Start after 10 seconds
});