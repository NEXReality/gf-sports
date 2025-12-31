const SUPABASE_URL = 'https://jvuibcqogyyffylvfeog.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2dWliY3FvZ3l5ZmZ5bHZmZW9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMjg3MzUsImV4cCI6MjA1MTkwNDczNX0.iIu6f3LwdLmHoHmuVjbuVm-uLCDWA3oGZ7J07wXGBBU';
// Expose SUPABASE_URL on window for other scripts to use
if (typeof window.SUPABASE_URL === 'undefined') {
  window.SUPABASE_URL = SUPABASE_URL;
}
// Only create supabase client if it doesn't already exist (prevents duplicate declaration error)
if (typeof window.supabaseClient === 'undefined') {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
// Use var to allow redeclaration if script runs multiple times
var supabase = window.supabaseClient;

// Function to get the current language
function getCurrentLanguage() {
  return localStorage.getItem("language") || "en"
}
// Check if user logged in
async function checkUserLoggedIn() {
  const { data: { user } } = await supabase.auth.getUser();
  return user !== null;
}

// Handle create account form submission
const createAccountForm = document.querySelector('.create-account-form');
const phoneNumberInput = document.getElementById('phoneNumber');

// Function to validate phone number
function validatePhoneNumber(phoneNumber) {
  return /^[\d()+\-]{7,15}$/.test(phoneNumber);
}

// Add event listener to phone number input
phoneNumberInput.addEventListener('input', function (e) {
  let input = e.target.value;

  // Remove any characters that are not digits, +, -, (, or )
  input = input.replace(/[^\d()+\-]/g, '');

  // Truncate to 15 characters if longer
  input = input.slice(0, 15);

  // Update the input value
  e.target.value = input;

  // Visual feedback for minimum length
  if (input.length < 7) {
    e.target.setCustomValidity('Phone number must be at least 7 characters long');
  } else {
    e.target.setCustomValidity('');
  }
});

createAccountForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const phoneNumber = phoneNumberInput.value;
  const clubName = document.getElementById('clubName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  // Ensure phone number is valid
  if (!validatePhoneNumber(phoneNumber)) {
    window.translatedAlert('invalid_phone_number', 'Phone number must be 7-15 characters long and contain only numbers, +, -, (, and )');
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          club_name: clubName
        }
      }
    });

    if (error) throw error;

    console.log('Sign up successful:', data);
    window.translatedAlert('signup_successful');
    closeAllModals();
  } catch (error) {
    console.error('Error during sign up:', error);
    window.translatedAlert('signup_failed', error ? error.message : 'An unknown error occurred');
  }
});

// Handle login form submission
const loginForm = document.querySelector('.login-form');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    console.log('Login successful:', data.user);
    closeAllModals();
    await updateUIBasedOnLoginStatus();
    window.location.reload();
  } catch (error) {
    console.error('Login error:', error.message);
    window.translatedAlert('login_failed', error.message);
  }
});

// User dropdown functionality
const userButton = document.querySelector('.user-button');
const userDropdown = document.querySelector('.user-dropdown');
const loginModal = document.getElementById('login-modal');
const createAccountModal = document.getElementById('create-account-modal');
const loginBtn = document.getElementById('login-btn');
const createAccountBtn = document.getElementById('create-account-btn');
const forgotPasswordModal = document.getElementById('forgot-password-modal');
const forgotPasswordForm = document.querySelector('.forgot-password-form');
const forgotPasswordStage1 = document.getElementById('forgot-password-stage-1');
const forgotPasswordStage2 = document.getElementById('forgot-password-stage-2');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const backToLoginLink = document.getElementById('backToLoginLink');

// Function to position dropdown relative to user button
function positionDropdown() {
  if (userButton && userDropdown) {
    const buttonRect = userButton.getBoundingClientRect();
    const dropdownWidth = 200; // Width of dropdown from CSS

    // Calculate desired position (150px to the right of button's right edge)
    let rightOffset = window.innerWidth - buttonRect.right - 150;

    // Ensure dropdown doesn't go off the right edge of the viewport
    // Minimum right offset should be 8px from the edge
    const minRightOffset = 8;
    rightOffset = Math.max(rightOffset, minRightOffset);

    // Position dropdown just below the button
    userDropdown.style.top = `${buttonRect.bottom + 8}px`; // 8px gap below button
    userDropdown.style.right = `${rightOffset}px`;
  }
}

// Toggle dropdown when clicking user button
userButton.addEventListener('click', (e) => {
  e.stopPropagation();
  const isVisible = userDropdown.style.display === 'block';
  if (!isVisible) {
    positionDropdown(); // Update position before showing
    userDropdown.style.display = 'block';
  } else {
    userDropdown.style.display = 'none';
  }
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!userButton.contains(e.target) && !userDropdown.contains(e.target)) {
    userDropdown.style.display = 'none';
  }
});

// Reposition dropdown on window resize
window.addEventListener('resize', () => {
  if (userDropdown.style.display === 'block') {
    positionDropdown();
  }
});

// Modal handling functions
function closeAllModals() {
  loginModal.style.display = 'none';
  createAccountModal.style.display = 'none';
  forgotPasswordModal.style.display = 'none';
}

function showLoginModal() {
  closeAllModals();
  loginModal.style.display = 'flex';
}

function showCreateAccountModal() {
  closeAllModals();
  createAccountModal.style.display = 'flex';
}

// Show login modal when clicking login button
loginBtn.addEventListener('click', () => {
  userDropdown.style.display = 'none';
  showLoginModal();
});

// Show create account modal when clicking create account button
createAccountBtn.addEventListener('click', () => {
  userDropdown.style.display = 'none';
  showCreateAccountModal();
});

// Switch between modals
document.getElementById('switch-to-login').addEventListener('click', (e) => {
  e.preventDefault();
  showLoginModal();
});

document.querySelector('.login-form .form-footer a:first-child').addEventListener('click', (e) => {
  e.preventDefault();
  showCreateAccountModal();
});

document.querySelector('.login-form .form-footer a:last-child').addEventListener('click', (e) => {
  e.preventDefault();
  showForgotPasswordModal();
})

// Close modals when clicking outside
loginModal.addEventListener('click', (e) => {
  if (e.target === loginModal) {
    closeAllModals();
  }
});

createAccountModal.addEventListener('click', (e) => {
  if (e.target === createAccountModal) {
    closeAllModals();
  }
});

function showForgotPasswordModal() {
  closeAllModals();
  forgotPasswordModal.style.display = 'flex';
  forgotPasswordStage1.style.display = 'block';
  forgotPasswordStage2.style.display = 'none';
  backToLoginBtn.style.display = 'none';
}
// Handle forgot password form submission
forgotPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('forgotPasswordEmail').value;

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://globe-fashion.com/reset-password/index.html'
    });

    if (error) throw error;

    console.log('Password reset email sent:', email);

    // Show the second stage
    forgotPasswordStage1.style.display = 'none';
    forgotPasswordStage2.style.display = 'block';
  } catch (error) {
    console.error('Password reset error:', error.message);
    window.translatedAlert('password_reset_failed', error.message);
  }
});

// Handle "Back to Login" button click
backToLoginBtn.addEventListener('click', () => {
  closeAllModals();
  showLoginModal();
});

// Handle "Back to Login" link click
backToLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  closeAllModals();
  showLoginModal();
});

// Close forgot password modal when clicking outside
forgotPasswordModal.addEventListener('click', (e) => {
  if (e.target === forgotPasswordModal) {
    closeAllModals();
  }
});

// Prevent closing when clicking inside the modal content
forgotPasswordModal.querySelector('.modal-content').addEventListener('click', (e) => {
  e.stopPropagation();
});

// Add this function to handle dynamic translations
function getTranslation(key, lang) {
  const translations = {
    logout: {
      en: "Log out",
      fr: "Déconnexion",
    },
    // New translations for order details
    orderIdLabel: {
      en: "Order ID#",
      fr: "ID de commande#",
    },
    totalQuantity: {
      en: "pairs",
      fr: "paires",
    },
    fullNameLabel: {
      en: "Full Name",
      fr: "NOM Prénom",
    },
    emailLabel: {
      en: "Email",
      fr: "E-mail",
    },
    phoneLabel: {
      en: "Phone",
      fr: "Téléphone",
    },
    clubNameLabel: {
      en: "Club Name",
      fr: "Nom du club",
    },
    shippingAddressLabel: {
      en: "Shipping Address",
      fr: "Adresse de livraison",
    },
    sizeLabel: {
      en: "Size",
      fr: "Taille",
    },
    pairsLabel: {
      en: "pairs",
      fr: "paires",
    },
    siliconGripLabel: {
      en: "Silicon Grip:",
      fr: "Grip en silicone:",
    },
    yes: {
      en: "Yes",
      fr: "Oui",
    },
    no: {
      en: "No",
      fr: "Non",
    },
    totalLabel: {
      en: "Total:",
      fr: "Total:",
    },
    errorOrderNotFound: {
      en: "Error: Order not found",
      fr: "Erreur: Commande non trouvée",
    },
    errorNoOrderId: {
      en: "Error: No order ID provided",
      fr: "Erreur: Aucun ID de commande fourni",
    },
    created_on: {
      en: "Created on",
      fr: "Créé le",
    },
    select: {
      en: "Select",
      fr: "Sélectionner",
    },
    delete_confirmation: {
      en: 'Are you sure you want to delete "{0}"?',
      fr: 'Êtes-vous sûr de vouloir supprimer "{0}" ?'
    },
    design_name_exists: {
      en: 'A design with this name already exists. Please choose another name.',
      fr: 'Un design avec ce nom existe déjà. Veuillez choisir un autre nom.'
    },
    file_name_exists: {
      en: 'A file with this name already exists. Please try again.',
      fr: 'Un fichier avec ce nom existe déjà. Veuillez réessayer.'
    },
    error_saving_design: {
      en: 'Error saving design. Please try again.',
      fr: 'Erreur lors de l\'enregistrement du design. Veuillez réessayer.'
    },
    error_updating_design: {
      en: 'Error updating design. Please try again.',
      fr: 'Erreur lors de la mise à jour du design. Veuillez réessayer.'
    },
    error_uploading_logo: {
      en: 'Error uploading logo. Please try again.',
      fr: 'Erreur lors du téléchargement du logo. Veuillez réessayer.'
    },
    no_user_logged_in: {
      en: 'No user logged in',
      fr: 'Aucun utilisateur connecté'
    },
    productTypeLabel: {
      en: 'Product Type:',
      fr: 'Type de produit:'
    },
    productType_jersey: {
      en: 'Jersey',
      fr: 'Maillot'
    },
    productType_socks: {
      en: 'Socks',
      fr: 'Chaussettes'
    }
  }
  return translations[key]?.[lang] || key
}


// Upade UI based on login

async function updateUIBasedOnLoginStatus() {
  const isLoggedIn = await checkUserLoggedIn()
  const currentLang = localStorage.getItem("language") || "en"

  // 1. Show/hide .nav-link (always show home button and Configurator, only show My Designs/Place Order when logged in)
  const navLinks = document.querySelectorAll(".nav-link")
  navLinks.forEach((link) => {
    // Always show home button
    if (link.classList.contains('home-button')) {
      link.style.display = "flex"
      return
    }
    // Always show Configurator link
    const linkText = link.textContent.trim()
    if (linkText.includes('Configurator') || linkText.includes('Configurateur')) {
      link.style.display = "flex"
      return
    }
    // Only show "My Designs" and "Place Order" when logged in
    if (linkText.includes('My Designs') || linkText.includes('Mes Designs') ||
      linkText.includes('Place Order') || linkText.includes('Passer Commande')) {
      link.style.display = isLoggedIn ? "flex" : "none"
    }
  })

  // 2. Change background of .user-button
  const userButton = document.querySelector(".user-button")
  userButton.style.color = isLoggedIn ? "green" : ""

  // 3. Hide/show create-account-btn
  const createAccountBtn = document.getElementById("create-account-btn")
  createAccountBtn.style.display = isLoggedIn ? "none" : "flex"

  // 4. Update user-dropdown
  const userDropdown = document.querySelector(".user-dropdown")
  const loginBtn = document.getElementById("login-btn")
  let logoutBtn = document.getElementById("logout-btn")

  if (isLoggedIn) {
    loginBtn.style.display = "none"
    if (!logoutBtn) {
      logoutBtn = document.createElement("button")
      logoutBtn.id = "logout-btn"
      logoutBtn.className = "dropdown-item"
      logoutBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span data-en="Log out" data-fr="Déconnexion">${getTranslation("logout", currentLang)}</span>
        `
      userDropdown.appendChild(logoutBtn)
    } else {
      // Update existing logout button text
      const logoutText = logoutBtn.querySelector("span[data-en]")
      if (logoutText) {
        logoutText.textContent = getTranslation("logout", currentLang)
      }
    }
    logoutBtn.style.display = "flex"
  } else {
    loginBtn.style.display = "flex"
    if (logoutBtn) {
      logoutBtn.style.display = "none"
    }
  }
}

// this to ensure the logout button text is updated when the language changes
function updateLogoutButtonText() {
  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    const currentLang = localStorage.getItem("language") || "en"
    const logoutText = logoutBtn.querySelector("span[data-en]")
    if (logoutText) {
      logoutText.textContent = getTranslation("logout", currentLang)
    }
  }
}

// Call this function on page load and after login/logout
window.addEventListener('DOMContentLoaded', updateUIBasedOnLoginStatus);

// Add logout functionality
document.addEventListener('click', async (e) => {
  // Check if the clicked element or any of its parents have the id 'logout-btn'
  const logoutButton = e.target.closest('#logout-btn');

  if (logoutButton) {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log('Logged out successfully');
      await updateUIBasedOnLoginStatus();
      // Redirect to index.html
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Logout error:', error.message);
      window.translatedAlert('logout_failed', error.message);
    }
  }
});

const languageToggle = document.querySelector('.toggle-switch');
const frenchElements = document.querySelectorAll('[data-fr]');
const englishElements = document.querySelectorAll('[data-en]');

languageToggle.addEventListener('click', () => {
  const currentLang = localStorage.getItem('language') || 'en';
  const nextLang = currentLang === 'en' ? 'fr' : 'en';
  setLanguage(nextLang);
  updateLogoutButtonText();

  // Check if updateOrderDetails function exists before calling it
  if (typeof updateOrderDetails === 'function') {
    updateOrderDetails();
  }
});


function updateSelectOptions(lang) {
  // Select all select elements first
  const selects = document.querySelectorAll('select');

  selects.forEach(select => {
    // Get all options for this select
    const options = select.getElementsByTagName('option');

    // Convert HTMLCollection to Array for easier logging
    Array.from(options).forEach((option, index) => {
      const translatedText = option.getAttribute(`data-${lang}`);
      if (translatedText) {
        option.textContent = translatedText;
      }
      // Make sure option is visible
      option.style.display = ''; // Reset any display property
    });
  });
}

function updatePlaceholders(lang) {
  const inputs = document.querySelectorAll('input[placeholder]');
  inputs.forEach(input => {
    const translatedPlaceholder = input.getAttribute(`data-${lang}-placeholder`);
    if (translatedPlaceholder) {
      input.placeholder = translatedPlaceholder;
    }
  });
}

// Console messages translations
const alertMessages = {
  'signup_successful': {
    'en': 'Sign up successful! Check your email for the confirmation link.',
    'fr': 'Inscription réussie ! Vérifiez votre e-mail pour le lien de confirmation.'
  },
  'signup_failed': {
    'en': 'Sign up failed:',
    'fr': 'Échec de l\'inscription :'
  },
  'login_failed': {
    'en': 'Login failed:',
    'fr': 'Échec de la connexion :'
  },
  'password_reset_failed': {
    'en': 'Password reset failed:',
    'fr': 'Échec de la réinitialisation du mot de passe :'
  },
  'logout_failed': {
    'en': 'Logout failed:',
    'fr': 'Échec de la déconnexion :'
  },
  'design_details_not_found': {
    'en': 'Unable to find design details. Please try again later.',
    'fr': 'Impossible de trouver les détails du design. Veuillez réessayer plus tard.'
  },
  'design_ordered_no_rename': {
    'en': 'This design has been ordered and cannot be renamed. However, you can create a duplicate by using the \'Save As\' option in the Configurator page.',
    'fr': 'Cette conception a été commandée et ne peut pas être renommée. Cependant, vous pouvez créer un duplicata en utilisant \'option \'Enregistrer sous\' dans la page du Configurateur.'
  },

  'error_sharing_design': {
    'en': 'There was an error sharing this design. Please try again.',
    'fr': 'Une erreur s\'est produite lors du partage de cette conception. Veuillez réessayer.'
  },

  'unable_to_share_missing_data': {
    'en': 'Unable to share this design due to missing data.',
    'fr': 'Impossible de partager cette conception en raison de données manquantes.'
  },

  'share_url_copied': {
    'en': 'Share URL copied to clipboard!',
    'fr': 'URL de partage copiée dans le presse-papiers !'
  },

  'failed_to_copy_share_url': {
    'en': 'Failed to copy the share URL. Please try again.',
    'fr': 'Échec de la copie de l\'URL de partage. Veuillez réessayer.'
  },

  'design_ordered_no_delete': {
    'en': 'This design has been ordered and cannot be deleted. However, you can create a duplicate and redesign by using the \'Save As\' option in the Configurator page.',
    'fr': 'Cette conception a été commandée et ne peut pas être supprimée. Cependant, vous pouvez créer un duplicata et le modifier en utilisant l\'option \'Enregistrer sous\' dans la page du Configurateur.'
  },

  'error_deleting_design': {
    'en': 'An error occurred while deleting the design. Please try again.',
    'fr': 'Une erreur s\'est produite lors de la suppression de la conception. Veuillez réessayer.'
  },

  'all_sizes_added': {
    'en': 'All size ranges have been added.',
    'fr': 'Toutes les gammes de tailles ont été ajoutées.'
  },

  'profile_update_success': {
    'en': 'Profile updated successfully!',
    'fr': 'Profil mis à jour avec succès !'
  },

  'profile_update_error': {
    'en': 'There was an error updating your profile. Please try again.',
    'fr': 'Une erreur s\'est produite lors de la mise à jour de votre profil. Veuillez réessayer.'
  },

  'form_errors': {
    'en': 'Please correct the errors in the form before submitting.',
    'fr': 'Veuillez corriger les erreurs dans le formulaire avant de le soumettre.'
  },

  'minimum_quantity_error': {
    'en': 'Total quantity must be 150 or more to place an order.',
    'fr': 'La quantité totale doit être de 150 ou plus pour passer une commande.'
  },

  'no_designs_in_order': {
    'en': 'Please add at least one design with quantities to your order.',
    'fr': 'Veuillez ajouter au moins un design avec des quantités à votre commande.'
  },

  'order_placed_success': {
    'en': 'Order placed successfully!',
    'fr': 'Commande passée avec succès !'
  },

  'order_placement_error': {
    'en': 'There was an error placing your order. Please try again.',
    'fr': 'Une erreur s\'est produite lors du passage de votre commande. Veuillez réessayer.'
  },
  'enter_design_name': {
    'en': 'Please enter a design name.',
    'fr': 'Veuillez entrer un nom pour le design.'
  },
  'error_saving_design': {
    'en': 'Error saving design. Please try again.',
    'fr': 'Erreur lors de l\'enregistrement du design. Veuillez réessayer.'
  },
  'upload_png_only': {
    'en': 'Please upload a PNG file',
    'fr': 'Veuillez télécharger un fichier PNG'
  },
  'uploading_logo': {
    'en': 'Uploading logo...',
    'fr': 'Téléchargement du logo...'
  },
  'logo_upload_success': {
    'en': 'Logo uploaded successfully',
    'fr': 'Logo téléchargé avec succès'
  },
  'logo_upload_error': {
    'en': 'An error occurred while uploading the logo',
    'fr': 'Une erreur s\'est produite lors du téléchargement du logo'
  },
  'design_already_placed_error': {
    'en': 'This design has already been ordered and cannot be modified. However, you can create a duplicate by using the \'Save As\' option in the Configurator page.',
    'fr': 'Ce modèle a déjà été commandé et ne peut être modifié. Cependant, vous pouvez créer un doublon en utilisant \'option \'Enregistrer sous\' dans la page Configurateur.'
  },
  'unique_name_error': {
    'en': 'A design with this name already exists. Please use a unique name.',
    'fr': 'Un design portant ce nom existe déjà. Veuillez utiliser un nom unique.'
  },
  'unique_name_error': {
    'en': 'A design with this name already exists. Please use a unique name.',
    'fr': 'Un design portant ce nom existe déjà. Veuillez utiliser un nom unique.'
  },
  'save': {
    en: 'Save',
    fr: 'Enregistrer'
  },
  'saving': {
    en: 'Saving...',
    fr: 'Enregistrement...'
  }
}

// Function to show translated alert
function showTranslatedAlert(messageKey, ...args) {
  const currentLang = getCurrentLanguage()
  const message = alertMessages[messageKey] ? alertMessages[messageKey][currentLang] || messageKey : messageKey

  alert(message + " " + args.join(" "))
}

// Global translated alert method
window.translatedAlert = showTranslatedAlert

function setLanguage(lang) {
  // Set display for text elements
  if (lang === 'fr') {
    frenchElements.forEach(el => el.style.display = 'inline');
    englishElements.forEach(el => el.style.display = 'none');
    languageToggle.setAttribute('aria-pressed', 'true');
  } else {
    frenchElements.forEach(el => el.style.display = 'none');
    englishElements.forEach(el => el.style.display = 'inline');
    languageToggle.setAttribute('aria-pressed', 'false');
  }

  updateSelectOptions(lang);
  updatePlaceholders(lang);
  localStorage.setItem('language', lang);
  document.documentElement.lang = lang;

  // Update title if it exists
  const titleElement = document.querySelector('title');
  if (titleElement && titleElement.getAttribute(`data-${lang}`)) {
    document.title = titleElement.getAttribute(`data-${lang}`);
  }
  // Update design cards if they exist in the my-desings
  if (document.querySelector(".design-card")) {
    updateDesignCards(lang)
  }
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
  // Clear any existing language setting to ensure fresh start
  if (localStorage.getItem('language') === null) {
    localStorage.setItem('language', 'en');
  }
  const initialLang = localStorage.getItem('language');
  setLanguage(initialLang);
  updateSelectOptions(initialLang);  // Ensure select options are updated on load
  updateUIBasedOnLoginStatus();
});

// Location-based language selection
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          resolve({ latitude, longitude });
        },
        error => {
          console.log("Error getting user location:", error);
          reject(error);
        }
      );
    } else {
      reject(new Error("Geolocation is not supported by this browser."));
    }
  });
}

function checkIfInFrance(latitude, longitude) {
  // Approximate bounding box for France
  const franceBounds = {
    north: 51.1,
    south: 41.3,
    west: -5.1,
    east: 9.5
  };

  return (
    latitude >= franceBounds.south &&
    latitude <= franceBounds.north &&
    longitude >= franceBounds.west &&
    longitude <= franceBounds.east
  );
}

async function setInitialLanguage() {
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage) {
    setLanguage(savedLanguage);
  } else {
    try {
      const location = await getUserLocation();
      const isInFrance = checkIfInFrance(location.latitude, location.longitude);
      setLanguage(isInFrance ? 'fr' : 'en');
    } catch (error) {
      console.error("Error setting initial language:", error);
      setLanguage('en'); // Default to English if there's an error
    }
  }
}

// Custom alert style

(function () {
  // Store original functions
  const originalAlert = window.alert;
  const originalConfirm = window.confirm;

  // Custom alert function
  window.alert = function (message) {
    return new Promise((resolve) => {
      const existingModal = document.querySelector('.modal-overlay-alert');
      if (existingModal) {
        existingModal.remove();
      }

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay-alert';

      const content = document.createElement('div');
      content.className = 'modal-content-alert';

      const text = document.createElement('p');
      text.className = 'modal-message-alert';
      text.textContent = message;

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'modal-buttons';

      const button = document.createElement('button');
      button.className = 'modal-button-alert modal-button-primary';
      button.textContent = 'OK';

      const closeAlert = (e) => {
        e.preventDefault();
        e.stopPropagation();
        overlay.remove();
        resolve();
      };

      button.addEventListener('click', closeAlert, false);
      overlay.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);

      buttonContainer.appendChild(button);
      content.appendChild(text);
      content.appendChild(buttonContainer);
      overlay.appendChild(content);
      document.body.appendChild(overlay);

      button.focus();
    });
  };

  // Custom confirm function
  window.confirm = function (message) {
    return new Promise((resolve) => {
      const existingModal = document.querySelector('.modal-overlay-alert');
      if (existingModal) {
        existingModal.remove();
      }

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay-alert';

      const content = document.createElement('div');
      content.className = 'modal-content-alert';

      const text = document.createElement('p');
      text.className = 'modal-message-alert';
      text.textContent = message;

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'modal-buttons';

      const confirmButton = document.createElement('button');
      confirmButton.className = 'modal-button-alert modal-button-primary';
      confirmButton.textContent = 'OK';

      const cancelButton = document.createElement('button');
      cancelButton.className = 'modal-button-alert modal-button-secondary';
      cancelButton.textContent = 'Cancel';

      const closeConfirm = (confirmed) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        overlay.remove();
        resolve(confirmed);
      };

      confirmButton.addEventListener('click', closeConfirm(true), false);
      cancelButton.addEventListener('click', closeConfirm(false), false);

      overlay.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);

      buttonContainer.appendChild(cancelButton);
      buttonContainer.appendChild(confirmButton);
      content.appendChild(text);
      content.appendChild(buttonContainer);
      overlay.appendChild(content);
      document.body.appendChild(overlay);

      confirmButton.focus();
    });
  };
})();

// loadingAnimation

let lottiePlayer = null;

function initializeLoadingAnimation() {
  lottiePlayer = document.getElementById('loading-animation');
  if (!lottiePlayer) {
    console.warn('Lottie player element not found');
    return; // Exit the function if the element is not found
  }
}

function showLoading() {
  if (lottiePlayer) {
    lottiePlayer.style.display = 'block';
  }
}

function hideLoading() {
  if (lottiePlayer) {
    lottiePlayer.style.display = 'none';
  }
}
// Initialize the loading animation when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeLoadingAnimation);
