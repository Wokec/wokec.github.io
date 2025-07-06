// Explore management
class ExploreManager {
    constructor() {
        this.currentTab = 'trending';
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.closest('.explore-tab')) {
                const tab = e.target.closest('.explore-tab').dataset.tab;
                this.switchTab(tab);
            }
            
            if (e.target.closest('.explore-item')) {
                const postId = e.target.closest('.explore-item').dataset.postId;
                this.viewExplorePost(postId);
            }
        });
    }

    loadExplore() {
        this.loadExploreContent();
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update active tab
        document.querySelectorAll('.explore-tab').forEach(tabEl => {
            tabEl.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Load content for tab
        this.loadExploreContent();
    }

    loadExploreContent() {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) return;

        let posts = [];
        
        switch (this.currentTab) {
            case 'trending':
                posts = this.getTrendingPosts();
                break;
            case 'recent':
                posts = this.getRecentPosts();
                break;
            case 'popular':
                posts = this.getPopularPosts();
                break;
        }

        const exploreGrid = document.getElementById('explore-grid');
        
        if (posts.length === 0) {
            exploreGrid.innerHTML = `
                <div class="empty-state">
                    <h3 data-tr="no_content" data-en="No content available">İçerik bulunamadı</h3>
                    <p data-tr="try_different_tab" data-en="Try a different tab">Farklı bir sekme deneyin</p>
                </div>
            `;
            return;
        }

        const postsHtml = posts.map(post => this.renderExploreItem(post)).join('');
        exploreGrid.innerHTML = postsHtml;
        
        // Update language
        language.updateLanguage();
    }

    getTrendingPosts() {
        const posts = storage.getPosts()
            .filter(post => post.type !== 'story' || !Utils.isStoryExpired(post.expiresAt));
        
        // Calculate trending score based on recent engagement
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        
        return posts
            .map(post => {
                const postTime = new Date(post.createdAt).getTime();
                const recencyFactor = postTime > oneDayAgo ? 2 : 1;
                const trendingScore = (post.likes.length * 3 + post.shares * 5 + Math.log(post.views + 1)) * recencyFactor;
                return { ...post, trendingScore };
            })
            .sort((a, b) => b.trendingScore - a.trendingScore)
            .slice(0, 20);
    }

    getRecentPosts() {
        return storage.getPosts()
            .filter(post => post.type !== 'story' || !Utils.isStoryExpired(post.expiresAt))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 20);
    }

    getPopularPosts() {
        return storage.getPosts()
            .filter(post => post.type !== 'story' || !Utils.isStoryExpired(post.expiresAt))
            .sort((a, b) => {
                const aScore = a.likes.length * 2 + a.shares * 3 + Math.log(a.views + 1);
                const bScore = b.likes.length * 2 + b.shares * 3 + Math.log(b.views + 1);
                return bScore - aScore;
            })
            .slice(0, 20);
    }

    renderExploreItem(post) {
        const comments = storage.getCommentsByPostId(post.id);
        
        return `
            <div class="explore-item" data-post-id="${post.id}">
                ${post.mediaUrl ? `
                    <img src="${post.thumbnailUrl || post.mediaUrl}" alt="Post">
                ` : `
                    <div class="text-post-preview" style="background: linear-gradient(45deg, #667eea, #764ba2);">
                        <p>${Utils.escapeHtml(post.content).substring(0, 100)}${post.content.length > 100 ? '...' : ''}</p>
                    </div>
                `}
                <div class="explore-overlay">
                    <div class="explore-stats">
                        <span>❤️ ${Utils.formatNumber(post.likes.length)}</span>
                        <span>💬 ${Utils.formatNumber(comments.length)}</span>
                        <span>👁️ ${Utils.formatNumber(post.views)}</span>
                    </div>
                    ${post.trendingScore && this.currentTab === 'trending' ? 
                        '<div class="trending-indicator">TREND</div>' : ''}
                </div>
            </div>
        `;
    }

    viewExplorePost(postId) {
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

        // Navigate to appropriate view based on post type
        switch (post.type) {
            case 'reel':
                window.app.switchView('reels');
                break;
            case 'story':
                postsManager.viewStory(postId);
                break;
            case 'tweet':
                window.app.switchView('tweets');
                break;
            default:
                window.app.switchView('feed');
                break;
        }
    }
}

// Create global explore instance
const exploreManager = new ExploreManager();