const root = document.documentElement;

function updateOptionTexts(lang) {
  const isFrench = lang === "fr";
  const allOptions = document.querySelectorAll("option[data-en][data-fr]");
  
  allOptions.forEach(option => {
    const enText = option.getAttribute("data-en");
    const frText = option.getAttribute("data-fr");
    
    if (isFrench && frText) {
      option.textContent = frText;
    } else if (enText) {
      option.textContent = enText;
    }
  });
}

function updatePlaceholders(lang) {
  const inputs = document.querySelectorAll('input[data-en-placeholder], input[data-fr-placeholder]');
  inputs.forEach(input => {
    const translatedPlaceholder = input.getAttribute(`data-${lang}-placeholder`);
    if (translatedPlaceholder) {
      input.placeholder = translatedPlaceholder;
    }
  });
}

function setLanguage(lang) {
  const isFrench = lang === "fr";
  const root = document.documentElement;
  
  // Remove existing lang class and add the correct one
  root.classList.remove("lang-fr");
  if (isFrench) {
    root.classList.add("lang-fr");
  }
  root.lang = lang;
  
  const toggle = document.querySelector(".toggle-switch");
  if (toggle) {
    toggle.setAttribute("aria-pressed", isFrench ? "true" : "false");
  }
  
  updateOptionTexts(lang);
  updatePlaceholders(lang);
  
  // Save to localStorage
  localStorage.setItem('language', lang);
  
  // Update title if it exists
  const titleElement = document.querySelector('title');
  if (titleElement && titleElement.getAttribute(`data-${lang}`)) {
    document.title = titleElement.getAttribute(`data-${lang}`);
  }

  // Update design cards if they exist (for my-designs page)
  if (typeof updateDesignCards === 'function' && document.querySelector(".design-card")) {
    updateDesignCards(lang);
  }
}

// Make setLanguage available globally
window.setLanguage = setLanguage;

// Initialize language toggle when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector(".toggle-switch");
  
  if (toggle) {
    // Mark that we're attaching the listener to prevent duplicates
    if (!toggle.hasAttribute('data-listener-attached')) {
      toggle.setAttribute('data-listener-attached', 'true');
      
      // Get saved language from localStorage or default to 'en'
      const savedLang = localStorage.getItem('language') || 'en';
      
      // Set initial language
      setLanguage(savedLang);
      
      // Add click event listener
      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const currentLang = localStorage.getItem('language') || 'en';
        const nextLang = currentLang === 'en' ? 'fr' : 'en';
        console.log('Language toggle clicked, switching from', currentLang, 'to', nextLang);
        setLanguage(nextLang);
      });
    } else {
      // Listener already attached, just set the initial language
      const savedLang = localStorage.getItem('language') || 'en';
      setLanguage(savedLang);
    }
  } else {
    // Even if toggle doesn't exist, set the language for the page
    const savedLang = localStorage.getItem('language') || 'en';
    setLanguage(savedLang);
  }
});

// Function to update UI based on login status
async function updatePageBasedOnLoginStatus() {
  // Wait for auth.js to load
  let retries = 0;
  while (typeof window.checkUserLoggedIn === 'undefined' && retries < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    retries++;
  }
  
  if (typeof window.checkUserLoggedIn === 'undefined') {
    console.warn('auth.js not loaded yet');
    return; // auth.js not loaded yet
  }

  const isLoggedIn = await window.checkUserLoggedIn();
  const pageElement = document.querySelector(".page");
  const homeButton = document.querySelector(".home-button");
  const configuratorCards = document.getElementById("configurator-cards");
  
  // Ensure nothing under class="page" is hidden - keep all content visible
  // Remove any hidden classes that might have been added
  if (configuratorCards) {
    configuratorCards.classList.remove("hidden");
  }
  
  // Always ensure configurator-hidden class is not added (it causes issues)
  if (pageElement) {
    pageElement.classList.remove("configurator-hidden");
  }

  // Always show home button (visible even without login)
  if (homeButton) {
    homeButton.style.display = "flex";
  }

  // Show/hide navigation links based on login status
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    const linkText = link.textContent.trim();
    // Skip home button (it's always visible)
    if (link === homeButton || link.classList.contains('home-button')) return;
    
    // Only show "My Designs" and "Place Order" when logged in
    if (linkText.includes('My Designs') || linkText.includes('Mes Designs') || 
        linkText.includes('Place Order') || linkText.includes('Passer Commande')) {
      link.style.display = isLoggedIn ? "flex" : "none";
    }
  });
}

// Language initialization is now handled above with localStorage check

// Update page based on login status when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Wait a bit for auth.js to initialize
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Call auth.js update function first (handles user button, dropdown, etc.)
  if (typeof window.updateUIBasedOnLoginStatus === 'function') {
    await window.updateUIBasedOnLoginStatus();
  }
  
  // Then update our page-specific elements
  await updatePageBasedOnLoginStatus();
});

// Wrap the original updateUIBasedOnLoginStatus to also update our page
const wrapAuthUpdate = () => {
  if (typeof window.updateUIBasedOnLoginStatus !== 'undefined') {
    const originalUpdateUI = window.updateUIBasedOnLoginStatus;
    window.updateUIBasedOnLoginStatus = async function() {
      await originalUpdateUI();
      await updatePageBasedOnLoginStatus();
    };
  } else {
    setTimeout(wrapAuthUpdate, 100);
  }
};

wrapAuthUpdate();
