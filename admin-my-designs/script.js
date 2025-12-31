// SUPABASE_URL is exposed on window by auth.js (loaded before this script)
// Use window.SUPABASE_URL directly to avoid redeclaration conflict
const SUPABASE_URL_VALUE = window.SUPABASE_URL || 'https://jvuibcqogyyffylvfeog.supabase.co';

// Helper function to get base path (repository name) for GitHub Pages
// Returns '/gf-sports' on GitHub Pages or '' for local development
function getBasePath() {
    const pathname = window.location.pathname;
    // Extract repo name from path like /gf-sports/admin-my-designs/index.html
    const pathParts = pathname.split('/').filter(part => part);
    
    // Known subdirectories that indicate we're inside the repo
    const knownSubdirs = ['admin-my-designs', 'admin', 'jersey-configurator', 'socks-configurator', 
                          'my-designs', 'place-order', 'order-details', 'reset-password'];
    
    // If we're on GitHub Pages
    if (window.location.hostname.includes('github.io')) {
        // Check if first path part is a known subdirectory (means repo name is missing from URL)
        if (pathParts.length > 0 && knownSubdirs.includes(pathParts[0])) {
            // Repo name is missing, but we know it should be 'gf-sports' for this GitHub Pages site
            return '/gf-sports';
        }
        
        // Check if we're in a known subdirectory
        const subdirIndex = pathParts.findIndex(part => knownSubdirs.includes(part));
        if (subdirIndex > 0) {
            // Repo name is the part before the known subdirectory
            return `/${pathParts[subdirIndex - 1]}`;
        } else if (subdirIndex === -1 && pathParts.length > 0) {
            // Not in a known subdir, first part is likely the repo name
            return `/${pathParts[0]}`;
        } else if (subdirIndex === 0) {
            // Directly in a subdirectory without repo name - return repo name for this site
            return '/gf-sports';
        }
    }
    
    // For local development or if no repo name found, return empty string
    return '';
}

const urlParams = new URLSearchParams(window.location.search);
const ownerId = urlParams.get('owner');
if (ownerId) {
  console.log("Owner ID from URL:", ownerId);
} else {
  console.error("No owner ID found in the URL");
}

async function fetchDesigns() {
  const { data, error } = await supabase
    .from('user_files')
    .select("owner, id, design_name, name, custom_name, design_metadata, created_at, short_code, order_placed, product_type")
    .eq('owner', ownerId) // Filter by owner ID
    .not('design_name', 'is', null); // Filter out null design_name

  if (error) {
    console.error('Error fetching designs:', error);
    return [];
  }

  return data.filter(design => design.design_name !== null);
}

function createDesignCard(design) {
  const imageUrl = `${SUPABASE_URL_VALUE}/storage/v1/object/public/public-bucket/${design.name}`;
  const displayName = design.custom_name || design.design_name;
  const card = document.createElement('div');
  card.className = 'design-card';
  card.dataset.designMetadata = JSON.stringify(design.design_metadata);
  card.dataset.productType = design.product_type || 'socks';
  card.innerHTML = `
        <div class="design-header" data-design-id="${design.id}" data-short-code="${design.short_code}" data-product-type="${design.product_type || 'socks'}">
            <h3 class="design-title" id="page-title" data-original-name="${displayName}">${displayName}</h3>
        </div>
        <div class="design-preview">
            <img src="${imageUrl}" alt="${displayName} Preview" />
        </div>
        <div class="design-footer">
            <span class="creation-date" id="creation-date">Created on: ${new Date(design.created_at).toLocaleDateString()}</span>
        </div>
    `;

  const titleElement = card.querySelector('.design-title');
  titleElement.contentEditable = false;
  titleElement.classList.remove('renaming');

  return card;
}

async function renderDesigns() {
  showLoading();
  const designs = await fetchDesigns()

  // Sort designs by created_at date in descending order (latest first)
  designs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const designsGrid = document.querySelector(".designs-grid")
  designsGrid.innerHTML = "" // Clear existing content

  designs.forEach((design) => {
    const card = createDesignCard(design)
    card.addEventListener("click", () => {
      openDesign(design.short_code, design.product_type)
    })
    designsGrid.appendChild(card)
  })

  hideLoading();
}

// Call renderDesigns when the page loads
document.addEventListener('DOMContentLoaded', renderDesigns);

function openDesign(shortCode, productType) {
  // Determine the correct admin-design path based on product_type
  // Default to socks if product_type is missing/null
  const basePath = getBasePath();
  const adminDesignPath = productType === 'jersey' 
    ? '/jersey-configurator/admin-design/' 
    : '/socks-configurator/admin-design/';
  
  const designUrl = `${window.location.origin}${basePath}${adminDesignPath}?shortCode=${shortCode}`;
  window.open(designUrl, '_blank');
}
