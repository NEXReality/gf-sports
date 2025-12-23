// Get Supabase client from auth.js
const SUPABASE_URL = 'https://jvuibcqogyyffylvfeog.supabase.co';

// Get supabase client from window (set by auth.js)
let supabase = window.supabaseClient;

// Helper functions (from auth.js or fallback)
function getCurrentLanguage() {
    return window.getCurrentLanguage ? window.getCurrentLanguage() : (localStorage.getItem("language") || "en");
}

function getTranslation(key, lang) {
    if (window.getTranslation) {
        return window.getTranslation(key, lang);
    }
    // Fallback translations
    const translations = {
        created_on: {
            en: "Created on",
            fr: "Créé le"
        }
    };
    return translations[key]?.[lang] || translations[key]?.["en"] || key;
}

function showLoading() {
    if (window.showLoading) {
        window.showLoading();
    } else {
        const loadingAnimation = document.getElementById('loading-animation');
        if (loadingAnimation) {
            loadingAnimation.style.display = 'block';
        }
    }
}

function hideLoading() {
    if (window.hideLoading) {
        window.hideLoading();
    } else {
        const loadingAnimation = document.getElementById('loading-animation');
        if (loadingAnimation) {
            loadingAnimation.style.display = 'none';
        }
    }
}

// Function to update configurator link based on query parameter
function updateConfiguratorLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from');
    const configuratorLink = document.querySelector('a.nav-link[href*="configurator"]');
    const placeOrderLink = document.querySelector('a.nav-link[href*="place-order"]');
    
    if (configuratorLink) {
        if (from === 'socks') {
            configuratorLink.href = '../socks-configurator/index.html';
        } else {
            // Default to jersey if from=jersey or no parameter
            configuratorLink.href = '../jersey-configurator/index.html';
        }
    }
    
    // Update Place Order link to preserve the query parameter
    if (placeOrderLink && from) {
        const currentHref = placeOrderLink.getAttribute('href');
        const baseUrl = currentHref.split('?')[0];
        placeOrderLink.href = `${baseUrl}?from=${from}`;
    }
}

// Function to update brand section based on query parameter
function updateBrandSection() {
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from');
    const brandDiv = document.querySelector('.brand');
    
    if (!brandDiv) return;
    
    if (from === 'socks') {
        // Update to socks brand
        const existingLogo = brandDiv.querySelector('img, svg');
        if (existingLogo) {
            existingLogo.remove();
        }
        
        // Create socks SVG
        const socksSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        socksSvg.setAttribute('viewBox', '5 59 10 10');
        socksSvg.setAttribute('enable-background', 'new 5 59 10 10');
        socksSvg.setAttribute('style', 'height: 39px;');
        
        const paths = [
            { fill: '#10319C', d: 'M8.6,66.2C8.6,66.2,8.6,66.2,8.6,66.2c0-0.3,0.1-0.5,0.2-0.7c0-0.1,0.1-0.2,0-0.3c-0.1-0.4-0.4-0.6-0.7-0.7c0.3-0.6,0.6-1.2,0.7-1.8c0.1-0.4,0.1-0.8,0.2-1.2c0-0.1,0-0.2,0-0.3c0.1,0.1,0.1,0.2,0.1,0.3C9.5,62,10,62.6,10.6,63c-0.1,0.4-0.1,0.8-0.2,1.2c-0.1,0.1-0.2,0.1-0.3,0.2c-0.3,0.2-0.6,0.4-0.9,0.7C9,65.4,8.7,65.7,8.6,66.2z' },
            { fill: '#EE3140', d: 'M9.3,65c0.3-0.2,0.6-0.5,0.9-0.7c0.1-0.1,0.2-0.1,0.3-0.2c0,0.1,0,0.2,0,0.2c0,0.4,0.1,0.8,0.2,1.1c0.2,0.5,0.6,1,1.1,1.2c0.1,0,0.1,0.1,0.2,0.1c-0.2,0.3-0.3,0.6-0.5,0.9c-0.4-0.1-0.7-0.4-1-0.6c-0.4-0.4-0.7-0.8-0.9-1.3C9.5,65.6,9.4,65.3,9.3,65z' },
            { fill: '#D8D8D8', d: 'M9.3,65c0.1,0.3,0.2,0.6,0.3,0.9c0.2,0.5,0.5,0.9,0.9,1.3c0.3,0.3,0.6,0.5,1,0.6c0,0.1,0,0.1,0,0.2c-0.3,0.1-0.7,0.1-1,0c-0.3-0.1-0.5-0.2-0.6-0.5c-0.1-0.2-0.2-0.3-0.3-0.4c-0.2-0.4-0.5-0.7-0.9-0.8C8.7,65.7,8.9,65.3,9.3,65z' },
            { fill: '#D8D8D8', d: 'M10.6,63C10,62.6,9.5,62,9.1,61.4c0-0.1-0.1-0.2-0.1-0.2c0-0.1,0-0.2,0-0.3c0-0.2,0-0.3,0-0.5c0.2,0.1,0.3,0.1,0.4,0.2c-0.1,0.2-0.1,0.4-0.1,0.6c0,0,0.1,0.1,0.1,0.1c0.5,0.2,1,0.3,1.6,0.3C10.9,61.9,10.8,62.4,10.6,63z' },
            { fill: '#2B3870', d: 'M8.1,64.3c0.4,0.1,0.7,0.4,0.8,0.8c0,0.1,0,0.2,0,0.3c-0.1,0.2-0.2,0.5-0.3,0.7C8.3,66,8,65.8,7.8,65.6c-0.1-0.2-0.2-0.4-0.1-0.7C7.9,64.8,8,64.5,8.1,64.3z' },
            { fill: '#EE3140', d: 'M11,61.5c-0.6,0-1.1-0.2-1.6-0.3c-0.1,0-0.1-0.1-0.1-0.1c0-0.2,0-0.4,0.1-0.6c0.4,0.1,0.9,0.2,1.3,0.3c0.2,0,0.3,0.1,0.5,0.1C11.2,61.1,11.1,61.3,11,61.5z' },
            { fill: '#2B3870', d: 'M11.4,67.9c0-0.1,0-0.1,0-0.2c0.1-0.3,0.2-0.7,0.4-0.9c0.2,0.1,0.5,0.2,0.5,0.5c0.1,0.2,0,0.4-0.2,0.5C12,67.8,11.7,67.9,11.4,67.9z' }
        ];
        
        paths.forEach(pathData => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('fill', pathData.fill);
            path.setAttribute('d', pathData.d);
            socksSvg.appendChild(path);
        });
        
        brandDiv.insertBefore(socksSvg, brandDiv.querySelector('.brand-name'));
        
        // Update brand name
        const brandName = brandDiv.querySelector('.brand-name');
        if (brandName) {
            brandName.innerHTML = '<span data-en>3D Socks Configurator</span><span data-fr>Configurateur de Chaussettes 3D</span>';
            // Update language display
            const currentLang = getCurrentLanguage();
            brandName.querySelectorAll(`[data-${currentLang}]`).forEach((el) => (el.style.display = "inline"));
            brandName.querySelectorAll(`[data-${currentLang === "en" ? "fr" : "en"}]`).forEach((el) => (el.style.display = "none"));
        }
    } else {
        // Update to jersey brand (default)
        const existingLogo = brandDiv.querySelector('img, svg');
        if (existingLogo && existingLogo.tagName === 'SVG') {
            existingLogo.remove();
        }
        
        // Ensure jersey img exists
        let jerseyImg = brandDiv.querySelector('img.brand-logo');
        if (!jerseyImg) {
            jerseyImg = document.createElement('img');
            jerseyImg.className = 'brand-logo';
            jerseyImg.src = '../images/jersey_logo.svg';
            jerseyImg.alt = 'Jersey logo';
            jerseyImg.style.height = '30px';
            brandDiv.insertBefore(jerseyImg, brandDiv.querySelector('.brand-name'));
        } else {
            jerseyImg.style.height = '30px';
        }
        
        // Update brand name
        const brandName = brandDiv.querySelector('.brand-name');
        if (brandName) {
            brandName.innerHTML = '<span data-en>3D Jersey Configurator</span><span data-fr>Configurateur de Maillot 3D</span>';
            // Update language display
            const currentLang = getCurrentLanguage();
            brandName.querySelectorAll(`[data-${currentLang}]`).forEach((el) => (el.style.display = "inline"));
            brandName.querySelectorAll(`[data-${currentLang === "en" ? "fr" : "en"}]`).forEach((el) => (el.style.display = "none"));
        }
    }
}

// Fetch designs from Supabase
async function fetchDesigns() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
        .from('user_files')
        .select("id, design_name, name, custom_name, design_metadata, created_at, short_code, order_placed, product_type")
        .eq('owner', user.id)
        .not('design_name', 'is', null);

    if (error) {
        console.error('Error fetching designs:', error);
        return [];
    }

    return data.filter(design => design.design_name !== null);
}

// Create design card element
function createDesignCard(design) {
    const timestamp = new Date().getTime();
    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/public-bucket/${design.name}?t=${timestamp}`;
    const displayName = design.custom_name || design.design_name;
    const card = document.createElement('div');
    card.className = 'design-card';
    card.dataset.designMetadata = JSON.stringify(design.design_metadata);
    card.dataset.productType = design.product_type || 'jersey';
    card.innerHTML = `
        <div class="design-header" data-design-id="${design.id}" data-short-code="${design.short_code}" data-product-type="${design.product_type || 'jersey'}">
            <h3 class="design-title" id="page-title" data-original-name="${displayName}">${displayName}</h3>
            <button class="menu-button" aria-label="More options">
                <svg width="4" height="16" viewBox="0 0 4 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="2" cy="2" r="2" fill="currentColor"/>
                    <circle cx="2" cy="8" r="2" fill="currentColor"/>
                    <circle cx="2" cy="14" r="2" fill="currentColor"/>
                </svg>
            </button>
            <div class="design-menu" style="display: none;">
                <button class="menu-item rename-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span data-en>Rename</span>
                    <span data-fr>Renommer</span>
                </button>
                <button class="menu-item share-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 9.316a3 3 0 105.368-2.684 3 3 0 00-5.368 2.684zm0-9.316a3 3 0 105.366-2.683 3 3 0 00-5.366 2.683z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span data-en>Share</span>
                    <span data-fr>Partager</span>
                </button>
                <button class="menu-item delete-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span data-en>Delete</span>
                    <span data-fr>Supprimer</span>
                </button>
            </div>
        </div>
        <div class="design-preview">
            <img src="${imageUrl}" alt="${displayName} Preview" />
        </div>
        <div class="design-footer">
            <span class="creation-date" id="creation-date">
                ${getTranslation("created_on", getCurrentLanguage())}: ${new Date(design.created_at).toLocaleDateString()}
            </span>
        </div>
    `;

    const currentLang = getCurrentLanguage();
    card.querySelectorAll(`[data-${currentLang}]`).forEach((el) => (el.style.display = "inline"));
    card.querySelectorAll(`[data-${currentLang === "en" ? "fr" : "en"}]`).forEach((el) => (el.style.display = "none"));

    const titleElement = card.querySelector('.design-title');
    titleElement.contentEditable = false;
    titleElement.classList.remove('renaming');

    return card;
}

// Update design cards language
function updateDesignCards(lang) {
    const designCards = document.querySelectorAll('.design-card');
    designCards.forEach(card => {
        card.querySelectorAll(`[data-${lang}]`).forEach((el) => (el.style.display = "inline"));
        card.querySelectorAll(`[data-${lang === "en" ? "fr" : "en"}]`).forEach((el) => (el.style.display = "none"));
    });
}

// Make updateDesignCards available globally for auth.js
window.updateDesignCards = updateDesignCards;

// Render designs
async function renderDesigns() {
    showLoading();
    const designs = await fetchDesigns();

    // Sort designs by created_at date in descending order (latest first)
    designs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const designsGrid = document.querySelector(".designs-grid");
    designsGrid.innerHTML = "";

        designs.forEach((design) => {
        const card = createDesignCard(design);
        card.addEventListener("click", (event) => {
            const isRenaming = card.querySelector(".design-title.renaming");
            if (!event.target.closest(".menu-button") && !event.target.closest(".design-menu") && !isRenaming) {
                openDesign(design.short_code, design.product_type);
            }
        });
        designsGrid.appendChild(card);
    });

    hideLoading();

    // Add event listeners for menu buttons
    document.querySelectorAll(".menu-button").forEach((button) => {
        button.addEventListener("click", toggleMenu);
    });

    document.querySelectorAll(".rename-button").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            const card = event.target.closest(".design-card");
            const titleElement = card.querySelector(".design-title");
            titleElement.contentEditable = true;
            titleElement.classList.add("renaming");
            titleElement.focus();
        });
    });

    document.querySelectorAll('.share-button').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            shareDesign(event);
        });
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            deleteDesign(event);
        });
    });

    document.querySelectorAll('.design-title').forEach(titleElement => {
        titleElement.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                titleElement.blur();
            }
        });

        titleElement.addEventListener('blur', () => {
            titleElement.contentEditable = false;
            titleElement.classList.remove('renaming');
            const designId = titleElement.closest('.design-header').dataset.designId;
            renameDesign(designId, titleElement.textContent);
        });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (event) => {
        if (!event.target.closest(".design-card")) {
            closeAllMenus();
        }
    });
}

// Close all menus
function closeAllMenus() {
    document.querySelectorAll('.design-menu').forEach(menu => {
        menu.style.display = 'none';
    });
    document.querySelectorAll('.design-title').forEach(title => {
        if (title.contentEditable === 'true') {
            title.contentEditable = false;
            title.classList.remove('renaming');
        }
    });
}

// Toggle menu
function toggleMenu(event) {
    event.stopPropagation();
    const designHeader = event.target.closest('.design-header');
    if (!designHeader) return;
    
    const clickedMenu = designHeader.querySelector('.design-menu');
    if (!clickedMenu) return;
    
    const isClickedMenuVisible = clickedMenu.style.display === 'block';

    // Close all menus
    closeAllMenus();

    // If the clicked menu wasn't visible, show it
    if (!isClickedMenuVisible) {
        clickedMenu.style.display = 'block';
    }
}

// Rename design
async function renameDesign(designId, newName) {
    let success = false;
    let message = '';

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw new Error('Error getting user information');

        // Check if a design with the new name already exists (across all product types)
        const { data: existingDesigns, error: checkError } = await supabase
            .from("user_files")
            .select("id")
            .or(`design_name.eq.${newName},custom_name.eq.${newName}`)
            .eq("owner", user.id);

        if (checkError) {
            throw new Error('Error checking design names');
        }

        if (existingDesigns && existingDesigns.length > 0) {
            window.translatedAlert('unique_name_error');
            throw new Error('A design with this name already exists');
        }

        // If no existing design with that name, proceed with renaming
        const { data, error } = await supabase
            .from("user_files")
            .update({ custom_name: newName })
            .eq("id", designId);

        if (error) {
            throw new Error('Failed to rename design');
        }

        success = true;
        message = 'Design renamed successfully';

    } catch (error) {
        console.error('Error in renameDesign:', error);
        message = error.message;
    } finally {
        // Update the UI
        const titleElement = document.querySelector(`[data-design-id="${designId}"] .design-title`);
        if (titleElement) {
            if (!success) {
                titleElement.textContent = titleElement.getAttribute("data-original-name");
            } else {
                titleElement.setAttribute("data-original-name", newName);
            }
        }
        return { success, message };
    }
}

// Share design
function shareDesign(event) {
    const card = event.target.closest('.design-card');
    const designName = card.querySelector('.design-title').textContent;
    const designMetadataString = card.dataset.designMetadata;
    const productType = card.dataset.productType || 'jersey';

    let designMetadata;
    try {
        designMetadata = JSON.parse(designMetadataString);
    } catch (error) {
        console.error('Error parsing design metadata:', error);
        window.translatedAlert('error_sharing_design');
        return;
    }

    if (!designMetadata) {
        console.error('Design metadata is missing');
        window.translatedAlert('unable_to_share_missing_data');
        return;
    }

    const params = new URLSearchParams();
    params.append('name', designName);
    params.append('metadata', JSON.stringify(designMetadata));

    const configuratorPath = productType === 'socks' ? 'socks-configurator' : 'jersey-configurator';
    const shareUrl = `${window.location.origin}/${configuratorPath}/share/?${params.toString()}`;

    // Copy the URL to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl)
            .then(() => window.translatedAlert('share_url_copied'))
            .catch(err => {
                console.error('Error copying URL: ', err);
                fallbackCopyToClipboard(shareUrl);
            });
    } else {
        fallbackCopyToClipboard(shareUrl);
    }
}

// Fallback clipboard copy function
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            window.translatedAlert('share_url_copied');
        } else {
            window.translatedAlert('failed_to_copy_share_url');
        }
    } catch (err) {
        console.error('Fallback copy failed: ', err);
        window.translatedAlert('failed_to_copy_share_url');
    } finally {
        document.body.removeChild(textArea);
    }
}

// Delete design
async function deleteDesign(event) {
    const card = event.target.closest(".design-card");
    const designId = card.querySelector(".design-header").dataset.designId;
    const designName = card.querySelector(".design-title").textContent;

    // First, check if the design has been ordered
    const { data: designData, error: fetchError } = await supabase
        .from("user_files")
        .select("order_placed, name")
        .eq("id", designId)
        .single();

    if (fetchError) {
        console.error("Error fetching design data:", fetchError);
        return;
    }

    if (designData.order_placed > 0) {
        window.translatedAlert('design_ordered_no_delete');
        return;
    }

    const currentLang = getCurrentLanguage();
    const deleteConfirmationKey = 'delete_confirmation';
    let translatedMessage = getTranslation(deleteConfirmationKey, currentLang);
    if (translatedMessage === deleteConfirmationKey) {
        translatedMessage = `Are you sure you want to delete "${designName}"? This action cannot be undone.`;
    } else {
        translatedMessage = translatedMessage.replace('{0}', designName);
    }
    
    const shouldDelete = window.translatedConfirm ? await window.translatedConfirm(translatedMessage) : await confirm(translatedMessage);

    if (shouldDelete) {
        try {
            // Step 1: Delete the file from storage
            const { error: storageError } = await supabase.storage
                .from("public-bucket")
                .remove([designData.name]);

            if (storageError) throw storageError;

            // Step 2: Delete the database entry
            const { error: dbError } = await supabase
                .from("user_files")
                .delete()
                .eq("id", designId);

            if (dbError) throw dbError;

            // Step 3: Remove the card from the UI
            card.remove();

            console.log("Design deleted successfully");
        } catch (error) {
            console.error("Error deleting design:", error);
            window.translatedAlert('error_deleting_design');
        }
    }
}

// Open design
function openDesign(shortCode, productType) {
    if (shortCode) {
        const configuratorPath = productType === 'socks' ? 'socks-configurator' : 'jersey-configurator';
        const designUrl = `${window.location.origin}/${configuratorPath}/index.html?shortCode=${shortCode}`;
        window.open(designUrl, '_self');
    }
}

// Initialize page when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Update configurator link based on query parameter
    updateConfiguratorLink();
    
    // Update brand section based on query parameter
    updateBrandSection();
    
    // Show brand after update
    const brandDiv = document.querySelector('.brand');
    if (brandDiv) {
        brandDiv.style.visibility = 'visible';
    }
    
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        const designsGrid = document.querySelector(".designs-grid");
        const currentLang = getCurrentLanguage();
        designsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
                <p style="color: var(--color-text-secondary); margin-bottom: 1rem;">
                    <span data-en style="display: ${currentLang === 'en' ? 'inline' : 'none'}">Please log in to view your designs</span>
                    <span data-fr style="display: ${currentLang === 'fr' ? 'inline' : 'none'}">Veuillez vous connecter pour voir vos designs</span>
                </p>
            </div>
        `;
    } else {
        await renderDesigns();
    }
});
