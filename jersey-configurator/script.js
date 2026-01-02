// Debug logging function (only logs when DEBUG_MODE is enabled)
const DEBUG_MODE = false; // Set to true to enable debug logs
function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log(...args);
  }
}

// Save button dropdown functionality
const dropdownArrow = document.getElementById('dropdown-arrow');
const saveDropdown = document.querySelector('.save-dropdown');
const saveAsButton = document.querySelector('.save-as-button');
const newDesignButton = document.querySelector('.new-design-button');

// Toggle dropdown when clicking the arrow
if (dropdownArrow) {
  dropdownArrow.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = saveDropdown.style.display === 'block';
    saveDropdown.style.display = isVisible ? 'none' : 'block';
  });
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.save-button-group')) {
    if (saveDropdown) {
      saveDropdown.style.display = 'none';
    }
  }
});

// Prevent closing when clicking inside the dropdown
if (saveDropdown) {
  saveDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// Tab switching functionality using radio-options pattern
function initializeJerseyTabs() {
  const jerseyTabsGroup = document.getElementById('jersey-tabs')?.closest('.radio-group');
  if (!jerseyTabsGroup) {
    console.warn('jersey-tabs group not found');
    return;
  }

  const background = jerseyTabsGroup.querySelector('.radio-background');
  const radioButtons = jerseyTabsGroup.querySelectorAll('input[type="radio"]');
  const tabContents = document.querySelectorAll('.tab-content');

  if (tabContents.length === 0) {
    console.warn('No tab-content elements found');
    return;
  }

  // Set initial position based on checked radio
  const checkedRadio = jerseyTabsGroup.querySelector('input[type="radio"]:checked');
  if (checkedRadio) {
    const expectedTabId = `${checkedRadio.value}-tab`;
    const initialTab = document.getElementById(expectedTabId);

    // Only update if the active tab doesn't match the checked radio
    const currentlyActiveTab = document.querySelector('.tab-content.active');
    if (!currentlyActiveTab || currentlyActiveTab.id !== expectedTabId) {
      // Set initial active tab - ensure correct tab is visible
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      if (initialTab) {
        initialTab.classList.add('active');
        console.log('Initial tab set to:', checkedRadio.value);
      } else {
        console.warn('Initial tab not found:', expectedTabId);
        // Fallback: ensure at least one tab is visible
        if (tabContents.length > 0) {
          tabContents[0].classList.add('active');
        }
      }
    } else {
      console.log('Tab already correctly set to:', checkedRadio.value);
    }

    // Set background position
    if (checkedRadio.value === 'colors') {
      if (background) background.style.transform = 'translateX(100%)';

      // Sync initial mode to colors
      if (window.jerseyViewer) {
        window.jerseyViewer.activeMode = 'colors';
      }
    } else {
      if (background) background.style.transform = 'translateX(0)';

      // Sync initial mode to design and hide stripes
      if (window.jerseyViewer) {
        window.jerseyViewer.switchToDesignMode();
      }
    }
  } else {
    // No radio checked - default to designs tab
    const designsTab = document.getElementById('designs-tab');
    if (designsTab) {
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      designsTab.classList.add('active');
      console.log('No radio checked, defaulting to designs tab');
    }
  }

  // Add event listeners to radio buttons (only if not already added)
  radioButtons.forEach(radio => {
    // Check if listener already exists
    if (radio.dataset.listenerAdded === 'true') return;
    radio.dataset.listenerAdded = 'true';

    radio.addEventListener('change', () => {
      // Add transition for smooth animation
      if (background) background.style.transition = 'transform 0.3s ease-in-out';

      if (radio.value === 'colors') {
        if (background) background.style.transform = 'translateX(100%)';

        // Switch to colors & stripes mode
        if (window.jerseyViewer) {
          window.jerseyViewer.switchToColorsMode();

          // Generate initial default stripes ONLY if:
          // 1. Not currently loading a config
          // 2. No stripes exist yet (first time)
          if (!window.jerseyViewer.isLoadingConfig) {
            const hasAnyStripes = Object.values(window.jerseyViewer.partCanvases).some(canvas =>
              canvas && canvas.getObjects().some(obj => obj.name && obj.name.startsWith('stripeLayer'))
            );

            if (!hasAnyStripes && window.jerseyViewer.generateInitialDefaultStripes) {
              window.jerseyViewer.generateInitialDefaultStripes();
            }
          }
        }
      } else {
        if (background) background.style.transform = 'translateX(0)';

        // Switch to design mode
        if (window.jerseyViewer) {
          window.jerseyViewer.switchToDesignMode();
        }
      }

      // Show/hide tab contents
      tabContents.forEach(content => {
        content.classList.remove('active');
      });

      const targetContent = document.getElementById(`${radio.value}-tab`);
      if (targetContent) {
        targetContent.classList.add('active');
        console.log('Switched to tab:', radio.value);
      } else {
        console.warn('Target tab not found:', `${radio.value}-tab`);
      }
    });
  });
}

// Initialize tabs when DOM is ready - use multiple methods to ensure it runs
function initTabsOnReady() {
  // Try to initialize immediately if DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initializeJerseyTabs, 50);
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeJerseyTabs, 50);
    });
  } else {
    setTimeout(initializeJerseyTabs, 50);
  }
}

// Call initialization
initTabsOnReady();

// Also try on window load as backup
window.addEventListener('load', () => {
  // Double-check tabs are initialized
  const designsTab = document.getElementById('designs-tab');
  const colorsTab = document.getElementById('colors-tab');
  if (designsTab && !designsTab.classList.contains('active') && !colorsTab?.classList.contains('active')) {
    console.log('Re-initializing tabs on window load');
    initializeJerseyTabs();
  }

  // Initialize protected controls (require login for edits)
  initializeProtectedControls();

  // Guard navigation away when there are unsaved changes
  initializeUnsavedNavigationGuard();
});

// ==================== AUTH GUARD FOR EDIT ACTIONS ====================
async function requireLoginGuard(evt, el) {
  try {
    const isLoggedIn = await checkUserLoggedIn();
    if (isLoggedIn) return true;
  } catch (e) {
    console.error('Auth check failed', e);
  }

  // Not logged in: prevent the change and show modal
  if (evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  if (el) {
    // Restore previous value if we captured one
    if (el.type === 'checkbox' || el.type === 'radio') {
      if (el.dataset.prevChecked !== undefined) {
        el.checked = el.dataset.prevChecked === 'true';
      }
    } else if (el.tagName === 'SELECT' || el.tagName === 'INPUT') {
      if (el.dataset.prevValue !== undefined) {
        el.value = el.dataset.prevValue;
      }
    }
  }

  if (window.showLoginModal) window.showLoginModal();
  return false;
}

function markDesignDirty() {
  // Don't mark as dirty if we're currently loading a configuration
  if (isLoadingConfig) {
    return;
  }

  // Check localStorage for loading state (persists across navigation)
  const loadingState = localStorage.getItem('jerseyDesignLoading');
  if (loadingState) {
    try {
      const { timestamp, designId } = JSON.parse(loadingState);
      const now = Date.now();
      const timeSinceLoad = now - timestamp;

      // If we're within 10 seconds of loading and it's the same design, don't mark dirty
      // This handles async operations and navigation timing issues
      if (timeSinceLoad < 10000) {
        // Also check if current design matches (if we have a design ID)
        if (!designId || currentDesignId === designId || !currentDesignId) {
          return;
        }
      } else {
        // Loading state is old, remove it
        localStorage.removeItem('jerseyDesignLoading');
      }
    } catch (e) {
      // Invalid data, remove it
      localStorage.removeItem('jerseyDesignLoading');
    }
  }

  // This is a real user change - mark as dirty and clear any loading flags
  designDirty = true;
  window.designDirty = true;
  localStorage.removeItem('jerseyDesignLoading'); // Clear loading flag on actual user change
}

function setDesignClean() {
  designDirty = false;
  window.designDirty = false;
}

function initializeProtectedControls() {
  // Protect colors & stripes tab inputs (all form controls inside colors tab)
  const colorsTab = document.getElementById('colors-tab');
  if (colorsTab) {
    protectInputs(colorsTab);
  }

  // Protect design color pickers (design customization panel)
  const designColors = document.getElementById('color-selection-group');
  if (designColors) {
    protectInputs(designColors);
  }
}

function protectInputs(container) {
  const inputs = container.querySelectorAll('input, select');
  inputs.forEach(input => {
    input.addEventListener('focusin', () => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        input.dataset.prevChecked = input.checked.toString();
      } else {
        input.dataset.prevValue = input.value;
      }
    });

    const handler = async (e) => {
      const allowed = await requireLoginGuard(e, input);
      if (!allowed) return;
      markDesignDirty();
    };

    input.addEventListener('change', handler);
    if (input.type === 'range' || input.type === 'color' || input.type === 'number') {
      input.addEventListener('input', handler);
    }
  });
}

function initializeUnsavedNavigationGuard() {
  const navLinks = document.querySelectorAll('.nav-link[href*="my-designs"], .nav-link[href*="place-order"]');
  navLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      if (!designDirty) return;
      e.preventDefault();
      e.stopPropagation();

      const proceed = window.showUnsavedConfirm
        ? await window.showUnsavedConfirm()
        : confirm('You have unsaved changes. Leave anyway?');
      if (proceed) {
        window.location.href = link.href;
      }
    });
  });
}

// Design family and design loading functionality
const designThumbnails = document.getElementById('design-thumbnails');
const familyName = document.getElementById('family-name');
const backButton = document.getElementById('back-button');
const designCustomizationPanel = document.getElementById('design-customization-panel');
let currentFamily = null;
let currentDesign = null;
let designDirty = false; // tracks unsaved edits
let isLoadingConfig = false; // prevents marking dirty during config loading
window.designDirty = designDirty;


// ==================== SAVE FUNCTIONALITY - STATE MANAGEMENT ====================
// Global variables for save functionality
let currentDesignName = '';
let currentDesignId = null;
let isInitialSave = true;
let isSaving = false;
let isSharedDesign = false;

// Get Supabase client (should be available from auth.js)
// Helper function to get Supabase client - tries to use the one from auth.js first
function getSupabaseClient() {
  // Try to access supabase from auth.js (it's created as const in global scope)
  // Since auth.js is loaded before this script, it should be available
  if (typeof supabase !== 'undefined' && supabase) {
    return supabase;
  }

  // Fallback: create our own instance if not available
  if (typeof window !== 'undefined' && window.supabase) {
    const SUPABASE_URL = 'https://jvuibcqogyyffylvfeog.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2dWliY3FvZ3l5ZmZ5bHZmZW9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMjg3MzUsImV4cCI6MjA1MTkwNDczNX0.iIu6f3LwdLmHoHmuVjbuVm-uLCDWA3oGZ7J07wXGBBU';
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return null;
}

// ==================== DOWNLOAD FUNCTIONALITY ====================
// Function to download JSON
function downloadDesignJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

function getShortCodeFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('shortCode');
}

async function fetchDesignData(shortCode) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Supabase client not available');
    return null;
  }

  const { data, error } = await supabase
    .from('user_files')
    .select('design_name, custom_name, design_metadata, short_code, id')
    .eq('short_code', shortCode)
    .single();

  if (error) {
    console.error('Error fetching design data:', error);
    return null;
  }

  return data;
}

// Function to handle the download
// ==================== ZIP DOWNLOAD HELPERS ====================
// Helper function to fetch image as blob
async function fetchImageAsBlob(url) {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${url}`);
      return null;
    }
    return await response.blob();
  } catch (error) {
    console.warn(`Error fetching image ${url}:`, error);
    return null;
  }
}

// Helper function to download zip file
function downloadZip(blob, filename) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Modified handleDownload to create zip with JSON + logos
async function handleDownload() {
  try {
    const shortCode = getShortCodeFromUrl();
    let metadata;
    let zipFilename;

    if (shortCode) {
      // Case 1: Existing design - fetch from database
      console.log(`Loading design from database with shortCode: ${shortCode}`);
      const data = await fetchDesignData(shortCode);

      if (!data || !data.design_metadata) {
        console.log("No design metadata found for the given short code");
        return;
      }

      metadata = data.design_metadata;
      zipFilename = `jersey_design_${shortCode}.zip`;
    } else {
      // Case 2: New design - capture current state from UI
      console.log("No shortCode found - capturing current design state from UI");
      metadata = getJerseyConfiguration();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      zipFilename = `jersey_design_new_${timestamp}.zip`;
    }

    console.log("Creating zip package with JSON and logos...");

    // Create zip file
    const zip = new JSZip();

    // Add JSON configuration
    zip.file("config.json", JSON.stringify(metadata, null, 2));
    console.log("✓ Added config.json");

    // Add logo images
    const logosFolder = zip.folder("logos");
    const logoPromises = [];

    if (metadata.logos) {
      for (const [partName, logos] of Object.entries(metadata.logos)) {
        if (Array.isArray(logos) && logos.length > 0) {
          logos.forEach((logo, index) => {
            if (logo.url) {
              const promise = fetchImageAsBlob(logo.url).then(blob => {
                if (blob) {
                  const filename = `${partName}_logo_${index + 1}.png`;
                  logosFolder.file(filename, blob);
                  console.log(`✓ Added logo: ${filename}`);
                }
              });
              logoPromises.push(promise);
            }
          });
        }
      }
    }

    // Wait for all logos to be fetched
    await Promise.all(logoPromises);

    // Generate and download zip
    console.log("Generating zip file...");
    const zipBlob = await zip.generateAsync({ type: "blob" });
    downloadZip(zipBlob, zipFilename);
    console.log("✅ Zip file downloaded successfully");

  } catch (error) {
    console.error("Error downloading design package:", error);
  }
}

// Event listener for download button
document.addEventListener("DOMContentLoaded", () => {
  const downloadButton = document.getElementById("download-button");

  if (downloadButton) {
    downloadButton.addEventListener("click", handleDownload);
  }

  // Screenshot button functionality
  const screenshotButton = document.getElementById('screenshot-button');
  if (screenshotButton) {
    screenshotButton.addEventListener('click', () => {
      // Call the globally exposed function from threeD-script.js
      if (typeof window.takeCurrentViewScreenshot === 'function') {
        window.takeCurrentViewScreenshot();
      } else {
        console.error('Screenshot function not available yet');
      }
    });
  }
});


// Design configuration - loaded from design-config.json
// Simple format: just specifies display order, paths are derived from folder names
let familyOrder = [];   // Order of families: ["graphic", "jacquard", ...]
let designOrder = {};   // Order of designs per family: { graphic: ["aurora"], ... }

// Fallback configuration
const fallbackFamilyOrder = ['graphic', 'jacquard', 'stripes', 'uni_design'];
const fallbackDesignOrder = {
  graphic: ['aurora'],
  jacquard: ['classic'],
  stripes: ['the_grey'],
  uni_design: ['flame_red']
};

// Helper: Convert folder/file name to display name
// "uni_design" -> "Uni Design", "flame_red" -> "Flame Red"
function toDisplayName(name) {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Normalize URL params so they match our file naming convention
// e.g. "set-in" -> "set_in", "V_Neck" -> "v_neck"
function normalizeTypeValue(value, fallback) {
  const v = (value || fallback || '').toString().trim().toLowerCase().replace(/-/g, '_');
  return v || fallback;
}

// Helper function to get the correct base path based on current page location
function getBasePath() {
  const currentPath = window.location.pathname;
  const isInSubfolder = currentPath.includes('/admin-design/') || currentPath.includes('/share/');
  return isInSubfolder ? '../../' : '../';
}

// Path helpers for the folder structure
function getFamilyThumbnailPath(familyId, collar, shoulder) {
  // Family thumbnails are per model type (collar + shoulder)
  const basePath = typeof getBasePath === 'function' ? getBasePath() : '../';
  return `${basePath}designs/design_family/${familyId}/${collar}_${shoulder}_${familyId}_thumb.webp`;
}

function getDesignIconPath(familyId, designId, collar, shoulder) {
  const basePath = typeof getBasePath === 'function' ? getBasePath() : '../';
  return `${basePath}designs/icons/${familyId}/${designId}/${collar}_${shoulder}_${designId}_thumb.webp`;
}

function getDesignSvgPath(familyId, designId, collar, shoulder) {
  // Use getBasePath() if available (from threeD-script.js), otherwise fallback to '../'
  const basePath = typeof getBasePath === 'function' ? getBasePath() : '../';
  return `${basePath}designs/svg/${familyId}/${designId}/${collar}_${shoulder}_${designId}.svg`;
}

function getDesignIdFromSvgPath(svgPath) {
  try {
    if (!svgPath) return null;
    const parts = svgPath.split('/');
    // Expected: ../designs/svg/<family>/<design>/<collar>_<shoulder>_<design>.svg
    return parts.length >= 2 ? parts[parts.length - 2] : null;
  } catch {
    return null;
  }
}

// Load design configuration from JSON file
async function loadDesignConfig() {
  try {
    // Use getBasePath() to resolve path correctly from both main page and share subdirectory
    const basePath = typeof getBasePath === 'function' ? getBasePath() : './';
    const configPath = basePath === './' ? './design-config.json' : `${basePath}jersey-configurator/design-config.json`;
    const response = await fetch(configPath);
    if (!response.ok) {
      throw new Error(`Failed to load design-config.json: ${response.status} ${response.statusText}`);
    }
    const config = await response.json();

    // Load family order
    if (config.familyOrder && Array.isArray(config.familyOrder)) {
      familyOrder = config.familyOrder;
      console.log('Family order loaded:', familyOrder);
    }

    // Load design order per family
    if (config.designOrder && typeof config.designOrder === 'object') {
      designOrder = config.designOrder;
      console.log('Design order loaded:', designOrder);
    }

    console.log('Design configuration loaded successfully');
    return true;
  } catch (error) {
    console.warn('Failed to load design-config.json, using fallback:', error.message);
    familyOrder = fallbackFamilyOrder;
    designOrder = fallbackDesignOrder;
    return false;
  }
}

// Load design families (initial view)
function loadDesignFamilies() {
  designThumbnails.innerHTML = '';
  familyName.innerHTML = '<span data-en>Select Design Family</span><span data-fr>Sélectionner la Famille de Design</span>';
  backButton.style.display = 'none';
  designCustomizationPanel.style.display = 'none';
  const colorGroup = document.getElementById('color-selection-group');
  if (colorGroup) colorGroup.style.display = 'none';
  const ribbedCollarGroup = document.getElementById('ribbed-collar-group-designs');
  if (ribbedCollarGroup) ribbedCollarGroup.style.display = 'none';
  designThumbnails.style.display = 'grid';
  currentFamily = null;
  currentDesign = null;

  // Get current collar and shoulder from URL parameters (normalized)
  const { collar, shoulder } = getCurrentCollarAndShoulder();

  // Display families in the order specified by familyOrder
  familyOrder.forEach(familyId => {
    const thumbnailPath = getFamilyThumbnailPath(familyId, collar, shoulder);
    const displayName = toDisplayName(familyId);

    const thumbnailItem = document.createElement('div');
    thumbnailItem.className = 'thumbnail-item';
    thumbnailItem.setAttribute('data-family-id', familyId);

    const img = document.createElement('img');
    img.src = thumbnailPath;
    img.alt = displayName;
    img.onerror = function () {
      // Fallback to legacy single thumbnail (if present): {basePath}designs/{familyId}.webp
      if (!img.dataset.fallbackTried) {
        img.dataset.fallbackTried = '1';
        const basePath = getBasePath();
        img.src = `${basePath}designs/${familyId}.webp`;
        return;
      }

      console.error('Failed to load family thumbnail:', thumbnailPath, 'and fallback:', img.src);
      thumbnailItem.style.display = 'none';
    };

    // Add label for family name
    const label = document.createElement('span');
    label.className = 'thumbnail-label';
    label.textContent = displayName;

    thumbnailItem.appendChild(img);
    thumbnailItem.appendChild(label);
    thumbnailItem.addEventListener('click', () => loadFamilyDesigns(familyId));
    designThumbnails.appendChild(thumbnailItem);
  });

  console.log(`Loaded ${familyOrder.length} design families`);
}

// Get current collar and shoulder from URL parameters
function getCurrentCollarAndShoulder() {
  const urlParams = new URLSearchParams(window.location.search);
  const collar = normalizeTypeValue(urlParams.get('collar'), 'insert');
  const shoulder = normalizeTypeValue(urlParams.get('shoulder'), 'reglan');
  return { collar, shoulder };
}

// Update collar2 option visibility based on collar type
// collar2 is only available for insert collar types (insert_reglan, insert_set_in)
function updateCollar2OptionVisibility() {
  const { collar } = getCurrentCollarAndShoulder();
  const isInsertCollar = collar === 'insert';

  // Get all part select dropdowns
  const partSelects = [
    document.getElementById('jersey-part-select-colors'),
    document.getElementById('jersey-part-select-working'),
    document.getElementById('jersey-part-select')
  ];

  partSelects.forEach(select => {
    if (!select) return;

    const collar2Option = select.querySelector('option[value="collar2"]');
    if (collar2Option) {
      if (isInsertCollar) {
        collar2Option.style.display = '';
        collar2Option.disabled = false;
      } else {
        collar2Option.style.display = 'none';
        collar2Option.disabled = true;
        // If collar2 was selected, switch to a different option
        if (select.value === 'collar2') {
          select.value = 'collar';
        }
      }
    }
  });

  console.log(`Collar2 option visibility: ${isInsertCollar ? 'visible' : 'hidden'} (collar type: ${collar})`);
}

// Load designs from a specific family
// familyId: string identifier (e.g., 'graphic', 'jacquard')
function loadFamilyDesigns(familyId) {
  currentFamily = familyId;
  familyName.textContent = toDisplayName(familyId);
  backButton.style.display = 'flex';
  designCustomizationPanel.style.display = 'none';
  const colorGroup = document.getElementById('color-selection-group');
  if (colorGroup) colorGroup.style.display = 'none';
  const ribbedCollarGroup = document.getElementById('ribbed-collar-group-designs');
  if (ribbedCollarGroup) ribbedCollarGroup.style.display = 'none';
  designThumbnails.innerHTML = '';
  designThumbnails.style.display = 'grid';

  // Get current collar and shoulder from URL parameters
  const { collar, shoulder } = getCurrentCollarAndShoulder();

  // Get designs for this family from config
  const familyDesigns = designOrder[familyId] || [];
  console.log(`Loading ${familyDesigns.length} design(s) from ${toDisplayName(familyId)} for: ${collar}_${shoulder}`);

  if (familyDesigns.length === 0) {
    designThumbnails.innerHTML = '<p style="color: #888; text-align: center; grid-column: 1/-1;">No designs available</p>';
    return;
  }

  // Create thumbnails for each design
  familyDesigns.forEach(designId => {
    // Paths are built from familyId, designId, and current collar/shoulder
    const svgPath = getDesignSvgPath(familyId, designId, collar, shoulder);
    const iconPath = getDesignIconPath(familyId, designId, collar, shoulder);
    const displayName = toDisplayName(designId);

    const thumbnailItem = document.createElement('div');
    thumbnailItem.className = 'thumbnail-item';
    thumbnailItem.setAttribute('data-design-id', designId);

    const img = document.createElement('img');
    img.src = iconPath;
    img.alt = displayName;
    img.onerror = function () {
      // Fallbacks:
      // 1) iconPath -> svgPath
      // 2) svgPath -> placeholder
      if (!img.dataset.fallbackStep) {
        img.dataset.fallbackStep = 'svg';
        console.warn('Icon not found, falling back to SVG:', iconPath);
        img.src = svgPath;
        return;
      }

      console.error('Design thumbnail missing (icon + svg). Falling back to placeholder:', {
        iconPath,
        svgPath
      });
      img.onerror = null;
      img.src = '../images/placeholder.svg';
    };

    // Add label for design name
    const label = document.createElement('span');
    label.className = 'thumbnail-label';
    label.textContent = displayName;

    thumbnailItem.appendChild(img);
    thumbnailItem.appendChild(label);
    thumbnailItem.addEventListener('click', async (e) => {
      e.stopPropagation();
      currentDesign = svgPath;

      // Update header name: "Family - Design"
      familyName.textContent = `${toDisplayName(currentFamily)} - ${displayName}`;
      markDesignDirty();

      // Fetch SVG and detect colors
      try {
        const response = await fetch(svgPath);
        const svgText = await response.text();

        // Detect unique colors in the SVG
        const colors = detectUniqueColors(svgText);
        debugLog('Detected colors in design:', colors);

        // Store colors globally for use in showDesignCustomization
        window.currentSVGColors = colors;
      } catch (error) {
        console.error('Error detecting colors:', error);
        window.currentSVGColors = [];
      }

      // Dispatch custom event to notify 3D viewer to load this SVG
      const designSelectedEvent = new CustomEvent('designSelected', {
        detail: { svgPath: svgPath }
      });
      window.dispatchEvent(designSelectedEvent);

      showDesignCustomization();
    });

    designThumbnails.appendChild(thumbnailItem);
  });
}

// Show design customization panel
function showDesignCustomization() {
  designThumbnails.style.display = 'none';

  // Populate color pickers with detected colors
  if (window.currentSVGColors && window.currentSVGColors.length > 0) {
    populateColorPickers(window.currentSVGColors);
  } else {
    // Fallback: show empty color group or hide it
    const colorGroup = document.getElementById('color-selection-group');
    if (colorGroup) {
      colorGroup.style.display = 'none';
    }
  }

  const ribbedCollarGroup = document.getElementById('ribbed-collar-group-designs');
  if (ribbedCollarGroup) ribbedCollarGroup.style.display = 'block';
  designCustomizationPanel.style.display = 'block';
  // Initialize select dropdown handler when panel becomes visible
  initializeSelectDropdown();
}

// Initialize select dropdown to handle overflow issue
function initializeSelectDropdown() {
  const selectInput = document.getElementById('jersey-part-select');
  if (!selectInput) {
    console.warn('Select input not found');
    return;
  }

  const customizationPanel = document.querySelector('.customization-panel');
  if (!customizationPanel) {
    console.warn('Customization panel not found');
    return;
  }

  // Remove any existing event listeners by checking if already initialized
  if (selectInput.dataset.initialized === 'true') {
    return; // Already initialized
  }
  selectInput.dataset.initialized = 'true';

  let isSelectOpen = false;
  let blurTimeout = null;

  // Handle mousedown - open select before native dropdown appears
  selectInput.addEventListener('mousedown', function (e) {
    e.stopPropagation();
    if (!isSelectOpen) {
      isSelectOpen = true;
      customizationPanel.classList.add('select-open');
      // Clear any pending blur timeout
      if (blurTimeout) {
        clearTimeout(blurTimeout);
        blurTimeout = null;
      }
    }
  }, true);

  // Handle click - ensure select is open
  selectInput.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!isSelectOpen) {
      isSelectOpen = true;
      customizationPanel.classList.add('select-open');
    }
  }, true);

  // Handle focus
  selectInput.addEventListener('focus', function () {
    isSelectOpen = true;
    customizationPanel.classList.add('select-open');
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }
  }, true);

  // Handle blur - delay to allow option selection
  selectInput.addEventListener('blur', function () {
    blurTimeout = setTimeout(() => {
      if (document.activeElement !== selectInput && !selectInput.matches(':focus')) {
        isSelectOpen = false;
        customizationPanel.classList.remove('select-open');
      }
    }, 200);
  });

  // Handle change event
  selectInput.addEventListener('change', function () {
    // Keep open briefly to allow visual feedback, then close
    setTimeout(() => {
      isSelectOpen = false;
      customizationPanel.classList.remove('select-open');
    }, 150);
  });

  // Handle click outside to close
  const handleClickOutside = function (e) {
    // Don't close if clicking on the select or its options
    if (!selectInput.contains(e.target) &&
      !e.target.closest('select') &&
      !e.target.closest('option')) {
      if (isSelectOpen) {
        isSelectOpen = false;
        customizationPanel.classList.remove('select-open');
      }
    }
  };

  // Add click outside listener
  document.addEventListener('mousedown', handleClickOutside, true);
}

// Back button functionality
backButton.addEventListener('click', () => {
  if (currentDesign) {
    // If showing customization panel, check if we should skip thumbnails
    currentDesign = null;
    designCustomizationPanel.style.display = 'none';
    const colorGroup = document.getElementById('color-selection-group');
    if (colorGroup) colorGroup.style.display = 'none';
    const ribbedCollarGroup = document.getElementById('ribbed-collar-group-designs');
    if (ribbedCollarGroup) ribbedCollarGroup.style.display = 'none';

    // Design was manually selected, show thumbnails
    designThumbnails.style.display = 'grid';
  } else {
    // If showing designs, go back to families
    loadDesignFamilies();
  }
});

// Range input value display
document.addEventListener('DOMContentLoaded', () => {
  // Range input value display
  document.querySelectorAll('.range-input').forEach(input => {
    const valueDisplay = input.closest('.settings-group, .scale-group').querySelector('.range-value');
    const unit = input.dataset.unit || '';

    function updateValue() {
      valueDisplay.textContent = `${input.value}${unit}`;
    }

    input.addEventListener('input', updateValue);
    updateValue();
  });
});

// Initialize: Load design configuration and then display design families
(async function initializeDesigns() {
  await loadDesignConfig();
  loadDesignFamilies();
})();

// Colors & Stripes Panel Functionality
// Stripe Orientation Radio Group
const jerseyStripesGroup = document.getElementById('jersey-stripes-orientation')?.closest('.radio-group');

// Function to update the stripe orientation background position
function updateStripeOrientationBackground() {
  if (!jerseyStripesGroup) return;

  const background = jerseyStripesGroup.querySelector('.radio-background');
  const checkedRadio = jerseyStripesGroup.querySelector('input[type="radio"]:checked');

  if (background && checkedRadio) {
    if (checkedRadio.value === 'vertical') {
      background.style.transform = 'translateX(100%)';
    } else {
      background.style.transform = 'translateX(0)';
    }
  }
}

if (jerseyStripesGroup) {
  const background = jerseyStripesGroup.querySelector('.radio-background');
  const radioButtons = jerseyStripesGroup.querySelectorAll('input[type="radio"]');

  // Set initial position based on checked radio
  updateStripeOrientationBackground();

  // Add event listeners to radio buttons
  radioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
      background.style.transition = 'transform 0.3s ease-in-out';
      updateStripeOrientationBackground();
    });
  });
}

// Expose function globally so it can be called from config loading
window.updateStripeOrientationBackground = updateStripeOrientationBackground;


// Stripe Layer Tabs (no-tab-group)
function adjustTabWidths(tabGroup) {
  const tabContainer = tabGroup.querySelector('.no-tab-container');
  const tabs = tabGroup.querySelectorAll('.no-tab');
  const activeContent = tabGroup.querySelector('.no-tab-content.no-active');

  if (tabContainer && tabs.length > 0 && activeContent) {
    const contentWidth = activeContent.offsetWidth;
    const tabWidth = contentWidth / 4;

    tabs.forEach(tab => {
      tab.style.width = `${tabWidth}px`;
    });

    tabContainer.style.width = `${contentWidth}px`;
  }
}

function initializeStripeTabs() {
  const stripeTabGroup = document.querySelector('#colors-tab .no-tab-group');
  if (!stripeTabGroup) return;

  adjustTabWidths(stripeTabGroup);

  stripeTabGroup.querySelectorAll('.no-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      stripeTabGroup.querySelectorAll('.no-tab').forEach(t => t.classList.remove('no-active'));
      stripeTabGroup.querySelectorAll('.no-tab-content').forEach(content => content.classList.remove('no-active'));

      tab.classList.add('no-active');
      const targetContent = stripeTabGroup.querySelector(`.no-tab-content[data-tab="${tab.dataset.tab}"]`);
      if (targetContent) {
        targetContent.classList.add('no-active');
      }

      adjustTabWidths(stripeTabGroup);
      // Initialize stripe selects when tab is switched
      initializeStripeSelects();
    });
  });

  // Initialize stripe selects for the initially active tab
  initializeStripeSelects();
}

// Initialize stripe tabs when Colors & Stripes tab is active
const colorsTabRadio = document.querySelector('input[name="jersey-tab"][value="colors"]');
if (colorsTabRadio) {
  colorsTabRadio.addEventListener('change', () => {
    if (colorsTabRadio.checked) {
      setTimeout(initializeStripeTabs, 100);
      // Initialize default stripes when switching to Colors & Stripes tab
      if (window.jerseyViewer && window.jerseyViewer.initializeDefaultStripes) {
        setTimeout(() => window.jerseyViewer.initializeDefaultStripes(), 150);
      }
    }
  });
}


// Initialize on page load if Colors tab is active
if (colorsTabRadio && colorsTabRadio.checked) {
  setTimeout(initializeStripeTabs, 100);
}

// Range input value display for Colors & Stripes tab
document.addEventListener('DOMContentLoaded', () => {
  // Update range values in Colors & Stripes tab
  const colorsTab = document.getElementById('colors-tab');
  if (colorsTab) {
    colorsTab.querySelectorAll('.range-input').forEach(input => {
      const valueDisplay = input.closest('.settings-group, .scale-group').querySelector('.range-value');
      if (valueDisplay) {
        const unit = input.dataset.unit || '';

        function updateValue() {
          valueDisplay.textContent = `${input.value}${unit}`;
        }

        input.addEventListener('input', updateValue);
        updateValue();
      }
    });
  }
});

// Initialize stripe select dropdowns
function initializeStripeSelects() {
  const stripeSelects = document.querySelectorAll('#colors-tab .stripes-select');
  const customizationPanel = document.querySelector('.customization-panel');

  if (!customizationPanel) return;

  stripeSelects.forEach(select => {
    if (select.dataset.initialized === 'true') return;
    select.dataset.initialized = 'true';

    let isSelectOpen = false;
    let blurTimeout = null;

    select.addEventListener('mousedown', function (e) {
      e.stopPropagation();
      if (!isSelectOpen) {
        isSelectOpen = true;
        customizationPanel.classList.add('select-open');
        if (blurTimeout) {
          clearTimeout(blurTimeout);
          blurTimeout = null;
        }
      }
    }, true);

    select.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!isSelectOpen) {
        isSelectOpen = true;
        customizationPanel.classList.add('select-open');
      }
    }, true);

    select.addEventListener('focus', function () {
      isSelectOpen = true;
      customizationPanel.classList.add('select-open');
      if (blurTimeout) {
        clearTimeout(blurTimeout);
        blurTimeout = null;
      }
    }, true);

    select.addEventListener('blur', function () {
      blurTimeout = setTimeout(() => {
        if (document.activeElement !== select && !select.matches(':focus')) {
          isSelectOpen = false;
          customizationPanel.classList.remove('select-open');
        }
      }, 200);
    });

    select.addEventListener('change', function () {
      setTimeout(() => {
        isSelectOpen = false;
        customizationPanel.classList.remove('select-open');
      }, 150);
    });
  });
}

// Toggle stripe settings visibility based on stripe count
function toggleStripeSettings() {
  const stripeSelects = document.querySelectorAll('#colors-tab .stripes-select');

  stripeSelects.forEach(select => {
    select.addEventListener('change', function () {
      const tabContent = this.closest('.no-tab-content');
      if (!tabContent) return;

      const stripeSettings = tabContent.querySelectorAll('[data-stripe-setting]');

      if (this.value === '0') {
        stripeSettings.forEach(setting => {
          setting.style.display = 'none';
        });
      } else {
        stripeSettings.forEach(setting => {
          setting.style.display = 'block';
        });
      }
    });

    // Initial call to set correct visibility on page load
    select.dispatchEvent(new Event('change'));
  });
}

// Initialize stripe settings toggle and select dropdowns
document.addEventListener('DOMContentLoaded', () => {
  toggleStripeSettings();
  initializeStripeSelects();

  // Update collar2 option visibility based on collar type
  updateCollar2OptionVisibility();

  // Handle ribbed collar checkbox changes
  const ribbedCollarCheckboxes = [
    document.getElementById('ribbed-collar-checkbox-designs'),
    document.getElementById('ribbed-collar-checkbox-colors'),
    document.getElementById('ribbed-collar-checkbox')
  ];

  ribbedCollarCheckboxes.forEach(checkbox => {
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        const isRibbed = e.target.checked;
        console.log(`Ribbed collar checkbox changed: ${isRibbed}`);

        // Sync all other checkboxes to match this one
        ribbedCollarCheckboxes.forEach(otherCheckbox => {
          if (otherCheckbox && otherCheckbox !== checkbox) {
            otherCheckbox.checked = isRibbed;
          }
        });

        // Toggle normal maps on collar materials
        if (window.jerseyViewer) {
          window.jerseyViewer.toggleCollarNormalMaps(isRibbed);
        }
      });
    }
  });
});

// Initialize select dropdown for Colors & Stripes tab
function initializeColorsSelectDropdown() {
  const selectInput = document.getElementById('jersey-part-select-colors');
  if (!selectInput) return;

  const customizationPanel = document.querySelector('.customization-panel');
  if (!customizationPanel) return;

  if (selectInput.dataset.initialized === 'true') {
    return;
  }
  selectInput.dataset.initialized = 'true';

  let isSelectOpen = false;
  let blurTimeout = null;

  selectInput.addEventListener('mousedown', function (e) {
    e.stopPropagation();
    if (!isSelectOpen) {
      isSelectOpen = true;
      customizationPanel.classList.add('select-open');
      if (blurTimeout) {
        clearTimeout(blurTimeout);
        blurTimeout = null;
      }
    }
  }, true);

  selectInput.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!isSelectOpen) {
      isSelectOpen = true;
      customizationPanel.classList.add('select-open');
    }
  }, true);

  selectInput.addEventListener('focus', function () {
    isSelectOpen = true;
    customizationPanel.classList.add('select-open');
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }
  }, true);

  selectInput.addEventListener('blur', function () {
    blurTimeout = setTimeout(() => {
      if (document.activeElement !== selectInput && !selectInput.matches(':focus')) {
        isSelectOpen = false;
        customizationPanel.classList.remove('select-open');
      }
    }, 200);
  });

  selectInput.addEventListener('change', function () {
    setTimeout(() => {
      isSelectOpen = false;
      customizationPanel.classList.remove('select-open');
    }, 150);
  });

  // Handle click outside
  const handleClickOutside = function (e) {
    if (!selectInput.contains(e.target) &&
      !e.target.closest('select') &&
      !e.target.closest('option')) {
      if (isSelectOpen) {
        isSelectOpen = false;
        customizationPanel.classList.remove('select-open');
      }
    }
  };

  document.addEventListener('mousedown', handleClickOutside, true);
}

// Initialize select dropdown when Colors tab is shown
if (colorsTabRadio) {
  colorsTabRadio.addEventListener('change', () => {
    if (colorsTabRadio.checked) {
      setTimeout(initializeColorsSelectDropdown, 100);
    }
  });
}

// Initialize on page load if Colors tab is active
if (colorsTabRadio && colorsTabRadio.checked) {
  setTimeout(initializeColorsSelectDropdown, 100);
}

// Logo upload handling
const logoUpload = document.getElementById('logo-upload');
const logoUploadColors = document.getElementById('logo-upload-colors');
const uploadArea = document.querySelector('.logo-upload-area');
const uploadStatus = document.getElementById('upload-status');
const uploadStatusColors = document.getElementById('upload-status-colors');

function updateUploadStatus(messageKey, isError = false, isColorsTab = false) {
  const currentLang = window.getCurrentLanguage ? window.getCurrentLanguage() : (localStorage.getItem("language") || "en");
  const statusElement = isColorsTab ? uploadStatusColors : uploadStatus;

  if (!statusElement) return;

  // Use alertMessages matching reference pattern from socks configurator
  const translatedMessage = window.alertMessages && window.alertMessages[messageKey] ?
    (window.alertMessages[messageKey][currentLang] || window.alertMessages[messageKey]['en'] || messageKey) :
    messageKey;

  statusElement.textContent = translatedMessage;
  statusElement.classList.remove('hidden', 'error', 'success');
  statusElement.classList.add(isError ? 'error' : 'success');

  clearTimeout(window.statusTimeout);
  window.statusTimeout = setTimeout(() => {
    statusElement.classList.add('hidden');
  }, 2000);
}

// Handle drag and drop for both upload areas
document.querySelectorAll('.logo-upload-area').forEach((area) => {
  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.style.borderColor = 'var(--color-primary)';
  });

  area.addEventListener('dragleave', () => {
    area.style.borderColor = 'var(--color-border)';
  });

  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.style.borderColor = 'var(--color-border)';
    const file = e.dataTransfer.files[0];
    const isColorsTab = area.closest('.logo-upload').querySelector('#logo-upload-colors') !== null;

    if (file && file.type === 'image/png') {
      handleLogoFile(file, isColorsTab);
    } else {
      updateUploadStatus('Please upload a PNG file', true, isColorsTab);
    }
  });
});

// Handle file input change for designs tab
if (logoUpload) {
  logoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleLogoFile(file, false);
    }
  });
}

// Handle file input change for colors tab
if (logoUploadColors) {
  logoUploadColors.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleLogoFile(file, true);
    }
  });
}

async function handleLogoFile(file, isColorsTab = false) {
  try {
    updateUploadStatus('uploading_logo', false, isColorsTab);
    const result = await uploadLogoToSupabase(file);
    if (result.success) {
      updateUploadStatus('logo_upload_success', false, isColorsTab);
      // Call readLogo if it exists in threeD-script.js
      if (window.readLogo) {
        window.readLogo(result.publicUrl);
      } else {
        console.log('Logo uploaded. Public URL:', result.publicUrl);
        // You can add custom logic here to handle the logo in the 3D viewer
      }
    } else {
      updateUploadStatus('logo_upload_error', true, isColorsTab);
    }
  } catch (error) {
    console.error('Error handling logo file:', error);
    updateUploadStatus('logo_upload_error', true, isColorsTab);
  }
}

async function uploadLogoToSupabase(file) {
  if (window.showLoading) window.showLoading();

  try {
    // Get Supabase client - check if it's available globally from auth.js
    let supabase;
    if (window.supabaseClient) {
      supabase = window.supabaseClient;
    } else if (window.supabase && window.supabase.createClient) {
      supabase = window.supabase.createClient(
        'https://jvuibcqogyyffylvfeog.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2dWliY3FvZ3l5ZmZ5bHZmZW9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMjg3MzUsImV4cCI6MjA1MTkwNDczNX0.iIu6f3LwdLmHoHmuVjbuVm-uLCDWA3oGZ7J07wXGBBU'
      );
    } else {
      throw new Error('Supabase client not available');
    }

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
      console.error('No user logged in');
      if (window.hideLoading) window.hideLoading();
      if (window.showLoginModal) {
        window.showLoginModal();
      }
      return {
        success: false,
        message: window.getTranslation ? window.getTranslation('no_user_logged_in', localStorage.getItem("language") || "en") : 'Please log in to upload a logo'
      };
    }

    const userId = user.id;
    const timestamp = Date.now();
    const fileName = `${file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, '_')}_${timestamp}.png`;
    const filePath = `${userId}/logo/${fileName}`;

    // Resize image if necessary
    const resizedFile = await resizeImage(file);

    // Upload the resized logo file to the user's folder
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public-bucket')
      .upload(filePath, resizedFile, {
        contentType: 'image/png'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      if (window.hideLoading) window.hideLoading();
      return {
        success: false,
        message: window.getTranslation ? window.getTranslation('error_uploading_logo', localStorage.getItem("language") || "en") : 'Error uploading logo'
      };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('public-bucket')
      .getPublicUrl(filePath);

    setTimeout(() => {
      if (window.hideLoading) window.hideLoading();
    }, 2500);

    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    console.log('Logo uploaded successfully. Public URL:', urlData.publicUrl);
    return { success: true, message: 'Logo uploaded successfully', publicUrl: urlData.publicUrl };
  } catch (error) {
    console.error('Error uploading logo:', error);
    setTimeout(() => {
      if (window.hideLoading) window.hideLoading();
    }, 2500);
    return {
      success: false,
      message: window.getTranslation ? window.getTranslation('error_uploading_logo', localStorage.getItem("language") || "en") : 'Error uploading logo'
    };
  }
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > 1000) {
            height *= 1000 / width;
            width = 1000;
          }
        } else {
          if (height > 1000) {
            width *= 1000 / height;
            height = 1000;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(resolve, 'image/png');
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==================== SVG COLOR DETECTION ====================
/**
 * Detects SVG classes and their colors from CSS style blocks, sorted by dominance
 * @param {SVGElement|string} svgElement - SVG DOM element or SVG string
 * @returns {Array<Object>} Array of class info objects with {className, color, dominance, elementCount}
 */
function detectUniqueColors(svgElement) {
  let svgDoc;
  let svgString;

  // Handle both SVG element and SVG string
  if (typeof svgElement === 'string') {
    svgString = svgElement;
    // Parse SVG string to DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgElement, 'image/svg+xml');
    svgDoc = doc.documentElement;
  } else {
    svgDoc = svgElement;
    // Convert element to string for style parsing
    svgString = new XMLSerializer().serializeToString(svgElement);
  }

  // Map to store class information: className -> {color, elementCount, totalArea}
  const classMap = new Map();

  // Step 1: Parse CSS style block to extract class-to-color mappings
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const styleMatch = styleRegex.exec(svgString);

  if (styleMatch && styleMatch[1]) {
    const cssContent = styleMatch[1];

    // Extract class definitions with fill colors
    // Matches patterns like: .st0{...fill:#FFD700...} or .st2{...fill:#2698D1...}
    // This regex matches single-class selectors only for backward compatibility
    const classRegex = /\.([a-zA-Z0-9_-]+)\s*\{[^}]*fill:\s*([#a-fA-F0-9]+)[^}]*\}/g;

    let match;
    while ((match = classRegex.exec(cssContent)) !== null) {
      const className = match[1];
      let color = match[2].toLowerCase();

      // Normalize 3-char hex to 6-char (e.g., #fff -> #ffffff)
      if (/^#[a-fA-F0-9]{3}$/.test(color)) {
        color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
      }

      // Skip if color is 'none' or similar
      if (color && color !== 'none') {
        // For CSS cascade: later rules override earlier ones
        // So we always update the color if this class was already detected
        classMap.set(className, {
          className: className,
          color: color,
          elementCount: 0,
          totalArea: 0
        });
      }
    }
  }

  debugLog('Parsed CSS classes:', Array.from(classMap.keys()));

  // Helper function to estimate element area
  function estimateElementArea(element) {
    try {
      const bbox = element.getBBox ? element.getBBox() : null;
      if (bbox && bbox.width && bbox.height) {
        return bbox.width * bbox.height;
      }
    } catch (e) {
      // getBBox might fail for some elements
    }
    // Fallback: assign a default area
    return 100;
  }

  // Helper function to check if a class has a fill defined in the style block
  function classHasFillInStyle(className) {
    return classMap.has(className);
  }

  // Helper function to get the computed fill of an element
  // Returns the fill color if explicitly set, or null if element defaults to black
  function getElementFill(element, cssContent) {
    // Check for inline fill attribute
    const inlineFill = element.getAttribute('fill');
    if (inlineFill && inlineFill !== 'none') {
      return inlineFill.toLowerCase();
    }

    // Check for inline style with fill
    const style = element.getAttribute('style');
    if (style) {
      const fillMatch = style.match(/fill:\s*([^;]+)/i);
      if (fillMatch && fillMatch[1] && fillMatch[1].trim() !== 'none') {
        return fillMatch[1].trim().toLowerCase();
      }
    }

    // Check if element has a class with defined fill
    const classAttr = element.getAttribute('class');
    if (classAttr) {
      // Handle multiple classes
      const classes = classAttr.split(/\s+/);
      for (const cls of classes) {
        if (classHasFillInStyle(cls)) {
          return classMap.get(cls).color;
        }
      }
    }

    // No fill defined - element will default to black (SVG default)
    return null;
  }

  // Track elements that default to black (no fill defined)
  let defaultBlackCount = 0;
  let defaultBlackArea = 0;

  // Step 2: Traverse SVG to count elements for each class
  function traverseElement(element) {
    // Get the class attribute
    const classAttr = element.getAttribute('class');
    const tagName = element.tagName ? element.tagName.toLowerCase() : '';

    // Only consider shape elements (path, polygon, rect, circle, ellipse, line, polyline)
    const shapeElements = ['path', 'polygon', 'rect', 'circle', 'ellipse', 'line', 'polyline'];
    const isShapeElement = shapeElements.includes(tagName);

    if (isShapeElement) {
      if (classAttr && classMap.has(classAttr)) {
        const classInfo = classMap.get(classAttr);
        classInfo.elementCount++;
        classInfo.totalArea += estimateElementArea(element);
      } else {
        // Check if this element has no fill defined (defaults to black)
        const fill = getElementFill(element, null);
        if (fill === null) {
          // Element has no fill, defaults to black
          defaultBlackCount++;
          defaultBlackArea += estimateElementArea(element);
        } else if (fill !== 'none') {
          // Element has inline fill - check if we need to track it
          // For now, we focus on the CSS classes approach
          // But we could add inline colors to a separate tracking if needed
        }
      }
    }

    // Recursively traverse child elements
    for (let i = 0; i < element.children.length; i++) {
      traverseElement(element.children[i]);
    }
  }

  // Start traversal from the root SVG element
  if (svgDoc) {
    traverseElement(svgDoc);
  }

  // If there are elements that default to black, add a pseudo-class entry
  if (defaultBlackCount > 0) {
    classMap.set('__default_black__', {
      className: '__default_black__',
      color: '#000000',
      elementCount: defaultBlackCount,
      totalArea: defaultBlackArea
    });
    debugLog(`Found ${defaultBlackCount} elements defaulting to black with total area ${defaultBlackArea}`);
  }

  // Convert Map to Array and calculate dominance score
  const classArray = Array.from(classMap.values())
    .filter(classInfo => classInfo.elementCount > 0) // Only include classes that are actually used
    .map(classInfo => {
      // Dominance = weighted combination of element count and total area
      // Normalize by giving more weight to area (70%) than count (30%)
      classInfo.dominance = (classInfo.totalArea * 0.7) + (classInfo.elementCount * 100 * 0.3);
      return classInfo;
    });

  // Sort alphabetically by className for consistent ordering across pages
  // This ensures colors are always mapped the same way
  classArray.sort((a, b) => a.className.localeCompare(b.className));

  console.log('✅ Detected SVG classes (alphabetically sorted):', classArray.map(c => c.className));
  debugLog('Detected SVG classes by className:', classArray);

  return classArray;
}

// Make function available globally for use in other scripts
window.detectUniqueColors = detectUniqueColors;

/**
 * Populates the color-selection-group with dynamic color pickers based on detected SVG classes
 * @param {Array<Object>} classArray - Array of class info objects with {className, color, dominance, elementCount}
 */
function populateColorPickers(classArray) {
  debugLog('🎨 populateColorPickers() called with:', classArray);
  const colorGroup = document.getElementById('color-selection-group');
  if (!colorGroup) {
    console.warn('color-selection-group element not found');
    return;
  }

  // Clear existing color pickers
  colorGroup.innerHTML = '';

  // Store class information for mapping (used when updating SVG)
  window.currentSVGClassMap = {};

  // Generate color picker for each detected class
  classArray.forEach((classInfo, index) => {
    const pickerId = `svg-class-${index}`;

    // Store class information
    window.currentSVGClassMap[pickerId] = {
      className: classInfo.className,
      originalColor: classInfo.color
    };

    // Create color option item
    const colorItem = document.createElement('div');
    colorItem.className = 'color-option-item';

    // Create color input
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.id = pickerId;
    colorInput.className = 'color-picker-input';
    colorInput.value = classInfo.color;
    colorInput.dataset.className = classInfo.className; // Store class name (st0, st2, etc.)
    colorInput.dataset.colorIndex = `color${index + 1}`; // Store color index (color1, color2, etc.)
    colorInput.dataset.originalColor = classInfo.color; // Store original color

    // Create label with user-friendly name
    const label = document.createElement('label');
    label.htmlFor = pickerId;
    label.className = 'color-label-text';

    // Use "Color 1", "Color 2" instead of "ST0", "ST2"
    const colorLabel = `Color ${index + 1}`;

    const labelTextEn = document.createElement('span');
    labelTextEn.setAttribute('data-en', '');
    labelTextEn.textContent = colorLabel;

    const labelTextFr = document.createElement('span');
    labelTextFr.setAttribute('data-fr', '');
    labelTextFr.textContent = colorLabel;

    label.appendChild(labelTextEn);
    label.appendChild(labelTextFr);

    // Color update handler (shared by both events)
    const handleColorUpdate = (e) => {
      const className = e.target.dataset.className;
      const newColor = e.target.value;

      // Update the SVG color by class
      updateSVGColorByClass(className, newColor);
    };

    // Real-time updates while dragging (input event)
    colorInput.addEventListener('input', handleColorUpdate);

    // Final update when color picker closes (change event)
    colorInput.addEventListener('change', (e) => {
      const className = e.target.dataset.className;
      const oldColor = e.target.dataset.originalColor;
      const newColor = e.target.value;

      console.log(`Color change for class "${className}": ${oldColor} → ${newColor}`);

      // Update the stored original color to the new color
      e.target.dataset.originalColor = newColor;
      window.currentSVGClassMap[pickerId].originalColor = newColor;
    });

    // Append elements
    colorItem.appendChild(colorInput);
    colorItem.appendChild(label);
    colorGroup.appendChild(colorItem);
  });

  // Show the color group if it has classes
  if (classArray.length > 0) {
    colorGroup.style.display = 'flex';
  }

  // Dispatch event to signal color pickers are ready
  debugLog('📢 Dispatching colorPickersReady event');
  window.dispatchEvent(new CustomEvent('colorPickersReady', {
    detail: { colorCount: classArray.length }
  }));
  debugLog('✅ colorPickersReady event dispatched');
}

/**
 * Updates all instances of an SVG class to a new color (HYBRID APPROACH)
 * Modifies the hidden SVG DOM, then triggers re-rasterization
 * @param {string} className - The SVG class name (e.g., "st0", "st2")
 * @param {string} newColor - The new color (hex format)
 * @param {boolean} skipRasterize - If true, skip the re-rasterization (useful for batching updates)
 */
function updateSVGColorByClass(className, newColor, skipRasterize = false) {
  // Access the hidden SVG element
  const svgElement = window.jerseyViewer?.currentSVGElement;

  if (!svgElement) {
    console.warn('No SVG element available for color editing');
    return;
  }

  debugLog(`Updating class "${className}" to color: ${newColor}`);

  // Special handling for __default_black__ pseudo-class
  // This class represents elements without any fill that default to black
  if (className === '__default_black__') {
    const shapeElements = ['path', 'polygon', 'rect', 'circle', 'ellipse', 'line', 'polyline'];
    let updatedCount = 0;

    // Helper to check if element was originally a default-black element
    // or if it has no fill defined (for first-time detection)
    function isDefaultBlackElement(element) {
      // Check if already marked as default-black (from previous update)
      if (element.hasAttribute('data-default-black')) {
        return true;
      }

      // First-time check: element has no fill defined at all
      // Check inline fill attribute
      if (element.hasAttribute('fill') && element.getAttribute('fill') !== '') {
        return false;
      }

      // Check inline style with fill
      const style = element.getAttribute('style');
      if (style && /fill\s*:/i.test(style)) {
        return false;
      }

      // Check if element has a class with fill defined in stylesheet
      const classAttr = element.getAttribute('class');
      if (classAttr) {
        const styleElement = svgElement.querySelector('style');
        if (styleElement) {
          const cssContent = styleElement.textContent;
          const fillRegex = new RegExp(`\\.${classAttr}\\s*\\{[^}]*fill\\s*:`);
          if (fillRegex.test(cssContent)) {
            return false;
          }
        }
      }

      // No fill defined - this is a default black element
      return true;
    }

    // Traverse and update elements with no fill defined
    function updateDefaultBlackElements(element) {
      const tagName = element.tagName ? element.tagName.toLowerCase() : '';

      if (shapeElements.includes(tagName)) {
        if (isDefaultBlackElement(element)) {
          element.setAttribute('fill', newColor);
          // Mark this element so we can find it again on subsequent updates
          element.setAttribute('data-default-black', 'true');
          updatedCount++;
        }
      }

      // Recursively process children
      for (let i = 0; i < element.children.length; i++) {
        updateDefaultBlackElements(element.children[i]);
      }
    }

    updateDefaultBlackElements(svgElement);
    debugLog(`Updated ${updatedCount} elements with default black fill to ${newColor}`);

    // Trigger re-rasterization unless skipped (for batching)
    if (!skipRasterize) {
      if (window.jerseyViewer && window.jerseyViewer.rasterizeAndLoadSVG) {
        debugLog('Re-rasterizing SVG with new colors...');
        window.jerseyViewer.rasterizeAndLoadSVG();
      } else {
        console.warn('rasterizeAndLoadSVG method not available');
      }
    }
    return;
  }

  // Standard handling for CSS class-based colors
  // Find and update the style block
  const styleElement = svgElement.querySelector('style');

  if (!styleElement) {
    console.warn('No style element found in SVG');
    return;
  }

  // Get current CSS content
  let cssContent = styleElement.textContent;

  // Update the fill color for this class
  // Match patterns like: .st0{...fill:#FFD700...} or .st2{fill:#2698D1;...}
  const classRegex = new RegExp(`(\\.${className}\\s*\\{[^}]*fill:\\s*)([#a-fA-F0-9]+)([^}]*\\})`, 'g');

  const updatedCSS = cssContent.replace(classRegex, (match, before, oldColor, after) => {
    debugLog(`  Replacing ${oldColor} with ${newColor} in class .${className}`);
    return before + newColor + after;
  });

  // Update the style element
  styleElement.textContent = updatedCSS;

  // Trigger re-rasterization unless skipped (for batching)
  if (!skipRasterize) {
    if (window.jerseyViewer && window.jerseyViewer.rasterizeAndLoadSVG) {
      debugLog('Re-rasterizing SVG with new colors...');
      window.jerseyViewer.rasterizeAndLoadSVG();
    } else {
      console.warn('rasterizeAndLoadSVG method not available');
    }
  }
}

// Make function available globally for use in share page
window.updateSVGColorByClass = updateSVGColorByClass;

/**
 * Captures the current design colors from the color pickers
 * @returns {Array<string>} Array of hex color strings (e.g., ["#FFD700", "#2698D1"])
 */
function captureCurrentDesignColors() {
  const colors = [];

  // Get all color pickers in order
  const colorPickers = document.querySelectorAll('#color-selection-group .color-picker-input');

  colorPickers.forEach(picker => {
    colors.push(picker.value); // Hex color like "#FFD700"
  });

  console.log(`📸 Capturing ${colorPickers.length} color pickers, got ${colors.length} colors:`, colors);
  debugLog(`📸 Captured ${colors.length} design colors:`, colors);
  return colors;
}

/**
 * Restores saved design colors to the SVG and updates the UI
 * @param {Array<string>} designColors - Array of hex color strings
 */
function restoreDesignColors(designColors) {
  console.log('🎨 restoreDesignColors() called with:', designColors);
  debugLog('🎨 restoreDesignColors() called with:', designColors);

  if (!designColors || designColors.length === 0) {
    console.warn('⚠️ No design colors to restore (empty or null)');
    debugLog('⚠️ No design colors to restore (empty or null)');
    debugLog('No design colors to restore');
    return;
  }

  if (!window.currentSVGClassMap) {
    console.warn('⚠️ No SVG class map available, cannot restore colors');
    debugLog('⚠️ No SVG class map available, cannot restore colors');
    debugLog('⚠️ No SVG class map available, cannot restore colors');
    return;
  }

  console.log(`🎨 Restoring ${designColors.length} design colors...`);
  debugLog(`🎨 Restoring ${designColors.length} design colors...`);
  debugLog(`🎨 Restoring ${designColors.length} design colors...`);

  // Get all color pickers in order
  const colorPickers = document.querySelectorAll('#color-selection-group .color-picker-input');
  console.log(`🔍 Found ${colorPickers.length} color pickers to update`);
  debugLog(`🔍 Found ${colorPickers.length} color pickers to update`);

  // Apply each saved color (batch updates by skipping rasterization until the last one)
  const validColorCount = Math.min(colorPickers.length, designColors.length);

  colorPickers.forEach((picker, index) => {
    if (index < designColors.length) {
      const savedColor = designColors[index];
      const className = picker.dataset.className;
      const isLastColor = (index === validColorCount - 1);

      console.log(`  🎨 Restoring color ${index + 1}: ${savedColor} to class ${className}`);
      debugLog(`  Restoring color ${index}: ${savedColor} to class ${className}`);

      if (className && savedColor) {
        // Update the SVG color (skip rasterization for all but the last)
        updateSVGColorByClass(className, savedColor, !isLastColor);

        // Update the color picker UI
        picker.value = savedColor;
        picker.dataset.originalColor = savedColor;

        // Update the stored class map
        const pickerId = picker.id;
        if (window.currentSVGClassMap[pickerId]) {
          window.currentSVGClassMap[pickerId].originalColor = savedColor;
        }

        debugLog(`  ✓ Restored ${className}: ${savedColor}`);
        debugLog(`  ✓ Restored ${className}: ${savedColor}`);
      }
    }
  });

  debugLog(`✅ Design colors restored successfully`);
  debugLog(`✅ Design colors restored successfully`);
}

// Make functions available globally
window.captureCurrentDesignColors = captureCurrentDesignColors;
window.restoreDesignColors = restoreDesignColors;

/**
 * Updates all instances of a color in the current SVG (via Fabric.js canvas)
 * @param {string} oldColor - The color to replace (hex format)
 * @param {string} newColor - The new color (hex format)
 */
function updateSVGColor(oldColor, newColor) {
  // Access the Jersey Viewer instance
  if (!window.jerseyViewer || !window.jerseyViewer.partCanvases) {
    console.warn('Jersey Viewer or Fabric.js canvases not available');
    return;
  }

  const partCanvases = window.jerseyViewer.partCanvases;
  let updated = false;

  // Normalize colors for comparison
  const normalizeForComparison = (color) => {
    if (!color) return null;
    return color.toLowerCase().replace(/\s/g, '');
  };

  const oldColorNormalized = normalizeForComparison(oldColor);
  const newColorNormalized = normalizeForComparison(newColor);

  console.log(`Updating color across all parts: ${oldColor} → ${newColor}`);

  // Iterate through all part canvases (front, back, sleeves, etc.)
  Object.entries(partCanvases).forEach(([partName, canvas]) => {
    if (!canvas) return;

    let partUpdated = false;

    // Iterate through all objects on this canvas
    canvas.getObjects().forEach(obj => {
      // Handle groups (SVG groups)
      if (obj.type === 'group') {
        obj.getObjects().forEach(subObj => {
          if (updateObjectColor(subObj, oldColorNormalized, newColorNormalized)) {
            partUpdated = true;
            updated = true;
          }
        });
      } else {
        if (updateObjectColor(obj, oldColorNormalized, newColorNormalized)) {
          partUpdated = true;
          updated = true;
        }
      }
    });

    // Re-render this canvas if it was updated
    if (partUpdated) {
      canvas.renderAll();
      console.log(`✓ Updated colors on ${partName}`);

      // Update the texture for this part
      if (window.jerseyViewer.updateTexture) {
        window.jerseyViewer.updateTexture(partName);
      }
    }
  });

  if (updated) {
    console.log('✓ Color update complete');
  } else {
    console.log('⚠ No objects found with the old color');
  }
}

/**
 * Helper function to update color properties of a Fabric.js object
 * @param {fabric.Object} obj - Fabric.js object
 * @param {string} oldColor - Old color (normalized)
 * @param {string} newColor - New color (normalized)
 * @returns {boolean} - Whether the object was updated
 */
function updateObjectColor(obj, oldColor, newColor) {
  let updated = false;
  const normalizeForComparison = (color) => {
    if (!color) return null;
    return color.toLowerCase().replace(/\s/g, '');
  };

  // Check and update fill
  if (obj.fill && normalizeForComparison(obj.fill) === oldColor) {
    obj.set('fill', newColor);
    updated = true;
  }

  // Check and update stroke
  if (obj.stroke && normalizeForComparison(obj.stroke) === oldColor) {
    obj.set('stroke', newColor);
    updated = true;
  }

  // For path objects, check individual path colors
  if (obj.type === 'path' && obj.path) {
    // Fabric.js paths might have colors in their path data
    // This is handled by fill and stroke above
  }

  return updated;
}

// Make functions available globally
window.populateColorPickers = populateColorPickers;
window.updateSVGColor = updateSVGColor;

// ==================== SAVE FUNCTIONALITY - CONFIGURATION COLLECTION ====================
// Step 1: Configuration Collection Functions (Placeholder)
function getJerseyConfiguration() {
  // Placeholder data structure for testing
  // Will be replaced with actual data collection later
  return {
    designs: {
      family: currentFamily || "graphic",
      svgPath: currentDesign || "../designs/svg/graphic/aurora/round_reglan_aurora.svg",
      selectedPart: document.getElementById('jersey-part-select')?.value || "front",
      ribbedCollar: document.getElementById('ribbed-collar-checkbox-designs')?.checked ||
        document.getElementById('ribbed-collar-checkbox')?.checked || false,
      designColors: (() => {
        const colors = captureCurrentDesignColors();
        debugLog('🔍 getJerseyConfiguration() - designColors set to:', colors);
        return colors;
      })(), // Capture current SVG design colors
      logo: {
        url: "", // Will be populated from logo upload
        scale: parseFloat(document.getElementById('logo-scale')?.value || 1),
        rotation: parseInt(document.getElementById('logo-rotate')?.value || 0)
      },
      colors: {
        color1: document.getElementById('jersey-color-1')?.value || "#3e7bb3",
        color2: document.getElementById('jersey-color-2')?.value || "#ffffff",
        color3: document.getElementById('jersey-color-3')?.value || "#1a1f36"
      }
    },
    colorsStripes: {
      selectedPart: document.getElementById('jersey-part-select-colors')?.value || "front",
      partColor: document.getElementById('jersey-part-color')?.value || "#ffffff",
      ribbedCollar: document.getElementById('ribbed-collar-checkbox-colors')?.checked || true,
      stripeOrientation: document.querySelector('input[name="jersey-orientation"]:checked')?.value || "horizontal",
      stripes: {
        tab1: {
          count: parseInt(document.getElementById('jersey-stripes-select-tab1')?.value || 1),
          color: document.getElementById('jersey-stripes-color-tab1')?.value || "#eaeef1",
          position: parseFloat(document.getElementById('jersey-stripes-position-tab1')?.value || 5),
          gap: parseInt(document.getElementById('jersey-stripes-gap-tab1')?.value || 10),
          thickness: parseInt(document.getElementById('jersey-stripes-thickness-tab1')?.value || 5)
        },
        tab2: {
          count: parseInt(document.getElementById('jersey-stripes-select-tab2')?.value || 0),
          color: document.getElementById('jersey-stripes-color-tab2')?.value || "#eaeef1",
          position: parseFloat(document.getElementById('jersey-stripes-position-tab2')?.value || 0),
          gap: parseInt(document.getElementById('jersey-stripes-gap-tab2')?.value || 10),
          thickness: parseInt(document.getElementById('jersey-stripes-thickness-tab2')?.value || 5)
        },
        tab3: {
          count: parseInt(document.getElementById('jersey-stripes-select-tab3')?.value || 0),
          color: document.getElementById('jersey-stripes-color-tab3')?.value || "#eaeef1",
          position: parseFloat(document.getElementById('jersey-stripes-position-tab3')?.value || 0),
          gap: parseInt(document.getElementById('jersey-stripes-gap-tab3')?.value || 10),
          thickness: parseInt(document.getElementById('jersey-stripes-thickness-tab3')?.value || 5)
        },
        tab4: {
          count: parseInt(document.getElementById('jersey-stripes-select-tab4')?.value || 0),
          color: document.getElementById('jersey-stripes-color-tab4')?.value || "#eaeef1",
          position: parseFloat(document.getElementById('jersey-stripes-position-tab4')?.value || 0),
          gap: parseInt(document.getElementById('jersey-stripes-gap-tab4')?.value || 10),
          thickness: parseInt(document.getElementById('jersey-stripes-thickness-tab4')?.value || 5)
        }
      },
      logo: {
        url: "", // Will be populated from logo upload
        scale: parseFloat(document.getElementById('logo-scale-colors')?.value || 1),
        rotation: parseInt(document.getElementById('logo-rotate-colors')?.value || 0)
      }
    }
  };
}

function saveJerseyConfiguration() {
  const config = getJerseyConfiguration();
  localStorage.setItem('jerseyConfig', JSON.stringify(config));
  console.log('Jersey configuration saved to localStorage:', config);
}

// ==================== SAVE FUNCTIONALITY - THUMBNAIL HANDLING (PLACEHOLDER) ====================
// Step 2: Thumbnail Handling (Placeholder)
async function fetchPlaceholderThumbnail() {
  try {
    const response = await fetch('../images/jersey.webp');
    if (!response.ok) {
      throw new Error('Failed to fetch placeholder image');
    }
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error fetching placeholder thumbnail:', error);
    // Fallback: create a simple colored blob
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e1e7ec';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.9));
  }
}

// ==================== SAVE FUNCTIONALITY - SAVE MODAL ====================
// Step 3: Save Modal Implementation
const designSaveModal = document.querySelector('.design-save-modal');
const designSaveConfirmBtn = document.getElementById('design-save-confirm-btn');
const designSaveCancelBtn = document.querySelector('.design-save-cancel-btn');
const newDesignNameInput = document.getElementById('newDesignName');
const charCountElement = document.querySelector('.design-save-char-count');

async function showDesignSaveModal() {
  const designSaveModal = document.querySelector('.design-save-modal');
  const newDesignNameInput = document.getElementById('newDesignName');
  const designPreview = document.getElementById('design-save-preview');

  if (designSaveModal) {
    designSaveModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  }

  if (newDesignNameInput) {
    newDesignNameInput.value = ''; // Clear input when opening
    newDesignNameInput.focus();
  }

  // Generate and display the design preview
  if (designPreview) {
    try {
      // Try to use takeScreenshot if available, otherwise use placeholder
      if (window.takeScreenshot) {
        const thumbnailBlob = await window.takeScreenshot();
        const thumbnailUrl = URL.createObjectURL(thumbnailBlob);
        designPreview.style.backgroundImage = `url('${thumbnailUrl}')`;
        designPreview.style.backgroundSize = 'cover';
        designPreview.style.backgroundPosition = 'center';
        designPreview.style.display = 'block';
        // Store URL for cleanup
        window.lastThumbnailUrl = thumbnailUrl;
      } else {
        // Fallback to placeholder image
        const placeholderUrl = '../images/jersey.webp';
        designPreview.style.backgroundImage = `url('${placeholderUrl}')`;
        designPreview.style.backgroundSize = 'cover';
        designPreview.style.backgroundPosition = 'center';
        designPreview.style.display = 'block';
      }
    } catch (error) {
      console.error('Error generating design preview:', error);
      designPreview.style.display = 'none'; // Hide the preview if there's an error
    }
  }

  updateCharCount(); // Make sure this function is defined elsewhere
}

function hideDesignSaveModal() {
  const designSaveModal = document.querySelector('.design-save-modal');
  const newDesignNameInput = document.getElementById('newDesignName');
  const designPreview = document.getElementById('design-save-preview');

  if (designSaveModal) {
    designSaveModal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling when modal is closed
  }

  if (newDesignNameInput) {
    newDesignNameInput.value = ''; // Clear input when closing
  }

  // Remove the background image from the design preview
  if (designPreview) {
    designPreview.style.backgroundImage = 'none';
    designPreview.style.backgroundSize = '';
    designPreview.style.backgroundPosition = '';
  }

  // If a temporary URL was created for the thumbnail, revoke it to free up memory
  if (window.lastThumbnailUrl) {
    URL.revokeObjectURL(window.lastThumbnailUrl);
    window.lastThumbnailUrl = null;
  }
}

function updateCharCount() {
  if (newDesignNameInput && charCountElement) {
    const currentLength = newDesignNameInput.value.length;
    charCountElement.textContent = `${currentLength} / 30`;
    if (designSaveConfirmBtn) {
      designSaveConfirmBtn.disabled = currentLength === 0 || currentLength > 30;
    }
  }
}

// Event listeners for modal
if (newDesignNameInput) {
  newDesignNameInput.addEventListener('input', updateCharCount);
}

if (designSaveCancelBtn) {
  designSaveCancelBtn.addEventListener('click', () => {
    hideDesignSaveModal();
  });
}

// Close modal when clicking outside
if (designSaveModal) {
  designSaveModal.addEventListener('click', (e) => {
    if (e.target === designSaveModal || e.target.classList.contains('design-save-overlay')) {
      hideDesignSaveModal();
    }
  });
}

// Prevent closing when clicking inside the modal content
const modalContent = document.querySelector('.design-save-content');
if (modalContent) {
  modalContent.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// ==================== SAVE FUNCTIONALITY - SAVE FUNCTIONS ====================
// Step 4: Save Functions

// Helper function to get translation
function getTranslation(key, lang = 'en') {
  // Use window.getTranslation if available (from auth.js), but prevent recursion
  if (window.getTranslation && window.getTranslation !== getTranslation) {
    return window.getTranslation(key, lang);
  }
  // Fallback translations
  const translations = {
    'saving': { en: 'Saving...', fr: 'Enregistrement...' },
    'save': { en: 'Save', fr: 'Enregistrer' },
    'no_user_logged_in': { en: 'Please log in to save your design', fr: 'Veuillez vous connecter pour enregistrer votre design' },
    'design_name_exists': { en: 'A design with this name already exists', fr: 'Un design avec ce nom existe déjà' },
    'design_saved_successfully': { en: 'Design saved successfully', fr: 'Design enregistré avec succès' },
    'error_saving_design': { en: 'Error saving design', fr: 'Erreur lors de l\'enregistrement du design' },
    'file_name_exists': { en: 'A file with this name already exists', fr: 'Un fichier avec ce nom existe déjà' },
    'error_uploading_thumbnail': { en: 'Error uploading thumbnail', fr: 'Erreur lors du téléchargement de la miniature' },
    'enter_design_name': { en: 'Please enter a design name', fr: 'Veuillez entrer un nom de design' },
    'error_saving_design': { en: 'Error saving design', fr: 'Erreur lors de l\'enregistrement du design' },
    'error_updating_design': { en: 'Error updating design', fr: 'Erreur lors de la mise à jour du design' },
    'enter_design_name': { en: 'Please enter a design name', fr: 'Veuillez entrer un nom de design' },
    'design_saved_successfully': { en: 'Design saved successfully', fr: 'Design enregistré avec succès' },
    'design_updated_successfully': { en: 'Design updated successfully', fr: 'Design mis à jour avec succès' },
    'unsaved_changes_warning': { en: 'You have unsaved changes. Save before leaving?', fr: 'Vous avez des modifications non enregistrées. Enregistrez avant de quitter ?' },
    'unsaved_stay': { en: 'Stay', fr: 'Rester' },
    'unsaved_leave': { en: 'Leave', fr: 'Quitter' }
  };
  return translations[key] ? (translations[key][lang] || translations[key]['en']) : key;
}

// Check if design name already exists
async function checkDesignNameExists(designName) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('Supabase client not available');
      return false;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .from('user_files')
      .select('id')
      .eq('owner', user.id)
      .eq('design_name', designName)
      .limit(1);

    if (error) throw error;
    return data.length > 0;
  } catch (error) {
    console.error('Error checking design name:', error);
    return false;
  }
}

// Upload thumbnail and save design
async function uploadThumbnailAndSaveDesign(designName) {
  try {
    if (window.showLoading) window.showLoading();

    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
      if (window.hideLoading) window.hideLoading();
      return {
        success: false,
        message: getTranslation('no_user_logged_in', localStorage.getItem('language') || 'en')
      };
    }

    const designExists = await checkDesignNameExists(designName);
    if (designExists) {
      if (window.hideLoading) window.hideLoading();
      return {
        success: false,
        message: getTranslation('design_name_exists', localStorage.getItem('language') || 'en')
      };
    }

    const userId = user.id;
    const thumbnailName = `jersey_${designName.replace(/\s+/g, '_')}_thumb.webp`;
    const userFolderPath = `${userId}/thumb/${thumbnailName}`;

    // Take screenshot for thumbnail
    let thumbnailBlob;
    if (window.takeScreenshot) {
      thumbnailBlob = await window.takeScreenshot();
    } else {
      // Fallback to placeholder if takeScreenshot not available
      thumbnailBlob = await fetchPlaceholderThumbnail();
    }

    // Upload the thumbnail to the user's folder
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public-bucket')
      .upload(userFolderPath, thumbnailBlob, {
        contentType: 'image/webp',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      if (uploadError.statusCode === 409) {
        if (window.hideLoading) window.hideLoading();
        return {
          success: false,
          message: getTranslation('file_name_exists', localStorage.getItem('language') || 'en')
        };
      } else {
        console.warn('Non-blocking error during upload:', uploadError);
        // If upload failed completely, we can't proceed
        if (window.hideLoading) window.hideLoading();
        return {
          success: false,
          message: getTranslation('error_uploading_thumbnail', localStorage.getItem('language') || 'en') || 'Error uploading thumbnail'
        };
      }
    }

    // Wait for the user_files entry to be created by the trigger (retry mechanism)
    let fileEntry = null;
    console.log('Waiting for trigger to create user_files entry for:', userFolderPath);

    // First, verify the file was uploaded to storage
    const { data: storageCheck, error: storageError } = await supabase.storage
      .from('public-bucket')
      .list(`${userId}/thumb`, {
        search: thumbnailName
      });

    if (storageError) {
      console.error('Error checking storage:', storageError);
    } else {
      console.log('Storage check result:', storageCheck);
    }

    for (let i = 0; i < 10; i++) {
      // Wait before first check, then between retries
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const { data, error } = await supabase
        .from('user_files')
        .select('*')
        .eq('name', userFolderPath)
        .eq('bucket_id', 'public-bucket')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error(`Error fetching file entry (attempt ${i + 1}):`, error);
      } else if (data && data.length > 0) {
        console.log('File entry found on attempt', i + 1, ':', data[0]);
        fileEntry = data[0];
        break;
      } else {
        console.log(`File entry not found yet (attempt ${i + 1}/10)`);
      }
    }

    if (!fileEntry) {
      // Trigger didn't fire - manually create the entry as fallback
      console.warn('Trigger did not create entry, creating manually as fallback');

      // Verify file exists in storage first
      const { data: storageFiles, error: storageListError } = await supabase.storage
        .from('public-bucket')
        .list(`${userId}/thumb`, {
          search: thumbnailName
        });

      if (storageListError) {
        console.error('Error checking storage:', storageListError);
      }

      // Get file metadata from storage - use the search result we already have
      let uploadedFile = storageFiles?.find(f => f.name === thumbnailName);

      if (!uploadedFile) {
        // Try without search filter to get all files
        const { data: allFiles } = await supabase.storage
          .from('public-bucket')
          .list(`${userId}/thumb`);
        uploadedFile = allFiles?.find(f => f.name === thumbnailName);
      }

      if (!uploadedFile) {
        console.error('File not found in storage list. Files found:', storageFiles);
        if (window.hideLoading) window.hideLoading();
        throw new Error('File was not uploaded to storage');
      }

      // Manually create the user_files entry
      const now = new Date().toISOString();
      const { data: manualEntry, error: insertError } = await supabase
        .from('user_files')
        .insert({
          owner: userId,
          bucket_id: 'public-bucket',
          name: userFolderPath,
          created_at: uploadedFile.created_at || now,
          updated_at: uploadedFile.updated_at || now,
          last_accessed_at: now,
          metadata: uploadedFile.metadata || {},
          user_metadata: {}
        })
        .select()
        .single();

      if (insertError) {
        // If it's a conflict, try to get the existing entry
        if (insertError.code === '23505') {
          const { data: existingEntry } = await supabase
            .from('user_files')
            .select('*')
            .eq('name', userFolderPath)
            .eq('bucket_id', 'public-bucket')
            .single();

          if (existingEntry) {
            fileEntry = existingEntry;
            console.log('Found existing entry after conflict:', fileEntry);
          } else {
            if (window.hideLoading) window.hideLoading();
            throw new Error('Failed to create or find file entry: ' + insertError.message);
          }
        } else {
          if (window.hideLoading) window.hideLoading();
          throw new Error('Failed to create file entry: ' + insertError.message);
        }
      } else {
        fileEntry = manualEntry;
        console.log('Manually created file entry:', fileEntry);
      }
    }

    if (!fileEntry) {
      if (window.hideLoading) window.hideLoading();
      throw new Error('File entry not found after multiple attempts and manual creation failed');
    }

    // Get configuration
    const configJSON = getJerseyConfiguration();

    // Update the user_files entry with design name and metadata
    const { data: updateData, error: updateError } = await supabase
      .from('user_files')
      .update({
        design_name: designName,
        design_metadata: configJSON,
        product_type: 'jersey'
      })
      .eq('id', fileEntry.id);

    if (updateError) throw updateError;

    currentDesignName = designName;
    currentDesignId = fileEntry.id;

    // Get the public URL of the uploaded thumbnail
    const { data: urlData } = supabase.storage
      .from('public-bucket')
      .getPublicUrl(userFolderPath);

    const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;
    updateUIAfterSave(publicUrl);

    isInitialSave = false;
    console.log('Design saved successfully');
    if (window.hideLoading) window.hideLoading();
    setDesignClean();
    return {
      success: true,
      message: getTranslation('design_saved_successfully', localStorage.getItem('language') || 'en')
    };
  } catch (error) {
    console.error('Error saving design:', error);
    if (window.hideLoading) window.hideLoading();
    return {
      success: false,
      message: getTranslation('error_saving_design', localStorage.getItem('language') || 'en')
    };
  }
}

// Update existing design
async function updateExistingDesign(designId, designName) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        message: getTranslation('no_user_logged_in', localStorage.getItem('language') || 'en')
      };
    }

    // Take screenshot for thumbnail
    let thumbnailBlob;
    if (window.takeScreenshot) {
      thumbnailBlob = await window.takeScreenshot();
    } else {
      // Fallback to placeholder if takeScreenshot not available
      thumbnailBlob = await fetchPlaceholderThumbnail();
    }

    // Prepare the thumbnail file name
    const thumbnailName = `jersey_${designName.replace(/\s+/g, '_')}_thumb.webp`;
    const userFolderPath = `${user.id}/thumb/${thumbnailName}`;

    // Update the thumbnail in the bucket (overwrite)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public-bucket')
      .upload(userFolderPath, thumbnailBlob, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      console.error('Thumbnail update error:', uploadError);
      // Continue with the update even if thumbnail upload fails
    }

    // Get the public URL of the updated thumbnail
    const { data: urlData } = supabase.storage
      .from('public-bucket')
      .getPublicUrl(userFolderPath);

    const publicUrl = urlData.publicUrl;

    // Get the current design data (placeholder structure)
    const configJSON = getJerseyConfiguration();

    // Prepare the update data
    const designUpdateData = {
      design_metadata: configJSON,
    };

    // If it's a shared design, update the owner
    if (isSharedDesign) {
      designUpdateData.owner = user.id;
    }

    // Update the user_files entry
    const { data, error: updateError } = await supabase
      .from('user_files')
      .update(designUpdateData)
      .eq('id', designId);

    if (updateError) throw updateError;

    console.log('Design updated successfully');
    setDesignClean();
    return {
      success: true,
      message: getTranslation('design_updated_successfully', localStorage.getItem('language') || 'en')
    };
  } catch (error) {
    console.error('Error updating design:', error);
    return {
      success: false,
      message: getTranslation('error_updating_design', localStorage.getItem('language') || 'en')
    };
  }
}

// Main save design function
async function saveDesign() {
  if (isSaving) return;
  const mainSaveButton = document.getElementById('main-save-button');
  const saveTextSpan = mainSaveButton?.querySelector('.save-text');

  try {
    isSaving = true;
    const currentLang = localStorage.getItem('language') || 'en';
    if (saveTextSpan) {
      const saveText = saveTextSpan.querySelector('[data-en]');
      if (saveText) saveText.textContent = getTranslation('saving', currentLang);
    }
    if (mainSaveButton) mainSaveButton.disabled = true;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (isSharedDesign || (!isInitialSave && currentDesignName && currentDesignId)) {
      // Check if the design has been ordered
      const { data, error } = await supabase
        .from('user_files')
        .select('order_placed')
        .eq('id', currentDesignId)
        .eq('owner', user.id)
        .single();

      if (error) {
        throw new Error('Error checking design order status');
      }

      if (data && data.order_placed !== 0) {
        if (window.translatedAlert) {
          window.translatedAlert('design_already_placed_error');
        }
        return;
      }

      // If not ordered, proceed with updating the design
      const result = await updateExistingDesign(currentDesignId, currentDesignName);
      if (result.success) {
        displayFeedback(result.message);
      } else {
        throw new Error(result.message);
      }
    } else {
      throw new Error('No existing design to update');
    }
  } catch (error) {
    console.error('Error saving design:', error);
    displayFeedback(error.message, true);
  } finally {
    isSaving = false;
    const currentLang = localStorage.getItem('language') || 'en';
    const mainSaveButton = document.getElementById('main-save-button');
    const saveTextSpan = mainSaveButton?.querySelector('.save-text');
    if (saveTextSpan) {
      const saveText = saveTextSpan.querySelector('[data-en]');
      if (saveText) saveText.textContent = getTranslation('save', currentLang);
    }
    if (mainSaveButton) mainSaveButton.disabled = false;
  }
}

// Update UI after save
function updateUIAfterSave(thumbnailUrl) {
  const panelTitle = document.querySelector('.panel-title');
  if (panelTitle && currentDesignName) {
    // Update the panel title with the design name, preserving translation structure
    // Let CSS handle visibility based on data-en/data-fr attributes
    panelTitle.innerHTML = `
      <span data-en>${currentDesignName}</span>
      <span data-fr>${currentDesignName}</span>
    `;
    panelTitle.style.display = 'block';
  }

  const designPreview = document.getElementById('design-save-preview');
  if (designPreview) {
    designPreview.style.backgroundImage = `url('${thumbnailUrl}')`;
    designPreview.style.backgroundSize = 'cover';
    designPreview.style.backgroundPosition = 'center';
  }
}

function displayFeedback(messageKey, isError = false, ...args) {
  const currentLang = localStorage.getItem('language') || 'en';
  const feedbackElement = document.getElementById('save-feedback');

  if (feedbackElement) {
    // Get the translated message
    const translatedMessage = getTranslation(messageKey, currentLang);

    // Format the message with any additional arguments
    const formattedMessage = translatedMessage + " " + args.join(" ");

    feedbackElement.textContent = formattedMessage;
    feedbackElement.style.color = isError ? 'red' : 'green';
    feedbackElement.style.display = 'block';

    if (!isError) {
      setTimeout(() => {
        feedbackElement.style.display = 'none';
      }, 2500); // Hide after 2.5 seconds for success messages
    }
  }

  // Prevent modal from closing on error
  if (isError) {
    const modal = document.querySelector('.design-save-modal');
    if (modal) {
      modal.style.display = 'flex';
    }

    // Hide the feedback element after 2.5 seconds
    setTimeout(() => {
      if (feedbackElement) {
        feedbackElement.style.display = 'none';
      }
    }, 2500);
  }
}

// Event listener for design save confirm button
if (designSaveConfirmBtn) {
  designSaveConfirmBtn.addEventListener('click', async () => {
    const designName = newDesignNameInput?.value.trim();
    if (designName) {
      const result = await uploadThumbnailAndSaveDesign(designName);

      if (result.success) {
        displayFeedback(result.message);
        hideDesignSaveModal();
        isInitialSave = false;
      } else {
        displayFeedback(result.message, true);
        if (newDesignNameInput) {
          newDesignNameInput.focus();
        }
      }
    } else {
      displayFeedback('enter_design_name', true);
      if (newDesignNameInput) {
        newDesignNameInput.focus();
      }
    }
  });
}

// Save button click handler
const mainSaveButton = document.getElementById('main-save-button');
if (mainSaveButton) {
  mainSaveButton.addEventListener('click', async () => {
    // Save configuration to localStorage first
    saveJerseyConfiguration();

    // Check if user is logged in
    let isLoggedIn = false;
    if (window.checkUserLoggedIn) {
      isLoggedIn = await window.checkUserLoggedIn();
    } else {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        isLoggedIn = user !== null;
      }
    }

    if (isLoggedIn) {
      if (isSharedDesign || !isInitialSave) {
        await saveDesign();
      } else {
        showDesignSaveModal();
      }
    } else {
      console.log('User not logged in. Please log in to save your design.');
      if (window.showLoginModal) {
        window.showLoginModal();
      }
    }
  });
}

// Handle save as button click
if (saveAsButton) {
  saveAsButton.addEventListener('click', async () => {
    let isLoggedIn = false;
    if (window.checkUserLoggedIn) {
      isLoggedIn = await window.checkUserLoggedIn();
    } else {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        isLoggedIn = user !== null;
      }
    }

    if (isLoggedIn) {
      showDesignSaveModal();
    } else {
      console.log('User not logged in. Please log in to save your design.');
      if (window.showLoginModal) {
        window.showLoginModal();
      }
    }
    if (saveDropdown) {
      saveDropdown.style.display = 'none';
    }
  });
}

// Handle new design button click
if (newDesignButton) {
  newDesignButton.addEventListener('click', () => {
    // Reset state
    currentDesignName = '';
    currentDesignId = null;
    isInitialSave = true;
    isSharedDesign = false;

    // Clear saved jersey configuration
    localStorage.removeItem('jerseyConfig');

    // Get the base URL without query parameters
    const baseUrl = window.location.href.split('?')[0];
    window.location.href = baseUrl;

    if (saveDropdown) {
      saveDropdown.style.display = 'none';
    }
  });
}
// ==================== JERSEY CONFIGURATION SAVE/LOAD SYSTEM ====================

// Save jersey configuration to localStorage
function saveJerseyConfiguration() {
  const config = getJerseyConfiguration();
  localStorage.setItem('jerseyConfig', JSON.stringify(config));
  console.log('Jersey configuration saved:', config);
}

// Get current jersey configuration from UI
function getJerseyConfiguration() {
  // Determine which tab is active
  const activeTabRadio = document.querySelector('input[name="jersey-tab"]:checked');
  const activeTab = activeTabRadio ? activeTabRadio.value : 'designs';

  // Get collar and shoulder from URL parameters (these determine which 3D model is loaded)
  const urlParams = new URLSearchParams(window.location.search);
  const collar = urlParams.get('collar') || 'insert';
  const shoulder = urlParams.get('shoulder') || 'reglan';

  const config = {
    activeTab: activeTab,
    collar: collar,
    shoulder: shoulder,
    ribbedCollar: document.getElementById('ribbed-collar-checkbox-designs')?.checked ||
      document.getElementById('ribbed-collar-checkbox')?.checked ||
      document.getElementById('ribbed-collar-checkbox-colors')?.checked || false
  };

  if (activeTab === 'designs') {
    // Design mode: capture design family, SVG path, and color pickers
    config.design = {
      familyId: currentFamily || null,
      svgPath: currentDesign || null,
      designColors: captureCurrentDesignColors(), // Capture SVG design colors
      colors: {
        color1: document.getElementById('jersey-color-1')?.value || '#3e7bb3',
        color2: document.getElementById('jersey-color-2')?.value || '#ffffff',
        color3: document.getElementById('jersey-color-3')?.value || '#1a1f36'
      }
    };
  } else {
    // Colors & Stripes mode: capture ALL parts' configurations from 3D viewer
    // This ensures we don't lose customizations when switching between parts

    if (window.getStripesConfiguration) {
      // Get complete stripe configuration for all parts from 3D viewer
      config.colorsAndStripes = window.getStripesConfiguration();
      debugLog('📊 Captured stripes configuration from 3D viewer:', config.colorsAndStripes);
    } else {
      // Fallback: capture from current UI state (only current part)
      debugLog('⚠️ getStripesConfiguration not available, using fallback');
      const currentPart = document.getElementById('jersey-part-select-colors')?.value || 'front';
      const orientationRadio = document.querySelector('input[name="jersey-orientation"]:checked');
      const orientation = orientationRadio ? orientationRadio.value : 'horizontal';

      config.colorsAndStripes = {
        [currentPart]: {
          backgroundColor: document.getElementById('jersey-part-color')?.value || '#ffffff',
          stripeOrientation: orientation,
          stripes: {}
        }
      };

      // Capture all 4 stripe layers for current part
      for (let i = 1; i <= 4; i++) {
        const tabId = `tab${i}`;
        const toggle = document.getElementById(`jersey-stripes-toggle-${tabId}`);
        const colorInput = document.getElementById(`jersey-stripes-color-${tabId}`);
        const positionInput = document.getElementById(`jersey-stripes-position-${tabId}`);
        const gapInput = document.getElementById(`jersey-stripes-gap-${tabId}`);
        const thicknessInput = document.getElementById(`jersey-stripes-thickness-${tabId}`);
        const rotationInput = document.getElementById(`jersey-stripes-rotation-${tabId}`);

        // Get default counts from current config
        const currentConfig = window.jerseyViewer?.stripeLayersByPart?.[currentPart]?.[tabId];
        const defaultCounts = currentConfig?.defaultCounts || { horizontal: 4, vertical: 3 };

        config.colorsAndStripes[currentPart].stripes[tabId] = {
          enabled: toggle ? toggle.checked : false,
          color: colorInput ? colorInput.value : '#eaeef1',
          position: positionInput ? parseFloat(positionInput.value) : 5,
          gap: gapInput ? parseInt(gapInput.value) : 10,
          thickness: thicknessInput ? parseInt(thicknessInput.value) : 5,
          rotation: rotationInput ? parseFloat(rotationInput.value) : 0,
          defaultCounts: defaultCounts
        };
      }
    }
  }

  // Capture logo information from the 3D viewer
  if (window.getLogosConfiguration) {
    config.logos = window.getLogosConfiguration();
  } else {
    // Fallback if 3D viewer not initialized yet
    config.logos = {
      front: [],
      back: [],
      'right-sleeve': [],
      'left-sleeve': []
    };
  }

  return config;
}

// Helper functions to show/hide configuration loading overlay
function showConfigLoading() {
  const overlay = document.getElementById('config-loading-overlay');
  const viewerSection = document.querySelector('.viewer-section');
  if (overlay) {
    overlay.style.display = 'flex';
  }
  if (viewerSection) {
    viewerSection.classList.add('loading');
  }
}

function hideConfigLoading() {
  const overlay = document.getElementById('config-loading-overlay');
  const viewerSection = document.querySelector('.viewer-section');
  if (overlay) {
    overlay.style.display = 'none';
  }
  if (viewerSection) {
    viewerSection.classList.remove('loading');
  }
}

// Load jersey configuration from localStorage
function loadJerseyConfiguration(isSavedDesign) {
  const savedConfig = isSavedDesign ? localStorage.getItem('jerseyConfig') : null;

  // When loading a saved design, mark it as clean (no unsaved changes)
  // and set flag to prevent programmatic changes from marking it dirty
  if (isSavedDesign) {
    setDesignClean();
    isLoadingConfig = true; // Prevent marking dirty during loading

    // Store loading state in localStorage (persists across navigation)
    // This helps handle timing issues with async operations
    const loadingState = {
      timestamp: Date.now(),
      designId: currentDesignId || null
    };
    localStorage.setItem('jerseyDesignLoading', JSON.stringify(loadingState));
  }

  if (savedConfig) {
    const config = JSON.parse(savedConfig);

    // Show loading overlay
    // showConfigLoading(); // Temporarily disabled

    console.log('Loading jersey configuration:', config);

    // Update URL parameters with collar and shoulder to ensure correct 3D model loads
    if (config.collar && config.shoulder) {
      const urlParams = new URLSearchParams(window.location.search);
      const currentCollar = urlParams.get('collar') || 'insert';
      const currentShoulder = urlParams.get('shoulder') || 'reglan';

      // Only update URL if parameters have changed (avoid unnecessary reloads)
      if (currentCollar !== config.collar || currentShoulder !== config.shoulder) {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('collar', config.collar);
        currentUrl.searchParams.set('shoulder', config.shoulder);

        // Update URL without reloading the page
        window.history.replaceState({}, '', currentUrl);

        // Notify 3D viewer to reload the model with new parameters
        if (window.jerseyViewer && typeof window.jerseyViewer.loadModel === 'function') {
          const modelPath = getModelPath(config.collar, config.shoulder);
          window.jerseyViewer.loadModel(modelPath);
        }
      }
    }

    // Switch to the correct tab
    // Set flag to prevent initial stripe generation during config load
    if (window.jerseyViewer) {
      window.jerseyViewer.isLoadingConfig = true;
    }

    const tabRadio = document.querySelector(`input[name="jersey-tab"][value="${config.activeTab}"]`);
    if (tabRadio) {
      tabRadio.checked = true;
      tabRadio.dispatchEvent(new Event('change'));
    }

    // Clear flag after tab switch
    if (window.jerseyViewer) {
      window.jerseyViewer.isLoadingConfig = false;
    }

    // Apply saved ribbed collar setting
    if (config.ribbedCollar !== undefined) {
      const ribbedCollarCheckboxes = [
        document.getElementById('ribbed-collar-checkbox-designs'),
        document.getElementById('ribbed-collar-checkbox-colors'),
        document.getElementById('ribbed-collar-checkbox')
      ];

      // Update all checkboxes
      ribbedCollarCheckboxes.forEach(checkbox => {
        if (checkbox) {
          checkbox.checked = config.ribbedCollar;
        }
      });

      // Apply normal map setting to 3D model
      setTimeout(() => {
        if (window.jerseyViewer) {
          window.jerseyViewer.toggleCollarNormalMaps(config.ribbedCollar);
        }
      }, 500); // Wait for 3D model to load
    }

    if (config.activeTab === 'designs' && config.design) {
      // Load design mode configuration
      if (config.design.colors) {
        const color1Input = document.getElementById('jersey-color-1');
        const color2Input = document.getElementById('jersey-color-2');
        const color3Input = document.getElementById('jersey-color-3');

        if (color1Input) color1Input.value = config.design.colors.color1;
        if (color2Input) color2Input.value = config.design.colors.color2;
        if (color3Input) color3Input.value = config.design.colors.color3;
      }

      // Load the design family and SVG
      if (config.design.familyId && config.design.svgPath) {
        // With simplified config, just use the familyId directly
        currentFamily = config.design.familyId;

        // Recalculate the SVG path to ensure correct depth for current page location
        // Extract design ID from the saved path
        const designId = getDesignIdFromSvgPath(config.design.svgPath);
        if (designId && config.collar && config.shoulder) {
          // Recalculate path with correct depth
          currentDesign = getDesignSvgPath(config.design.familyId, designId, config.collar, config.shoulder);
          debugLog(`📐 Recalculated SVG path: ${currentDesign} (was: ${config.design.svgPath})`);
        } else {
          // Fallback to saved path if we can't recalculate
          currentDesign = config.design.svgPath;
          debugLog(`⚠️ Using saved SVG path: ${currentDesign}`);
        }

        // Load the family designs and show customization panel
        setTimeout(() => {
          loadFamilyDesigns(config.design.familyId);
          setTimeout(async () => {
            // Update header to "Family - Design"
            const restoredDesignId = getDesignIdFromSvgPath(config.design.svgPath);
            if (restoredDesignId) {
              familyName.textContent = `${toDisplayName(config.design.familyId)} - ${toDisplayName(restoredDesignId)}`;
            }

            // Check if we have saved design colors
            const hasSavedColors = config.design.designColors && config.design.designColors.length > 0;

            // Always fetch SVG to get class names (use recalculated path)
            debugLog('🔍 Fetching SVG...');
            try {
              const response = await fetch(currentDesign);
              const svgText = await response.text();
              const detectedColors = detectUniqueColors(svgText);

              if (hasSavedColors) {
                // Use saved colors with detected class names
                debugLog('📦 Mapping saved colors to detected classes');
                window.currentSVGColors = detectedColors.map((item, index) => ({
                  className: item.className,
                  color: config.design.designColors[index] || item.color
                }));
                debugLog('✅ Mapped colors:', window.currentSVGColors);
              } else {
                // Use detected colors
                debugLog('🔍 Using detected colors');
                window.currentSVGColors = detectedColors;
              }
              debugLog('✅ SVG processing complete, currentSVGColors set');
            } catch (error) {
              console.error('Error loading SVG:', error);
              window.currentSVGColors = [];
            }

            debugLog('📋 About to call showDesignCustomization()');

            // Set up event listener BEFORE calling showDesignCustomization
            if (hasSavedColors) {
              debugLog('🔧 Setting up colorPickersReady listener');
              const colorRestoreHandler = () => {
                // Wait for SVG to load before restoring colors
                setTimeout(() => {
                  debugLog('🔄 Applying saved colors to SVG...');
                  restoreDesignColors(config.design.designColors);
                  // After colors are restored, mark clean and re-enable dirty tracking
                  // This happens after restoreDesignColors completes (which sets color picker values)
                  if (isSavedDesign) {
                    setDesignClean();
                    isLoadingConfig = false; // Re-enable dirty tracking after color restoration
                    // Remove loading state from localStorage after a delay
                    // This gives time for any delayed events to complete
                    setTimeout(() => {
                      localStorage.removeItem('jerseyDesignLoading');
                    }, 2000);
                  }
                }, 1000); // Wait for SVG to load into hidden container (1s for slower machines)
                window.removeEventListener('colorPickersReady', colorRestoreHandler);
              };
              window.addEventListener('colorPickersReady', colorRestoreHandler);
            } else {
              // If no saved colors, we can reset the flag earlier
              // But still wait a bit to ensure all operations complete
              setTimeout(() => {
                if (isSavedDesign) {
                  setDesignClean();
                  isLoadingConfig = false;
                  // Remove loading state from localStorage after a delay
                  // This gives time for any delayed events to complete
                  setTimeout(() => {
                    localStorage.removeItem('jerseyDesignLoading');
                  }, 2000);
                }
              }, 500);
            }

            showDesignCustomization();
            debugLog('✅ showDesignCustomization() completed');

            // Dispatch the designSelected event to load the SVG on the 3D model (use recalculated path)
            const designSelectedEvent = new CustomEvent('designSelected', {
              detail: { svgPath: currentDesign }
            });
            window.dispatchEvent(designSelectedEvent);

            // Load the 3D configuration (for logos and other settings)
            setTimeout(() => {
              loadJustThe3DConfig(config);
              // Hide canvas loader after all async operations complete
              setTimeout(() => {
                if (window.hideCanvasLoader) window.hideCanvasLoader();
                // Only mark clean here if we don't have saved colors (otherwise it's handled in colorRestoreHandler)
                if (isSavedDesign && !hasSavedColors) {
                  setDesignClean();
                  isLoadingConfig = false; // Re-enable dirty tracking after loading
                  // Remove loading state from localStorage after a delay
                  setTimeout(() => {
                    localStorage.removeItem('jerseyDesignLoading');
                  }, 2000);
                }
              }, 800);
            }, 200);
          }, 100);
        }, 100);
      }
    } else if (config.activeTab === 'colors') {
      // Load colors & stripes mode configuration

      // Load all parts' configurations
      if (config.colorsAndStripes) {
        Object.entries(config.colorsAndStripes).forEach(([partName, partConfig]) => {
          debugLog(`📦 Loading configuration for part: ${partName}`, partConfig);

          // Apply background color to the part's canvas
          if (partConfig.backgroundColor) {
            const fabricCanvas = window.jerseyViewer?.partCanvases[partName];
            if (fabricCanvas) {
              fabricCanvas.backgroundColor = partConfig.backgroundColor;
              fabricCanvas.renderAll();
              window.jerseyViewer.updateTexture(partName);
              debugLog(`✅ Applied background color ${partConfig.backgroundColor} to ${partName}`);
            }
          }

          // Apply stripe orientation FIRST (before regenerating stripes)
          if (partConfig.stripeOrientation && window.jerseyViewer) {
            window.jerseyViewer.stripeOrientationByPart[partName] = partConfig.stripeOrientation;
            debugLog(`✅ Set orientation ${partConfig.stripeOrientation} for ${partName}`);
          }

          // Apply stripe configuration to the part
          if (partConfig.stripes && window.jerseyViewer?.stripeLayersByPart) {
            window.jerseyViewer.stripeLayersByPart[partName] =
              JSON.parse(JSON.stringify(partConfig.stripes));  // Deep copy
            debugLog(`✅ Applied stripe configuration to ${partName}`);

            // Regenerate stripes on the canvas (now uses correct orientation)
            if (window.jerseyViewer.regenerateStripesForPart) {
              window.jerseyViewer.regenerateStripesForPart(partName);
            }
          }
        });

        // Update UI to show the currently selected part's configuration
        const currentPart = document.getElementById('jersey-part-select-colors')?.value || 'front';
        const currentPartConfig = config.colorsAndStripes[currentPart];

        if (currentPartConfig) {
          // Update orientation radio buttons for current part
          if (currentPartConfig.stripeOrientation) {
            const orientationRadio = document.querySelector(
              `input[name="jersey-orientation"][value="${currentPartConfig.stripeOrientation}"]`
            );
            if (orientationRadio) {
              orientationRadio.checked = true;
              debugLog(`🔘 Set radio to ${currentPartConfig.stripeOrientation}`);

              // Dispatch change event to trigger CSS sliding background animation
              orientationRadio.dispatchEvent(new Event('change', { bubbles: true }));

              // Update the visual background position after a short delay to ensure DOM has updated
              setTimeout(() => {
                if (window.updateStripeOrientationBackground) {
                  window.updateStripeOrientationBackground();
                  debugLog(`✅ Updated stripe orientation background for ${currentPartConfig.stripeOrientation}`);
                } else {
                  debugLog(`⚠️ updateStripeOrientationBackground function not available`);
                }
              }, 50);

              debugLog(`✅ Set UI orientation to ${currentPartConfig.stripeOrientation} for current part ${currentPart}`);
            } else {
              debugLog(`⚠️ Could not find orientation radio for ${currentPartConfig.stripeOrientation}`);
            }
          }


          // Update part color input
          const partColorInput = document.getElementById('jersey-part-color');
          if (partColorInput && currentPartConfig.backgroundColor) {
            partColorInput.value = currentPartConfig.backgroundColor;
            partColorInput.dispatchEvent(new Event('input', { bubbles: true }));
          }

          // Update stripe UI controls for current part
          if (currentPartConfig.stripes) {
            for (let i = 1; i <= 4; i++) {
              const tabId = `tab${i}`;
              const layerConfig = currentPartConfig.stripes[tabId];

              if (layerConfig) {
                const toggle = document.getElementById(`jersey-stripes-toggle-${tabId}`);
                const colorInput = document.getElementById(`jersey-stripes-color-${tabId}`);
                const positionInput = document.getElementById(`jersey-stripes-position-${tabId}`);
                const gapInput = document.getElementById(`jersey-stripes-gap-${tabId}`);
                const thicknessInput = document.getElementById(`jersey-stripes-thickness-${tabId}`);

                if (toggle) {
                  toggle.checked = layerConfig.enabled || false;
                  toggle.dispatchEvent(new Event('change'));
                }
                if (colorInput) {
                  colorInput.value = layerConfig.color;
                  colorInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                if (positionInput) {
                  positionInput.value = layerConfig.position;
                  const valueDisplay = positionInput.closest('.settings-group').querySelector('.range-value');
                  if (valueDisplay) valueDisplay.textContent = layerConfig.position;
                }
                if (gapInput) {
                  gapInput.value = layerConfig.gap;
                  const valueDisplay = gapInput.closest('.settings-group').querySelector('.range-value');
                  if (valueDisplay) valueDisplay.textContent = layerConfig.gap;
                }

                // Set thickness
                if (thicknessInput && layerConfig.thickness !== undefined) {
                  thicknessInput.value = layerConfig.thickness;
                  const valueDisplay = thicknessInput.closest('.settings-group').querySelector('.range-value');
                  if (valueDisplay) valueDisplay.textContent = layerConfig.thickness;
                }

                // Set rotation
                const rotationInput = document.getElementById(`jersey-stripes-rotation-${tabId}`);
                if (rotationInput && layerConfig.rotation !== undefined) {
                  rotationInput.value = layerConfig.rotation;
                  const valueDisplay = rotationInput.parentElement.querySelector('.range-value');
                  if (valueDisplay) valueDisplay.textContent = layerConfig.rotation + '°';
                }
              }
            }
          }
        }
      }

      // Load the 3D configuration
      setTimeout(() => {
        loadJustThe3DConfig(config);

        // Hide canvas loader after all async operations complete
        setTimeout(() => {
          if (window.hideCanvasLoader) window.hideCanvasLoader();
          // Mark design as clean after all loading operations complete
          // This ensures that programmatic changes during load don't mark it as dirty
          if (isSavedDesign) {
            setDesignClean();
            isLoadingConfig = false; // Re-enable dirty tracking after loading
            // Remove loading state from localStorage after a delay
            // This gives time for any delayed events (like color restoration) to complete
            setTimeout(() => {
              localStorage.removeItem('jerseyDesignLoading');
            }, 2000);
          }
        }, 800);
      }, 200);
    }
  } else {
    // No saved configuration, load default 3D config
    loadJustThe3DConfig(null);

    // Hide canvas loader after model loads (no design to load)
    setTimeout(() => {
      if (window.hideCanvasLoader) window.hideCanvasLoader();
      // Reset loading flag if it was set
      if (isSavedDesign) {
        isLoadingConfig = false;
        // Remove loading state from localStorage
        setTimeout(() => {
          localStorage.removeItem('jerseyDesignLoading');
        }, 2000);
      }
    }, 1000);
  }
}

// Load just the 3D configuration (calls threeD-script.js)
function loadJustThe3DConfig(config) {
  // Check if the loadInitialConfig function is available from threeD-script.js
  if (window.jerseyViewer && typeof window.jerseyViewer.loadInitialConfig === 'function') {
    window.jerseyViewer.loadInitialConfig(config);
  } else {
    console.warn('jerseyViewer.loadInitialConfig not available yet. Configuration will be applied when viewer is ready.');
    // Store config to be loaded when viewer is ready
    window.pendingJerseyConfig = config;
  }
}

// Detect shared design from URL parameters
async function detectSharedDesign() {
  const urlParams = new URLSearchParams(window.location.search);
  let shortCode = urlParams.get('') || urlParams.get('shortCode');
  const metaData = urlParams.get('metadata');

  if (shortCode) {
    try {
      // Get Supabase client
      let supabase;
      if (window.supabaseClient) {
        supabase = window.supabaseClient;
      } else if (window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(
          'https://jvuibcqogyyffylvfeog.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2dWliY3FvZ3l5ZmZ5bHZmZW9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMjg3MzUsImV4cCI6MjA1MTkwNDczNX0.iIu6f3LwdLmHoHmuVjbuVm-uLCDWA3oGZ7J07wXGBBU'
        );
      }

      if (supabase) {
        const { data, error } = await supabase
          .from('user_files')
          .select('id, design_name, custom_name, design_metadata')
          .eq('short_code', shortCode)
          .single();

        if (error) throw error;

        if (data && data.design_metadata) {
          console.log('Shared design loaded:', data.design_metadata);

          // Update panel title
          const titleElement = document.querySelector('.panel-title');
          if (titleElement) {
            titleElement.textContent = data.custom_name || data.design_name;
          }

          // Store configuration in localStorage
          localStorage.setItem('jerseyConfig', JSON.stringify(data.design_metadata));

          // Set state variables for save functionality
          // Check if the current user owns this design
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Check ownership
            const { data: ownerData } = await supabase
              .from('user_files')
              .select('owner')
              .eq('short_code', shortCode)
              .single();

            if (ownerData && ownerData.owner === user.id) {
              // User owns this design - enable direct save/overwrite
              currentDesignId = data.id;
              currentDesignName = data.custom_name || data.design_name;
              isInitialSave = false;
              isSharedDesign = false;
              console.log('User owns this design, save will overwrite. ID:', currentDesignId);
            } else {
              // User doesn't own this design - treat as shared
              isSharedDesign = true;
              isInitialSave = true;
              console.log('Viewing shared design from another user');
            }
          }

          // Load the configuration
          loadJerseyConfiguration(true);
        } else {
          console.log('No design found with the provided short code');
          loadJerseyConfiguration(false);
        }
      } else {
        console.warn('Supabase not available, loading default configuration');
        loadJerseyConfiguration(false);
      }
    } catch (error) {
      console.error('Error fetching shared design:', error);
      loadJerseyConfiguration(false);
    }
  } else if (metaData) {
    // Load configuration from metadata URL parameter
    try {
      const config = JSON.parse(metaData);
      loadJustThe3DConfig(config);
      // Hide canvas loader after loading
      setTimeout(() => {
        if (window.hideCanvasLoader) window.hideCanvasLoader();
      }, 1000);
    } catch (error) {
      console.error('Error parsing metadata:', error);
      loadJerseyConfiguration(false);
    }
  } else {
    // No shared design, check for saved configuration
    loadJerseyConfiguration(true);
  }
}

// Initialize configuration loading on page load
document.addEventListener('DOMContentLoaded', () => {
  // Clean up any stale loading flags from previous sessions
  // (flags older than 30 seconds are considered stale)
  const loadingState = localStorage.getItem('jerseyDesignLoading');
  if (loadingState) {
    try {
      const { timestamp } = JSON.parse(loadingState);
      const now = Date.now();
      if (now - timestamp > 30000) {
        localStorage.removeItem('jerseyDesignLoading');
      }
    } catch (e) {
      localStorage.removeItem('jerseyDesignLoading');
    }
  }

  // Detect and load shared designs
  setTimeout(() => {
    detectSharedDesign();
  }, 100);

  // Clear localStorage when home button is clicked
  const homeButton = document.querySelector('.home-button');
  if (homeButton) {
    homeButton.addEventListener('click', () => {
      localStorage.removeItem('jerseyConfig');
      localStorage.removeItem('jerseyDesignLoading');
      console.log('Cleared saved config on home button click');
    });
  }
});

// Update document title based on language
function updateTitleLanguage() {
  const titleElement = document.querySelector('title');
  if (titleElement) {
    const isFrench = document.documentElement.classList.contains('lang-fr');
    const enTitle = titleElement.getAttribute('data-en');
    const frTitle = titleElement.getAttribute('data-fr');

    if (isFrench && frTitle) {
      titleElement.textContent = frTitle;
    } else if (enTitle) {
      titleElement.textContent = enTitle;
    }
  }
}

// Watch for language changes and update title
const observer = new MutationObserver(() => {
  updateTitleLanguage();
});

// Start observing the document element for class changes
if (document.documentElement) {
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
}

// Update title on initial load
document.addEventListener('DOMContentLoaded', () => {
  updateTitleLanguage();
});

// Language toggle functionality with localStorage
function updateLanguageDisplay(lang) {
  // Toggle lang-fr class on document element
  if (lang === 'fr') {
    document.documentElement.classList.add('lang-fr');
    document.documentElement.lang = 'fr';
  } else {
    document.documentElement.classList.remove('lang-fr');
    document.documentElement.lang = 'en';
  }

  // Update title
  updateTitleLanguage();

  // Update option texts in select elements
  const allOptions = document.querySelectorAll("option[data-en][data-fr]");
  const isFrench = lang === "fr";
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

  // Remove any existing event listeners by cloning the element
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

// Initialize language immediately and on page load
function initLanguage() {
  // Get saved language from localStorage or default to 'en'
  const savedLang = localStorage.getItem('language') || 'en';

  // Set initial language display immediately (before DOMContentLoaded)
  updateLanguageDisplay(savedLang);

  // Initialize toggle when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeLanguageToggle();
    });
  } else {
    // DOM is already loaded
    initializeLanguageToggle();
  }
}

// Initialize language system
initLanguage();

// Export functions for use in other scripts
window.saveJerseyConfiguration = saveJerseyConfiguration;
window.getJerseyConfiguration = getJerseyConfiguration;
window.loadJerseyConfiguration = loadJerseyConfiguration;
window.loadJustThe3DConfig = loadJustThe3DConfig;
