// User Controls Script
// Uses supabase client from auth.js (window.supabaseClient)

// Pagination state
let currentPage = 1;
const itemsPerPage = 20;
let totalUsers = 0;
let isAdminUser = false;

// DOM Elements
const usersTableBody = document.getElementById('users-table-body');
const paginationInfo = document.getElementById('pagination-info');
const pageNumbers = document.getElementById('page-numbers');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');

// Confirm action modal state
let confirmPendingUserId = null;
let confirmPendingNewStatus = null;

// Check if current user is admin
async function checkIsAdmin() {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return false;
        }
        
        // Check if user is in admin_users table
        const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('user_id')
            .eq('user_id', user.id)
            .single();
        
        return !adminError && adminData !== null;
    } catch (err) {
        console.error('Error checking admin status:', err);
        return false;
    }
}

// Redirect non-admin users
async function enforceAdminAccess() {
    showLoading();
    
    isAdminUser = await checkIsAdmin();
    
    if (!isAdminUser) {
        const currentLang = getCurrentLanguage();
        // Show access denied message
        const mainContainer = document.querySelector('.admin-container');
        if (mainContainer) {
            mainContainer.innerHTML = `
                <div class="access-denied">
                    <span>${currentLang === 'fr' ? 'Accès Refusé' : 'Access Denied'}</span>
                </div>
            `;
        }
        hideLoading();
        return false;
    }
    
    return true;
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Ensure the current language is applied to all static text on this page
    try {
        const initialLang = typeof getCurrentLanguage === 'function'
            ? getCurrentLanguage()
            : (localStorage.getItem('language') || 'en');
        if (typeof setLanguage === 'function') {
            setLanguage(initialLang);
        }
    } catch (e) {
        console.error('Error applying initial language:', e);
    }

    // Wait a bit for auth.js to initialize supabase
    setTimeout(async () => {
        // Check admin access first
        const hasAccess = await enforceAdminAccess();
        if (!hasAccess) return;
        
        setupConfirmActionModal();
        await loadUsers();
        setupEventListeners();
        
        // Listen for language toggle to reload table with correct translations
        const languageToggle = document.querySelector('.toggle-switch');
        if (languageToggle) {
            languageToggle.addEventListener('click', () => {
                // Small delay to let the language change take effect
                setTimeout(() => {
                    loadUsers();
                }, 50);
            });
        }
    }, 100);
});

// Confirm action modal: show warning (email will be sent) before approve / reactivate / suspend
function setupConfirmActionModal() {
    const modal = document.getElementById('confirm-action-modal');
    const cancelBtn = document.getElementById('confirm-action-cancel');
    const confirmBtn = document.getElementById('confirm-action-confirm');
    if (!modal || !cancelBtn || !confirmBtn) return;

    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        confirmPendingUserId = null;
        confirmPendingNewStatus = null;
    });

    confirmBtn.addEventListener('click', () => {
        if (confirmPendingUserId !== null && confirmPendingNewStatus !== null) {
            modal.style.display = 'none';
            const userId = confirmPendingUserId;
            const newStatus = confirmPendingNewStatus;
            confirmPendingUserId = null;
            confirmPendingNewStatus = null;
            updateUserStatus(userId, newStatus);
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            confirmPendingUserId = null;
            confirmPendingNewStatus = null;
        }
    });
}

function showConfirmActionModal(userId, newStatus) {
    confirmPendingUserId = userId;
    confirmPendingNewStatus = newStatus;
    const msgApprove = document.getElementById('confirm-msg-approve');
    const msgSuspend = document.getElementById('confirm-msg-suspend');
    if (msgApprove) msgApprove.style.display = newStatus === 'approved' ? '' : 'none';
    if (msgSuspend) msgSuspend.style.display = newStatus === 'suspended' ? '' : 'none';
    const modal = document.getElementById('confirm-action-modal');
    if (modal) modal.style.display = 'flex';
}

// Setup event listeners
function setupEventListeners() {
    // Pagination
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadUsers();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(totalUsers / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                loadUsers();
            }
        });
    }
}

// Load users from database
async function loadUsers() {
    showLoading();

    try {
        const currentLang = getCurrentLanguage();
        // Build query from public.profiles: first_name, last_name, email (not email_order), etc.
        let query = supabase
            .from('profiles')
            .select('user_id, created_at, first_name, last_name, email, club_name, distributor_name, account_status, jersey_access, socks_access', { count: 'exact' })
            .eq('hide_from_user_list', false); //Hides users from the user list

        // Apply pagination
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to).order('created_at', { ascending: false });

        const { data: users, error, count } = await query;

        if (error) {
            console.error('Error loading users:', error);
            showToast(
                currentLang === 'fr'
                    ? 'Erreur lors du chargement des utilisateurs'
                    : 'Error loading users',
                'error'
            );
            hideLoading();
            return;
        }

        totalUsers = count || 0;
        renderUsers(users);
        updatePagination();
    } catch (err) {
        console.error('Error:', err);
        const currentLang = getCurrentLanguage();
        showToast(
            currentLang === 'fr'
                ? 'Erreur lors du chargement des utilisateurs'
                : 'Error loading users',
            'error'
        );
    } finally {
        hideLoading();
    }
}

// Render users table
function renderUsers(users) {
    const currentLang = getCurrentLanguage();
    
    if (!users || users.length === 0) {
        const emptyTitle = currentLang === 'fr' ? 'Aucun utilisateur trouvé' : 'No users found';
        const emptyText = currentLang === 'fr' ? 'Il n\'y a pas encore d\'utilisateurs dans le système.' : 'There are no users in the system yet.';
        
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3>${emptyTitle}</h3>
                        <p>${emptyText}</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    
    // Tooltip text for disabled checkboxes
    const disabledTooltip = currentLang === 'fr' 
        ? 'L\'utilisateur doit être approuvé pour que les paramètres d\'accès prennent effet'
        : 'User must be approved for access settings to take effect';
    
    usersTableBody.innerHTML = users.map((user, index) => {
        const rowNumber = startIndex + index + 1;
        const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US') : '-';
        // Name from public.profiles: first_name + last_name only (do not use full_name), with proper casing
        const rawFirstName = (user.first_name || '').trim();
        const rawLastName = (user.last_name || '').trim();
        let displayName = `${rawFirstName} ${rawLastName}`.trim();
        displayName = displayName ? toTitleCase(displayName) : '-';
        // Email from public.profiles (account email), not email_order
        const email = (user.email != null && String(user.email).trim() !== '') ? String(user.email).trim() : '-';
        // Club and Distributor names: keep original casing from profiles
        const rawClubName = (user.club_name || '').trim();
        const rawDistributorName = (user.distributor_name || '').trim();
        const clubName = rawClubName || '-';
        const distributorName = rawDistributorName || '-';
        const status = user.account_status || 'approved';
        const jerseyAccess = user.jersey_access !== false; // Default to true if not set
        const socksAccess = user.socks_access !== false; // Default to true if not set
        
        // Get translated status text
        const statusText = currentLang === 'fr' ? getStatusFrench(status) : capitalizeFirst(status);
        
        // Checkboxes are only enabled when user is approved
        const isApproved = status === 'approved';
        const disabledAttr = isApproved ? '' : 'disabled';
        const disabledClass = isApproved ? '' : 'access-disabled';
        const tooltipAttr = isApproved ? '' : `title="${disabledTooltip}"`;
        
        // Check access level for approved users
        const hasFullAccess = isApproved && jerseyAccess && socksAccess;
        const hasPartialAccess = isApproved && (jerseyAccess !== socksAccess);
        const hasNoAccess = isApproved && !jerseyAccess && !socksAccess;
        
        let statusBadgeClass = status;
        if (hasNoAccess) {
            statusBadgeClass = `${status} no-access`;
        } else if (hasPartialAccess) {
            statusBadgeClass = `${status} partial-access`;
        }

        return `
            <tr data-user-id="${user.user_id}" class="${isApproved ? '' : 'row-inactive'}">
                <td>${rowNumber}</td>
                <td>${createdDate}</td>
                <td>${escapeHtml(displayName)}</td>
                <td>${escapeHtml(email)}</td>
                <td>${escapeHtml(clubName)}</td>
                <td>${escapeHtml(distributorName)}</td>
                <td>
                    <span class="status-badge ${statusBadgeClass}">${statusText}</span>
                </td>
                <td class="checkbox-cell ${disabledClass}" ${tooltipAttr}>
                    <input type="checkbox" 
                           class="access-checkbox" 
                           id="jersey-access-${user.user_id}"
                           data-user-id="${user.user_id}"
                           data-access-type="jersey"
                           ${jerseyAccess ? 'checked' : ''}
                           ${disabledAttr}
                           onchange="toggleConfiguratorAccess('${user.user_id}', 'jersey', this.checked)">
                </td>
                <td class="checkbox-cell ${disabledClass}" ${tooltipAttr}>
                    <input type="checkbox" 
                           class="access-checkbox" 
                           id="socks-access-${user.user_id}"
                           data-user-id="${user.user_id}"
                           data-access-type="socks"
                           ${socksAccess ? 'checked' : ''}
                           ${disabledAttr}
                           onchange="toggleConfiguratorAccess('${user.user_id}', 'socks', this.checked)">
                </td>
                <td>
                    ${getActionButton(user.user_id, status, currentLang)}
                </td>
            </tr>
        `;
    }).join('');
}

// Get action button based on status
function getActionButton(userId, status, lang) {
    const translations = {
        approve: lang === 'fr' ? 'Approuver' : 'Approve',
        suspend: lang === 'fr' ? 'Suspendre' : 'Suspend',
        reactivate: lang === 'fr' ? 'Réactiver' : 'Reactivate'
    };
    
    if (status === 'pending') {
        return `
            <button class="action-button approve" onclick="showConfirmActionModal('${userId}', 'approved')">
                ${translations.approve}
            </button>
        `;
    } else if (status === 'approved') {
        return `
            <button class="action-button suspend" onclick="showConfirmActionModal('${userId}', 'suspended')">
                ${translations.suspend}
            </button>
        `;
    } else if (status === 'suspended') {
        return `
            <button class="action-button approve" onclick="showConfirmActionModal('${userId}', 'approved')">
                ${translations.reactivate}
            </button>
        `;
    }
    return '';
}

// Toggle configurator access
async function toggleConfiguratorAccess(userId, configurator, enabled) {
    const checkbox = document.querySelector(`[data-user-id="${userId}"][data-access-type="${configurator}"]`);
    const currentLang = getCurrentLanguage();
    
    try {
        const column = configurator === 'jersey' ? 'jersey_access' : 'socks_access';
        
        const { error } = await supabase
            .from('profiles')
            .update({ [column]: enabled })
            .eq('user_id', userId);

        if (error) {
            console.error('Error updating access:', error);
            showToast(currentLang === 'fr' ? 'Erreur lors de la mise à jour de l\'accès' : 'Error updating access', 'error');
            // Revert checkbox
            if (checkbox) checkbox.checked = !enabled;
            return;
        }

        const accessText = enabled ? (currentLang === 'fr' ? 'activé' : 'enabled') : (currentLang === 'fr' ? 'désactivé' : 'disabled');
        const configuratorText = configurator === 'jersey' ? (currentLang === 'fr' ? 'Maillot' : 'Jersey') : (currentLang === 'fr' ? 'Chaussettes' : 'Socks');
        
        showToast(`${configuratorText} ${currentLang === 'fr' ? 'accès' : 'access'} ${accessText}`, 'success');
        
        // Update status badge color dynamically
        updateStatusBadgeColor(userId);
    } catch (err) {
        console.error('Error:', err);
        showToast(currentLang === 'fr' ? 'Erreur lors de la mise à jour de l\'accès' : 'Error updating access', 'error');
        // Revert checkbox
        if (checkbox) checkbox.checked = !enabled;
    }
}

// Update status badge color based on current checkbox states
function updateStatusBadgeColor(userId) {
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (!row) return;
    
    const statusBadge = row.querySelector('.status-badge');
    if (!statusBadge) return;
    
    // Check if user is approved (badge has 'approved' class)
    if (!statusBadge.classList.contains('approved')) return;
    
    // Get current checkbox states
    const jerseyCheckbox = row.querySelector('[data-access-type="jersey"]');
    const socksCheckbox = row.querySelector('[data-access-type="socks"]');
    
    const jerseyAccess = jerseyCheckbox ? jerseyCheckbox.checked : false;
    const socksAccess = socksCheckbox ? socksCheckbox.checked : false;
    
    // Remove existing access classes
    statusBadge.classList.remove('no-access', 'partial-access');
    
    // Add appropriate class based on access level
    if (!jerseyAccess && !socksAccess) {
        statusBadge.classList.add('no-access');
    } else if (jerseyAccess !== socksAccess) {
        statusBadge.classList.add('partial-access');
    }
    // If both are checked, no additional class needed (full access = green)
}

// Update user status
async function updateUserStatus(userId, newStatus) {
    const currentLang = getCurrentLanguage();
    
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ account_status: newStatus })
            .eq('user_id', userId);

        if (error) {
            console.error('Error updating status:', error);
            showToast(currentLang === 'fr' ? 'Erreur lors de la mise à jour du statut' : 'Error updating user status', 'error');
            return;
        }

        const statusText = currentLang === 'fr' ? getStatusFrench(newStatus) : newStatus;
        showToast(
            currentLang === 'fr' 
                ? `Statut utilisateur mis à jour: ${statusText}` 
                : `User status updated to ${newStatus}`,
            'success'
        );
        
        // Reload users to reflect changes
        loadUsers();
    } catch (err) {
        console.error('Error:', err);
        showToast(currentLang === 'fr' ? 'Erreur lors de la mise à jour du statut' : 'Error updating user status', 'error');
    }
}

// Update pagination UI
function updatePagination() {
    const currentLang = getCurrentLanguage();
    const totalPages = Math.ceil(totalUsers / itemsPerPage);
    const from = totalUsers === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const to = Math.min(currentPage * itemsPerPage, totalUsers);

    // Update info text
    if (paginationInfo) {
        paginationInfo.innerHTML = currentLang === 'fr'
            ? `<span>Affichage de ${from} à ${to} sur ${totalUsers} résultats</span>`
            : `<span>Showing ${from} to ${to} of ${totalUsers} results</span>`;
    }

    // Update buttons
    if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;

    // Update page numbers
    if (pageNumbers) {
        let pageNumbersHtml = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbersHtml += `
                <button class="page-number ${i === currentPage ? 'active' : ''}" 
                        onclick="goToPage(${i})">${i}</button>
            `;
        }

        pageNumbers.innerHTML = pageNumbersHtml;
    }
}

// Go to specific page
function goToPage(page) {
    currentPage = page;
    loadUsers();
}

// Toast notification
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Helper functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Convert a string to title case (each word: first letter upper, rest lower)
function toTitleCase(str) {
    return String(str)
        .toLowerCase()
        .split(' ')
        .filter(part => part.length > 0)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getStatusFrench(status) {
    const statusMap = {
        'pending': 'En attente',
        'approved': 'Approuvé',
        'suspended': 'Suspendu'
    };
    return statusMap[status] || status;
}

// Make functions available globally
window.toggleConfiguratorAccess = toggleConfiguratorAccess;
window.updateUserStatus = updateUserStatus;
window.showConfirmActionModal = showConfirmActionModal;
window.goToPage = goToPage;
