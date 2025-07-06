// Admin panel management
class AdminManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Admin panel will be loaded when needed
    }

    loadAdminPanel() {
        const currentUser = auth.getCurrentUser();
        
        if (!currentUser || (!currentUser.isAdmin && !currentUser.isSuperAdmin)) {
            Utils.showToast('Bu sayfaya erişim yetkiniz yok', 'error');
            return;
        }

        this.updateAdminStats();
        this.loadReportedContent();
        this.loadUserManagement();
    }

    updateAdminStats() {
        const users = storage.getUsers();
        const posts = storage.getPosts();
        const reports = storage.getReports() || [];

        document.getElementById('total-users').textContent = users.length;
        document.getElementById('total-posts').textContent = posts.length;
        document.getElementById('total-reports').textContent = reports.length;
    }

    loadReportedContent() {
        const reports = storage.getReports() || [];
        const reportedContainer = document.getElementById('reported-content');
        
        if (reports.length === 0) {
            reportedContainer.innerHTML = '<p>Şikayet edilen içerik bulunmuyor.</p>';
            return;
        }

        const reportsHtml = reports.map(report => {
            const post = storage.getPosts().find(p => p.id === report.postId);
            const reporter = storage.getUserById(report.reporterId);
            const reported = storage.getUserById(report.reportedUserId);
            
            return `
                <div class="reported-item" data-report-id="${report.id}">
                    <div class="reported-item-info">
                        <h4>Şikayet: ${report.reason}</h4>
                        <p>Şikayet Eden: ${reporter?.displayName || 'Bilinmeyen'}</p>
                        <p>Şikayet Edilen: ${reported?.displayName || 'Bilinmeyen'}</p>
                        <p>Tarih: ${Utils.formatTimeAgo(report.createdAt)}</p>
                        ${post ? `<p>İçerik: ${post.content.substring(0, 100)}...</p>` : ''}
                    </div>
                    <div class="reported-item-actions">
                        <button class="admin-action-btn approve" onclick="adminManager.approveReport('${report.id}')">Onayla</button>
                        <button class="admin-action-btn reject" onclick="adminManager.rejectReport('${report.id}')">Reddet</button>
                        <button class="admin-action-btn ban" onclick="adminManager.banUser('${report.reportedUserId}')">Kullanıcıyı Banla</button>
                    </div>
                </div>
            `;
        }).join('');

        reportedContainer.innerHTML = reportsHtml;
    }

    loadUserManagement() {
        const users = storage.getUsers();
        const userContainer = document.getElementById('user-management');
        
        const usersHtml = users.map(user => `
            <div class="user-item" data-user-id="${user.id}">
                <div class="user-item-info">
                    <h4>${user.displayName} (@${user.username})</h4>
                    <p>E-posta: ${user.email}</p>
                    <p>Kayıt: ${Utils.formatTimeAgo(user.createdAt)}</p>
                    <p>Durum: ${user.isBanned ? 'Banlı' : 'Aktif'}</p>
                    ${user.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
                    ${user.isSuperAdmin ? '<span class="super-admin-badge">SÜPER ADMIN</span>' : ''}
                    ${user.isPremium ? '<span class="premium-badge">PREMIUM</span>' : ''}
                </div>
                <div class="user-item-actions">
                    ${!user.isBanned ? 
                        `<button class="admin-action-btn ban" onclick="adminManager.banUser('${user.id}')">Banla</button>` :
                        `<button class="admin-action-btn approve" onclick="adminManager.unbanUser('${user.id}')">Ban Kaldır</button>`
                    }
                    <button class="admin-action-btn reject" onclick="adminManager.deleteUser('${user.id}')">Sil</button>
                    ${!user.isAdmin && !user.isSuperAdmin ? 
                        `<button class="admin-action-btn approve" onclick="adminManager.makeAdmin('${user.id}')">Admin Yap</button>` : ''
                    }
                </div>
            </div>
        `).join('');

        userContainer.innerHTML = usersHtml;
    }

    approveReport(reportId) {
        const reports = storage.getReports() || [];
        const reportIndex = reports.findIndex(r => r.id === reportId);
        
        if (reportIndex !== -1) {
            const report = reports[reportIndex];
            
            // Delete the reported post
            const posts = storage.getPosts();
            const postIndex = posts.findIndex(p => p.id === report.postId);
            if (postIndex !== -1) {
                posts.splice(postIndex, 1);
                storage.savePosts(posts);
            }
            
            // Remove the report
            reports.splice(reportIndex, 1);
            storage.saveReports(reports);
            
            // Send email notification (simulated)
            this.sendEmailNotification(report.reportedUserId, 'İçeriğiniz şikayet nedeniyle kaldırıldı.');
            
            Utils.showToast('Şikayet onaylandı ve içerik kaldırıldı', 'success');
            this.loadReportedContent();
            this.updateAdminStats();
        }
    }

    rejectReport(reportId) {
        const reports = storage.getReports() || [];
        const reportIndex = reports.findIndex(r => r.id === reportId);
        
        if (reportIndex !== -1) {
            reports.splice(reportIndex, 1);
            storage.saveReports(reports);
            
            Utils.showToast('Şikayet reddedildi', 'success');
            this.loadReportedContent();
            this.updateAdminStats();
        }
    }

    banUser(userId) {
        const user = storage.getUserById(userId);
        if (!user) return;

        if (user.isAdmin || user.isSuperAdmin) {
            Utils.showToast('Admin kullanıcıları banlanamaz', 'error');
            return;
        }

        user.isBanned = true;
        user.bannedAt = new Date().toISOString();
        storage.saveUser(user);

        // Send email notification
        this.sendEmailNotification(userId, 'Hesabınız topluluk kurallarını ihlal ettiği için banlandı.');

        Utils.showToast(`${user.displayName} banlandı`, 'success');
        this.loadUserManagement();
    }

    unbanUser(userId) {
        const user = storage.getUserById(userId);
        if (!user) return;

        user.isBanned = false;
        delete user.bannedAt;
        storage.saveUser(user);

        // Send email notification
        this.sendEmailNotification(userId, 'Hesabınızın banı kaldırıldı. Tekrar platformumuzu kullanabilirsiniz.');

        Utils.showToast(`${user.displayName} banı kaldırıldı`, 'success');
        this.loadUserManagement();
    }

    deleteUser(userId) {
        const currentUser = auth.getCurrentUser();
        const user = storage.getUserById(userId);
        
        if (!user) return;

        if (user.isAdmin || user.isSuperAdmin) {
            Utils.showToast('Admin kullanıcıları silinemez', 'error');
            return;
        }

        if (user.id === currentUser.id) {
            Utils.showToast('Kendi hesabınızı silemezsiniz', 'error');
            return;
        }

        if (confirm(`${user.displayName} kullanıcısını kalıcı olarak silmek istediğinizden emin misiniz?`)) {
            // Delete user's posts
            const posts = storage.getPosts().filter(p => p.userId !== userId);
            storage.savePosts(posts);

            // Delete user's comments
            const comments = storage.getComments().filter(c => c.userId !== userId);
            storage.saveComments(comments);

            // Delete user's chats
            const chats = storage.getChats().filter(c => !c.participants.includes(userId));
            storage.saveChats(chats);

            // Delete user
            const users = storage.getUsers().filter(u => u.id !== userId);
            localStorage.setItem('vibly_users', JSON.stringify(users));

            // Send email notification
            this.sendEmailNotification(userId, 'Hesabınız kalıcı olarak silindi.');

            Utils.showToast(`${user.displayName} silindi`, 'success');
            this.loadUserManagement();
            this.updateAdminStats();
        }
    }

    makeAdmin(userId) {
        const currentUser = auth.getCurrentUser();
        
        if (!currentUser.isSuperAdmin) {
            Utils.showToast('Sadece süper admin kullanıcı yapabilir', 'error');
            return;
        }

        const user = storage.getUserById(userId);
        if (!user) return;

        user.isAdmin = true;
        user.adminSince = new Date().toISOString();
        storage.saveUser(user);

        // Send email notification
        this.sendEmailNotification(userId, 'Tebrikler! Admin yetkisi verildi.');

        Utils.showToast(`${user.displayName} admin yapıldı`, 'success');
        this.loadUserManagement();
    }

    sendEmailNotification(userId, message) {
        const user = storage.getUserById(userId);
        if (!user) return;

        // Simulate email sending
        console.log(`Email sent to ${user.email}: ${message}`);
        
        // In a real application, this would send an actual email
        // For demo purposes, we'll just log it
    }

    reportPost(postId, reason) {
        const currentUser = auth.getCurrentUser();
        const post = storage.getPosts().find(p => p.id === postId);
        
        if (!post) return;

        const report = {
            id: Utils.generateId(),
            postId: postId,
            reporterId: currentUser.id,
            reportedUserId: post.userId,
            reason: reason,
            createdAt: new Date().toISOString()
        };

        const reports = storage.getReports() || [];
        reports.push(report);
        storage.saveReports(reports);

        Utils.showToast('Şikayet gönderildi', 'success');
    }
}

// Create global admin instance
const adminManager = new AdminManager();