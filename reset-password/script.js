document.addEventListener('DOMContentLoaded', async function () {
  const changePasswordForm = document.getElementById('changePasswordForm');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const passwordMismatchError = document.getElementById('passwordMismatch');
  const SUPABASE_URL = 'https://jvuibcqogyyffylvfeog.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2dWliY3FvZ3l5ZmZ5bHZmZW9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMjg3MzUsImV4cCI6MjA1MTkwNDczNX0.iIu6f3LwdLmHoHmuVjbuVm-uLCDWA3oGZ7J07wXGBBU';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Check for access_token in URL fragment
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const type = params.get('type');

  if (accessToken && type === 'recovery') {
    try {
      // Set the session using the access token
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) throw error;

      console.log('User authenticated:', data.user);
    } catch (error) {
      console.error('Error setting session:', error.message);
      window.translatedAlert('reset_token_verification_error');
      return;
    }
  } else {
    console.error('Invalid recovery link');
    window.translatedAlert('invalid_password_reset_link');
    return;
  }

  // Handle password change form submission
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (newPassword !== confirmPassword) {
        passwordMismatchError.style.display = 'block';
        return;
      }

      passwordMismatchError.style.display = 'none';

      try {
        const { data, error } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (error) throw error;

        console.log('Password changed successfully');
        window.translatedAlert('password_change_success');
        // Redirect to main index page
        window.location.href = '../index.html';
      } catch (error) {
        console.error('Error changing password:', error.message);
        window.translatedAlert('password_reset_failed', error.message);
      }
    });

    // Hide the error message when the user starts typing in either password field
    newPasswordInput.addEventListener('input', hideErrorMessage);
    confirmPasswordInput.addEventListener('input', hideErrorMessage);

    function hideErrorMessage() {
      passwordMismatchError.style.display = 'none';
    }
  }

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      console.log('PASSWORD_RECOVERY event detected', session);
    }
  });
});

// Function to update placeholders
function updatePlaceholders(lang) {
  const inputs = document.querySelectorAll('input[placeholder]');
  inputs.forEach(input => {
    const translatedPlaceholder = input.getAttribute(`data-${lang}-placeholder`);
    if (translatedPlaceholder) {
      input.placeholder = translatedPlaceholder;
    }
  });
}

// Function to update text content (for titles and labels)
function updateTextContent(lang) {
  const elements = document.querySelectorAll('[data-en]');
  elements.forEach(el => {
    const translatedText = el.getAttribute(`data-${lang}`);
    if (translatedText) {
      el.textContent = translatedText;
    }
  });
}

// Function to set language
function setLanguage(lang) {
  updatePlaceholders(lang);
  updateTextContent(lang);
  localStorage.setItem('language', lang);
  document.documentElement.lang = lang;

  // Update title if it exists
  const titleElement = document.querySelector('title');
  if (titleElement && titleElement.getAttribute(`data-${lang}`)) {
    document.title = titleElement.getAttribute(`data-${lang}`);
  }
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
  const initialLang = getCurrentLanguage();
  setLanguage(initialLang);
});

const alertMessages = {
  'reset_token_verification_error': {
    'en': 'Error verifying reset token. Please request a new password reset.',
    'fr': 'Erreur de vérification du jeton de réinitialisation. Veuillez demander une nouvelle réinitialisation de mot de passe.'
  },

  'invalid_password_reset_link': {
    'en': 'Invalid password reset link. Please request a new password reset.',
    'fr': 'Lien de réinitialisation de mot de passe invalide. Veuillez demander une nouvelle réinitialisation de mot de passe.'
  },

  'password_change_success': {
    'en': 'Password changed successfully',
    'fr': 'Mot de passe changé avec succès'
  },

  'password_reset_failed': {
    'en': 'Password reset failed:',
    'fr': 'Échec de la réinitialisation du mot de passe :'
  }
};

// Function to get the current language
function getCurrentLanguage() {
  return localStorage.getItem("language") || "en";
}

// Function to show translated alert
function showTranslatedAlert(messageKey, ...args) {
  const currentLang = getCurrentLanguage();
  const message = alertMessages[messageKey] ?
    alertMessages[messageKey][currentLang] || messageKey :
    messageKey;

  alert(message + " " + args.join(" "));
}

// Global translated alert method
window.translatedAlert = showTranslatedAlert;

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('language')) {
    localStorage.setItem('language', 'en');
  }
});
