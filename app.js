// Enhanced main application controller
class ViblyApp {
    constructor() {
        this.currentView = 'feed';
        this.notifications = [];
        this.unreadMessages = 0;
        this.init();
    }

    init() {
        // Show splash screen first
        this.showSplashScreen();
        
        // Initialize after splash
        setTimeout(() => {
            this.hideSplashScreen();
            
            // Check if language is set
            if (!localStorage.getItem('vibly_language')) {
                this.showLanguageSelector();
            } else {
                // Check if user is logged in
                if (auth.isLoggedIn()) {
                    this.showMainApp();
                } else {
                    this.showAuthScreen();
                }
            }
            
            this.setupEventListeners();
        }, 3000);
    }

    showSplashScreen() {
        document.getElementById('splash-screen').classList.remove('hidden');
    }

    hideSplashScreen() {
        document.getElementById('splash-screen').classList.add('hidden');
    }

    showLanguageSelector() {
        document.getElementById('language-selector').classList.remove('hidden');
    }

    showAuthScreen() {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
    }

    showMainApp() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        
        // Load initial data
        this.loadData();
        this.updateNotificationCounts();
    }

    setupEventListeners() {
        // Sidebar navigation
        const navItems = document.querySelectorAll('.nav-item[data-view]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const view = item.dataset.view;
                if (view) {
                    this.switchView(view);
                    
                    // Update active nav item
                    navItems.forEach(nav => nav.classList.remove('active'));
                    item.classList.add('active');
                }
            });
        });

        // Add ripple effect to buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('button') || e.target.closest('button')) {
                const button = e.target.matches('button') ? e.target : e.target.closest('button');
                Utils.createRipple(button, e);
            }
        });

        // Search functionality
        const searchInput = document.getElementById('main-search-input');
        const searchSubmit = document.getElementById('main-search-submit');
        
        if (searchInput && searchSubmit) {
            const performSearch = () => {
                const query = searchInput.value.trim();
                if (query) {
                    this.performSearch(query);
                    this.saveSearchHistory(query);
                }
            };

            searchSubmit.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });

            // Real-time search
            searchInput.addEventListener('input', Utils.debounce(() => {
                const query = searchInput.value.trim();
                if (query.length > 2) {
                    this.performSearch(query);
                }
            }, 300));
        }

        // Search tabs
        document.addEventListener('click', (e) => {
            if (e.target.closest('.search-tab')) {
                const tab = e.target.closest('.search-tab').dataset.tab;
                this.switchSearchTab(tab);
            }
        });

        // Setup infinite scroll for feed
        const feedContainer = document.getElementById('feed-container');
        if (feedContainer) {
            Utils.setupInfiniteScroll(feedContainer, () => {
                return this.loadMorePosts();
            });
        }

        // Quick tweet functionality
        const quickTweetBtn = document.getElementById('quick-tweet-btn');
        const quickTweetInput = document.getElementById('quick-tweet-input');
        
        if (quickTweetBtn) {
            quickTweetBtn.addEventListener('click', () => {
                this.publishQuickTweet();
            });
        }
        
        if (quickTweetInput) {
            quickTweetInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.publishQuickTweet();
                }
            });
        }

        // Notifications
        const markAllReadBtn = document.getElementById('mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                this.markAllNotificationsRead();
            });
        }

        // Video call functionality
        const videoCallBtn = document.getElementById('video-call-btn');
        const voiceCallBtn = document.getElementById('voice-call-btn');
        const endCallBtn = document.getElementById('end-call');
        
        if (videoCallBtn) {
            videoCallBtn.addEventListener('click', () => {
                this.startVideoCall();
            });
        }
        
        if (voiceCallBtn) {
            voiceCallBtn.addEventListener('click', () => {
                this.startVoiceCall();
            });
        }
        
        if (endCallBtn) {
            endCallBtn.addEventListener('click', () => {
                this.endCall();
            });
        }

        // Premium purchase
        const premiumForm = document.getElementById('premium-payment-form');
        if (premiumForm) {
            premiumForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processPremiumPayment();
            });
        }

        // Card number formatting
        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
                let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = formattedValue;
            });
        }

        // Card expiry formatting
        const cardExpiryInput = document.getElementById('card-expiry');
        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
            });
        }

        // Real-time updates
        this.setupRealTimeUpdates();
    }

    setupRealTimeUpdates() {
        // Update notification counts every 30 seconds
        setInterval(() => {
            this.updateNotificationCounts();
        }, 30000);

        // Listen for new messages and notifications
        realTimeManager.subscribe('new_message', (data) => {
            this.handleNewMessage(data);
        });

        realTimeManager.subscribe('new_notification', (data) => {
            this.handleNewNotification(data);
        });
    }

    loadData() {
        // Load content for all views
        postsManager.loadFeed();
        postsManager.loadTweets();
        chatManager.loadChats();
        profileManager.loadProfile();
        reelsManager.loadReels();
        exploreManager.loadExplore();
        
        // Load settings
        settingsManager.loadSettings();
        
        // Load notifications
        this.loadNotifications();
        this.loadSearchHistory();
    }

    switchView(viewName) {
        // Hide all views
        const views = document.querySelectorAll('.view');
        views.forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
            
            // Load view-specific data
            this.loadViewData(viewName);
        }

        // Update navigation active state
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(nav => nav.classList.remove('active'));
        
        const activeNav = document.querySelector(`[data-view="${viewName}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }

    loadViewData(viewName) {
        switch (viewName) {
            case 'feed':
                postsManager.loadFeed();
                break;
            case 'explore':
                exploreManager.loadExplore();
                break;
            case 'reels':
                reelsManager.loadReels();
                break;
            case 'tweets':
                postsManager.loadTweets();
                break;
            case 'chat':
                chatManager.loadChats();
                break;
            case 'profile':
                profileManager.loadProfile();
                break;
            case 'notifications':
                this.loadNotifications();
                break;
            case 'search':
                this.loadSearchHistory();
                break;
            case 'settings':
                // Settings are loaded on app init
                break;
        }
    }

    // Search functionality
    performSearch(query) {
        const results = Utils.searchContent(query);
        this.displaySearchResults(results);
    }

    switchSearchTab(tab) {
        // Update active tab
        document.querySelectorAll('.search-tab').forEach(tabEl => {
            tabEl.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Filter results based on tab
        const query = document.getElementById('main-search-input').value.trim();
        if (query) {
            const results = Utils.searchContent(query);
            this.displaySearchResults(results, tab);
        }
    }

    displaySearchResults(results, filter = 'all') {
        const searchResults = document.getElementById('search-results');
        let html = '';

        // Hide search history when showing results
        const searchHistory = searchResults.querySelector('.search-history');
        if (searchHistory) {
            searchHistory.style.display = 'none';
        }

        if (filter === 'all' || filter === 'users') {
            if (results.users.length > 0) {
                html += `
                    <div class="search-section">
                        <h4 data-tr="users" data-en="Users">Kullanıcılar</h4>
                        <div class="search-users">
                            ${results.users.map(user => `
                                <div class="search-user-item" data-user-id="${user.id}" onclick="profileManager.loadProfile('${user.id}'); window.app.switchView('profile');">
                                    <img src="${user.avatar}" alt="${user.displayName}" class="search-user-avatar">
                                    <div class="search-user-info">
                                        <div class="search-user-name">${Utils.escapeHtml(user.displayName)}</div>
                                        <div class="search-user-username">@${Utils.escapeHtml(user.username)}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }

        if (filter === 'all' || filter === 'posts') {
            if (results.posts.length > 0) {
                html += `
                    <div class="search-section">
                        <h4 data-tr="posts" data-en="Posts">Gönderiler</h4>
                        <div class="search-posts">
                            ${results.posts.map(post => {
                                const user = storage.getUserById(post.userId);
                                return `
                                    <div class="search-post-item" data-post-id="${post.id}">
                                        <div class="search-post-user">
                                            <img src="${user.avatar}" alt="${user.displayName}">
                                            <span>${Utils.escapeHtml(user.displayName)}</span>
                                        </div>
                                        <div class="search-post-content">
                                            ${Utils.formatTextWithLinks(post.content.substring(0, 100))}
                                            ${post.content.length > 100 ? '...' : ''}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        }

        if (html === '') {
            html = `<p class="no-results" data-tr="no_results" data-en="No results found">Sonuç bulunamadı</p>`;
        }

        // Create a results container
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results-content';
        resultsContainer.innerHTML = html;
        
        // Replace or add results
        const existingResults = searchResults.querySelector('.search-results-content');
        if (existingResults) {
            searchResults.replaceChild(resultsContainer, existingResults);
        } else {
            searchResults.appendChild(resultsContainer);
        }

        language.updateLanguage();
    }

    saveSearchHistory(query) {
        let history = JSON.parse(localStorage.getItem('vibly_search_history') || '[]');
        
        // Remove if already exists
        history = history.filter(item => item !== query);
        
        // Add to beginning
        history.unshift(query);
        
        // Keep only last 10 searches
        history = history.slice(0, 10);
        
        localStorage.setItem('vibly_search_history', JSON.stringify(history));
        this.loadSearchHistory();
    }

    loadSearchHistory() {
        const history = JSON.parse(localStorage.getItem('vibly_search_history') || '[]');
        const historyList = document.getElementById('search-history-list');
        
        if (historyList && history.length > 0) {
            historyList.innerHTML = history.map(query => `
                <div class="search-history-item" onclick="document.getElementById('main-search-input').value='${query}'; window.app.performSearch('${query}');">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="21 21l-4.35-4.35"></path>
                    </svg>
                    <span>${Utils.escapeHtml(query)}</span>
                </div>
            `).join('');
        }
    }

    // Notifications
    loadNotifications() {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) return;

        this.notifications = this.generateNotifications(currentUser);
        const notificationsContainer = document.getElementById('notifications-container');
        
        if (this.notifications.length === 0) {
            notificationsContainer.innerHTML = `
                <div class="empty-state">
                    <h3 data-tr="no_notifications" data-en="No notifications">Bildirim yok</h3>
                    <p data-tr="notifications_appear_here" data-en="Notifications will appear here">Bildirimler burada görünecek</p>
                </div>
            `;
            return;
        }

        const notificationsHtml = this.notifications.map(notification => `
            <div class="notification-item ${notification.read ? '' : 'unread'}">
                <div class="notification-avatar">
                    <img src="${notification.avatar}" alt="${notification.username}">
                </div>
                <div class="notification-content">
                    <p><strong>${notification.username}</strong> ${notification.message}</p>
                    <span class="notification-time">${notification.time}</span>
                </div>
            </div>
        `).join('');

        notificationsContainer.innerHTML = notificationsHtml;
        language.updateLanguage();
    }

    generateNotifications(currentUser) {
        const users = storage.getUsers().filter(u => u.id !== currentUser.id);
        const posts = storage.getPostsByUserId(currentUser.id);
        const notifications = [];

        // Generate like notifications
        posts.forEach(post => {
            post.likes.forEach(userId => {
                const user = storage.getUserById(userId);
                if (user) {
                    notifications.push({
                        id: Utils.generateId(),
                        avatar: user.avatar,
                        username: user.displayName,
                        message: 'gönderinizi beğendi',
                        time: Utils.formatTimeAgo(new Date(Date.now() - Math.random() * 86400000).toISOString()),
                        read: Math.random() > 0.3
                    });
                }
            });
        });

        // Generate follow notifications
        currentUser.followers.forEach(userId => {
            const user = storage.getUserById(userId);
            if (user) {
                notifications.push({
                    id: Utils.generateId(),
                    avatar: user.avatar,
                    username: user.displayName,
                    message: 'sizi takip etmeye başladı',
                    time: Utils.formatTimeAgo(new Date(Date.now() - Math.random() * 86400000).toISOString()),
                    read: Math.random() > 0.3
                });
            }
        });

        // Generate comment notifications
        const comments = storage.getComments().filter(comment => {
            const post = storage.getPosts().find(p => p.id === comment.postId);
            return post && post.userId === currentUser.id && comment.userId !== currentUser.id;
        });

        comments.forEach(comment => {
            const user = storage.getUserById(comment.userId);
            if (user) {
                notifications.push({
                    id: Utils.generateId(),
                    avatar: user.avatar,
                    username: user.displayName,
                    message: 'gönderinize yorum yaptı',
                    time: Utils.formatTimeAgo(comment.createdAt),
                    read: Math.random() > 0.3
                });
            }
        });

        // Generate story like notifications
        const stories = storage.getPostsByType('story').filter(story => story.userId === currentUser.id);
        stories.forEach(story => {
            story.likes.forEach(userId => {
                const user = storage.getUserById(userId);
                if (user && userId !== currentUser.id) {
                    notifications.push({
                        id: Utils.generateId(),
                        avatar: user.avatar,
                        username: user.displayName,
                        message: 'hikayanizi beğendi',
                        time: Utils.formatTimeAgo(new Date(Date.now() - Math.random() * 86400000).toISOString()),
                        read: Math.random() > 0.3
                    });
                }
            });
        });

        // Sort by time and limit to 20
        return notifications.slice(0, 20);
    }

    markAllNotificationsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.loadNotifications();
        this.updateNotificationCounts();
        Utils.showToast('Tüm bildirimler okundu işaretlendi', 'success');
    }

    updateNotificationCounts() {
        const unreadNotifications = this.notifications.filter(n => !n.read).length;
        const notificationBadge = document.getElementById('notification-count');
        
        if (notificationBadge) {
            if (unreadNotifications > 0) {
                notificationBadge.textContent = unreadNotifications;
                notificationBadge.classList.remove('hidden');
            } else {
                notificationBadge.classList.add('hidden');
            }
        }

        // Update message count
        const messageBadge = document.getElementById('message-count');
        if (messageBadge) {
            if (this.unreadMessages > 0) {
                messageBadge.textContent = this.unreadMessages;
                messageBadge.classList.remove('hidden');
            } else {
                messageBadge.classList.add('hidden');
            }
        }
    }

    handleNewMessage(data) {
        const currentUser = auth.getCurrentUser();
        if (currentUser && data.message.userId !== currentUser.id) {
            this.unreadMessages++;
            this.updateNotificationCounts();
        }
    }

    handleNewNotification(data) {
        this.notifications.unshift(data);
        this.updateNotificationCounts();
    }

    publishQuickTweet() {
        const content = document.getElementById('quick-tweet-input').value.trim();
        const currentUser = auth.getCurrentUser();
        
        if (!currentUser) {
            Utils.showToast('login_required', 'error');
            return;
        }
        
        if (!content) {
            Utils.showToast('Lütfen bir şeyler yazın', 'error');
            return;
        }

        const newTweet = {
            id: Utils.generateId(),
            userId: currentUser.id,
            type: 'tweet',
            content: content,
            mediaUrl: null,
            thumbnailUrl: null,
            likes: [],
            comments: [],
            shares: 0,
            views: Math.floor(Math.random() * 50) + 1,
            createdAt: new Date().toISOString(),
        };

        storage.savePost(newTweet);
        document.getElementById('quick-tweet-input').value = '';
        
        Utils.showToast('tweet_published', 'success');
        
        // Reload tweets
        postsManager.loadTweets();
    }

    loadMorePosts() {
        return new Promise((resolve) => {
            postsManager.currentPage++;
            setTimeout(() => {
                postsManager.loadFeed();
                resolve();
            }, 500);
        });
    }

    // Video call functionality
    startVideoCall() {
        this.switchView('video-call');
        this.initializeVideoCall();
    }

    startVoiceCall() {
        // For now, just show video call with audio only
        this.startVideoCall();
    }

    async initializeVideoCall() {
        try {
            const localVideo = document.getElementById('local-video');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            localVideo.srcObject = stream;
            
            // Start call timer
            this.startCallTimer();
        } catch (error) {
            console.error('Error accessing media devices:', error);
            Utils.showToast('Kamera veya mikrofon erişimi reddedildi', 'error');
        }
    }

    startCallTimer() {
        let seconds = 0;
        const timerElement = document.querySelector('.call-duration');
        
        this.callTimer = setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    endCall() {
        // Stop call timer
        if (this.callTimer) {
            clearInterval(this.callTimer);
        }
        
        // Stop video stream
        const localVideo = document.getElementById('local-video');
        if (localVideo.srcObject) {
            localVideo.srcObject.getTracks().forEach(track => track.stop());
        }
        
        // Return to chat
        this.switchView('chat');
    }

    // Premium payment processing
    processPremiumPayment() {
        const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
        const cardExpiry = document.getElementById('card-expiry').value;
        const cardCvv = document.getElementById('card-cvv').value;
        const cardHolder = document.getElementById('card-holder').value.trim();

        // Basic validation
        if (!cardNumber || cardNumber.length < 16) {
            Utils.showToast('Geçerli bir kart numarası girin', 'error');
            return;
        }

        if (!cardExpiry || cardExpiry.length < 5) {
            Utils.showToast('Geçerli bir son kullanma tarihi girin', 'error');
            return;
        }

        if (!cardCvv || cardCvv.length < 3) {
            Utils.showToast('Geçerli bir CVV girin', 'error');
            return;
        }

        if (!cardHolder) {
            Utils.showToast('Kart sahibi adını girin', 'error');
            return;
        }

        // Simulate payment processing
        Utils.showToast('Ödeme işleniyor...', 'info');
        
        setTimeout(() => {
            const currentUser = auth.getCurrentUser();
            const updatedData = {
                isPremium: true,
                premiumSince: new Date().toISOString()
            };

            auth.updateCurrentUser(updatedData);
            Utils.showToast('Premium üyelik aktif edildi! 🎉', 'success');
            
            // Reload profile to show premium badge
            profileManager.loadProfile();
            
            // Switch back to profile
            this.switchView('profile');
            
            // Real-time update
            realTimeManager.broadcastUpdate('premium_activated', {
                userId: currentUser.id
            });
        }, 2000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ViblyApp();
});

// Make instances globally available
window.auth = auth;
window.storage = storage;
window.utils = Utils;
window.language = language;