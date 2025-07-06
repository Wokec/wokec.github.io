// Reels management
class ReelsManager {
    constructor() {
        this.currentReelIndex = 0;
        this.reels = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Reel actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.reel-action')) {
                const action = e.target.closest('.reel-action').dataset.action;
                const reelId = e.target.closest('.reel-item').dataset.reelId;
                this.handleReelAction(action, reelId);
            }
        });

        // Scroll handling for reels
        const reelsContainer = document.getElementById('reels-container');
        if (reelsContainer) {
            let isScrolling = false;
            reelsContainer.addEventListener('scroll', () => {
                if (isScrolling) return;
                isScrolling = true;
                
                setTimeout(() => {
                    this.updateCurrentReel();
                    isScrolling = false;
                }, 100);
            });
        }
    }

    loadReels() {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) return;

        // Get reels using algorithm
        this.reels = Utils.getRecommendedContent(currentUser.id, 'reel');
        const reelsContainer = document.getElementById('reels-container');
        
        if (this.reels.length === 0) {
            reelsContainer.innerHTML = `
                <div class="empty-state">
                    <h3 data-tr="no_reels" data-en="No reels available">Henüz reel yok</h3>
                    <p data-tr="create_first_reel" data-en="Be the first to create a reel!">İlk reel'i sen oluştur!</p>
                    <button class="btn-primary" onclick="window.app.switchView('create')" data-tr="create_reel" data-en="Create Reel">Reel Oluştur</button>
                </div>
            `;
            return;
        }

        const reelsHtml = this.reels.map((reel, index) => this.renderReel(reel, index)).join('');
        reelsContainer.innerHTML = reelsHtml;
        
        // Update language
        language.updateLanguage();
        
        // Auto-play first reel
        this.playReel(0);
    }

    renderReel(reel, index) {
        const user = storage.getUserById(reel.userId);
        const currentUser = auth.getCurrentUser();
        const isLiked = reel.likes.includes(currentUser?.id);
        const comments = storage.getCommentsByPostId(reel.id);

        return `
            <div class="reel-item" data-reel-id="${reel.id}" data-index="${index}">
                ${reel.mediaUrl ? `
                    <video class="reel-video" src="${reel.mediaUrl}" loop muted playsinline></video>
                ` : `
                    <div class="reel-placeholder" style="background: linear-gradient(45deg, #667eea, #764ba2);">
                        <h3>${Utils.escapeHtml(reel.content)}</h3>
                    </div>
                `}
                
                <div class="reel-overlay">
                    <div class="reel-user">
                        <div class="reel-avatar">
                            <img src="${user.avatar}" alt="${user.displayName}">
                        </div>
                        <div class="reel-user-info">
                            <span class="reel-username">
                                ${Utils.escapeHtml(user.displayName)}
                                ${user.verified ? '<span class="verified-badge">✓</span>' : ''}
                            </span>
                            <button class="follow-btn ${currentUser?.following.includes(user.id) ? 'following' : ''}" data-user-id="${user.id}">
                                ${currentUser?.following.includes(user.id) ? language.t('following') : language.t('follow')}
                            </button>
                        </div>
                    </div>
                    
                    <div class="reel-content">
                        ${Utils.formatTextWithLinks(reel.content)}
                    </div>
                </div>
                
                <div class="reel-actions">
                    <div class="reel-action" data-action="like">
                        <div class="reel-action-icon ${isLiked ? 'liked' : ''}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="${isLiked ? '#ff3040' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </div>
                        <span>${Utils.formatNumber(reel.likes.length)}</span>
                    </div>
                    
                    <div class="reel-action" data-action="comment">
                        <div class="reel-action-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </div>
                        <span>${Utils.formatNumber(comments.length)}</span>
                    </div>
                    
                    <div class="reel-action" data-action="share">
                        <div class="reel-action-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                        </div>
                        <span>${Utils.formatNumber(reel.shares)}</span>
                    </div>
                    
                    <div class="reel-action" data-action="profile">
                        <div class="reel-action-icon">
                            <img src="${user.avatar}" alt="${user.displayName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    handleReelAction(action, reelId) {
        const currentUser = auth.getCurrentUser();
        
        if (!currentUser) {
            Utils.showToast('login_required', 'error');
            return;
        }

        switch (action) {
            case 'like':
                this.toggleReelLike(reelId);
                break;
            case 'comment':
                this.showReelComments(reelId);
                break;
            case 'share':
                this.shareReel(reelId);
                break;
            case 'profile':
                const reel = this.reels.find(r => r.id === reelId);
                if (reel) {
                    profileManager.loadProfile(reel.userId);
                    window.app.switchView('profile');
                }
                break;
        }
    }

    toggleReelLike(reelId) {
        const currentUser = auth.getCurrentUser();
        const posts = storage.getPosts();
        const postIndex = posts.findIndex(p => p.id === reelId);
        
        if (postIndex === -1) return;

        const post = posts[postIndex];
        const likeIndex = post.likes.indexOf(currentUser.id);
        
        if (likeIndex > -1) {
            post.likes.splice(likeIndex, 1);
        } else {
            post.likes.push(currentUser.id);
            storage.saveUserInteraction(currentUser.id, 'likes', reelId);
        }
        
        storage.savePosts(posts);
        
        // Update UI
        const reelElement = document.querySelector(`[data-reel-id="${reelId}"]`);
        const likeButton = reelElement.querySelector('[data-action="like"]');
        const likeIcon = likeButton.querySelector('.reel-action-icon');
        const likeCount = likeButton.querySelector('span');
        
        if (post.likes.includes(currentUser.id)) {
            likeIcon.classList.add('liked');
            likeIcon.querySelector('svg').style.fill = '#ff3040';
        } else {
            likeIcon.classList.remove('liked');
            likeIcon.querySelector('svg').style.fill = 'none';
        }
        
        likeCount.textContent = Utils.formatNumber(post.likes.length);
        
        // Update reels array
        const reelIndex = this.reels.findIndex(r => r.id === reelId);
        if (reelIndex !== -1) {
            this.reels[reelIndex] = post;
        }
    }

    showReelComments(reelId) {
        postsManager.showComments({ dataset: { postId: reelId } });
    }

    shareReel(reelId) {
        postsManager.sharePost({ dataset: { postId: reelId }, querySelector: () => ({ textContent: '0' }) });
    }

    updateCurrentReel() {
        const reelsContainer = document.getElementById('reels-container');
        const reelItems = reelsContainer.querySelectorAll('.reel-item');
        
        let currentIndex = 0;
        let minDistance = Infinity;
        
        reelItems.forEach((item, index) => {
            const rect = item.getBoundingClientRect();
            const distance = Math.abs(rect.top);
            
            if (distance < minDistance) {
                minDistance = distance;
                currentIndex = index;
            }
        });
        
        if (currentIndex !== this.currentReelIndex) {
            this.pauseReel(this.currentReelIndex);
            this.playReel(currentIndex);
            this.currentReelIndex = currentIndex;
            
            // Track view
            const currentUser = auth.getCurrentUser();
            if (currentUser && this.reels[currentIndex]) {
                storage.saveUserInteraction(currentUser.id, 'views', this.reels[currentIndex].id);
                
                // Increase view count
                const posts = storage.getPosts();
                const postIndex = posts.findIndex(p => p.id === this.reels[currentIndex].id);
                if (postIndex !== -1) {
                    posts[postIndex].views++;
                    storage.savePosts(posts);
                }
            }
        }
    }

    playReel(index) {
        const reelItems = document.querySelectorAll('.reel-item');
        if (reelItems[index]) {
            const video = reelItems[index].querySelector('.reel-video');
            if (video) {
                video.play().catch(e => console.log('Video play failed:', e));
            }
        }
    }

    pauseReel(index) {
        const reelItems = document.querySelectorAll('.reel-item');
        if (reelItems[index]) {
            const video = reelItems[index].querySelector('.reel-video');
            if (video) {
                video.pause();
            }
        }
    }
}

// Create global reels instance
const reelsManager = new ReelsManager();