// Enhanced authentication management with admin accounts and security
class AuthManager {
    constructor() {
        this.currentUser = storage.getCurrentUser();
        this.setupEventListeners();
        this.initializeAdminAccounts();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.querySelector('#login-form form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.querySelector('#register-form form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Switch between login and register
        const showRegister = document.getElementById('show-register');
        const showLogin = document.getElementById('show-login');
        
        if (showRegister) {
            showRegister.addEventListener('click', () => {
                this.switchToRegister();
            });
        }
        
        if (showLogin) {
            showLogin.addEventListener('click', () => {
                this.switchToLogin();
            });
        }

        // Password strength checker
        const passwordInput = document.getElementById('register-password');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.checkPasswordStrength(e.target.value);
            });
        }

        // Captcha generation
        this.generateCaptcha();

        // Privacy policy
        const showPrivacyBtn = document.getElementById('show-privacy');
        const closePrivacyBtn = document.getElementById('close-privacy');
        const acceptPrivacyBtn = document.getElementById('accept-privacy');
        
        if (showPrivacyBtn) {
            showPrivacyBtn.addEventListener('click', () => {
                document.getElementById('privacy-modal').classList.remove('hidden');
            });
        }
        
        if (closePrivacyBtn) {
            closePrivacyBtn.addEventListener('click', () => {
                document.getElementById('privacy-modal').classList.add('hidden');
            });
        }
        
        if (acceptPrivacyBtn) {
            acceptPrivacyBtn.addEventListener('click', () => {
                document.getElementById('privacy-checkbox').checked = true;
                document.getElementById('privacy-modal').classList.add('hidden');
            });
        }
    }

    initializeAdminAccounts() {
        const adminAccounts = [
            {
                id: 'admin_001',
                username: 'admin_moderator1',
                email: 'admin1@vibly.com',
                password: 'ViblyAdmin2024!',
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
                id: 'admin_002',
                username: 'admin_moderator2',
                email: 'admin2@vibly.com',
                password: 'ViblyAdmin2024!',
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
                id: 'admin_003',
                username: 'admin_moderator3',
                email: 'admin3@vibly.com',
                password: 'ViblyAdmin2024!',
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
                id: 'admin_004',
                username: 'admin_moderator4',
                email: 'admin4@vibly.com',
                password: 'ViblyAdmin2024!',
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
                id: 'admin_005',
                username: 'admin_moderator5',
                email: 'admin5@vibly.com',
                password: 'ViblyAdmin2024!',
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
                id: 'superadmin_001',
                username: 'vibly_owner',
                email: 'owner@vibly.com',
                password: 'ViblyOwner2024!',
                displayName: 'Vibly Sahibi',
                avatar: Utils.getDefaultAvatar('vibly_owner'),
                bio: '👑 Vibly Kurucusu ve Sahibi | Platform Yöneticisi',
                followers: [],
                following: [],
                verified: false,
                isAdmin: true,
                isSuperAdmin: true,
                isPremium: true,
                isBanned: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
            }
        ];

        // Check if admin accounts exist, if not create them
        adminAccounts.forEach(admin => {
            const existingAdmin = storage.getUserByEmail(admin.email);
            if (!existingAdmin) {
                storage.saveUser(admin);
            }
        });
    }

    generateCaptcha() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operation = Math.random() > 0.5 ? '+' : '-';
        
        let question, answer;
        if (operation === '+') {
            question = `${num1} + ${num2} = ?`;
            answer = num1 + num2;
        } else {
            // Ensure positive result
            const larger = Math.max(num1, num2);
            const smaller = Math.min(num1, num2);
            question = `${larger} - ${smaller} = ?`;
            answer = larger - smaller;
        }
        
        const captchaQuestion = document.getElementById('captcha-question');
        if (captchaQuestion) {
            captchaQuestion.textContent = question;
            captchaQuestion.dataset.answer = answer;
        }
    }

    checkPasswordStrength(password) {
        const strengthIndicator = document.getElementById('password-strength');
        if (!strengthIndicator) return;

        let strength = 0;
        let feedback = '';

        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        if (strength < 3) {
            strengthIndicator.className = 'password-strength weak';
            feedback = 'Zayıf - Daha güçlü bir şifre kullanın';
        } else if (strength < 5) {
            strengthIndicator.className = 'password-strength medium';
            feedback = 'Orta - İyi ama daha güçlü olabilir';
        } else {
            strengthIndicator.className = 'password-strength strong';
            feedback = 'Güçlü - Mükemmel şifre!';
        }

        strengthIndicator.title = feedback;
    }

    handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            Utils.showToast('fill_all_fields', 'error');
            return;
        }

        if (!Utils.isValidEmail(email)) {
            Utils.showToast('invalid_email', 'error');
            return;
        }

        // Check user credentials
        const user = storage.getUserByEmail(email);
        if (!user) {
            Utils.showToast('invalid_credentials', 'error');
            return;
        }

        // Check password (in real app, this would be hashed)
        let validPassword = false;
        if (user.isAdmin || user.isSuperAdmin) {
            // Admin accounts have specific passwords
            validPassword = password === 'ViblyAdmin2024!' || password === 'ViblyOwner2024!';
        } else {
            // Regular users use default password
            validPassword = password === 'password123';
        }

        if (!validPassword) {
            Utils.showToast('invalid_credentials', 'error');
            return;
        }

        // Check if user is banned
        if (user.isBanned) {
            Utils.showToast('Hesabınız banlanmış. Destek ile iletişime geçin.', 'error');
            return;
        }

        this.loginUser(user);
    }

    handleRegister() {
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const displayName = document.getElementById('register-displayname').value.trim();
        const password = document.getElementById('register-password').value;
        const captchaAnswer = parseInt(document.getElementById('captcha-answer').value);
        const privacyAccepted = document.getElementById('privacy-checkbox').checked;

        // Validation
        if (!username || !email || !displayName || !password) {
            Utils.showToast('fill_all_fields', 'error');
            return;
        }

        if (!Utils.isValidEmail(email)) {
            Utils.showToast('invalid_email', 'error');
            return;
        }

        if (!Utils.isValidUsername(username)) {
            Utils.showToast('Kullanıcı adı 3-20 karakter olmalı ve sadece harf, rakam, alt çizgi içermeli', 'error');
            return;
        }

        if (password.length < 6) {
            Utils.showToast('password_short', 'error');
            return;
        }

        // Check password strength
        const strengthIndicator = document.getElementById('password-strength');
        if (strengthIndicator && strengthIndicator.classList.contains('weak')) {
            Utils.showToast('Lütfen daha güçlü bir şifre kullanın', 'error');
            return;
        }

        // Check captcha
        const correctAnswer = parseInt(document.getElementById('captcha-question').dataset.answer);
        if (captchaAnswer !== correctAnswer) {
            Utils.showToast('Doğrulama sorusu yanlış', 'error');
            this.generateCaptcha();
            return;
        }

        // Check privacy agreement
        if (!privacyAccepted) {
            Utils.showToast('Gizlilik politikasını kabul etmelisiniz', 'error');
            return;
        }

        // Check if user already exists
        if (storage.getUserByEmail(email)) {
            Utils.showToast('email_taken', 'error');
            return;
        }

        if (storage.getUserByUsername(username)) {
            Utils.showToast('username_taken', 'error');
            return;
        }

        // Create new user
        const newUser = {
            id: Utils.generateId(),
            username: username,
            email: email,
            displayName: displayName,
            avatar: Utils.getDefaultAvatar(username),
            bio: '',
            followers: [],
            following: [],
            verified: false,
            isAdmin: false,
            isSuperAdmin: false,
            isPremium: false,
            isBanned: false,
            isPrivate: false,
            showOnline: true,
            createdAt: new Date().toISOString(),
        };

        storage.saveUser(newUser);
        this.loginUser(newUser);
        Utils.showToast('register_success', 'success');
    }

    loginUser(user) {
        this.currentUser = user;
        storage.setCurrentUser(user);
        
        // Hide auth screen and show main app
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        
        // Initialize the app
        if (window.app) {
            window.app.loadData();
        }
        
        Utils.showToast('login_success', 'success');

        // Log activity
        storage.saveActivityLog({
            userId: user.id,
            action: 'login',
            timestamp: new Date().toISOString()
        });
    }

    logout() {
        if (this.currentUser) {
            // Log activity
            storage.saveActivityLog({
                userId: this.currentUser.id,
                action: 'logout',
                timestamp: new Date().toISOString()
            });
        }

        this.currentUser = null;
        storage.clearCurrentUser();
        
        // Show auth screen and hide main app
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
        
        // Reset forms
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
        
        Utils.showToast('Başarıyla çıkış yapıldı', 'success');
    }

    switchToRegister() {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
        this.generateCaptcha();
    }

    switchToLogin() {
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    updateCurrentUser(updatedData) {
        if (this.currentUser) {
            this.currentUser = { ...this.currentUser, ...updatedData };
            storage.setCurrentUser(this.currentUser);
            storage.saveUser(this.currentUser);
        }
    }

    // Get admin credentials for reference
    getAdminCredentials() {
        return {
            admins: [
                { email: 'admin1@vibly.com', password: 'ViblyAdmin2024!' },
                { email: 'admin2@vibly.com', password: 'ViblyAdmin2024!' },
                { email: 'admin3@vibly.com', password: 'ViblyAdmin2024!' },
                { email: 'admin4@vibly.com', password: 'ViblyAdmin2024!' },
                { email: 'admin5@vibly.com', password: 'ViblyAdmin2024!' }
            ],
            superAdmin: { email: 'owner@vibly.com', password: 'ViblyOwner2024!' }
        };
    }
}

// Create global auth instance
const auth = new AuthManager();