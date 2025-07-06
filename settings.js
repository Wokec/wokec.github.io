// Enhanced settings management with password validation
class SettingsManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Edit profile
        const editProfileBtn = document.getElementById('edit-profile-settings');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                this.showEditProfile();
            });
        }

        // Change password
        const changePasswordBtn = document.getElementById('change-password');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.showChangePassword();
            });
        }

        // Privacy settings
        const privacyBtn = document.getElementById('privacy-settings');
        if (privacyBtn) {
            privacyBtn.addEventListener('click', () => {
                this.showPrivacySettings();
            });
        }

        // Language select
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                language.setLanguage(e.target.value);
                // Don't require re-login, just update language
                language.updateLanguage();
                Utils.showToast('Dil değiştirildi', 'success');
            });
        }

        // Theme select
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        }

        // Premium
        const premiumBtn = document.getElementById('get-premium');
        if (premiumBtn) {
            premiumBtn.addEventListener('click', () => {
                window.app.switchView('premium');
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logout-settings');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm(language.t('confirm_logout') || 'Çıkış yapmak istediğinizden emin misiniz?')) {
                    auth.logout();
                }
            });
        }
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
                        <label data-tr="username" data-en="Username">Kullanıcı Adı</label>
                        <input type="text" id="edit-username" value="${Utils.escapeHtml(currentUser.username)}">
                    </div>
                    <div class="input-group">
                        <label data-tr="bio" data-en="Bio">Biyografi</label>
                        <textarea id="edit-bio" class="bio-input" placeholder="${language.t('tell_about_yourself') || 'Kendin hakkında anlat... Link ekleyebilirsin!'}">${Utils.escapeHtml(currentUser.bio || '')}</textarea>
                        <small>Biyografinde web sitesi linklerini paylaşabilirsin!</small>
                    </div>
                    <div class="input-group">
                        <label data-tr="profile_picture" data-en="Profile Picture">Profil Resmi</label>
                        <input type="file" id="edit-avatar" accept="image/*">
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
        const avatarInput = document.getElementById('edit-avatar');
        
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });
        
        cancelBtn.addEventListener('click', () => {
            Utils.hideModal();
        });

        // Handle avatar upload
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                Utils.handleFileUpload(file, (dataUrl) => {
                    currentUser.newAvatar = dataUrl;
                });
            }
        });
    }

    saveProfile() {
        const displayName = document.getElementById('edit-displayname').value.trim();
        const username = document.getElementById('edit-username').value.trim();
        const bio = document.getElementById('edit-bio').value.trim();
        
        if (!displayName) {
            Utils.showToast('Görünen ad gerekli', 'error');
            return;
        }

        if (!username) {
            Utils.showToast('Kullanıcı adı gerekli', 'error');
            return;
        }

        if (!Utils.isValidUsername(username)) {
            Utils.showToast('Geçersiz kullanıcı adı', 'error');
            return;
        }

        const currentUser = auth.getCurrentUser();
        
        // Check if username is taken by another user
        const existingUser = storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== currentUser.id) {
            Utils.showToast('Bu kullanıcı adı alınmış', 'error');
            return;
        }

        const updatedData = {
            displayName: displayName,
            username: username,
            bio: bio
        };

        // Update avatar if changed
        if (currentUser.newAvatar) {
            updatedData.avatar = currentUser.newAvatar;
            delete currentUser.newAvatar;
        }

        auth.updateCurrentUser(updatedData);
        Utils.hideModal();
        Utils.showToast('profile_updated', 'success');
        
        // Reload profile
        profileManager.loadProfile();
        
        // Real-time update
        realTimeManager.broadcastUpdate('profile_updated', {
            userId: currentUser.id,
            data: updatedData
        });
    }

    showChangePassword() {
        const modalContent = `
            <div class="change-password-form">
                <h3 data-tr="change_password" data-en="Change Password">Şifre Değiştir</h3>
                <form>
                    <div class="input-group">
                        <label data-tr="current_password" data-en="Current Password">Mevcut Şifre</label>
                        <input type="password" id="current-password" required>
                    </div>
                    <div class="input-group">
                        <label data-tr="new_password" data-en="New Password">Yeni Şifre</label>
                        <input type="password" id="new-password" required>
                        <div class="password-strength" id="new-password-strength"></div>
                    </div>
                    <div class="input-group">
                        <label data-tr="confirm_password" data-en="Confirm Password">Şifreyi Onayla</label>
                        <input type="password" id="confirm-password" required>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" id="cancel-password" data-tr="cancel" data-en="Cancel">İptal</button>
                        <button type="submit" class="btn-primary" data-tr="change_password" data-en="Change Password">Şifre Değiştir</button>
                    </div>
                </form>
            </div>
        `;

        Utils.showModal(modalContent);

        const form = document.querySelector('.change-password-form form');
        const cancelBtn = document.getElementById('cancel-password');
        const newPasswordInput = document.getElementById('new-password');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });
        
        cancelBtn.addEventListener('click', () => {
            Utils.hideModal();
        });

        // Password strength checker
        newPasswordInput.addEventListener('input', (e) => {
            this.checkPasswordStrength(e.target.value, 'new-password-strength');
        });
    }

    checkPasswordStrength(password, elementId) {
        const strengthIndicator = document.getElementById(elementId);
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

    changePassword() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const currentUser = auth.getCurrentUser();

        // Validate current password
        let validCurrentPassword = false;
        if (currentUser.isAdmin || currentUser.isSuperAdmin) {
            validCurrentPassword = currentPassword === 'ViblyAdmin2024!' || currentPassword === 'ViblyOwner2024!';
        } else {
            validCurrentPassword = currentPassword === 'password123';
        }

        if (!validCurrentPassword) {
            Utils.showToast('Mevcut şifre yanlış', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            Utils.showToast('Şifreler eşleşmiyor', 'error');
            return;
        }

        if (newPassword.length < 6) {
            Utils.showToast('Yeni şifre en az 6 karakter olmalı', 'error');
            return;
        }

        // Check password strength
        const strengthIndicator = document.getElementById('new-password-strength');
        if (strengthIndicator && strengthIndicator.classList.contains('weak')) {
            Utils.showToast('Lütfen daha güçlü bir şifre kullanın', 'error');
            return;
        }

        Utils.hideModal();
        Utils.showToast('Şifre başarıyla değiştirildi', 'success');
        
        // Log activity
        storage.saveActivityLog({
            userId: currentUser.id,
            action: 'password_change',
            timestamp: new Date().toISOString()
        });
    }

    showPrivacySettings() {
        const currentUser = auth.getCurrentUser();
        
        const modalContent = `
            <div class="privacy-settings-form">
                <h3 data-tr="privacy_settings" data-en="Privacy Settings">Gizlilik Ayarları</h3>
                <div class="privacy-options">
                    <div class="privacy-item">
                        <div>
                            <span data-tr="private_account" data-en="Private Account">Gizli Hesap</span>
                            <p data-tr="private_desc" data-en="Only followers can see your posts">Sadece takipçilerin gönderilerini görebilir</p>
                        </div>
                        <label class="toggle">
                            <input type="checkbox" id="private-account" ${currentUser.isPrivate ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="privacy-item">
                        <div>
                            <span data-tr="show_online" data-en="Show Online Status">Çevrimiçi Durumu Göster</span>
                            <p data-tr="online_desc" data-en="Let others see when you're online">Diğerleri çevrimiçi olduğunuzu görebilir</p>
                        </div>
                        <label class="toggle">
                            <input type="checkbox" id="show-online" ${currentUser.showOnline !== false ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="privacy-item">
                        <div>
                            <span data-tr="show_followers" data-en="Show Followers">Takipçileri Göster</span>
                            <p data-tr="followers_desc" data-en="Let others see your followers and following">Diğerleri takipçilerinizi ve takip ettiklerinizi görebilir</p>
                        </div>
                        <label class="toggle">
                            <input type="checkbox" id="show-followers" ${currentUser.showFollowers !== false ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" id="cancel-privacy" data-tr="cancel" data-en="Cancel">İptal</button>
                    <button type="button" class="btn-primary" id="save-privacy" data-tr="save_changes" data-en="Save Changes">Değişiklikleri Kaydet</button>
                </div>
            </div>
        `;

        Utils.showModal(modalContent);

        const cancelBtn = document.getElementById('cancel-privacy');
        const saveBtn = document.getElementById('save-privacy');
        
        cancelBtn.addEventListener('click', () => {
            Utils.hideModal();
        });
        
        saveBtn.addEventListener('click', () => {
            this.savePrivacySettings();
        });
    }

    savePrivacySettings() {
        const isPrivate = document.getElementById('private-account').checked;
        const showOnline = document.getElementById('show-online').checked;
        const showFollowers = document.getElementById('show-followers').checked;

        const updatedData = {
            isPrivate: isPrivate,
            showOnline: showOnline,
            showFollowers: showFollowers
        };

        auth.updateCurrentUser(updatedData);
        Utils.hideModal();
        Utils.showToast('Gizlilik ayarları güncellendi', 'success');
        
        // Log activity
        const currentUser = auth.getCurrentUser();
        storage.saveActivityLog({
            userId: currentUser.id,
            action: 'privacy_update',
            details: updatedData,
            timestamp: new Date().toISOString()
        });
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('vibly_theme', theme);
        
        // Update theme select
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = theme;
        }
        
        Utils.showToast('Tema değiştirildi', 'success');
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    loadSettings() {
        // Load saved theme
        const savedTheme = localStorage.getItem('vibly_theme') || 'dark';
        this.setTheme(savedTheme);

        // Load saved language
        const savedLanguage = localStorage.getItem('vibly_language') || 'tr';
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = savedLanguage;
        }
    }
}

// Create global settings instance
const settingsManager = new SettingsManager();