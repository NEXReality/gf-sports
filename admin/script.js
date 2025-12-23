// Pagination state
let currentPage = 1;
const itemsPerPage = 20;
let totalOrders = 0;

// DOM elements
const tableBody = document.getElementById('orders-table-body');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageNumbers = document.querySelector('.page-numbers');
const paginationInfo = document.querySelector('.pagination-info');

// Helper function to apply language display to dynamically generated content
function applyLanguageDisplay(container) {
    const currentLang = getCurrentLanguage();
    const otherLang = currentLang === 'en' ? 'fr' : 'en';
    
    container.querySelectorAll(`[data-${currentLang}]`).forEach(el => {
        el.style.display = 'inline';
    });
    container.querySelectorAll(`[data-${otherLang}]`).forEach(el => {
        el.style.display = 'none';
    });
}

// Fetch orders from Supabase
async function fetchOrders() {
    const { data, error, count } = await supabase
        .from('user_orders')
        .select('date, order_items, full_name, email_order, order_id', { count: 'exact' })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    totalOrders = count;
    return data;
}

// Update table with current page data
async function updateTable() {
    const start = (currentPage - 1) * itemsPerPage;
    const currentLang = getCurrentLanguage();
    showLoading();
    
    try {
        const orders = await fetchOrders();
        
        if (!orders || orders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem;">
                        <span data-en>No orders found</span>
                        <span data-fr>Aucune commande trouvée</span>
                    </td>
                </tr>
            `;
            applyLanguageDisplay(tableBody);
            updatePaginationInfo(0, 0, 0);
            if (prevPageBtn) prevPageBtn.disabled = true;
            if (nextPageBtn) nextPageBtn.disabled = true;
            if (pageNumbers) pageNumbers.innerHTML = '';
            hideLoading();
            return;
        }
        
        tableBody.innerHTML = orders.map((order, index) => {
            const orderItems = Array.isArray(order.order_items) ? order.order_items : [order.order_items];
            const designLinks = orderItems.map(item =>
                `<a href="#" class="clickable-link design-link" data-design-name="${item.design_name}">
                    ${item.design_name}
                </a>`
            ).join('<br>');

            const orderDate = new Date(order.date);
            const formattedDate = new Intl.DateTimeFormat(currentLang, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(orderDate);
            const formattedTime = new Intl.DateTimeFormat(currentLang, {
                hour: '2-digit',
                minute: '2-digit'
            }).format(orderDate);

            return `
                <tr>
                    <td>${start + index + 1}</td>
                    <td>
                        ${formattedDate}<br>
                        <span class="order-time">${formattedTime}</span>
                    </td>
                    <td>${designLinks}</td>
                    <td>${order.full_name}</td>
                    <td>${order.email_order}</td>
                    <td>
                        <a href="#" class="clickable-link order-link" data-order-id="${order.order_id}">
                            ${order.order_id}
                        </a>
                    </td>
                </tr>
            `;
        }).join('');

        // Update pagination info
        const totalPages = Math.ceil(totalOrders / itemsPerPage);
        updatePaginationInfo(start + 1, Math.min(start + orders.length, totalOrders), totalOrders);

        // Update pagination buttons
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;

        // Update page numbers
        updatePageNumbers(totalPages);
    } catch (error) {
        console.error('Error updating table:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: red;">
                    <span data-en>Error loading orders. Please refresh the page.</span>
                    <span data-fr>Erreur lors du chargement des commandes. Veuillez actualiser la page.</span>
                </td>
            </tr>
        `;
        applyLanguageDisplay(tableBody);
    } finally {
        hideLoading();
    }
}

function updatePaginationInfo(start, end, total) {
    const paginationInfo = document.querySelector('.pagination-info');
    if (!paginationInfo) return;

    const currentLang = getCurrentLanguage();

    const translations = {
        en: `Showing ${start} to ${end} of ${total} results`,
        fr: `Affichage de ${start} à ${end} sur ${total} résultats`
    };

    paginationInfo.textContent = translations[currentLang];
}

// Update page number buttons
function updatePageNumbers(totalPages) {
    let pages = [];
    if (totalPages <= 3) {
        pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (currentPage <= 2) {
        pages = [1, 2, 3];
    } else if (currentPage >= totalPages - 1) {
        pages = [totalPages - 2, totalPages - 1, totalPages];
    } else {
        pages = [currentPage - 1, currentPage, currentPage + 1];
    }

    pageNumbers.innerHTML = pages.map(page => `
        <button class="page-number ${page === currentPage ? 'active' : ''}"
                onclick="goToPage(${page})">${page}</button>
    `).join('');
}

// Navigation functions
function goToPage(page) {
    currentPage = page;
    updateTable();
}

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        updateTable();
    }
});

nextPageBtn.addEventListener('click', () => {
    if (currentPage < Math.ceil(totalOrders / itemsPerPage)) {
        currentPage++;
        updateTable();
    }
});

// Show order details - opens order details page in new tab
function showOrderDetails(orderId) {
    const orderDetailsUrl = `/order-details/?orderId=${encodeURIComponent(orderId)}`;
    window.open(orderDetailsUrl, '_blank');
}

// Initialize the table
updateTable();

// Function to find design info (shortcode and product_type) by design name or custom name
async function findDesignInfoByName(designName) {
    const { data, error } = await supabase
        .from('user_files')
        .select('short_code, product_type')
        .or(`design_name.eq."${designName}",custom_name.eq."${designName}"`)
        .single();

    if (error) {
        console.error('Error finding design info:', error);
        return null;
    }

    return data ? { short_code: data.short_code, product_type: data.product_type || 'socks' } : null;
}

// Function to open design details page
async function openDesignDetails(designName) {
    const designInfo = await findDesignInfoByName(designName);
    if (designInfo && designInfo.short_code) {
        // Determine the correct admin-design path based on product_type
        const adminDesignPath = designInfo.product_type === 'jersey' 
            ? '/jersey-configurator/admin-design/' 
            : '/socks-configurator/admin-design/';
        
        window.open(`${adminDesignPath}?shortCode=${encodeURIComponent(designInfo.short_code)}`, '_blank');
    } else {
        console.error('Design info not found for design:', designName);
        window.translatedAlert('design_details_not_found');
    }
}

// Make functions globally accessible
window.openDesignDetails = openDesignDetails;
window.showOrderDetails = showOrderDetails;
window.goToPage = goToPage;

// Event delegation for clickable links (design names and order IDs)
// This approach works reliably with async functions unlike inline onclick
document.addEventListener('click', async (e) => {
    // Handle design name links
    const designLink = e.target.closest('.design-link');
    if (designLink) {
        e.preventDefault();
        e.stopPropagation();
        const designName = designLink.getAttribute('data-design-name');
        if (designName) {
            await openDesignDetails(designName);
        }
        return;
    }
    
    // Handle order ID links
    const orderLink = e.target.closest('.order-link');
    if (orderLink) {
        e.preventDefault();
        e.stopPropagation();
        const orderId = orderLink.getAttribute('data-order-id');
        if (orderId) {
            showOrderDetails(orderId);
        }
        return;
    }
});

// Add design_details_not_found message to alertMessages if not present
if (window.alertMessages && !window.alertMessages['design_details_not_found']) {
    window.alertMessages['design_details_not_found'] = {
        'en': 'Unable to find design details. Please try again later.',
        'fr': 'Impossible de trouver les détails du design. Veuillez réessayer plus tard.'
    };
}
