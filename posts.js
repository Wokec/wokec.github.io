// Enhanced posts management with real-time updates and post menu
class PostsManager {
    constructor() {
        this.currentPage = 0;
        this.postsPerPage = 10;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Post actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.like-btn')) {
                this.toggleLike(e.target.closest('.like-btn'));
            }
            
            if (e.target.closest('.comment-btn')) {
                this.showComments(e.target.closest('.comment-btn'));
            }
            
            if (e.target.closest('.share-btn')) {
                this.sharePost(e.target.closest('.share-btn'));
            }

            if (e.target.closest('.follow-btn')) {
                this.toggleFollow(e.target.closest('.follow-btn'));
            }

            if (e.target.closest('.post-menu')) {
                this.showPostMenu(e.target.closest('.post-menu'));
            }

            if (e.target.closest('.delete-post-btn')) {
                this.deletePost(e.target.closest('.delete-post-btn'));
            }

            if (e.target.closest('.not-interested-btn')) {
                this.markNotInterested(e.target.closest('.not-interested-btn'));
            }

            if (e.target.closest('.dislike-btn')) {
                this.markDislike(e.target.closest('.dislike-btn'));
            }
        });

        // Create post events
        const createButtons = {
            'create-reel': 'reel',
            'create-post': 'post',
            'create-story': 'story',
            'create-tweet': 'tweet'
        };

        Object.entries(createButtons).forEach(([buttonId, type]) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => this.startCreatePost(type));
            }
        });

        // Media upload
        const mediaInput = document.getElementById('media-input');
        const addMediaBtn = document.getElementById('add-media');
        
        if (addMediaBtn) {
            addMediaBtn.addEventListener('click', () => {
                mediaInput.click();
            });
        }
        
        if (mediaInput) {
            mediaInput.addEventListener('change', (e) => {
                this.handleMediaUpload(e.target.files[0]);
            });
        }

        // Publish post
        const publishBtn = document.getElementById('publish-post');
        if (publishBtn) {
            publishBtn.addEventListener('click', () => this.publishPost());
        }

        // Cancel create
        const cancelBtn = document.getElementById('cancel-create');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelCreate());
        }

        // Story clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.story-item') && !e.target.closest('.add-story')) {
                const storyId = e.target.closest('.story-item').dataset.storyId;
                if (storyId) {
                    this.viewStory(storyId);
                }
            }
            
            if (e.target.closest('.add-story')) {
                this.startCreatePost('story');
                window.app.switchView('create');
            }
        });

        // Real-time subscriptions
        realTimeManager.subscribe('new_post', (data) => {
            this.handleNewPost(data);
        });

        realTimeManager.subscribe('new_like', (data) => {
            this.handleNewLike(data);
        });

        realTimeManager.subscribe('new_comment', (data) => {
            this.handleNewComment(data);
        });
    }

    loadFeed() {
        const feedContainer = document.getElementById('feed-container');
        const currentUser = auth.getCurrentUser();
        
        if (!currentUser) return;

        // Get recommended posts using algorithm
        const recommendedPosts = Utils.getRecommendedContent(currentUser.id)
            .filter(post => post.type !== 'story' || !Utils.isStoryExpired(post.expiresAt))
            .slice(0, (this.currentPage + 1) * this.postsPerPage);

        feedContainer.innerHTML = recommendedPosts.map(post => this.renderPost(post)).join('');
        this.loadStories();
    }

    loadTweets() {
        const tweetsContainer = document.getElementById('tweets-container');
        const tweets = storage.getPostsByType('tweet')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        tweetsContainer.innerHTML = tweets.map(tweet => this.renderTweet(tweet)).join('');
    }

    loadStories() {
        const storiesList = document.getElementById('stories-list');
        const stories = storage.getPostsByType('story')
            .filter(story => !Utils.isStoryExpired(story.expiresAt))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Clear existing stories except add story button
        const addStoryElement = storiesList.querySelector('.add-story');
        storiesList.innerHTML = '';
        storiesList.appendChild(addStoryElement);
        
        const storiesHtml = stories.map(story => {
            const user = storage.getUserById(story.userId);
            const currentUser = auth.getCurrentUser();
            const isViewed = currentUser && storage.getUserInteractions(currentUser.id).views.includes(story.id);
            
            return `
                <div class="story-item ${isViewed ? 'viewed' : ''}" data-story-id="${story.id}">
                    <div class="story-avatar">
                        <img src="${user.avatar}" alt="${user.displayName}">
                    </div>
                    <span>${Utils.escapeHtml(user.displayName)}</span>
                </div>
            `;
        }).join('');
        
        addStoryElement.insertAdjacentHTML('afterend', storiesHtml);
    }

    renderPost(post) {
        const user = storage.getUserById(post.userId);
        const currentUser = auth.getCurrentUser();
        const isLiked = post.likes.includes(currentUser?.id);
        const comments = storage.getCommentsByPostId(post.id);
        const isFollowing = currentUser?.following.includes(post.userId);
        const canDelete = currentUser && (currentUser.id === post.userId || currentUser.isAdmin);

        return `
            <div class="post" data-post-id="${post.id}" data-user-id="${post.userId}">
                <div class="post-header">
                    <div class="post-avatar" onclick="profileManager.loadProfile('${post.userId}'); window.app.switchView('profile');">
                        <img src="${user.avatar}" alt="${user.displayName}">
                    </div>
                    <div class="post-user-info">
                        <div class="post-username" onclick="profileManager.loadProfile('${post.userId}'); window.app.switchView('profile');">
                            ${Utils.escapeHtml(user.displayName)}
                            ${user.isPremium ? '<span class="verified-badge"></span>' : ''}
                            ${user.isAdmin && !user.isSuperAdmin ? '<span class="admin-badge"></span>' : ''}
                            ${user.isSuperAdmin ? '<span class="super-admin-badge"></span>' : ''}
                            ${post.userId !== currentUser?.id ? `
                                <button class="follow-btn ${isFollowing ? 'following' : ''}" data-user-id="${post.userId}">
                                    ${isFollowing ? language.t('following') : language.t('follow')}
                                </button>
                            ` : ''}
                        </div>
                        <div class="post-time">${Utils.formatTimeAgo(post.createdAt)}</div>
                    </div>
                </div>
                
                ${currentUser ? `
                    <button class="post-menu" data-post-id="${post.id}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                    </button>
                ` : ''}
                
                <div class="post-content">
                    ${post.mediaUrl ? `
                        <img src="${post.mediaUrl}" alt="Post media" class="post-media">
                    ` : ''}
                    ${post.content ? `
                        <div class="post-text">${Utils.formatTextWithLinks(post.content)}</div>
                    ` : ''}
                </div>
                
                <div class="post-actions">
                    <div class="post-action-group">
                        <button class="post-action like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="${isLiked ? '#ff3040' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span>${Utils.formatNumber(post.likes.length)}</span>
                        </button>
                        
                        <button class="post-action comment-btn" data-post-id="${post.id}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>${Utils.formatNumber(comments.length)}</span>
                        </button>
                        
                        <button class="post-action share-btn" data-post-id="${post.id}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                            <span>${Utils.formatNumber(post.shares)}</span>
                        </button>
                    </div>
                    
                    <div class="post-stats">
                        <span>${Utils.formatNumber(post.views)} ${language.t('views')}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderTweet(tweet) {
        const user = storage.getUserById(tweet.userId);
        const currentUser = auth.getCurrentUser();
        const isLiked = tweet.likes.includes(currentUser?.id);
        const comments = storage.getCommentsByPostId(tweet.id);
        const isFollowing = currentUser?.following.includes(tweet.userId);

        return `
            <div class="tweet-item" data-post-id="${tweet.id}" data-user-id="${tweet.userId}">
                <div class="tweet-header">
                    <div class="post-avatar" onclick="profileManager.loadProfile('${tweet.userId}'); window.app.switchView('profile');">
                        <img src="${user.avatar}" alt="${user.displayName}">
                    </div>
                    <div class="post-user-info">
                        <div class="post-username" onclick="profileManager.loadProfile('${tweet.userId}'); window.app.switchView('profile');">
                            ${Utils.escapeHtml(user.displayName)}
                            ${user.isPremium ? '<span class="verified-badge"></span>' : ''}
                            ${user.isAdmin && !user.isSuperAdmin ? '<span class="admin-badge"></span>' : ''}
                            ${user.isSuperAdmin ? '<span class="super-admin-badge"></span>' : ''}
                            ${tweet.userId !== currentUser?.id ? `
                                <button class="follow-btn ${isFollowing ? 'following' : ''}" data-user-id="${tweet.userId}">
                                    ${isFollowing ? language.t('following') : language.t('follow')}
                                </button>
                            ` : ''}
                        </div>
                        <div class="post-time">${Utils.formatTimeAgo(tweet.createdAt)}</div>
                    </div>
                </div>
                
                ${currentUser ? `
                    <button class="post-menu" data-post-id="${tweet.id}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                    </button>
                ` : ''}
                
                <div class="tweet-content">
                    ${Utils.formatTextWithLinks(tweet.content)}
                </div>
                
                <div class="post-actions">
                    <div class="post-action-group">
                        <button class="post-action like-btn ${isLiked ? 'liked' : ''}" data-post-id="${tweet.id}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="${isLiked ? '#ff3040' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span>${Utils.formatNumber(tweet.likes.length)}</span>
                        </button>
                        
                        <button class="post-action comment-btn" data-post-id="${tweet.id}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>${Utils.formatNumber(comments.length)}</span>
                        </button>
                        
                        <button class="post-action share-btn" data-post-id="${tweet.id}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                            <span>${Utils.formatNumber(tweet.shares)}</span>
                        </button>
                    </div>
                    
                    <div class="post-stats">
                        <span>${Utils.formatNumber(tweet.views)} ${language.t('views')}</span>
                    </div>
                </div>
            </div>
        `;
    }

    showPostMenu(button) {
        const postId = button.dataset.postId;
        const post = storage.getPosts().find(p => p.id === postId);
        const currentUser = auth.getCurrentUser();
        
        if (!post || !currentUser) return;

        const canDelete = currentUser.id === post.userId || currentUser.isAdmin;
        const isOwnPost = currentUser.id === post.userId;

        const menuItems = [];
        
        if (canDelete) {
            menuItems.push(`
                <button class="menu-item delete-post-btn" data-post-id="${postId}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                    </svg>
                    Sil
                </button>
            `);
        }
        
        if (!isOwnPost) {
            menuItems.push(`
                <button class="menu-item not-interested-btn" data-post-id="${postId}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    İlgilenmiyorum
                </button>
            `);
            
            menuItems.push(`
                <button class="menu-item dislike-btn" data-post-id="${postId}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                    </svg>
                    Sevmedim
                </button>
            `);
        }

        const modalContent = `
            <div class="post-menu-modal">
                <h3>Gönderi Seçenekleri</h3>
                <div class="menu-items">
                    ${menuItems.join('')}
                </div>
            </div>
        `;

        Utils.showModal(modalContent);
    }

    deletePost(button) {
        const postId = button.dataset.postId;
        const currentUser = auth.getCurrentUser();
        
        if (!currentUser) return;

        if (confirm('Bu gönderiyi silmek istediğinizden emin misiniz?')) {
            storage.deletePost(postId);
            Utils.hideModal();
            Utils.showToast('Gönderi silindi', 'success');
            
            // Log activity
            storage.saveActivityLog({
                userId: currentUser.id,
                action: 'delete_post',
                targetId: postId,
                timestamp: new Date().toISOString()
            });
            
            // Refresh current view
            this.refreshCurrentView();
        }
    }

    markNotInterested(button) {
        const postId = button.dataset.postId;
        const currentUser = auth.getCurrentUser();
        
        if (!currentUser) return;

        // Save user preference
        storage.saveUserInteraction(currentUser.id, 'not_interested', postId);
        
        Utils.hideModal();
        Utils.showToast('Bu tür içerikler daha az gösterilecek', 'info');
        
        // Remove post from current view
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                postElement.remove();
            }, 300);
        }
    }

    markDislike(button) {
        const postId = button.dataset.postId;
        const currentUser = auth.getCurrentUser();
        
        if (!currentUser) return;

        // Save user preference
        storage.saveUserInteraction(currentUser.id, 'dislikes', postId);
        
        Utils.hideModal();
        Utils.showToast('Geri bildiriminiz kaydedildi', 'info');
        
        // Remove post from current view
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                postElement.remove();
            }, 300);
        }
    }

    toggleLike(button) {
        const postId = button.dataset.postId;
        const currentUser = auth.getCurrentUser();
        
        if (!currentUser) {
            Utils.showToast('login_required', 'error');
            return;
        }

        const posts = storage.getPosts();
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex === -1) return;

        const post = posts[postIndex];
        const likeIndex = post.likes.indexOf(currentUser.id);
        
        if (likeIndex > -1) {
            post.likes.splice(likeIndex, 1);
            button.classList.remove('liked');
        } else {
            post.likes.push(currentUser.id);
            button.classList.add('liked');
            
            // Save interaction for algorithm
            storage.saveUserInteraction(currentUser.id, 'likes', postId);
            
            // Broadcast real-time update
            realTimeManager.broadcastUpdate('new_like', {
                postId: postId,
                userId: currentUser.id
            });
        }
        
        storage.savePosts(posts);
        
        // Update UI with animation
        const likeCount = button.querySelector('span');
        likeCount.textContent = Utils.formatNumber(post.likes.length);
        
        const heartIcon = button.querySelector('svg');
        if (post.likes.includes(currentUser.id)) {
            heartIcon.style.fill = '#ff3040';
            heartIcon.style.animation = 'heartBeat 0.6s ease';
        } else {
            heartIcon.style.fill = 'none';
        }
        
        // Reset animation
        setTimeout(() => {
            heartIcon.style.animation = '';
        }, 600);
    }

    toggleFollow(button) {
        const targetUserId = button.dataset.userId;
        const currentUser = auth.getCurrentUser();
        
        if (!currentUser) {
            Utils.showToast('login_required', 'error');
            return;
        }

        const targetUser = storage.getUserById(targetUserId);
        if (!targetUser) return;

        const isFollowing = targetUser.followers.includes(currentUser.id);
        
        if (isFollowing) {
            // Unfollow
            targetUser.followers = targetUser.followers.filter(id => id !== currentUser.id);
            currentUser.following = currentUser.following.filter(id => id !== targetUserId);
            button.textContent = language.t('follow');
            button.classList.remove('following');
        } else {
            // Follow
            targetUser.followers.push(currentUser.id);
            currentUser.following.push(targetUserId);
            button.textContent = language.t('following');
            button.classList.add('following');
            
            // Save interaction for algorithm
            storage.saveUserInteraction(currentUser.id, 'follows', targetUserId);
            
            // Broadcast real-time update
            realTimeManager.broadcastUpdate('new_follow', {
                followerId: currentUser.id,
                followedId: targetUserId
            });
        }

        // Save changes
        storage.saveUser(targetUser);
        storage.saveUser(currentUser);
        auth.updateCurrentUser(currentUser);
    }

    showComments(button) {
        const postId = button.dataset.postId;
        const comments = storage.getCommentsByPostId(postId);
        const post = storage.getPosts().find(p => p.id === postId);
        
        if (!post) return;

        const commentsHtml = comments.map(comment => {
            const user = storage.getUserById(comment.userId);
            const currentUser = auth.getCurrentUser();
            const isLiked = comment.likes.includes(currentUser?.id);
            const isAuthor = post.userId === comment.userId;
            
            return `
                <div class="comment">
                    <div class="comment-header">
                        <img src="${user.avatar}" alt="${user.displayName}" class="comment-avatar">
                        <span class="comment-username">
                            ${Utils.escapeHtml(user.displayName)}
                            ${isAuthor ? '<span class="author-badge">Yazar</span>' : ''}
                        </span>
                        <span class="comment-time">${Utils.formatTimeAgo(comment.createdAt)}</span>
                    </div>
                    <div class="comment-content">${Utils.formatTextWithLinks(comment.content)}</div>
                    <div class="comment-actions">
                        <button class="comment-like-btn ${isLiked ? 'liked' : ''}" data-comment-id="${comment.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isLiked ? '#ff3040' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            ${comment.likes.length > 0 ? `<span>${comment.likes.length}</span>` : ''}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        const modalContent = `
            <div class="comments-modal">
                <h3 data-tr="comments" data-en="Comments">Yorumlar</h3>
                <div class="comments-list">
                    ${commentsHtml || `<p data-tr="no_comments" data-en="No comments yet. Be the first to comment!">Henüz yorum yok. İlk yorumu sen yap!</p>`}
                </div>
                <div class="comment-form">
                    <textarea id="new-comment" data-tr="write_comment" data-en="Write a comment..." placeholder="Yorum yaz..."></textarea>
                    <button id="post-comment" class="btn-primary" data-post-id="${postId}" data-tr="post_comment" data-en="Post Comment">Yorumu Gönder</button>
                </div>
            </div>
        `;

        Utils.showModal(modalContent);

        // Setup comment posting
        const postCommentBtn = document.getElementById('post-comment');
        if (postCommentBtn) {
            postCommentBtn.addEventListener('click', () => this.postComment(postId));
        }

        // Setup comment liking
        document.addEventListener('click', (e) => {
            if (e.target.closest('.comment-like-btn')) {
                this.toggleCommentLike(e.target.closest('.comment-like-btn'));
            }
        });
    }

    toggleCommentLike(button) {
        const commentId = button.dataset.commentId;
        const currentUser = auth.getCurrentUser();
        
        if (!currentUser) {
            Utils.showToast('login_required', 'error');
            return;
        }

        const comments = storage.getComments();
        const commentIndex = comments.findIndex(c => c.id === commentId);
        
        if (commentIndex === -1) return;

        const comment = comments[commentIndex];
        const likeIndex = comment.likes.indexOf(currentUser.id);
        
        if (likeIndex > -1) {
            comment.likes.splice(likeIndex, 1);
            button.classList.remove('liked');
        } else {
            comment.likes.push(currentUser.id);
            button.classList.add('liked');
        }
        
        storage.saveComments(comments);
        
        // Update UI
        const heartIcon = button.querySelector('svg');
        const likeCount = button.querySelector('span');
        
        if (comment.likes.includes(currentUser.id)) {
            heartIcon.style.fill = '#ff3040';
        } else {
            heartIcon.style.fill = 'none';
        }
        
        if (comment.likes.length > 0) {
            if (!likeCount) {
                button.insertAdjacentHTML('beforeend', `<span>${comment.likes.length}</span>`);
            } else {
                likeCount.textContent = comment.likes.length;
            }
        } else if (likeCount) {
            likeCount.remove();
        }
    }

    postComment(postId) {
        const commentText = document.getElementById('new-comment').value.trim();
        const currentUser = auth.getCurrentUser();
        
        if (!currentUser) {
            Utils.showToast('login_required', 'error');
            return;
        }
        
        if (!commentText) {
            Utils.showToast('Lütfen bir yorum girin', 'error');
            return;
        }

        const newComment = {
            id: Utils.generateId(),
            userId: currentUser.id,
            postId: postId,
            content: commentText,
            likes: [],
            createdAt: new Date().toISOString()
        };

        storage.saveComment(newComment);
        
        // Save interaction for algorithm
        storage.saveUserInteraction(currentUser.id, 'comments', postId);
        
        // Broadcast real-time update
        realTimeManager.broadcastUpdate('new_comment', {
            postId: postId,
            comment: newComment
        });
        
        Utils.hideModal();
        Utils.showToast('comment_posted', 'success');
        
        // Refresh the current view
        this.refreshCurrentView();
    }

    sharePost(button) {
        const postId = button.dataset.postId;
        const currentUser = auth.getCurrentUser();
        
        if (!currentUser) {
            Utils.showToast('login_required', 'error');
            return;
        }

        // Show share modal
        this.showShareModal(postId);
    }

    showShareModal(postId) {
        const modalContent = `
            <div class="share-modal">
                <h3>Paylaş</h3>
                <div class="share-options">
                    <button class="share-option" id="share-to-chat" data-post-id="${postId}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span>Mesajla Paylaş</span>
                    </button>
                    <button class="share-option" id="copy-link" data-post-id="${postId}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        <span>Linki Kopyala</span>
                    </button>
                </div>
                <div class="share-chats hidden" id="share-chats">
                    <h4>Kime göndermek istiyorsun?</h4>
                    <div class="chat-list-share" id="chat-list-share">
                        <!-- Chat list for sharing will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        Utils.showModal(modalContent);

        // Setup share options
        document.getElementById('share-to-chat').addEventListener('click', () => {
            this.showChatListForSharing(postId);
        });

        document.getElementById('copy-link').addEventListener('click', () => {
            navigator.clipboard.writeText(`${window.location.origin}#post/${postId}`)
                .then(() => {
                    Utils.hideModal();
                    Utils.showToast('Link panoya kopyalandı!', 'success');
                    
                    // Increase share count
                    this.incrementShareCount(postId);
                });
        });
    }

    showChatListForSharing(postId) {
        const currentUser = auth.getCurrentUser();
        const chats = storage.getChatsByUserId(currentUser.id);
        
        const chatsHtml = chats.map(chat => {
            const otherParticipant = chat.participants.find(p => p !== currentUser.id);
            const otherUser = storage.getUserById(otherParticipant);
            
            return `
                <div class="chat-item-share" data-chat-id="${chat.id}" data-post-id="${postId}">
                    <img src="${otherUser?.avatar || Utils.getDefaultAvatar(otherUser?.username || 'U')}" alt="${otherUser?.displayName || 'User'}">
                    <span>${Utils.escapeHtml(otherUser?.displayName || 'Bilinmeyen Kullanıcı')}</span>
                </div>
            `;
        }).join('');

        document.getElementById('share-chats').classList.remove('hidden');
        document.getElementById('chat-list-share').innerHTML = chatsHtml;

        // Setup chat selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.chat-item-share')) {
                const chatId = e.target.closest('.chat-item-share').dataset.chatId;
                const postId = e.target.closest('.chat-item-share').dataset.postId;
                this.shareToChat(chatId, postId);
            }
        });
    }

    shareToChat(chatId, postId) {
        const currentUser = auth.getCurrentUser();
        const post = storage.getPosts().find(p => p.id === postId);
        
        if (!post) return;

        const shareMessage = {
            id: Utils.generateId(),
            chatId: chatId,
            userId: currentUser.id,
            content: `Gönderi paylaştı: ${post.content.substring(0, 100)}... ${window.location.origin}#post/${postId}`,
            type: 'text',
            createdAt: new Date().toISOString()
        };

        storage.saveMessage(shareMessage);
        
        Utils.hideModal();
        Utils.showToast('Gönderi paylaşıldı!', 'success');
        
        // Increase share count
        this.incrementShareCount(postId);
    }

    incrementShareCount(postId) {
        const posts = storage.getPosts();
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
            posts[postIndex].shares++;
            storage.savePosts(posts);
            
            // Update UI
            const shareBtn = document.querySelector(`[data-post-id="${postId}"] .share-btn span`);
            if (shareBtn) {
                shareBtn.textContent = Utils.formatNumber(posts[postIndex].shares);
            }
        }
    }

    startCreatePost(type) {
        this.currentPostType = type;
        
        // Show create form
        document.getElementById('create-form').classList.remove('hidden');
        
        // Set placeholder based on type
        const textarea = document.getElementById('post-content');
        const mediaUpload = document.getElementById('media-upload');
        
        switch (type) {
            case 'reel':
                textarea.placeholder = language.t('describe_reel') || 'Reel\'ini anlat...';
                mediaUpload.classList.remove('hidden');
                break;
            case 'post':
                textarea.placeholder = language.t('whats_on_mind');
                mediaUpload.classList.remove('hidden');
                break;
            case 'story':
                textarea.placeholder = language.t('share_story') || 'Hikayeni paylaş...';
                mediaUpload.classList.remove('hidden');
                break;
            case 'tweet':
                textarea.placeholder = language.t('whats_happening') || 'Neler oluyor?';
                mediaUpload.classList.add('hidden');
                break;
        }
    }

    handleMediaUpload(file) {
        Utils.handleFileUpload(file, (dataUrl, fileType) => {
            this.currentMediaUrl = dataUrl;
            this.currentMediaType = fileType;
            
            // Show preview
            const preview = document.getElementById('media-preview');
            if (fileType.startsWith('image/')) {
                preview.innerHTML = `<img src="${dataUrl}" alt="Preview">`;
            } else if (fileType.startsWith('video/')) {
                preview.innerHTML = `<video src="${dataUrl}" controls></video>`;
            }
            preview.classList.remove('hidden');
        });
    }

    publishPost() {
        const content = document.getElementById('post-content').value.trim();
        const currentUser = auth.getCurrentUser();
        
        if (!currentUser) {
            Utils.showToast('login_required', 'error');
            return;
        }
        
        if (!content && !this.currentMediaUrl) {
            Utils.showToast('Lütfen içerik veya medya ekleyin', 'error');
            return;
        }

        const newPost = {
            id: Utils.generateId(),
            userId: currentUser.id,
            type: this.currentPostType,
            content: content,
            mediaUrl: this.currentMediaUrl || null,
            thumbnailUrl: this.currentMediaUrl || null,
            likes: [],
            comments: [],
            shares: 0,
            views: Math.floor(Math.random() * 100) + 1, // Random initial views
            createdAt: new Date().toISOString(),
        };

        // Add expiration for stories (24 hours)
        if (this.currentPostType === 'story') {
            newPost.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        }

        storage.savePost(newPost);
        
        // Broadcast real-time update
        realTimeManager.broadcastUpdate('new_post', { post: newPost });
        
        this.cancelCreate();
        
        // Show success message based on type
        const successMessages = {
            'reel': 'Reel yayınlandı!',
            'post': 'post_published',
            'story': 'story_published',
            'tweet': 'tweet_published'
        };
        
        Utils.showToast(successMessages[this.currentPostType], 'success');
        
        // Log activity
        storage.saveActivityLog({
            userId: currentUser.id,
            action: 'create_post',
            targetId: newPost.id,
            details: this.currentPostType,
            timestamp: new Date().toISOString()
        });
        
        // Refresh appropriate view
        this.refreshCurrentView();
        
        // Switch to appropriate view
        if (this.currentPostType === 'tweet') {
            window.app.switchView('tweets');
        } else {
            window.app.switchView('feed');
        }
    }

    cancelCreate() {
        // Reset form
        document.getElementById('post-content').value = '';
        document.getElementById('media-preview').classList.add('hidden');
        document.getElementById('create-form').classList.add('hidden');
        
        // Reset variables
        this.currentMediaUrl = null;
        this.currentMediaType = null;
        this.currentPostType = null;
        
        // Switch back to feed
        window.app.switchView('feed');
    }

    viewStory(storyId) {
        const story = storage.getPosts().find(p => p.id === storyId && p.type === 'story');
        if (!story || Utils.isStoryExpired(story.expiresAt)) {
            Utils.showToast('Hikaye bulunamadı veya süresi dolmuş', 'error');
            return;
        }

        const user = storage.getUserById(story.userId);
        const currentUser = auth.getCurrentUser();
        
        const storyHtml = `
            <div class="story-viewer-content">
                <div class="story-header">
                    <div class="story-user">
                        <img src="${user.avatar}" alt="${user.displayName}">
                        <span>${Utils.escapeHtml(user.displayName)}</span>
                    </div>
                    <div class="story-time">${Utils.formatTimeAgo(story.createdAt)}</div>
                    <button class="close-story">×</button>
                </div>
                
                <div class="story-content">
                    ${story.mediaUrl ? `
                        <img src="${story.mediaUrl}" alt="Story">
                    ` : ''}
                    ${story.content ? `
                        <div class="story-text">${Utils.formatTextWithLinks(story.content)}</div>
                    ` : ''}
                </div>
                
                ${currentUser ? `
                    <div class="story-actions">
                        <button class="story-action like-btn ${story.likes.includes(currentUser.id) ? 'liked' : ''}" data-story-id="${story.id}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="${story.likes.includes(currentUser.id) ? '#ff3040' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                        <button class="story-action comment-btn" data-story-id="${story.id}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </button>
                    </div>
                ` : ''}
                
                <div class="story-progress">
                    <div class="progress-bar"></div>
                </div>
            </div>
        `;

        document.getElementById('stories-viewer').innerHTML = storyHtml;
        window.app.switchView('stories');

        // Auto close after 5 seconds
        const autoCloseTimer = setTimeout(() => {
            window.app.switchView('feed');
        }, 5000);

        // Close story on click
        document.querySelector('.close-story').addEventListener('click', () => {
            clearTimeout(autoCloseTimer);
            window.app.switchView('feed');
        });

        // Story actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.story-action.like-btn')) {
                this.toggleStoryLike(e.target.closest('.story-action.like-btn'));
            }
            if (e.target.closest('.story-action.comment-btn')) {
                this.showStoryComments(e.target.closest('.story-action.comment-btn'));
            }
        });
        
        // Track view
        if (currentUser) {
            storage.saveUserInteraction(currentUser.id, 'views', storyId);
            
            // Mark story as viewed
            const storyElement = document.querySelector(`[data-story-id="${storyId}"]`);
            if (storyElement) {
                storyElement.classList.add('viewed');
            }
        }
    }

    toggleStoryLike(button) {
        const storyId = button.dataset.storyId;
        const currentUser = auth.getCurrentUser();
        
        if (!currentUser) return;

        const posts = storage.getPosts();
        const storyIndex = posts.findIndex(p => p.id === storyId);
        
        if (storyIndex === -1) return;

        const story = posts[storyIndex];
        const likeIndex = story.likes.indexOf(currentUser.id);
        
        if (likeIndex > -1) {
            story.likes.splice(likeIndex, 1);
            button.classList.remove('liked');
        } else {
            story.likes.push(currentUser.id);
            button.classList.add('liked');
            
            // Send notification to story owner
            if (story.userId !== currentUser.id) {
                realTimeManager.broadcastUpdate('story_like', {
                    storyId: storyId,
                    likerId: currentUser.id,
                    storyOwnerId: story.userId
                });
            }
        }
        
        storage.savePosts(posts);
        
        // Update UI
        const heartIcon = button.querySelector('svg');
        if (story.likes.includes(currentUser.id)) {
            heartIcon.style.fill = '#ff3040';
        } else {
            heartIcon.style.fill = 'none';
        }
    }

    showStoryComments(button) {
        const storyId = button.dataset.storyId;
        this.showComments({ dataset: { postId: storyId } });
    }

    refreshCurrentView() {
        if (!window.app) return;
        
        switch (window.app.currentView) {
            case 'feed':
                this.loadFeed();
                break;
            case 'tweets':
                this.loadTweets();
                break;
            case 'reels':
                reelsManager.loadReels();
                break;
            case 'profile':
                profileManager.loadProfile();
                break;
        }
    }

    // Real-time event handlers
    handleNewPost(data) {
        if (window.app && (window.app.currentView === 'feed' || window.app.currentView === 'tweets')) {
            this.refreshCurrentView();
        }
    }

    handleNewLike(data) {
        // Update like count in real-time
        const postElement = document.querySelector(`[data-post-id="${data.postId}"]`);
        if (postElement) {
            const post = storage.getPosts().find(p => p.id === data.postId);
            if (post) {
                const likeBtn = postElement.querySelector('.like-btn span');
                if (likeBtn) {
                    likeBtn.textContent = Utils.formatNumber(post.likes.length);
                }
            }
        }
    }

    handleNewComment(data) {
        // Update comment count in real-time
        const postElement = document.querySelector(`[data-post-id="${data.postId}"]`);
        if (postElement) {
            const comments = storage.getCommentsByPostId(data.postId);
            const commentBtn = postElement.querySelector('.comment-btn span');
            if (commentBtn) {
                commentBtn.textContent = Utils.formatNumber(comments.length);
            }
        }
    }
}

// Create global posts instance
const postsManager = new PostsManager();