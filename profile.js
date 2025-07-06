// Enhanced profile management
class ProfileManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Profile actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.follow-btn')) {
                this.toggleFollow(e.target.closest('.follow-btn'));
            }
            
            if (e.target.closest('.edit-profile-btn')) {
                this.showEditProfile();
            }
            
            if (e.target.closest('.profile-post')) {
                const postId = e.target.closest('.profile-post').dataset.postId;
                this.viewPost(postId);
            }
        });
    }

    loadProfile(userId = null) {
        const currentUser = auth.getCurrentUser();
        const profileUser = userId ? storage.getUserById(userId) : currentUser;
        
        if (!profileUser) return;

        const isOwnProfile = profileUser.id === currentUser?.id;
        const isFollowing = currentUser ? profileUser.followers.includes(currentUser.id) : false;
        const userPosts = storage.getPostsByUserId(profileUser.id)
            .filter(post => post.type !== 'story' || !Utils.isStoryExpired(post.expiresAt))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const profileHtml = `
            <div class="profile-header">
                <div class="profile-avatar">
                    <img src="${profileUser.avatar}" alt="${profileUser.displayName}">
                </div>
                <h2 class="profile-name">
                    ${Utils.escapeHtml(profileUser.displayName)}
                    ${profileUser.verified ? '<span class="verified-badge">✓</span>' : ''}
                </h2>
                <p class="profile-username">@${Utils.escapeHtml(profileUser.username)}</p>
                ${profileUser.bio ? `<p class="profile-bio">${Utils.formatTextWithLinks(profileUser.bio)}</p>` : ''}
                
                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-number">${Utils.formatNumber(userPosts.length)}</span>
                        <span class="stat-label" data-tr="posts" data-en="Posts">Gönderi</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${Utils.formatNumber(profileUser.followers.length)}</span>
                        <span class="stat-label" data-tr="followers" data-en="Followers">Takipçi</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${Utils.formatNumber(profileUser.following.length)}</span>
                        <span class="stat-label" data-tr="following_count" data-en="Following">Takip</span>
                    </div>
                </div>
                
                <div class="profile-actions">
                    ${isOwnProfile ? `
                        <button class="btn-primary edit-profile-btn" data-tr="edit_profile" data-en="Edit Profile">Profili Düzenle</button>
                        <button class="btn-secondary" id="logout-btn" data-tr="logout" data-en="Logout">Çıkış Yap</button>
                    ` : `
                        <button class="btn-primary follow-btn ${isFollowing ? 'following' : ''}" data-user-id="${profileUser.id}">
                            ${isFollowing ? language.t('following') : language.t('follow')}
                        </button>
                        <button class="btn-secondary message-btn" data-user-id="${profileUser.id}" data-tr="message" data-en="Message">Mesaj</button>
                    `}
                </div>
            </div>
            
            <div class="profile-posts">
                <h3 data-tr="posts" data-en="Posts">Gönderiler</h3>
                <div class="posts-grid">
                    ${userPosts.length > 0 ? userPosts.map(post => this.renderProfilePost(post)).join('') : 
                        `<p class="empty-state" data-tr="no_posts_yet" data-en="No posts yet">Henüz gönderi yok</p>`}
                </div>
            </div>
        `;

        document.getElementById('profile-container').innerHTML = profileHtml;

        // Update language
        language.updateLanguage();

        // Setup logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm(language.t('confirm_logout') || 'Çıkış yapmak istediğinizden emin misiniz?')) {
                    auth.logout();
                }
            });
        }

        // Setup message button
        const messageBtn = document.querySelector('.message-btn');
        if (messageBtn) {
            messageBtn.addEventListener('click', () => {
                chatManager.startNewChat(profileUser.id);
                window.app.switchView('chat');
            });
        }
    }

    renderProfilePost(post) {
        const comments = storage.getCommentsByPostId(post.id);
        
        return `
            <div class="profile-post" data-post-id="${post.id}">
                ${post.mediaUrl ? `
                    <img src="${post.thumbnailUrl || post.mediaUrl}" alt="Post">
                ` : `
                    <div class="text-post-preview">
                        <p>${Utils.escapeHtml(post.content).substring(0, 100)}${post.content.length > 100 ? '...' : ''}</p>
                    </div>
                `}
                <div class="post-overlay">
                    <div class="post-stats">
                        <span>❤️ ${Utils.formatNumber(post.likes.length)}</span>
                        <span>💬 ${Utils.formatNumber(comments.length)}</span>
                        <span>👁️ ${Utils.formatNumber(post.views)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    viewPost(postId) {
        const post = storage.getPosts().find(p => p.id === postId);
        if (!post) return;

        // Increase view count
        post.views++;
        const posts = storage.getPosts();
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
            posts[postIndex] = post;
            storage.savePosts(posts);
        }

        // Track view for algorithm
        const currentUser = auth.getCurrentUser();
        if (currentUser) {
            storage.saveUserInteraction(currentUser.id, 'views', postId);
        }

        // Show post in modal or navigate to appropriate view
        if (post.type === 'story') {
            postsManager.viewStory(postId);
        } else {
            // For now, just switch to feed view
            window.app.switchView('feed');
        }
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
            Utils.showToast('unfollow_success', 'success');
        } else {
            // Follow
            targetUser.followers.push(currentUser.id);
            currentUser.following.push(targetUserId);
            button.textContent = language.t('following');
            button.classList.add('following');
            Utils.showToast('follow_success', 'success');
            
            // Save interaction for algorithm
            storage.saveUserInteraction(currentUser.id, 'follows', targetUserId);
        }

        // Save changes
        storage.saveUser(targetUser);
        storage.saveUser(currentUser);
        auth.updateCurrentUser(currentUser);

        // Update stats
        this.loadProfile(targetUserId);
    }

    showEditProfile() {
        const currentUser = auth.getCurrentUser();
        
        const modalContent = `
            <div class="edit-profile-form">
                <h3 data-tr="edit_profile" data-en="Edit Profile">Profili Düzenle</h3>
                <form>
                    <div class="input-group">
                        <label data-tr="display_name" data-en="Display Name">Görünen Ad</label>
                        <input type="text" id="edit-displayname" value="${Utils.escapeHtml(currentUser.displayName)}">
                    </div>
                    <div class="input-group">
                        <label data-tr="bio" data-en="Bio">Biyografi</label>
                        <textarea id="edit-bio" placeholder="${language.t('tell_about_yourself') || 'Kendin hakkında anlat...'}">${Utils.escapeHtml(currentUser.bio || '')}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" id="cancel-edit" data-tr="cancel" data-en="Cancel">İptal</button>
                        <button type="submit" class="btn-primary" id="save-profile" data-tr="save_changes" data-en="Save Changes">Değişiklikleri Kaydet</button>
                    </div>
                </form>
            </div>
        `;

        Utils.showModal(modalContent);

        // Setup form handling
        const editForm = document.querySelector('.edit-profile-form form');
        const cancelBtn = document.getElementById('cancel-edit');
        
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });
        
        cancelBtn.addEventListener('click', () => {
            Utils.hideModal();
        });
    }

    saveProfile() {
        const displayName = document.getElementById('edit-displayname').value.trim();
        const bio = document.getElementById('edit-bio').value.trim();
        
        if (!displayName) {
            Utils.showToast('Görünen ad gerekli', 'error');
            return;
        }

        const currentUser = auth.getCurrentUser();
        const updatedData = {
            displayName: displayName,
            bio: bio
        };

        auth.updateCurrentUser(updatedData);
        Utils.hideModal();
        Utils.showToast('profile_updated', 'success');
        
        // Reload profile
        this.loadProfile();
    }
}

// Create global profile instance
const profileManager = new ProfileManager();