// Enhanced utility functions
class Utils {
    // XSS Protection
    static sanitizeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    // Time formatting with language support
    static formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);
        const lang = language.getCurrentLanguage();

        if (diffInSeconds < 60) {
            return language.t('just_now');
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} ${language.t('minutes_ago')}`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} ${language.t('hours_ago')}`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} ${language.t('days_ago')}`;
        } else {
            return date.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US');
        }
    }

    // Generate unique IDs
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Format numbers with language support
    static formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Validate email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate username
    static isValidUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    }

    // Show toast notification with language support
    static showToast(messageKey, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Check if messageKey is a translation key or direct message
        const message = language.t(messageKey) !== messageKey ? language.t(messageKey) : messageKey;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Show modal
    static showModal(content) {
        const modalOverlay = document.getElementById('modal-overlay');
        const modal = document.getElementById('modal');
        
        modal.innerHTML = content;
        modalOverlay.classList.remove('hidden');
        
        // Close modal on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                Utils.hideModal();
            }
        });
        
        // Update language for modal content
        language.updateLanguage();
    }

    static hideModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        modalOverlay.classList.add('hidden');
    }

    // File upload handler with better validation
    static handleFileUpload(file, callback) {
        if (!file) return;
        
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            Utils.showToast('Dosya boyutu 10MB\'dan küçük olmalı', 'error');
            return;
        }
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
        if (!allowedTypes.includes(file.type)) {
            Utils.showToast('Desteklenmeyen dosya türü', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            callback(e.target.result, file.type);
        };
        reader.readAsDataURL(file);
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Check if stories are expired
    static isStoryExpired(expiresAt) {
        if (!expiresAt) return false;
        return new Date() > new Date(expiresAt);
    }

    // Get default avatar with better design
    static getDefaultAvatar(username) {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
        const colorIndex = username.charCodeAt(0) % colors.length;
        const color = colors[colorIndex];
        
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${color}dd;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="150" height="150" fill="url(#grad)"/>
                <text x="75" y="85" font-family="Inter, Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" font-weight="600">
                    ${username.charAt(0).toUpperCase()}
                </text>
            </svg>
        `)}`;
    }

    // Infinite scroll handler
    static setupInfiniteScroll(container, loadMore) {
        let loading = false;
        
        container.addEventListener('scroll', Utils.debounce(() => {
            if (loading) return;
            
            const { scrollTop, scrollHeight, clientHeight } = container;
            
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                loading = true;
                loadMore().finally(() => {
                    loading = false;
                });
            }
        }, 200));
    }

    // Create ripple effect
    static createRipple(button, event) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.className = 'ripple';
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            if (button.contains(ripple)) {
                ripple.remove();
            }
        }, 600);
    }

    // Algorithm for content recommendation
    static getRecommendedContent(userId, contentType = 'all') {
        const currentUser = storage.getCurrentUser();
        if (!currentUser) return [];

        const posts = storage.getPosts();
        const userInteractions = storage.getUserInteractions(userId);
        const following = currentUser.following || [];

        // Score posts based on various factors
        const scoredPosts = posts.map(post => {
            let score = 0;
            
            // Recent posts get higher score
            const ageInHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
            score += Math.max(0, 24 - ageInHours) * 2;
            
            // Posts from followed users get higher score
            if (following.includes(post.userId)) {
                score += 50;
            }
            
            // Popular posts get higher score
            score += post.likes.length * 3;
            score += post.comments.length * 5;
            score += post.shares * 2;
            score += Math.log(post.views + 1) * 2;
            
            // User interaction history
            const userLikes = userInteractions.likes || [];
            const userComments = userInteractions.comments || [];
            
            // Similar content preference
            if (userLikes.some(likedPostId => {
                const likedPost = posts.find(p => p.id === likedPostId);
                return likedPost && likedPost.type === post.type;
            })) {
                score += 20;
            }
            
            // Avoid showing user's own posts in recommendations
            if (post.userId === userId) {
                score -= 100;
            }
            
            return { ...post, score };
        });

        // Filter by content type if specified
        let filteredPosts = scoredPosts;
        if (contentType !== 'all') {
            filteredPosts = scoredPosts.filter(post => post.type === contentType);
        }

        // Sort by score and return
        return filteredPosts
            .sort((a, b) => b.score - a.score)
            .slice(0, 20); // Limit to top 20
    }

    // Hashtag extraction
    static extractHashtags(text) {
        const hashtagRegex = /#[\w\u00c0-\u024f\u1e00-\u1eff]+/gi;
        return text.match(hashtagRegex) || [];
    }

    // Mention extraction
    static extractMentions(text) {
        const mentionRegex = /@[\w\u00c0-\u024f\u1e00-\u1eff]+/gi;
        return text.match(mentionRegex) || [];
    }

    // Format text with hashtags and mentions
    static formatTextWithLinks(text) {
        let formattedText = Utils.escapeHtml(text);
        
        // Format hashtags
        formattedText = formattedText.replace(/#([\w\u00c0-\u024f\u1e00-\u1eff]+)/gi, 
            '<span class="hashtag">#$1</span>');
        
        // Format mentions
        formattedText = formattedText.replace(/@([\w\u00c0-\u024f\u1e00-\u1eff]+)/gi, 
            '<span class="mention">@$1</span>');
        
        return formattedText;
    }

    // Voice recording utilities
    static async startVoiceRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            return new Promise((resolve) => {
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                    resolve(audioUrl);
                };

                mediaRecorder.start();
                
                // Return recorder to control from outside
                resolve({
                    recorder: mediaRecorder,
                    stop: () => mediaRecorder.stop()
                });
            });
        } catch (error) {
            console.error('Voice recording error:', error);
            Utils.showToast('Ses kaydı başlatılamadı', 'error');
            return null;
        }
    }

    // Search functionality
    static searchContent(query, type = 'all') {
        const posts = storage.getPosts();
        const users = storage.getUsers();
        
        const results = {
            posts: [],
            users: [],
            hashtags: [],
            mentions: []
        };

        const searchTerm = query.toLowerCase().trim();
        
        if (searchTerm.startsWith('#')) {
            // Hashtag search
            const hashtag = searchTerm.substring(1);
            results.posts = posts.filter(post => 
                post.content && post.content.toLowerCase().includes(`#${hashtag}`)
            );
        } else if (searchTerm.startsWith('@')) {
            // User search
            const username = searchTerm.substring(1);
            results.users = users.filter(user => 
                user.username.toLowerCase().includes(username) ||
                user.displayName.toLowerCase().includes(username)
            );
        } else {
            // General search
            results.posts = posts.filter(post => 
                post.content && post.content.toLowerCase().includes(searchTerm)
            );
            
            results.users = users.filter(user => 
                user.username.toLowerCase().includes(searchTerm) ||
                user.displayName.toLowerCase().includes(searchTerm) ||
                (user.bio && user.bio.toLowerCase().includes(searchTerm))
            );
        }

        return results;
    }
}

// Add enhanced CSS for new features
const enhancedCSS = `
.hashtag {
    color: #4facfe;
    font-weight: 500;
    cursor: pointer;
}

.hashtag:hover {
    text-decoration: underline;
}

.mention {
    color: #f093fb;
    font-weight: 500;
    cursor: pointer;
}

.mention:hover {
    text-decoration: underline;
}

.verified-badge {
    color: #4facfe;
    margin-left: 0.3rem;
}

.trending-indicator {
    background: linear-gradient(45deg, #ff6b6b, #feca57);
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    margin-left: 0.5rem;
}

.algorithm-boost {
    border-left: 3px solid #4facfe;
    background: rgba(79, 172, 254, 0.1);
}
`;

const style = document.createElement('style');
style.textContent = enhancedCSS;
document.head.appendChild(style);