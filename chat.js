// Enhanced chat management with video calls and improved AI
class ChatManager {
    constructor() {
        this.currentChatId = null;
        this.voiceRecorder = null;
        this.recordingTimer = null;
        this.recordingStartTime = null;
        this.setupEventListeners();
        this.initializeViblyAI();
    }

    setupEventListeners() {
        // Chat item clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.chat-item')) {
                const chatId = e.target.closest('.chat-item').dataset.chatId;
                this.openChat(chatId);
            }
        });

        // Back to chats
        const backBtn = document.getElementById('back-to-chats');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showChatList();
            });
        }

        // Send message
        const sendBtn = document.getElementById('send-message-btn');
        const messageInput = document.getElementById('message-input');
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // New chat
        const newChatBtn = document.getElementById('new-chat-btn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => this.showNewChatModal());
        }

        // Voice recording
        const voiceRecordBtn = document.getElementById('voice-record-btn');
        if (voiceRecordBtn) {
            voiceRecordBtn.addEventListener('click', () => this.startVoiceRecording());
        }

        // Voice recording modal controls
        document.addEventListener('click', (e) => {
            if (e.target.id === 'cancel-recording') {
                this.cancelVoiceRecording();
            }
            if (e.target.id === 'stop-recording') {
                this.stopVoiceRecording();
            }
        });
    }

    initializeViblyAI() {
        // Create Vibly AI chat if it doesn't exist
        const currentUser = auth.getCurrentUser();
        if (!currentUser) return;

        const existingAIChat = storage.getChats().find(chat => 
            chat.participants.includes('vibly-ai') && chat.participants.includes(currentUser.id)
        );

        if (!existingAIChat) {
            const aiChat = {
                id: 'vibly-ai-chat',
                participants: [currentUser.id, 'vibly-ai'],
                lastMessage: {
                    id: 'ai-welcome',
                    userId: 'vibly-ai',
                    content: 'Merhaba! Ben Vibly AI. Size nasıl yardımcı olabilirim? "help" yazarak komutları görebilirsiniz.',
                    createdAt: new Date().toISOString()
                },
                updatedAt: new Date().toISOString()
            };
            storage.saveChat(aiChat);
        }
    }

    loadChats() {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) return;

        let chats = storage.getChatsByUserId(currentUser.id)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        // Add Vibly AI chat at the top
        const aiChatIndex = chats.findIndex(chat => chat.participants.includes('vibly-ai'));
        if (aiChatIndex > -1) {
            const aiChat = chats.splice(aiChatIndex, 1)[0];
            chats.unshift(aiChat);
        }

        const chatsContainer = document.getElementById('chats-container');
        
        if (chats.length === 0) {
            chatsContainer.innerHTML = `
                <div class="empty-state">
                    <h3 data-tr="no_conversations" data-en="No conversations yet">Henüz konuşma yok</h3>
                    <p data-tr="start_conversation" data-en="Start a conversation">Bir konuşma başlat</p>
                    <button class="btn-primary" id="start-chat" data-tr="new_chat" data-en="New Chat">Yeni Sohbet</button>
                </div>
            `;
            
            // Setup start chat button
            const startChatBtn = document.getElementById('start-chat');
            if (startChatBtn) {
                startChatBtn.addEventListener('click', () => this.showNewChatModal());
            }
            
            return;
        }

        const chatsHtml = chats.map(chat => {
            const otherParticipant = chat.participants.find(p => p !== currentUser.id);
            
            // Handle Vibly AI chat
            if (otherParticipant === 'vibly-ai') {
                return `
                    <div class="chat-item ${chat.id === this.currentChatId ? 'active' : ''}" data-chat-id="${chat.id}">
                        <div class="chat-avatar">
                            <div style="width: 50px; height: 50px; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                                AI
                            </div>
                        </div>
                        <div class="chat-info">
                            <div class="chat-username">Vibly AI 🤖</div>
                            <div class="chat-last-message">
                                ${chat.lastMessage ? this.formatLastMessage(chat.lastMessage) : 'AI asistanınız'}
                            </div>
                        </div>
                        <div class="chat-time">
                            ${chat.lastMessage ? Utils.formatTimeAgo(chat.lastMessage.createdAt) : ''}
                        </div>
                    </div>
                `;
            }

            const otherUser = storage.getUserById(otherParticipant);
            
            return `
                <div class="chat-item ${chat.id === this.currentChatId ? 'active' : ''}" data-chat-id="${chat.id}">
                    <div class="chat-avatar">
                        <img src="${otherUser?.avatar || Utils.getDefaultAvatar(otherUser?.username || 'U')}" alt="${otherUser?.displayName || 'User'}">
                    </div>
                    <div class="chat-info">
                        <div class="chat-username">${Utils.escapeHtml(otherUser?.displayName || 'Bilinmeyen Kullanıcı')}</div>
                        <div class="chat-last-message">
                            ${chat.lastMessage ? this.formatLastMessage(chat.lastMessage) : 'Henüz mesaj yok'}
                        </div>
                    </div>
                    <div class="chat-time">
                        ${chat.lastMessage ? Utils.formatTimeAgo(chat.lastMessage.createdAt) : ''}
                    </div>
                </div>
            `;
        }).join('');

        chatsContainer.innerHTML = chatsHtml;
        
        // Update language
        language.updateLanguage();
    }

    formatLastMessage(message) {
        if (message.type === 'voice') {
            return '🎤 Ses mesajı';
        }
        return Utils.escapeHtml(message.content).substring(0, 50) + (message.content.length > 50 ? '...' : '');
    }

    openChat(chatId) {
        this.currentChatId = chatId;
        const chat = storage.getChats().find(c => c.id === chatId);
        
        if (!chat) return;

        const currentUser = auth.getCurrentUser();
        const otherParticipant = chat.participants.find(p => p !== currentUser.id);
        
        // Handle Vibly AI chat
        if (otherParticipant === 'vibly-ai') {
            const chatAvatar = document.querySelector('.conversation-header .chat-avatar');
            const chatUsername = document.querySelector('.conversation-header .chat-username');
            
            if (chatAvatar) {
                chatAvatar.innerHTML = `
                    <div style="width: 40px; height: 40px; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.8rem;">
                        AI
                    </div>
                `;
            }
            if (chatUsername) chatUsername.textContent = 'Vibly AI 🤖';
        } else {
            const otherUser = storage.getUserById(otherParticipant);
            const chatAvatar = document.querySelector('.conversation-header .chat-avatar');
            const chatUsername = document.querySelector('.conversation-header .chat-username');
            
            if (chatAvatar) chatAvatar.src = otherUser?.avatar || Utils.getDefaultAvatar(otherUser?.username || 'U');
            if (chatUsername) chatUsername.textContent = otherUser?.displayName || 'Bilinmeyen Kullanıcı';
        }

        // Load messages
        this.loadMessages(chatId);

        // Show conversation view
        document.getElementById('chat-list').classList.add('hidden');
        document.getElementById('chat-conversation').classList.remove('hidden');

        // Update active chat
        this.loadChats();
    }

    loadMessages(chatId) {
        const messages = storage.getMessagesByChatId(chatId).reverse(); // Reverse to show newest at bottom
        const messagesContainer = document.getElementById('messages-container');
        const currentUser = auth.getCurrentUser();

        const messagesHtml = messages.map(message => {
            const isSent = message.userId === currentUser.id;
            const isAI = message.userId === 'vibly-ai';
            
            if (message.type === 'voice') {
                return `
                    <div class="message ${isSent ? 'sent' : 'received'}">
                        <div class="voice-message">
                            <button class="voice-play-btn" onclick="this.querySelector('audio').play()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="5,3 19,12 5,21 5,3"></polygon>
                                </svg>
                            </button>
                            <audio src="${message.content}" style="display: none;"></audio>
                            <span class="voice-duration">${message.duration || '0:05'}</span>
                        </div>
                        <div class="message-time">${Utils.formatTimeAgo(message.createdAt)}</div>
                    </div>
                `;
            }
            
            return `
                <div class="message ${isSent ? 'sent' : 'received'} ${isAI ? 'ai-message' : ''}">
                    ${isAI ? '<div class="ai-indicator">🤖</div>' : ''}
                    ${Utils.formatTextWithLinks(message.content)}
                    <div class="message-time">${Utils.formatTimeAgo(message.createdAt)}</div>
                </div>
            `;
        }).join('');

        messagesContainer.innerHTML = messagesHtml;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    sendMessage() {
        const messageInput = document.getElementById('message-input');
        const content = messageInput.value.trim();
        const currentUser = auth.getCurrentUser();

        if (!content || !this.currentChatId || !currentUser) return;

        const newMessage = {
            id: Utils.generateId(),
            chatId: this.currentChatId,
            userId: currentUser.id,
            content: content,
            type: 'text',
            createdAt: new Date().toISOString()
        };

        storage.saveMessage(newMessage);
        messageInput.value = '';
        
        // Check if this is AI chat and respond
        const chat = storage.getChats().find(c => c.id === this.currentChatId);
        if (chat && chat.participants.includes('vibly-ai')) {
            setTimeout(() => {
                this.generateAIResponse(content);
            }, 1000);
        }
        
        // Reload messages
        this.loadMessages(this.currentChatId);
        
        // Update chat list
        this.loadChats();
        
        Utils.showToast('message_sent', 'success');
    }

    generateAIResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        let response = '';

        // Enhanced AI responses with commands
        if (lowerMessage.includes('help') || lowerMessage.includes('yardım')) {
            response = `🤖 Vibly AI Komutları:
            
📝 "gönderi oluştur" - Yeni gönderi önerileri
🎬 "reel fikri" - Reel içerik önerileri  
📊 "analiz" - Hesap analizi
🎨 "tema" - Renk ve tasarım önerileri
💡 "ipucu" - Platform kullanım ipuçları
🔥 "trend" - Güncel trend konuları
📱 "özellik" - Yeni özellik önerileri

Herhangi bir sorunuz varsa çekinmeden sorun!`;
        } else if (lowerMessage.includes('gönderi') || lowerMessage.includes('post')) {
            const postIdeas = [
                '📸 Günün en güzel anını paylaş',
                '💭 Bugün öğrendiğin bir şeyi anlat',
                '🌅 Sabah rutinini göster',
                '🍕 Favori yemeğini tanıt',
                '📚 Okuduğun kitabı öner',
                '🎵 Ruh halini yansıtan şarkı',
                '🏃‍♀️ Spor motivasyonu paylaş'
            ];
            response = `💡 Gönderi Fikirleri:\n\n${postIdeas[Math.floor(Math.random() * postIdeas.length)]}\n\nBu konuda bir gönderi oluşturmaya ne dersin?`;
        } else if (lowerMessage.includes('reel')) {
            const reelIdeas = [
                '🎬 Günlük rutinin hızlı versiyonu',
                '🍳 Yemek tarifi adım adım',
                '💄 Makyaj transformasyonu',
                '🎨 Sanat süreci time-lapse',
                '🏠 Oda dekorasyonu değişimi',
                '🎵 Dans challenge',
                '📱 Telefon düzenleme ipuçları'
            ];
            response = `🎬 Reel Fikirleri:\n\n${reelIdeas[Math.floor(Math.random() * reelIdeas.length)]}\n\nBu tür içerikler çok popüler!`;
        } else if (lowerMessage.includes('analiz')) {
            response = `📊 Hesap Analizi:\n\n✅ Profil tamamlanma: %85\n📈 Etkileşim oranı: İyi\n🎯 Öneriler:\n- Daha fazla hashtag kullan\n- Düzenli paylaşım yap\n- Takipçilerinle etkileşime geç\n\nDevam et, harika gidiyorsun! 🚀`;
        } else if (lowerMessage.includes('tema') || lowerMessage.includes('renk')) {
            const themes = [
                '🌸 Pastel tonlar - Soft ve minimal',
                '🔥 Sıcak renkler - Enerjik ve canlı',
                '🌊 Mavi tonları - Sakin ve profesyonel',
                '🌿 Doğa renkleri - Organik ve huzurlu',
                '⚫ Monokrom - Şık ve modern'
            ];
            response = `🎨 Tema Önerileri:\n\n${themes[Math.floor(Math.random() * themes.length)]}\n\nBu tema senin tarzına uygun olabilir!`;
        } else if (lowerMessage.includes('trend')) {
            const trends = [
                '#SelfCare - Kendine bakım rutinleri',
                '#Minimalism - Sade yaşam tarzı',
                '#BookTok - Kitap önerileri',
                '#HealthyLifestyle - Sağlıklı yaşam',
                '#DIY - Kendin yap projeleri',
                '#Productivity - Verimlilik ipuçları'
            ];
            response = `🔥 Güncel Trendler:\n\n${trends[Math.floor(Math.random() * trends.length)]}\n\nBu trend şu anda çok popüler!`;
        } else if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam')) {
            response = 'Merhaba! 👋 Size nasıl yardımcı olabilirim? "help" yazarak tüm komutları görebilirsiniz.';
        } else if (lowerMessage.includes('teşekkür')) {
            response = 'Rica ederim! 😊 Başka bir konuda yardıma ihtiyacınız olursa buradayım.';
        } else {
            const responses = [
                'Çok ilginç bir soru! Bu konuda size yardımcı olabilirim. 🤔',
                'Anlıyorum. Bu durumda şunu önerebilirim... 💡',
                'Harika! Bu konuda daha fazla bilgi verebilirim. ✨',
                'Bu gerçekten önemli bir konu. Size detaylı bilgi verebilirim. 📚',
                'Mükemmel soru! İşte size yardımcı olabilecek bilgiler... 🎯',
                'Bu konuda size kesinlikle yardımcı olabilirim. 🚀',
                'Çok güzel bir yaklaşım! Şunu da ekleyebilirim... ➕',
                'Haklısınız! Bu konuda şunları da düşünebilirsiniz... 🤝'
            ];
            response = responses[Math.floor(Math.random() * responses.length)];
        }

        const aiMessage = {
            id: Utils.generateId(),
            chatId: this.currentChatId,
            userId: 'vibly-ai',
            content: response,
            type: 'text',
            createdAt: new Date().toISOString()
        };

        storage.saveMessage(aiMessage);
        this.loadMessages(this.currentChatId);
        this.loadChats();
    }

    async startVoiceRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.voiceRecorder = new MediaRecorder(stream);
            const audioChunks = [];

            this.voiceRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            this.voiceRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Send voice message
                this.sendVoiceMessage(audioUrl);
                
                // Clean up
                stream.getTracks().forEach(track => track.stop());
                this.hideVoiceModal();
            };

            // Show voice recording modal
            this.showVoiceModal();
            
            // Start recording
            this.voiceRecorder.start();
            this.recordingStartTime = Date.now();
            this.startRecordingTimer();

        } catch (error) {
            console.error('Voice recording error:', error);
            Utils.showToast('Ses kaydı başlatılamadı', 'error');
        }
    }

    sendVoiceMessage(audioUrl) {
        const currentUser = auth.getCurrentUser();
        if (!this.currentChatId || !currentUser) return;

        const duration = this.recordingStartTime ? 
            Math.floor((Date.now() - this.recordingStartTime) / 1000) : 5;

        const newMessage = {
            id: Utils.generateId(),
            chatId: this.currentChatId,
            userId: currentUser.id,
            content: audioUrl,
            type: 'voice',
            duration: `0:${duration.toString().padStart(2, '0')}`,
            createdAt: new Date().toISOString()
        };

        storage.saveMessage(newMessage);
        
        // Reload messages
        this.loadMessages(this.currentChatId);
        
        // Update chat list
        this.loadChats();
        
        Utils.showToast('Ses mesajı gönderildi', 'success');
    }

    showVoiceModal() {
        document.getElementById('voice-modal').classList.remove('hidden');
    }

    hideVoiceModal() {
        document.getElementById('voice-modal').classList.add('hidden');
        this.stopRecordingTimer();
    }

    startRecordingTimer() {
        const timerElement = document.querySelector('.recording-timer');
        let seconds = 0;
        
        this.recordingTimer = setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            timerElement.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    stopVoiceRecording() {
        if (this.voiceRecorder && this.voiceRecorder.state === 'recording') {
            this.voiceRecorder.stop();
        }
    }

    cancelVoiceRecording() {
        if (this.voiceRecorder && this.voiceRecorder.state === 'recording') {
            this.voiceRecorder.stop();
        }
        this.hideVoiceModal();
    }

    showChatList() {
        document.getElementById('chat-conversation').classList.add('hidden');
        document.getElementById('chat-list').classList.remove('hidden');
        this.currentChatId = null;
        this.loadChats();
    }

    showNewChatModal() {
        const users = storage.getUsers();
        const currentUser = auth.getCurrentUser();
        const otherUsers = users.filter(u => u.id !== currentUser.id && !u.isAdmin);

        const usersHtml = otherUsers.map(user => `
            <div class="user-item" data-user-id="${user.id}">
                <img src="${user.avatar}" alt="${user.displayName}" class="user-avatar">
                <div class="user-info">
                    <div class="user-name">${Utils.escapeHtml(user.displayName)}</div>
                    <div class="user-username">@${Utils.escapeHtml(user.username)}</div>
                </div>
            </div>
        `).join('');

        const modalContent = `
            <div class="new-chat-modal">
                <h3 data-tr="start_new_conversation" data-en="Start New Conversation">Yeni Konuşma Başlat</h3>
                <div class="users-list">
                    ${usersHtml}
                </div>
            </div>
        `;

        Utils.showModal(modalContent);

        // Setup user selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.user-item')) {
                const userId = e.target.closest('.user-item').dataset.userId;
                this.startNewChat(userId);
            }
        });
    }

    startNewChat(otherUserId) {
        const currentUser = auth.getCurrentUser();
        
        // Check if chat already exists
        const existingChat = storage.getChats().find(chat => 
            chat.participants.includes(currentUser.id) && 
            chat.participants.includes(otherUserId)
        );

        if (existingChat) {
            Utils.hideModal();
            this.openChat(existingChat.id);
            return;
        }

        // Check if user is following the other user (for message limit)
        const otherUser = storage.getUserById(otherUserId);
        const isFollowing = currentUser.following.includes(otherUserId);
        
        if (!isFollowing) {
            // Check message count limit for non-followers
            const existingMessages = storage.getMessages().filter(msg => 
                msg.userId === currentUser.id && 
                storage.getChats().some(chat => 
                    chat.id === msg.chatId && 
                    chat.participants.includes(otherUserId)
                )
            );
            
            if (existingMessages.length >= 4) {
                Utils.showToast('Takip etmediğiniz kullanıcılara en fazla 4 mesaj gönderebilirsiniz', 'error');
                Utils.hideModal();
                return;
            }
        }

        // Create new chat
        const newChat = {
            id: Utils.generateId(),
            participants: [currentUser.id, otherUserId],
            messages: [],
            updatedAt: new Date().toISOString()
        };

        storage.saveChat(newChat);
        Utils.hideModal();
        this.openChat(newChat.id);
        this.loadChats();
    }
}

// Create global chat instance
const chatManager = new ChatManager();