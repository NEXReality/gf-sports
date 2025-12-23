import { handleColorChange, readLogo, getLogosInfo, loadInitialConfig, takeScreenshot, takeCurrentViewScreenshot } from "./threeD-script.js";

// Part selector with settings toggle
const partButtons = document.querySelectorAll('.part-button');
const footSettings = document.querySelector('.foot-settings');
const legSettings = document.querySelector('.leg-settings');
const cuffSettings = document.querySelector('.cuff-settings');

// Global variables
let currentDesignName = '';
let currentDesignId = null;
let isInitialSave = true;
let isSaving = false;
let isSharedDesign = false;
// Get all radio groups
const legStripesGroup = document.getElementById('leg-stripes-orientation').closest('.radio-group');
const cuffStripesGroup = document.getElementById('cuff-stripes-orientation').closest('.radio-group');
const initialLang = localStorage.getItem('language');
partButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Update active button
        partButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Show/hide appropriate settings
        const part = button.querySelector('[data-en]').textContent.toLowerCase();
        footSettings.style.display = part === 'foot' ? 'block' : 'none';
        legSettings.style.display = part === 'leg' ? 'block' : 'none';
        cuffSettings.style.display = part === 'cuff' ? 'block' : 'none';

        // Initialize each group
        handleRadioChange(legStripesGroup, 'leg');
        handleRadioChange(cuffStripesGroup, 'cuff');
        updateSelectOptions(initialLang);
        initializeTabs();
    });
});

// Color selector functionality
function setupColorSelector(selector) {
    const trigger = selector.querySelector('.color-trigger');
    const grid = selector.querySelector('.color-grid');
    const preview = trigger.querySelector('.color-preview');

    if (!trigger || !grid || !preview) {
        console.error('Missing elements for color selector:', selector);
        return;
    }

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', !isExpanded);
        grid.style.display = isExpanded ? 'none' : 'grid';
    });

    grid.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const color = option.style.backgroundColor;
            const colorNumber = option.dataset.color;

            preview.style.backgroundColor = color;
            preview.textContent = colorNumber;
            preview.dataset.color = colorNumber;

            // 3D Color Change
            handleColorChange(color, selector.id);

            // Special case 1 - Foot (Change Color of Sole and Elastic Rib too)
            if (selector.id == "foot-color") {
                let soleColorPreview = document.querySelector('#sole-color .color-preview');
                let elasticRibFootColorPreview = document.querySelector('#elastic-rib-foot-color .color-preview');

                soleColorPreview.style.backgroundColor = color;
                soleColorPreview.textContent = colorNumber;
                soleColorPreview.dataset.color = colorNumber;
                elasticRibFootColorPreview.style.backgroundColor = color;
                elasticRibFootColorPreview.textContent = colorNumber;
                elasticRibFootColorPreview.dataset.color = colorNumber;
            }
            // Special case 2 - Leg (Change Color of Elastic Rib too)
            if (selector.id == "leg-color") {
                let elasticRibLegColorPreview = document.querySelector('#elastic-rib-leg-color .color-preview');

                elasticRibLegColorPreview.style.backgroundColor = color;
                elasticRibLegColorPreview.textContent = colorNumber;
                elasticRibLegColorPreview.dataset.color = colorNumber;
            }

            grid.style.display = 'none';
            trigger.setAttribute('aria-expanded', 'false');
        });
    });
}

// Set up all color selectors
document.querySelectorAll('.color-selector').forEach(setupColorSelector);

// Close color grid when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.color-selector')) {
        document.querySelectorAll('.color-grid').forEach(grid => {
            if (grid) {
                grid.style.display = 'none';
                const trigger = grid.closest('.color-selector')?.querySelector('.color-trigger');
                if (trigger) {
                    trigger.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }
});

// Hide color grids on page load
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.color-grid').forEach(grid => {
        grid.style.display = 'none';
    });

    // Show initial section (Foot)
    footSettings.style.display = 'block';
    legSettings.style.display = 'none';
    cuffSettings.style.display = 'none';

    // Test - SM
    // loadSockConfiguration();
});

// Range input value display
document.querySelectorAll('.range-input').forEach(input => {
    const valueDisplay = input.closest('.settings-group, .scale-group').querySelector('.range-value');
    const unit = input.dataset.unit;

    function updateValue() {
        valueDisplay.textContent = `${input.value}${unit}`;
    }

    input.addEventListener('input', updateValue);
    updateValue(); // Initialize the display
});

//******************* */

// Added function to check if user is logged in
async function checkUserLoggedIn() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user !== null;
    } catch (error) {
        console.error('Error checking user login status:', error);
        return false;
    }
}

// Save button functionality
const saveButtonGroup = document.querySelector('.save-button-group');
const mainSaveButton = document.getElementById('main-save-button');
const dropdownArrow = document.getElementById('dropdown-arrow');
const saveDropdown = document.querySelector('.save-dropdown');
const saveAsButton = document.querySelector('.save-as-button');
const newDesignButton = document.querySelector('.new-design-button');
const designSaveModal = document.getElementById('design-save-modal');
const designSaveConfirmBtn = document.querySelector('.design-save-confirm-btn');
const designSaveCancelBtn = document.querySelector('.design-save-cancel-btn');
const newDesignNameInput = document.getElementById('newDesignName');
const charCountElement = document.querySelector('.design-save-char-count');

//Separate Screenshot Button
// Add event listener for screenshotButton
let screenShotButton = document.getElementById("screenshot-button");
async function callTheeDScriptScreenShot() {
    takeCurrentViewScreenshot();
}
if (screenShotButton) {
    screenShotButton.addEventListener("click", callTheeDScriptScreenShot);
}

// Function to show modal
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
            const thumbnailBlob = await takeScreenshot();
            const thumbnailUrl = URL.createObjectURL(thumbnailBlob);
            designPreview.style.backgroundImage = `url('${thumbnailUrl}')`;
            designPreview.style.backgroundSize = 'cover';
            designPreview.style.backgroundPosition = 'center';
            designPreview.style.display = 'block'; // Ensure the preview is visible
        } catch (error) {
            console.error('Error generating design preview:', error);
            designPreview.style.display = 'none'; // Hide the preview if there's an error
        }
    }

    updateCharCount(); // Make sure this function is defined elsewhere
}

// Function to hide modal
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

// Function to update character count
function updateCharCount() {
    if (newDesignNameInput && charCountElement) {
        const currentLength = newDesignNameInput.value.length;
        charCountElement.textContent = `${currentLength} / 30`;
        if (designSaveConfirmBtn) {
            designSaveConfirmBtn.disabled = currentLength === 0 || currentLength > 30;
        }
    }
}

// Toggle dropdown only when clicking the dropdown arrow
if (dropdownArrow) {
    dropdownArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = saveDropdown.style.display === 'block';
        saveDropdown.style.display = isVisible ? 'none' : 'block';
    });
}

// Close dropdown when clicking outside
document.addEventListener('click', () => {
    if (saveDropdown) {
        saveDropdown.style.display = 'none';
    }
});

// Prevent closing when clicking inside the dropdown
if (saveDropdown) {
    saveDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// Main save button click handler
document.querySelector('.save-button').addEventListener('click', async () => {
    const isLoggedIn = await checkUserLoggedIn();

    saveSockConfiguration();
    // let screenshotDataUrl = captureScreenshot(320, 180).then(dataURL => {
    //     // Create a link element to download the image
    //     const link = document.createElement('a');
    //     link.href = dataURL;
    //     link.download = 'screenshot.webp'; // Set the filename
    //     link.style.display = 'none'; // Hide the link
    //     document.body.appendChild(link);
    //     link.click(); // Simulate a click to trigger the download
    //     document.body.removeChild(link); // Remove the link

    // }).catch(error => {
    //     console.error("Error taking screenshot:", error);
    // });

    if (isLoggedIn) {
        if (isSharedDesign || !isInitialSave) {
            await saveDesign();
        } else {
            showDesignSaveModal();
        }
    } else {
        console.log('User not logged in. Please log in to save your design.');
        showLoginModal();
    }
});

// Function to download JSON
function downloadDesignJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", filename)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
}
function getShortCodeFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('shortCode');
}

async function fetchDesignData(shortCode) {
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
async function handleDownload() {
    try {
        const shortCode = getShortCodeFromUrl()

        const data = await fetchDesignData(shortCode)

        if (data && data.design_metadata) {
            downloadDesignJSON(data.design_metadata, `sock_configuration_${shortCode}.json`)
        } else {
            console.log("No design metadata found for the given short code")
        }
    } catch (error) {
        console.error("Error downloading design metadata:", error)
    }
}

// event listener Download JSON
document.addEventListener("DOMContentLoaded", () => {
    const downloadButton = document.getElementById("download-button");

    if (!downloadButton) return; // Exit early if the button is not found

    downloadButton.addEventListener("click", handleDownload);
});
function getTranslation(key, lang = 'en') {
    return alertMessages[key] ? (alertMessages[key][lang] || alertMessages[key]['en']) : key;
}
// New function to handle design saving
async function saveDesign() {
    if (isSaving) return; // Prevent multiple save attempts
    const saveTextSpan = mainSaveButton.querySelector('.save-text');

    try {
        isSaving = true;
        const currentLang = getCurrentLanguage();
        if (saveTextSpan) saveTextSpan.textContent = getTranslation('saving', currentLang);
        mainSaveButton.disabled = true;

        // Get the current user
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
                // Show an alert for ordered designs
                window.translatedAlert('design_already_placed_error');
                return; // Exit the function early
            }

            // If not ordered, proceed with updating the design
            const result = await updateExistingDesign(currentDesignId, currentDesignName);
            if (result.success) {
                displayFeedback(result.message);
            } else {
                throw new Error(result.message);
            }
        } else {
            // This shouldn't happen, but just in case
            throw new Error('No existing design to update');
        }
    } catch (error) {
        console.error('Error saving design:', error);
    } finally {
        isSaving = false;
        const currentLang = getCurrentLanguage();
        if (saveTextSpan) saveTextSpan.textContent = getTranslation('save', currentLang);
        mainSaveButton.disabled = false;
    }
}

// Event listener for design save confirm button
document.getElementById('design-save-confirm-btn').addEventListener('click', async () => {
    const designName = document.getElementById('newDesignName').value.trim();
    if (designName) {
        const result = await uploadThumbnailAndSaveDesign(designName);

        if (result.success) {
            displayFeedback(result.message);
            hideDesignSaveModal();
            isInitialSave = false; // Set this to false after the first save
        } else {
            displayFeedback(result.message, true);
            const input = document.getElementById('newDesignName');
            if (input) {
                input.focus();
            }
        }
    } else {
        displayFeedback('enter_design_name', true);
        const input = document.getElementById('newDesignName');
        if (input) {
            input.focus();
        }
    }
});

// Handle save as button click
if (saveAsButton) {
    saveAsButton.addEventListener('click', async () => {
        const isLoggedIn = await checkUserLoggedIn();
        if (isLoggedIn) {
            showDesignSaveModal();
        } else {
            console.log('User not logged in. Please log in to save your design.');
            showLoginModal();
        }
        if (saveDropdown) {
            saveDropdown.style.display = 'none';
        }
    });
}

// Handle new design button click
if (newDesignButton) {
    newDesignButton.addEventListener('click', () => {
        // Add your new design logic here shit
        const panelTitle = document.querySelector('.panel-title');
        panelTitle.textContent = "Customize Your Sock"
        console.log('Creating new design');

        // Get the base URL without query parameters
        const baseUrl = window.location.href.split('?')[0];

        // Refresh to the base URL
        window.location.href = baseUrl;

        if (saveDropdown) {
            saveDropdown.style.display = 'none';
        }
    });
}

// Event listeners for modal
if (newDesignNameInput) {
    newDesignNameInput.addEventListener('input', updateCharCount);
}

if (designSaveConfirmBtn) {
    designSaveConfirmBtn.addEventListener('click', async () => {
        const designName = newDesignNameInput.value.trim();
        if (designName) {
            const result = await uploadThumbnailAndSaveDesign(designName);
            if (result.success) {
                displayFeedback(result.message);
                hideDesignSaveModal();
            } else {
                displayFeedback(result.message, true);
            }
        } else {
            displayFeedback('enter_design_name', true);
        }
    });
}

if (designSaveCancelBtn) {
    designSaveCancelBtn.addEventListener('click', () => {
        console.log('Cancel button clicked'); // Debug log
        hideDesignSaveModal();
    });
} else {
    console.error('Cancel button not found in the DOM');
}

// Close modal when clicking outside
if (designSaveModal) {
    designSaveModal.addEventListener('click', (e) => {
        if (e.target === designSaveModal) {
            hideDesignSaveModal();
        }
    });
}

// Prevent closing when clicking inside the modal content
const modalContent = document.querySelector('.modal-content');
if (modalContent) {
    modalContent.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

//*********** */
// hide the related settings when stripes 0 selects
function toggleStripeSettings() {
    const stripeSelects = document.querySelectorAll('.stripes-select');

    stripeSelects.forEach(select => {
        select.addEventListener('change', function () {
            const settingsGroup = this.closest('.settings-group').parentElement;
            const stripeSettings = settingsGroup.querySelectorAll('[data-stripe-setting]');

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

// Call the function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', toggleStripeSettings);


// Function to check if a design name already exists for the current user
async function checkDesignNameExists(designName) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No user logged in');
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

// Function to upload thumbnail and save design to Supabase
async function uploadThumbnailAndSaveDesign(designName) {
    try {
        showLoading();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No user logged in');
            hideLoading();
            return {
                success: false,
                message: getTranslation('no_user_logged_in', getCurrentLanguage())
            };
        }

        const designExists = await checkDesignNameExists(designName);
        if (designExists) {
            hideLoading();
            return { success: false, message: getTranslation('design_name_exists', getCurrentLanguage()) };
        }

        const userId = user.id;
        const thumbnailName = `${designName.replace(/\s+/g, '_')}_thumb.webp`;
        const userFolderPath = `${userId}/thumb/${thumbnailName}`;

        // Take screenshot
        const thumbnailBlob = await takeScreenshot();

        // Upload the screenshot to the user's folder
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('public-bucket')
            .upload(userFolderPath, thumbnailBlob, {
                contentType: 'image/webp',
                upsert: false
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            if (uploadError.statusCode === 409) {
                hideLoading();
                return {
                    success: false,
                    message: getTranslation('file_name_exists', getCurrentLanguage())
                };
            } else {
                console.warn('Non-blocking error during upload:', uploadError);
            }
        }

        // Wait for the user_files entry to be created (retry mechanism)
        let fileEntry = null;
        for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const { data, error } = await supabase
                .from('user_files')
                .select('*')
                .eq('name', userFolderPath)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) {
                console.error('Error fetching file entry:', error);
            } else if (data && data.length > 0) {
                fileEntry = data[0];
                break;
            }
        }

        if (!fileEntry) {
            hideLoading();
            throw new Error('File entry not found after multiple attempts');
        }

        let configJSON = {};
        const savedConfig = localStorage.getItem('sockConfig');
        if (savedConfig) {
            configJSON = JSON.parse(savedConfig);
        }

        // Update the user_files entry with design name and metadata
        const { data: updateData, error: updateError } = await supabase
            .from('user_files')
            .update({
                design_name: designName,
                design_metadata: configJSON
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
        hideLoading();
        return { success: true, message: 'Design saved successfully' };
    } catch (error) {
        console.error('Error saving design:', error);
        hideLoading();
        return {
            success: false,
            message: getTranslation('error_saving_design', getCurrentLanguage())
        };;
    }
}

// New function to update existing design
async function updateExistingDesign(designId, designName) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No user logged in');
            return {
                success: false,
                message: getTranslation('no_user_logged_in', getCurrentLanguage())
            };
        }

        // Take a new screenshot
        const thumbnailBlob = await takeScreenshot();

        // Prepare the thumbnail file name
        const thumbnailName = `${designName.replace(/\s+/g, '_')}_thumb.webp`;
        const userFolderPath = `${user.id}/thumb/${thumbnailName}`;

        // Update the thumbnail in the bucket (over write)
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('public-bucket')
            .update(userFolderPath, thumbnailBlob, {
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

        // Get the current design data
        let configJSON = {};
        const savedConfig = localStorage.getItem('sockConfig');
        if (savedConfig) {
            configJSON = JSON.parse(savedConfig);
        }

        // Prepare the update data
        const designUpdateData = {
            design_metadata: configJSON,
        };

        // If it's a shared design, update the owner
        if (isSharedDesign) {
            designUpdateData.owner = user.id;
            //isSharedDesign = true; // Reset the flag after updating ownership
        }

        // Update the user_files entry
        const { data, error: updateError } = await supabase
            .from('user_files')
            .update(designUpdateData)
            .eq('id', designId);

        if (updateError) throw updateError;

        console.log('Design updated successfully');
        return { success: true, message: 'Design updated successfully' };
    } catch (error) {
        console.error('Error updating design:', error);
        return {
            success: false,
            message: getTranslation('error_updating_design', getCurrentLanguage())
        };
    }
}
// Function to update UI after saving
function updateUIAfterSave(thumbnailUrl) {
    const panelTitle = document.querySelector('.panel-title');
    if (panelTitle) {
        panelTitle.textContent = currentDesignName;
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
    const currentLang = getCurrentLanguage();
    const feedbackElement = document.getElementById('save-feedback');

    if (feedbackElement) {
        // Get the translated message
        const translatedMessage = alertMessages[messageKey] ?
            alertMessages[messageKey][currentLang] || messageKey :
            messageKey;

        // Format the message with any additional arguments
        const formattedMessage = translatedMessage + " " + args.join(" ");

        feedbackElement.textContent = formattedMessage;
        feedbackElement.style.color = isError ? 'red' : 'green';
        feedbackElement.style.display = 'block';

        if (!isError) {
            setTimeout(() => {
                feedbackElement.style.display = 'none';
            }, 2500); // Hide after 5 seconds for success messages
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
            feedbackElement.style.display = 'none';
        }, 2500);
    }
}


// Logo upload handling
const logoUpload = document.getElementById('logo-upload');
const uploadArea = document.querySelector('.logo-upload-area');
const uploadStatus = document.getElementById('upload-status');
let statusTimeout;

function updateUploadStatus(messageKey, isError = false) {
    const currentLang = getCurrentLanguage();
    const translatedMessage = alertMessages[messageKey] ?
        alertMessages[messageKey][currentLang] || messageKey :
        messageKey;

    uploadStatus.textContent = translatedMessage;
    uploadStatus.classList.remove('hidden', 'error', 'success');
    uploadStatus.classList.add(isError ? 'error' : 'success');

    clearTimeout(window.statusTimeout);
    window.statusTimeout = setTimeout(() => {
        uploadStatus.classList.add('hidden');
    }, 2000);
}

if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--color-primary)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--color-border)';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--color-border)';
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'image/png') {
            handleLogoFile(file);
        } else {
            updateUploadStatus('Please upload a PNG file', true);
        }
    });
}

if (logoUpload) {
    logoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleLogoFile(file);
        }
    });
}

async function handleLogoFile(file) {
    try {
        updateUploadStatus('uploading_logo');
        const result = await uploadLogoToSupabase(file);
        if (result.success) {
            updateUploadStatus('logo_upload_success');
            // You can update your UI or do something with the public URL here
            // readLogo(file); // <---- If sending file
            readLogo(result.publicUrl); // <- If sending URL
        } else {
            updateUploadStatus('logo_upload_error', true);
        }
    } catch (error) {
        console.error('Error handling logo file:', error);
        updateUploadStatus('logo_upload_error', true);
    }
}

async function uploadLogoToSupabase(file) {
    showLoading();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No user logged in');
            hideLoading();
            showLoginModal()
            return {
                success: false,
                message: getTranslation('no_user_logged_in', getCurrentLanguage())
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
            hideLoading();
            return {
                success: false,
                message: getTranslation('error_uploading_logo', getCurrentLanguage())
            };
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
            .from('public-bucket')
            .getPublicUrl(filePath);
        setTimeout(() => {
            hideLoading();
        }, 2500);
        if (!urlData || !urlData.publicUrl) {
            throw new Error('Failed to get public URL');
        }

        console.log('Logo uploaded successfully. Public URL:', urlData.publicUrl);
        return { success: true, message: 'Logo uploaded successfully', publicUrl: urlData.publicUrl };
    } catch (error) {
        console.error('Error uploading logo:', error);
        setTimeout(() => {
            hideLoading();
        }, 2500);
        return {
            success: false,
            message: getTranslation('error_uploading_logo', getCurrentLanguage())
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
                    if (width > 400) {
                        height *= 400 / width;
                        width = 400;
                    }
                } else {
                    if (height > 400) {
                        width *= 400 / height;
                        height = 400;
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

async function detectSharedDesign() {
    const urlParams = new URLSearchParams(window.location.search);
    let shortCode = urlParams.get('');
    if (!shortCode) {
        shortCode = urlParams.get('shortCode');
    }

    const metaData = urlParams.get('metadata');

    if (shortCode) {
        try {
            const { data, error } = await supabase
                .from('user_files')
                .select('id, design_name, custom_name, design_metadata')
                .eq('short_code', shortCode)
                .single();

            if (error) throw error;

            if (data) {
                isSharedDesign = true;
                currentDesignName = data.custom_name || data.design_name;
                currentDesignId = data.id;

                // Update the UI with the shared design information
                const titleElement = document.querySelector('.panel-title');
                if (titleElement) {
                    titleElement.textContent = currentDesignName;
                }

                // Console log the metadata
                console.log('Design Metadata:', data.design_metadata);

                localStorage.setItem('sockConfig', JSON.stringify(data.design_metadata)); //JSON.stringify needed for localStorage

                loadSockConfiguration(true);

                // You can add more UI updates here if needed
            } else {
                console.log('No design found with the provided short code');
            }
        } catch (error) {
            console.error('Error fetching shared design:', error);
        }
    }
    else if (metaData) {
        // console.log(metaData);
        // localStorage.setItem('sockConfig', JSON.stringify(metaData));
        // loadSockConfiguration(true);
        loadJustThe3DConfig(JSON.parse(metaData));
    }
    else {
        loadSockConfiguration(false);
    }
}

// Call detectSharedDesign when the page loads
document.addEventListener('DOMContentLoaded', detectSharedDesign);

// Stripes orientation

// Define the options for each orientation
const stripeOptions = {
    horizontal: [
        { value: "0", textEn: "Without Stripes", textFr: "Sans Rayure" },
        { value: "1", textEn: "1 Stripe", textFr: "1 Rayure" },
        { value: "2", textEn: "2 Stripes", textFr: "2 Rayures" },
        { value: "3", textEn: "3 Stripes", textFr: "3 Rayures" },
        { value: "4", textEn: "4 Stripes", textFr: "4 Rayures" }
    ],
    vertical: [
        { value: "0", textEn: "Without Stripes", textFr: "Sans Rayures" },
        { value: "1", textEn: "With Stripe", textFr: "Avec Rayures" }
    ]
};
// Mapping for horizontal to vertical conversion
const horizontalToVerticalMap = {
    "0": "0",
    "1": "1",
    "2": "1",
    "3": "1",
    "4": "1"
};

// Function to update dropdown options

function handleRadioChange(radioGroup, part) {
    const background = radioGroup.querySelector('.radio-background');
    const radioButtons = radioGroup.querySelectorAll('input[type="radio"]');

    let orientation = "horizontal";

    // Set initial position based on checked radio
    const checkedRadio = radioGroup.querySelector('input[type="radio"]:checked');
    if (checkedRadio && checkedRadio.value === 'vertical') {
        background.style.transform = 'translateX(100%)';
        orientation = "vertical";
    }

    for (let tabNumber = 1; tabNumber <= 4; tabNumber++) {
        const select = document.getElementById(`${part}-stripes-select-tab${tabNumber}`);
        if (!select) continue; // Skip if select doesn't exist

        const currentValue = select.value;
        const options = stripeOptions[orientation];

        const rotationElement = document.getElementById(`${part}-stripes-rotation-tab${tabNumber}`);
        const rotationDiv = rotationElement.closest(".settings-group");

        // Clear existing options
        select.innerHTML = '';

        let currentLanguage = localStorage.getItem('language') || "en"; // Get language from localStorage, default to English

        // Add new options
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.setAttribute('data-en', option.textEn);
            optionElement.setAttribute('data-fr', option.textFr);
            optionElement.textContent = currentLanguage === "fr" ? option.textFr : option.textEn;
            select.appendChild(optionElement);
        });

        // Handle value mapping when switching from horizontal to vertical
        if (orientation === 'vertical') {
            select.value = horizontalToVerticalMap[currentValue];
            rotationDiv.style.display = "none";
        } else {
            // For other cases, try to maintain the current value if it exists
            const validValues = options.map(opt => opt.value);
            if (validValues.includes(currentValue)) {
                select.value = currentValue;
                if (currentValue !== "0") {
                    rotationDiv.style.display = "block";
                }
            } else {
                select.value = options[0].value; // Default to first option
            }
        }

    }

    // Add click event listeners to all radio buttons in the group
    radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            // Add transition class for smooth animation
            background.style.transition = 'transform 0.3s ease-in-out';

            if (radio.value === 'vertical') {
                background.style.transform = 'translateX(100%)';
            } else {
                background.style.transform = 'translateX(0)';
            }
        });
    });
}

// // Add event listeners to radio buttons
document.querySelectorAll('input[name="orientation1"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        handleRadioChange(legStripesGroup, 'leg');
    });
});


document.querySelectorAll('input[name="orientation2"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        handleRadioChange(cuffStripesGroup, 'cuff');
    });
});

// Number tab

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

function initializeTabs() {
    document.querySelectorAll('.no-tab-group').forEach(tabGroup => {
        adjustTabWidths(tabGroup);

        tabGroup.querySelectorAll('.no-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                tabGroup.querySelectorAll('.no-tab').forEach(t => t.classList.remove('no-active'));
                tabGroup.querySelectorAll('.no-tab-content').forEach(content => content.classList.remove('no-active'));

                tab.classList.add('no-active');
                tabGroup.querySelector(`.no-tab-content[data-tab="${tab.dataset.tab}"]`).classList.add('no-active');

                adjustTabWidths(tabGroup);
            });
        });
    });
}

// Run on initial load
document.addEventListener('DOMContentLoaded', initializeTabs);

// Run on window resize
window.addEventListener('resize', () => {
    //document.querySelectorAll('.no-tab-group').forEach(adjustTabWidths);
});


// Saving the 3D Config
function saveSockConfiguration() {
    const config = getSockConfiguration();
    localStorage.setItem('sockConfig', JSON.stringify(config));
    console.log(config);
}

function getSockConfiguration() {
    let legImageLogos = getLogosInfo();

    return {
        sock: {
            material: document.getElementById('sock-material-select').value
        },
        foot: {
            color: {
                colorNumber: document.querySelector('#foot-color .color-preview').dataset.color,
                colorRGB: document.querySelector('#foot-color .color-preview').style.backgroundColor
            },
            soleMaterial: document.getElementById('sole-material-select').value,
            construction: document.getElementById('construction-select').value,
            soleColor: {
                colorNumber: document.querySelector('#sole-color .color-preview').dataset.color,
                colorRGB: document.querySelector('#sole-color .color-preview').style.backgroundColor
            },
            elasticRibColor: {
                colorNumber: document.querySelector('#elastic-rib-foot-color .color-preview').dataset.color,
                colorRGB: document.querySelector('#elastic-rib-foot-color .color-preview').style.backgroundColor
            },
            siliconeTapeGrip: document.getElementById('silicone-tape-checkbox').checked
        },
        leg: {
            color: {
                colorNumber: document.querySelector('#leg-color .color-preview').dataset.color,
                colorRGB: document.querySelector('#leg-color .color-preview').style.backgroundColor
            },
            elasticRibColor: {
                colorNumber: document.querySelector('#elastic-rib-leg-color .color-preview').dataset.color,
                colorRGB: document.querySelector('#elastic-rib-leg-color .color-preview').style.backgroundColor
            },
            stripes: {
                orientation: document.querySelector('#leg-stripes-orientation input[name="orientation1"]:checked').value,
                tab1: {
                    count: parseInt(document.querySelector('#leg-stripes-select-tab1').value),
                    color: {
                        colorNumber: document.querySelector('#leg-stripes-color-tab1 .color-preview').dataset.color,
                        colorRGB: document.querySelector('#leg-stripes-color-tab1 .color-preview').style.backgroundColor
                    },
                    position: parseFloat(document.getElementById('leg-stripes-position-top-tab1').value),
                    rotation: parseInt(document.getElementById('leg-stripes-rotation-tab1').value),
                    gap: parseInt(document.getElementById('leg-stripes-gap-tab1').value),
                    thickness: parseInt(document.getElementById('leg-stripes-thickness-tab1').value)
                },
                tab2: {
                    count: parseInt(document.querySelector('#leg-stripes-select-tab2').value),
                    color: {
                        colorNumber: document.querySelector('#leg-stripes-color-tab2 .color-preview').dataset.color,
                        colorRGB: document.querySelector('#leg-stripes-color-tab2 .color-preview').style.backgroundColor
                    },
                    position: parseFloat(document.getElementById('leg-stripes-position-top-tab2').value),
                    rotation: parseInt(document.getElementById('leg-stripes-rotation-tab2').value),
                    gap: parseInt(document.getElementById('leg-stripes-gap-tab2').value),
                    thickness: parseInt(document.getElementById('leg-stripes-thickness-tab2').value)
                },
                tab3: {
                    count: parseInt(document.querySelector('#leg-stripes-select-tab3').value),
                    color: {
                        colorNumber: document.querySelector('#leg-stripes-color-tab3 .color-preview').dataset.color,
                        colorRGB: document.querySelector('#leg-stripes-color-tab3 .color-preview').style.backgroundColor
                    },
                    position: parseFloat(document.getElementById('leg-stripes-position-top-tab3').value),
                    rotation: parseInt(document.getElementById('leg-stripes-rotation-tab3').value),
                    gap: parseInt(document.getElementById('leg-stripes-gap-tab3').value),
                    thickness: parseInt(document.getElementById('leg-stripes-thickness-tab3').value)
                },
                tab4: {
                    count: parseInt(document.querySelector('#leg-stripes-select-tab4').value),
                    color: {
                        colorNumber: document.querySelector('#leg-stripes-color-tab4 .color-preview').dataset.color,
                        colorRGB: document.querySelector('#leg-stripes-color-tab4 .color-preview').style.backgroundColor
                    },
                    position: parseFloat(document.getElementById('leg-stripes-position-top-tab4').value),
                    rotation: parseInt(document.getElementById('leg-stripes-rotation-tab4').value),
                    gap: parseInt(document.getElementById('leg-stripes-gap-tab4').value),
                    thickness: parseInt(document.getElementById('leg-stripes-thickness-tab4').value)
                },

            },
            logo: legImageLogos
        },
        cuff: {
            color: {
                colorNumber: document.querySelector('#cuff-color .color-preview').dataset.color,
                colorRGB: document.querySelector('#cuff-color .color-preview').style.backgroundColor
            },
            height: parseInt(document.querySelector('#cuff-height-select').value),
            stripes: {
                orientation: document.querySelector('#cuff-stripes-orientation input[name="orientation2"]:checked').value,
                tab1: {
                    count: parseInt(document.querySelector('#cuff-stripes-select-tab1').value),
                    color: {
                        colorNumber: document.querySelector('#cuff-stripes-color-tab1 .color-preview').dataset.color,
                        colorRGB: document.querySelector('#cuff-stripes-color-tab1 .color-preview').style.backgroundColor
                    },
                    position: parseFloat(document.getElementById('cuff-stripes-position-top-tab1').value),
                    rotation: parseInt(document.getElementById('cuff-stripes-rotation-tab1').value),
                    gap: parseInt(document.getElementById('cuff-stripes-gap-tab1').value),
                    thickness: parseInt(document.getElementById('cuff-stripes-thickness-tab1').value)
                },
                tab2: {
                    count: parseInt(document.querySelector('#cuff-stripes-select-tab2').value),
                    color: {
                        colorNumber: document.querySelector('#cuff-stripes-color-tab2 .color-preview').dataset.color,
                        colorRGB: document.querySelector('#cuff-stripes-color-tab2 .color-preview').style.backgroundColor
                    },
                    position: parseFloat(document.getElementById('cuff-stripes-position-top-tab2').value),
                    rotation: parseInt(document.getElementById('cuff-stripes-rotation-tab2').value),
                    gap: parseInt(document.getElementById('cuff-stripes-gap-tab2').value),
                    thickness: parseInt(document.getElementById('cuff-stripes-thickness-tab2').value)
                },
                tab3: {
                    count: parseInt(document.querySelector('#cuff-stripes-select-tab3').value),
                    color: {
                        colorNumber: document.querySelector('#cuff-stripes-color-tab3 .color-preview').dataset.color,
                        colorRGB: document.querySelector('#cuff-stripes-color-tab3 .color-preview').style.backgroundColor
                    },
                    position: parseFloat(document.getElementById('cuff-stripes-position-top-tab3').value),
                    rotation: parseInt(document.getElementById('cuff-stripes-rotation-tab3').value),
                    gap: parseInt(document.getElementById('cuff-stripes-gap-tab3').value),
                    thickness: parseInt(document.getElementById('cuff-stripes-thickness-tab3').value)
                },
                tab4: {
                    count: parseInt(document.querySelector('#cuff-stripes-select-tab4').value),
                    color: {
                        colorNumber: document.querySelector('#cuff-stripes-color-tab4 .color-preview').dataset.color,
                        colorRGB: document.querySelector('#cuff-stripes-color-tab4 .color-preview').style.backgroundColor
                    },
                    position: parseFloat(document.getElementById('cuff-stripes-position-top-tab4').value),
                    rotation: parseInt(document.getElementById('cuff-stripes-rotation-tab4').value),
                    gap: parseInt(document.getElementById('cuff-stripes-gap-tab4').value),
                    thickness: parseInt(document.getElementById('cuff-stripes-thickness-tab4').value)
                },

            }
        }
    };
}

export function loadSockConfiguration(isSavedDesign) {

    const savedConfig = isSavedDesign ? localStorage.getItem('sockConfig') : null;
    
    if (savedConfig) {
        const config = JSON.parse(savedConfig);

        loadJustThe3DConfig(config);
        
        // Set General Material
        document.getElementById('sock-material-select').value = config.sock.material;
        
        // Set Foot Section
        document.querySelector('#foot-color .color-preview').dataset.color = config.foot.color.colorNumber;
        document.querySelector('#foot-color .color-preview').textContent = config.foot.color.colorNumber;
        document.querySelector('#foot-color .color-preview').style.backgroundColor = config.foot.color.colorRGB;
        document.getElementById('sole-material-select').value = config.foot.soleMaterial;
        document.getElementById('construction-select').value = config.foot.construction;
        document.querySelector('#sole-color .color-preview').dataset.color = config.foot.soleColor.colorNumber;
        document.querySelector('#sole-color .color-preview').textContent = config.foot.soleColor.colorNumber;
        document.querySelector('#sole-color .color-preview').style.backgroundColor = config.foot.soleColor.colorRGB;
        document.querySelector('#elastic-rib-foot-color .color-preview').dataset.color = config.foot.elasticRibColor.colorNumber;
        document.querySelector('#elastic-rib-foot-color .color-preview').textContent = config.foot.elasticRibColor.colorNumber;
        document.querySelector('#elastic-rib-foot-color .color-preview').style.backgroundColor = config.foot.elasticRibColor.colorRGB;
        document.getElementById('silicone-tape-checkbox').checked = config.foot.siliconeTapeGrip;

        // Set Leg Section
        document.querySelector('#leg-color .color-preview').dataset.color = config.leg.color.colorNumber;
        document.querySelector('#leg-color .color-preview').textContent = config.leg.color.colorNumber;
        document.querySelector('#leg-color .color-preview').style.backgroundColor = config.leg.color.colorRGB;
        document.querySelector('#elastic-rib-leg-color .color-preview').dataset.color = config.leg.elasticRibColor.colorNumber;
        document.querySelector('#elastic-rib-leg-color .color-preview').textContent = config.leg.elasticRibColor.colorNumber;
        document.querySelector('#elastic-rib-leg-color .color-preview').style.backgroundColor = config.leg.elasticRibColor.colorRGB;
        let legOrientation = config.leg.stripes.orientation;
        const verticalRadio = document.querySelector(`input[name="orientation1"][value="vertical"]`);
        if (legOrientation == "vertical") {
            verticalRadio.checked = true; // ${config.leg.stripes.orientation}
        }

        // Loop through stripe tabs
        for (let i = 1; i <= 4; i++) {
            document.querySelector(`#leg-stripes-select-tab${i}`).value = config.leg.stripes[`tab${i}`].count;
            document.querySelector(`#leg-stripes-color-tab${i} .color-preview`).dataset.color = config.leg.stripes[`tab${i}`].color.colorNumber;
            document.querySelector(`#leg-stripes-color-tab${i} .color-preview`).textContent = config.leg.stripes[`tab${i}`].color.colorNumber;
            document.querySelector(`#leg-stripes-color-tab${i} .color-preview`).style.backgroundColor = config.leg.stripes[`tab${i}`].color.colorRGB;
            
            document.getElementById(`leg-stripes-position-top-tab${i}`).value = config.leg.stripes[`tab${i}`].position;
            document.getElementById(`leg-stripes-position-top-tab${i}`).closest('.settings-group').querySelector('.range-value').textContent = config.leg.stripes[`tab${i}`].position;
            document.getElementById(`leg-stripes-rotation-tab${i}`).value = config.leg.stripes[`tab${i}`].rotation;
            document.getElementById(`leg-stripes-rotation-tab${i}`).closest('.settings-group').querySelector('.range-value').textContent = config.leg.stripes[`tab${i}`].rotation;
            document.getElementById(`leg-stripes-gap-tab${i}`).value = config.leg.stripes[`tab${i}`].gap;
            document.getElementById(`leg-stripes-gap-tab${i}`).closest('.settings-group').querySelector('.range-value').textContent = config.leg.stripes[`tab${i}`].gap;
            document.getElementById(`leg-stripes-thickness-tab${i}`).value = config.leg.stripes[`tab${i}`].thickness;
            document.getElementById(`leg-stripes-thickness-tab${i}`).closest('.settings-group').querySelector('.range-value').textContent = config.leg.stripes[`tab${i}`].thickness;
            
            const settingsGroup = document.querySelector(`#leg-stripes-select-tab${i}`).closest('.settings-group').parentElement;
            const stripeSettings = settingsGroup.querySelectorAll('[data-stripe-setting]');
            
            if (config.leg.stripes[`tab${i}`].count === 0) {
                stripeSettings.forEach(setting => {
                    setting.style.display = 'none';
                });
            } else {
                stripeSettings.forEach(setting => {
                    setting.style.display = 'block';
                });
            }
       
        }

        // Set Leg Logo
        document.querySelector('.scales .scale-group:first-child .range-input').value = config.leg.logo.scale;
        document.querySelector('.scales .scale-group:last-child .range-input').value = config.leg.logo.rotation;

        // Set Cuff Section
        document.querySelector('#cuff-color .color-preview').dataset.color = config.cuff.color.colorNumber;
        document.querySelector('#cuff-color .color-preview').textContent = config.cuff.color.colorNumber;
        document.querySelector('#cuff-color .color-preview').style.backgroundColor = config.cuff.color.colorRGB;
        document.querySelector('#cuff-height-select').value = config.cuff.height;
        //document.querySelector(`#cuff-stripes-orientation input[value="${config.cuff.stripes.orientation}"]`).checked = true;
        let cuffOrientation = config.cuff.stripes.orientation;
        const verticalRadioCuff = document.querySelector(`input[name="orientation2"][value="vertical"]`);
        const horizontalRadioCuff = document.querySelector(`input[name="orientation2"][value="horizontal"]`);
        if (verticalRadioCuff && horizontalRadioCuff) {
            if (cuffOrientation === "vertical") {
                verticalRadioCuff.checked = true;
            } else {
                horizontalRadioCuff.checked = true;
            }
        }

        // Loop through cuff stripe tabs
        for (let i = 1; i <= 4; i++) {
            document.querySelector(`#cuff-stripes-select-tab${i}`).value = config.cuff.stripes[`tab${i}`].count;
            document.querySelector(`#cuff-stripes-color-tab${i} .color-preview`).dataset.color = config.cuff.stripes[`tab${i}`].color.colorNumber;
            document.querySelector(`#cuff-stripes-color-tab${i} .color-preview`).textContent = config.cuff.stripes[`tab${i}`].color.colorNumber;
            document.querySelector(`#cuff-stripes-color-tab${i} .color-preview`).style.backgroundColor = config.cuff.stripes[`tab${i}`].color.colorRGB;
            
            document.getElementById(`cuff-stripes-position-top-tab${i}`).value = config.cuff.stripes[`tab${i}`].position;
            document.getElementById(`cuff-stripes-position-top-tab${i}`).closest('.settings-group').querySelector('.range-value').textContent = config.cuff.stripes[`tab${i}`].position;
            document.getElementById(`cuff-stripes-rotation-tab${i}`).value = config.cuff.stripes[`tab${i}`].rotation;
            document.getElementById(`cuff-stripes-position-top-tab${i}`).closest('.settings-group').querySelector('.range-value').textContent = config.cuff.stripes[`tab${i}`].position;
            document.getElementById(`cuff-stripes-gap-tab${i}`).value = config.cuff.stripes[`tab${i}`].gap;
            document.getElementById(`cuff-stripes-position-top-tab${i}`).closest('.settings-group').querySelector('.range-value').textContent = config.cuff.stripes[`tab${i}`].position;
            document.getElementById(`cuff-stripes-thickness-tab${i}`).value = config.cuff.stripes[`tab${i}`].thickness;
            document.getElementById(`cuff-stripes-position-top-tab${i}`).closest('.settings-group').querySelector('.range-value').textContent = config.cuff.stripes[`tab${i}`].position;
       
            const settingsGroup = document.querySelector(`#cuff-stripes-select-tab${i}`).closest('.settings-group').parentElement;
            const stripeSettings = settingsGroup.querySelectorAll('[data-stripe-setting]');
            
            if (config.cuff.stripes[`tab${i}`].count === 0) {
                stripeSettings.forEach(setting => {
                    setting.style.display = 'none';
                });
            } else {
                stripeSettings.forEach(setting => {
                    setting.style.display = 'block';
                });
            }
        }
    } else {
        loadJustThe3DConfig(null);
    }
}

function loadJustThe3DConfig(config) {
    loadInitialConfig(config);
}
