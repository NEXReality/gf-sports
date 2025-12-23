// SUPABASE_URL is exposed on window by auth.js (loaded before this script)
// Use window.SUPABASE_URL directly to avoid redeclaration conflict
const SUPABASE_URL_VALUE = window.SUPABASE_URL || 'https://jvuibcqogyyffylvfeog.supabase.co';

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
  const adminDesignPath = productType === 'jersey' 
    ? '/jersey-configurator/admin-design/' 
    : '/socks-configurator/admin-design/';
  
  const designUrl = `${window.location.origin}${adminDesignPath}?shortCode=${shortCode}`;
  window.open(designUrl, '_blank');
}
