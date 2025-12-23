// Supabase URL - using the same value as auth.js
// Note: auth.js declares this, so we use the value directly to avoid conflicts
const SUPABASE_URL_VALUE = 'https://jvuibcqogyyffylvfeog.supabase.co';

// Function to update configurator link based on query parameter
function updateConfiguratorLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from');
    const configuratorLink = document.querySelector('a.nav-link[href*="configurator"]');
    const myDesignsLink = document.querySelector('a.nav-link[href*="my-designs"]');
    
    if (configuratorLink) {
        if (from === 'socks') {
            configuratorLink.href = '../socks-configurator/index.html';
        } else {
            // Default to jersey if from=jersey or no parameter
            configuratorLink.href = '../jersey-configurator/index.html';
        }
    }
    
    // Update My Designs link to preserve the query parameter
    if (myDesignsLink && from) {
        const currentHref = myDesignsLink.getAttribute('href');
        const baseUrl = currentHref.split('?')[0];
        myDesignsLink.href = `${baseUrl}?from=${from}`;
    }
}

// Function to get current language (helper function)
function getCurrentLanguage() {
    return localStorage.getItem("language") || "en";
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

document.addEventListener('DOMContentLoaded', () => {
  // Update configurator link based on query parameter
  updateConfiguratorLink();
  // Update brand section based on query parameter (synchronously)
  updateBrandSection();
  // Show brand after update
  const brandDiv = document.querySelector('.brand');
  if (brandDiv) {
    brandDiv.style.visibility = 'visible';
  }
  
  const addDesignButton = document.getElementById('add-design-button');
  const modal = document.getElementById('design-select-modal');
  const closeModalButton = document.querySelector('.close-modal');
  const designList = document.querySelector('.design-list');
  const orderTableBody = document.getElementById('order-table-body');
  const grandTotal = document.getElementById('grand-total');

  // Jersey sizes (standard sizes)
  const JERSEY_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  // Socks sizes
  const SOCKS_SIZES = ['27/30', '31/34', '35/38', '39/42', '43/46', '47/50'];

  async function fetchDesigns() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('user_files')
      .select('id, design_name, name, custom_name, design_metadata, created_at, short_code, owner, product_type')
      .eq('owner', user.id) // Filter by owner ID
      .in('product_type', ['jersey', 'socks']) // Filter for both jersey and socks
      .not('design_name', 'is', null) // Filter out null design_name
      .order('created_at', { ascending: false }); // Sort by created_at in descending order

    if (error) {
      console.error('Error fetching designs:', error);
      return [];
    }

    return data.filter(design => design.design_name !== null || design.custom_name !== null);
  }

  function openModal() {
    modal.classList.add('active');
    loadDesigns();
  }

  function closeModal() {
    modal.classList.remove('active');
  }

  async function loadDesigns() {
    showLoading();
    const designs = await fetchDesigns();
    designList.innerHTML = '';
    designs.forEach(design => {
      const designElement = createDesignElement(design);
      designList.appendChild(designElement);
    });
    hideLoading();
  }

  function createDesignElement(design) {
    const designItem = document.createElement("div")
    designItem.className = "design-item"
    designItem.dataset.designId = design.id
    const imageUrl = `${SUPABASE_URL_VALUE}/storage/v1/object/public/public-bucket/${design.name}`
    const createdDate = new Date(design.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    const displayName = design.custom_name && design.custom_name.trim() !== "" ? design.custom_name : design.design_name

    designItem.innerHTML = `
                <div class="design-preview">
                    <img src="${imageUrl}" alt="${displayName}" class="design-thumbnail">
                </div>
                <div class="design-info">
                    <h3>${displayName}</h3>
                    <p>${createdDate}</p>
                </div>
                <button class="select-button">
                    <span data-en>Select</span>
                    <span data-fr>Sélectionner</span>
                </button>
            `

    designItem.addEventListener("click", () => selectDesign(design))
    const selectButton = designItem.querySelector(".select-button")
    selectButton.addEventListener("click", (e) => {
      e.stopPropagation()
      selectDesign(design)
    })

    return designItem
  }

  function selectDesign(design) {
    addDesignToOrder(design.id);
    closeModal();
  }

  async function addDesignToOrder(designId) {
    // Fetch the design data from Supabase
    const { data: design, error } = await supabase.from("user_files").select("*").eq("id", designId).single()

    if (error) {
      console.error("Error fetching design:", error)
      return
    }

    const displayName = design.custom_name && design.custom_name.trim() !== "" ? design.custom_name : design.design_name
    const productType = design.product_type || 'jersey'
    const row = document.createElement("tr")
    row.className = "design-row"
    row.dataset.designId = design.id
    row.dataset.productType = productType
    const isSocks = productType === 'socks'
    
    const currentLang = getCurrentLanguage();
    row.innerHTML = `
            <td>${displayName}</td>
            <td>
                <div class="preview-box">
                    <img src="${SUPABASE_URL_VALUE}/storage/v1/object/public/public-bucket/${design.name}" alt="${design.design_name} Preview" class="design-preview">
                </div>
            </td>
            <td class="product-type-cell" data-product-type="${productType}">
                <span data-en>${productType === 'socks' ? 'Socks' : 'Jersey'}</span>
                <span data-fr>${productType === 'socks' ? 'Chaussettes' : 'Maillot'}</span>
            </td>
            <td>
                <div class="size-ranges">
                    ${createSizeRangeGroup(row).outerHTML}
                </div>
            </td>
            <td class="silicon-grip">
                ${isSocks ? '<input type="checkbox" class="silicon-grip-checkbox">' : '<span class="silicon-grip-placeholder"></span>'}
            </td>
            <td class="total-quantity">0</td>
            <td>
                <button class="remove-design" aria-label="${currentLang === 'fr' ? 'Supprimer' : 'Remove'}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </td>
        `
    
    // Update language display for the new row
    const productTypeCell = row.querySelector('.product-type-cell');
    if (productTypeCell) {
      productTypeCell.querySelectorAll(`[data-${currentLang}]`).forEach((el) => (el.style.display = "inline"));
      productTypeCell.querySelectorAll(`[data-${currentLang === "en" ? "fr" : "en"}]`).forEach((el) => (el.style.display = "none"));
    }
    orderTableBody.appendChild(row)
    setupRowEventListeners(row)
    initializeSizeRanges(row)
    updateQuantities()
    
    // Update header visibility based on product types in table
    updateSiliconGripHeaderVisibility()
  }

  function createSizeRangeGroup(row) {
    const div = document.createElement('div');
    div.className = 'size-range-group';

    const availableSizes = getAvailableSizes(row);
    const defaultSize = availableSizes[0] || '';

    div.innerHTML = `
            <select class="size-range-select">
                ${availableSizes.map(size => `<option value="${size}">${size}</option>`).join('')}
            </select>
            <input type="number" class="quantity-input" min="1" value="0">
            <button class="add-size-range">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <button class="remove-size-range">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;

    const select = div.querySelector('.size-range-select');
    if (select) {
      select.value = defaultSize;
    }

    return div;
  }

  // This function is no longer needed as we use data-en/data-fr spans
  // Keeping it for backward compatibility but it should not be used
  function getProductTypeDisplay(productType) {
    const currentLang = getCurrentLanguage();
    if (productType === 'socks') {
      return currentLang === 'fr' ? 'Chaussettes' : 'Socks';
    } else {
      return currentLang === 'fr' ? 'Maillot' : 'Jersey';
    }
  }

  function getAvailableSizes(row) {
    const productType = row.dataset.productType || 'jersey';
    const usedSizes = Array.from(row.querySelectorAll('.size-range-select')).map(select => select.value);
    const availableSizes = productType === 'socks' ? SOCKS_SIZES : JERSEY_SIZES;
    return availableSizes.filter(size => !usedSizes.includes(size));
  }

  function setupRowEventListeners(row) {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.add-size-range')) {
        addNewSizeRange(row);
      } else if (e.target.closest('.remove-size-range')) {
        removeSizeRangeGroup(e.target.closest('.remove-size-range'));
      } else if (e.target.closest('.remove-design')) {
        removeDesignRow(row);
      }
    });

    row.addEventListener('input', (e) => {
      if (e.target.classList.contains('quantity-input')) {
        updateQuantities();
      }
    });

    row.addEventListener('change', (e) => {
      if (e.target.classList.contains('size-range-select')) {
        updateSizeRangeOptions(row);
      }
    });
  }

  function updateSizeRangeOptions(row) {
    const availableSizes = getAvailableSizes(row);
    row.querySelectorAll('.size-range-select').forEach(select => {
      const currentValue = select.value;
      const options = availableSizes.concat(currentValue).filter((v, i, a) => a.indexOf(v) === i);
      select.innerHTML = options.map(size => `<option value="${size}">${size}</option>`).join('');
      select.value = currentValue;
    });
  }

  function addNewSizeRange(row) {
    const sizeRanges = row.querySelector('.size-ranges');
    const availableSizes = getAvailableSizes(row);

    if (availableSizes.length > 0) {
      const newGroup = createSizeRangeGroup(row);
      sizeRanges.appendChild(newGroup);
      updateSizeRangeOptions(row);
      updateQuantities();
    } else {
      window.translatedAlert('all_sizes_added');
    }
  }

  function initializeSizeRanges(row) {
    const sizeRanges = row.querySelector('.size-ranges');
    sizeRanges.innerHTML = '';
    const initialGroup = createSizeRangeGroup(row);
    sizeRanges.appendChild(initialGroup);
  }

  function removeSizeRangeGroup(button) {
    const group = button.closest('.size-range-group');
    const row = group.closest('.design-row');
    const sizeRanges = group.parentElement;
    if (sizeRanges.children.length > 1) {
      group.remove();
      updateSizeRangeOptions(row);
      updateQuantities();
    }
  }

  function removeDesignRow(row) {
    row.remove();
    updateQuantities();
    updateSiliconGripHeaderVisibility();
  }

  function updateSiliconGripHeaderVisibility() {
    // Keep header and footer always visible for alignment
    // The checkbox visibility is handled per row
    // This function is kept for potential future use but doesn't hide columns
  }

  function updateQuantities() {
    const rows = document.querySelectorAll('.design-row');
    let grandTotalQuantity = 0;

    rows.forEach(row => {
      const quantities = Array.from(row.querySelectorAll('.quantity-input'))
        .map(input => parseInt(input.value) || 0);

      const total = quantities.reduce((sum, qty) => sum + qty, 0);
      row.querySelector('.total-quantity').textContent = total;
      grandTotalQuantity += total;
    });

    grandTotal.textContent = grandTotalQuantity;
  }

  addDesignButton.addEventListener('click', openModal);
  closeModalButton.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Handle quantity input validation
  document.addEventListener('input', (e) => {
    if (e.target.classList.contains('quantity-input')) {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      if (e.target.value.startsWith('0')) {
        e.target.value = e.target.value.substring(1);
      }
      updateQuantities();
    }
  });
});

document.addEventListener("DOMContentLoaded", async () => {
  // Form validation elements
  const fullNameInput = document.getElementById("fullName")
  const clubNameInput = document.getElementById("clubName")
  const emailOrderInput = document.getElementById("email_order")
  const phoneInput = document.getElementById("phone")
  const addressInput = document.getElementById("address")
  const cityInput = document.getElementById("city")
  const zipCodeInput = document.getElementById("zipCode")
  const stateInput = document.getElementById("state")
  const countryInput = document.getElementById("country")
  const placeOrderButton = document.querySelector(".place-order-button")
  const grandTotalElement = document.getElementById("grand-total")

  const formFields = [
    fullNameInput,
    clubNameInput,
    emailOrderInput,
    phoneInput,
    addressInput,
    cityInput,
    zipCodeInput,
    stateInput,
    countryInput,
  ]

  // Form validation functions
  function validateEmail(email) {
    return email.includes("@") && email.includes(".")
  }

  function setupInputValidation(input, regex) {
    if (input) {
      input.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(regex, "")
        validateField(input)
      })
    }
  }

  // Function to get the current language (use global from auth.js if available)
  function getCurrentLanguage() {
    if (window.getCurrentLanguage) {
      return window.getCurrentLanguage();
    }
    // Fallback: Check browser language settings or a stored preference
    const userLang = navigator.language || navigator.userLanguage
    return userLang.substring(0, 2) === "fr" ? "fr" : "en"
  }

  function validateField(field) {
    if (!field) return

    const errorElement = field.parentElement.querySelector(".error-message")
    if (!errorElement) return

    const currentLang = getCurrentLanguage()

    if (field.required && !field.value.trim()) {
      field.classList.add("error")
      errorElement.innerHTML = `<span data-en="${field.name || "This field"} is required." data-fr="${field.name || "Ce champ"} est obligatoire."></span>`
    } else if (field.id === "email_order" && !validateEmail(field.value)) {
      field.classList.add("error")
      errorElement.innerHTML =
        '<span data-en="Please enter a valid email address." data-fr="Veuillez entrer une adresse e-mail valide."></span>'
    } else if (field.id === "phone" && !/^\d{7,15}$/.test(field.value.replace(/\D/g, ""))) {
      field.classList.add("error")
      errorElement.innerHTML =
        '<span data-en="Please enter a valid phone number." data-fr="Veuillez entrer un numéro de téléphone valide."></span>'
    } else {
      field.classList.remove("error")
      errorElement.textContent = ""
    }

    // Show the correct language version
    if (errorElement.firstChild) {
      errorElement.firstChild.textContent = errorElement.firstChild.getAttribute(`data-${currentLang}`)
    }
  }

  // Setup input validation
  setupInputValidation(fullNameInput, /[^A-Za-z ]/g)
  setupInputValidation(clubNameInput, /[^A-Za-z0-9 ]/g)
  setupInputValidation(phoneInput, /[^0-9-+() ]/g)
  setupInputValidation(cityInput, /[^A-Za-z ]/g)
  setupInputValidation(zipCodeInput, /[^0-9-]/g)
  setupInputValidation(stateInput, /[^A-Za-z ]/g)
  setupInputValidation(countryInput, /[^A-Za-z ]/g)

  // Fetch user data from Supabase and populate form
  async function fetchAndPopulateUserData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("No authenticated user found")
      }

      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

      if (error) throw error

      if (data) {
        fullNameInput.value = data.full_name || ""
        clubNameInput.value = data.club_name || ""
        emailOrderInput.value = data.email_order || ""
        phoneInput.value = data.phone || ""
        addressInput.value = data.address_line1 || ""
        cityInput.value = data.city || ""
        zipCodeInput.value = data.zip_code || ""
        stateInput.value = data.state || ""
        countryInput.value = data.country || ""
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  async function saveProfileData() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("No authenticated user found")
    }

    const profileData = {
      user_id: user.id,
      full_name: fullNameInput.value.trim(),
      email: user.email,
      email_order: emailOrderInput.value.trim(),
      phone: phoneInput.value.trim(),
      club_name: clubNameInput.value.trim(),
      address_line1: addressInput.value.trim(),
      city: cityInput.value.trim(),
      state: stateInput.value.trim(),
      zip_code: zipCodeInput.value.trim(),
      country: countryInput.value.trim(),
    }

    const { error } = await supabase.from("profiles").upsert(profileData)

    if (error) throw error
  }

  // Place order form submission
  if (placeOrderButton) {
    placeOrderButton.addEventListener("click", handleOrderSubmission)
  }

  async function handleOrderSubmission(event) {
    event.preventDefault()

    // Validate all fields
    formFields.forEach(validateField)

    // Check if any required fields are empty or have errors
    const hasErrors = formFields.some((field) => field.classList.contains("error"))

    if (hasErrors) {
      window.translatedAlert("form_errors")
      return
    }

    // Validate total quantity
    const grandTotalQuantity = grandTotalElement ? Number.parseInt(grandTotalElement.textContent) : 0
    if (grandTotalQuantity < 0) {
      window.translatedAlert("minimum_quantity_error")
      return
    }

    try {
      // Save the current form data when submitting an order
      await saveProfileData()

      // Gather design details
      const designDetails = await gatherDesignDetails()

      if (designDetails.length === 0) {
        window.translatedAlert("no_designs_in_order")
        return
      }

      // Prepare the order details
      const orderDetails = {
        fullName: fullNameInput.value.trim(),
        emailOrder: emailOrderInput.value.trim(),
        designs: designDetails,
      }

      // Save the order to Supabase
      const savedOrder = await saveOrderToSupabase(orderDetails)

      console.log("Order placed successfully:", savedOrder)

      window.translatedAlert("order_placed_success")
      // Refresh the page
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error("Error submitting order:", error)
      window.translatedAlert("order_placement_error")
    }
  }

  // Handle quantity input validation
  document.addEventListener("input", (e) => {
    if (e.target.classList.contains("quantity-input")) {
      e.target.value = e.target.value.replace(/[^0-9]/g, "")
      if (e.target.value.startsWith("0")) {
        e.target.value = e.target.value.substring(1)
      }
      updateQuantities()
    }
  })

  function updateQuantities() {
    const rows = document.querySelectorAll(".design-row")
    let grandTotal = 0

    rows.forEach((row) => {
      const quantities = Array.from(row.querySelectorAll(".quantity-input")).map(
        (input) => Number.parseInt(input.value) || 0,
      )

      const total = quantities.reduce((sum, qty) => sum + qty, 0)
      const totalQuantityElement = row.querySelector(".total-quantity")
      if (totalQuantityElement) totalQuantityElement.textContent = total
      grandTotal += total
    })

    if (grandTotalElement) grandTotalElement.textContent = grandTotal
  }

  // Fetch and populate user data on page load
  fetchAndPopulateUserData()
  
  // Initialize language toggle
  initializeLanguageToggle()
})

// Language toggle functionality
function updateLanguageDisplay(lang) {
  // Toggle lang-fr class on document element
  if (lang === 'fr') {
    document.documentElement.classList.add('lang-fr');
    document.documentElement.lang = 'fr';
  } else {
    document.documentElement.classList.remove('lang-fr');
    document.documentElement.lang = 'en';
  }
  
  // Update all data-en and data-fr elements
  document.querySelectorAll('[data-en]').forEach(el => {
    if (lang === 'en') {
      if (el.tagName === 'SPAN') {
        el.style.display = 'inline';
      } else {
        el.style.display = '';
      }
    } else {
      el.style.display = 'none';
    }
  });

  document.querySelectorAll('[data-fr]').forEach(el => {
    if (lang === 'fr') {
      if (el.tagName === 'SPAN') {
        el.style.display = 'inline';
      } else {
        el.style.display = '';
      }
    } else {
      el.style.display = 'none';
    }
  });
  
  // Update brand name language if it has data-en/data-fr spans
  const brandName = document.querySelector('.brand-name');
  if (brandName) {
    const hasLangSpans = brandName.querySelector('[data-en], [data-fr]');
    if (hasLangSpans) {
      brandName.querySelectorAll(`[data-${lang}]`).forEach((el) => (el.style.display = "inline"));
      brandName.querySelectorAll(`[data-${lang === "en" ? "fr" : "en"}]`).forEach((el) => (el.style.display = "none"));
    }
  }
  
  // Update page title language
  const pageTitle = document.querySelector('.page-title');
  if (pageTitle) {
    pageTitle.querySelectorAll(`[data-${lang}]`).forEach((el) => {
      if (el.tagName === 'SPAN') {
        el.style.display = 'inline';
      } else {
        el.style.display = '';
      }
    });
    pageTitle.querySelectorAll(`[data-${lang === "en" ? "fr" : "en"}]`).forEach((el) => {
      el.style.display = 'none';
    });
  }
  
  // Update placeholders
  document.querySelectorAll('[data-en-placeholder], [data-fr-placeholder]').forEach(input => {
    const placeholder = input.getAttribute(`data-${lang}-placeholder`);
    if (placeholder) {
      input.placeholder = placeholder;
    }
  });
  
  // Update product type cells in table rows
  document.querySelectorAll('.product-type-cell').forEach(cell => {
    cell.querySelectorAll(`[data-${lang}]`).forEach((el) => (el.style.display = "inline"));
    cell.querySelectorAll(`[data-${lang === "en" ? "fr" : "en"}]`).forEach((el) => (el.style.display = "none"));
  });
}

// Initialize language toggle
function initializeLanguageToggle() {
  const toggleSwitch = document.querySelector('.toggle-switch');
  if (!toggleSwitch) return;
  
  // Get saved language from localStorage or default to 'en'
  const savedLang = localStorage.getItem('language') || 'en';
  
  // Set initial language display
  updateLanguageDisplay(savedLang);
  
  // Set initial toggle state
  toggleSwitch.setAttribute('aria-pressed', savedLang === 'fr' ? 'true' : 'false');
  
  // Remove existing listeners by cloning
  const newToggle = toggleSwitch.cloneNode(true);
  toggleSwitch.parentNode.replaceChild(newToggle, toggleSwitch);
  
  // Add click event listener to the new toggle
  newToggle.addEventListener('click', () => {
    const isPressed = newToggle.getAttribute('aria-pressed') === 'true';
    const newLang = isPressed ? 'en' : 'fr';
    
    // Update toggle state
    newToggle.setAttribute('aria-pressed', newLang === 'fr' ? 'true' : 'false');
    
    // Save to localStorage
    localStorage.setItem('language', newLang);
    
    // Update language display
    updateLanguageDisplay(newLang);
  });
}

// Initialize language on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('language') || 'en';
    updateLanguageDisplay(savedLang);
  });
} else {
  // DOM is already loaded
  const savedLang = localStorage.getItem('language') || 'en';
  updateLanguageDisplay(savedLang);
}


async function gatherDesignDetails() {
  const designs = []
  const designRows = document.querySelectorAll(".design-row")

  designRows.forEach((row) => {
    const designNameElement = row.querySelector("td:first-child")
    const designName = designNameElement ? designNameElement.textContent : "Unnamed Design"
    const designId = row.dataset.designId
    const imageElement = row.querySelector(".design-preview")
    const imageUrl = imageElement ? imageElement.src : null

    if (!designId) {
      console.error("Design ID is missing for row:", row)
      return // Skip this row if designId is missing
    }

    const productType = row.dataset.productType || 'jersey'
    const sizes = {}
    const sizeRangeGroups = row.querySelectorAll(".size-range-group")

    sizeRangeGroups.forEach((group) => {
      const sizeSelect = group.querySelector(".size-range-select")
      const quantityInput = group.querySelector(".quantity-input")

      if (sizeSelect && quantityInput) {
        const size = sizeSelect.value
        const quantity = Number.parseInt(quantityInput.value) || 0
        if (quantity > 0) {
          sizes[size] = (sizes[size] || 0) + quantity
        }
      }
    })

    const siliconGripCheckbox = row.querySelector(".silicon-grip-checkbox")
    const siliconGrip = siliconGripCheckbox ? siliconGripCheckbox.checked : false

    if (Object.keys(sizes).length > 0) {
      designs.push({ 
        id: designId, 
        name: designName, 
        sizes: sizes, 
        imageUrl: imageUrl,
        productType: productType,
        siliconGrip: productType === 'socks' ? siliconGrip : false
      })
    }
  })

  return designs
}

async function saveOrderToSupabase(orderDetails) {
  showLoading(); // Show loading at the start of the function
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      hideLoading(); // Hide loading if there's a user error
      throw userError;
    }
    if (!user) {
      hideLoading(); // Hide loading if no authenticated user is found
      throw new Error("No authenticated user found");
    }

    let totalQuantity = 0;
    const productTypes = new Set();
    const orderItems = orderDetails.designs.map((design) => {
      const itemTotalQuantity = Object.values(design.sizes).reduce((sum, quantity) => sum + quantity, 0);
      totalQuantity += itemTotalQuantity;
      productTypes.add(design.productType || 'jersey');
      return {
        design_id: design.id,
        design_name: design.name || 'Unnamed Design',
        sizes: design.sizes,
        item_total_quantity: itemTotalQuantity,
        image_url: design.imageUrl,
        product_type: design.productType || 'jersey',
        silicon_grip: design.siliconGrip || false,
      };
    });
    
    // Determine order product_type: 'mixed' if both types, otherwise the single type
    const orderProductType = productTypes.size > 1 ? 'mixed' : Array.from(productTypes)[0] || 'jersey';

    const orderData = {
      user_id: user.id,
      full_name: orderDetails.fullName,
      email_order: orderDetails.emailOrder,
      total_quantity: totalQuantity,
      order_items: orderItems,
      product_type: orderProductType, // 'jersey', 'socks', or 'mixed'
    };

    const { data: orderSaveData, error: orderSaveError } = await supabase
      .from("user_orders")
      .insert([orderData])
      .select();

    if (orderSaveError) {
      hideLoading(); // Hide loading if there's an error saving the order
      throw orderSaveError;
    }

    const updatePromises = orderItems.map(async item => {
      if (!item.design_id) {
        console.error('Design ID is undefined:', item);
        return;
      }

      const { data, error } = await supabase
        .from("user_files")
        .select('order_placed')
        .eq('id', item.design_id)
        .single();

      if (error) {
        console.error(`Error fetching order_placed for design ${item.design_id}:`, error);
        return;
      }

      const newOrderPlaced = ((data && data.order_placed) || 0) + 1;

      const { error: updateError } = await supabase
        .from("user_files")
        .update({ order_placed: newOrderPlaced })
        .eq('id', item.design_id);

      if (updateError) {
        console.error(`Error updating order_placed for design ${item.design_id}:`, updateError);
      } else {
        console.log(`Successfully updated order_placed for design ${item.design_id} to ${newOrderPlaced}`);
      }
    });

    await Promise.all(updatePromises);

    console.log("Order saved successfully:", orderSaveData);

    hideLoading(); // Hide loading after successful order save
    return orderSaveData;
  } catch (error) {
    console.error("Error saving order:", error);
    hideLoading(); // Hide loading if there's an error
    throw error;
  }
}

