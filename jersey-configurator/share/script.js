// Share page script - loads and displays shared designs

// Function to get current language
function getCurrentLanguage() {
    return localStorage.getItem("language") || "en";
}

// Function to update language display
function updateLanguage(lang) {
    document.querySelectorAll('[data-en]').forEach(el => {
        if (lang === 'en') {
            el.style.display = '';
        } else {
            el.style.display = 'none';
        }
    });

    document.querySelectorAll('[data-fr]').forEach(el => {
        if (lang === 'fr') {
            el.style.display = '';
        } else {
            el.style.display = 'none';
        }
    });
}

// Function to parse URL parameters
function getURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    const metadataString = urlParams.get('metadata');

    console.log('🔍 Share page - Parsing URL parameters:');
    console.log('  - name:', name);
    console.log('  - metadataString length:', metadataString ? metadataString.length : 0);

    let metadata = null;
    if (metadataString) {
        try {
            metadata = JSON.parse(decodeURIComponent(metadataString));
            console.log('✅ Metadata parsed successfully:', metadata);
        } catch (error) {
            console.error('❌ Error parsing metadata:', error);
            console.error('  - Raw metadata string (first 100 chars):', metadataString.substring(0, 100));
        }
    } else {
        console.warn('⚠️ No metadata parameter found in URL');
    }

    return { name, metadata };
}

// Function to extract collar and shoulder from SVG path
function extractCollarAndShoulder(svgPath) {
    if (!svgPath) return { collar: 'insert', shoulder: 'reglan' };

    // Extract from path like "../designs/svg/graphic/aurora/round_reglan_aurora.svg"
    const filename = svgPath.split('/').pop() || '';

    // Known collar types (check longer ones first)
    const collarTypes = ['v_neck_crossed', 'v_neck', 'insert', 'round'];
    const shoulderTypes = ['set_in', 'reglan'];

    let collar = 'insert';
    let shoulder = 'reglan';

    // Find matching collar type
    for (const collarType of collarTypes) {
        if (filename.startsWith(collarType + '_')) {
            collar = collarType;
            // Now find shoulder type after collar
            const afterCollar = filename.substring(collarType.length + 1);
            for (const shoulderType of shoulderTypes) {
                if (afterCollar.startsWith(shoulderType + '_')) {
                    shoulder = shoulderType;
                    break;
                }
            }
            break;
        }
    }

    return { collar, shoulder };
}

// Function to load shared design
async function loadSharedDesign() {
    const { name, metadata } = getURLParameters();

    if (!metadata) {
        console.error('No metadata found in URL');
        return;
    }

    console.log('📦 Loading shared design:', name, metadata);

    // Wait for jerseyViewer to be available on window object
    let attempts = 0;
    const maxAttempts = 100; // 100 attempts * 200ms = 20 seconds max
    console.log('⏳ Waiting for jerseyViewer to initialize...');

    while ((!window.jerseyViewer) && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
        if (attempts % 5 === 0) {
            console.log(`  ... still waiting (attempt ${attempts}/${maxAttempts})`);
        }
    }

    if (!window.jerseyViewer) {
        console.error('❌ Jersey viewer not initialized after', maxAttempts * 200, 'ms');
        console.error('   Please refresh the page and try again.');
        return;
    }

    console.log(`✅ Jersey viewer initialized after ${attempts * 200}ms`);

    const jerseyViewer = window.jerseyViewer;

    // Support both 'design' and 'designs' keys for backward compatibility
    const designData = metadata.design || metadata.designs;

    // Extract collar and shoulder from metadata or SVG path
    let collar = metadata.collar || 'insert';
    let shoulder = metadata.shoulder || 'reglan';

    if (!metadata.collar && designData && designData.svgPath) {
        const extracted = extractCollarAndShoulder(designData.svgPath);
        collar = extracted.collar;
        shoulder = extracted.shoulder;
    }

    // Load the appropriate 3D model
    const MODEL_MAP = {
        'round_reglan': 'round_collar_reglan_01.glb',
        'round_set_in': 'round_collar_set_in_02.glb',
        'insert_reglan': 'insert_collar_reglan_01.glb',
        'insert_set_in': 'insert_collar_set_in _01.glb',
        'v_neck_reglan': 'v_neck_reglan_01.glb',
        'v_neck_set_in': 'v_neck_set_in_01.glb',
        'v_neck_crossed_reglan': 'v_neck_crossed_reglan_01.glb',
        'v_neck_crossed_set_in': 'v_neck_crossed_set_in_01.glb'
    };

    const modelKey = `${collar}_${shoulder}`;
    const modelFilename = MODEL_MAP[modelKey] || 'insert_collar_reglan_01.glb';
    const modelPath = `../../jersey_3d_models/${modelFilename}`;

    console.log(`🎽 Loading 3D model: ${modelPath}`);

    try {
        // Load the 3D model first
        await jerseyViewer.loadModel(modelPath);
        console.log('✅ 3D model loaded successfully');

        // Use the existing loadInitialConfig method to handle everything
        // (SVG, colors, stripes, logos, etc.)
        console.log('📦 Loading configuration using loadInitialConfig...');
        jerseyViewer.loadInitialConfig(metadata);
        console.log('✅ Configuration loaded successfully');

        // Wait for loadInitialConfig to complete its async operations
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Apply SVG design colors if in designs mode
        // This must happen AFTER loadInitialConfig to override any default colors
        if (metadata.activeTab === 'designs' && designData && designData.colors) {
            console.log('🌈 Applying custom SVG design colors:', designData.colors);
            console.log('   (Overriding default colors:', designData.designColors, ')');

            // Wait for SVG to load
            let svgElementDetected = false;
            let attempts = 0;
            const maxAttempts = 10;

            while (!svgElementDetected && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 300));
                attempts++;

                if (window.jerseyViewer?.currentSVGElement) {
                    svgElementDetected = true;
                    console.log(`✅ SVG element detected on attempt ${attempts}`);
                } else {
                    console.log(`⏳ Waiting for SVG element (attempt ${attempts}/${maxAttempts})...`);
                }
            }

            if (svgElementDetected) {
                // Manually detect colors from the SVG element
                console.log('🔍 Detecting colors from SVG element...');
                if (typeof detectUniqueColors === 'function') {
                    const detectedColors = detectUniqueColors(window.jerseyViewer.currentSVGElement);
                    window.currentSVGColors = detectedColors;
                    console.log('📋 Detected SVG color classes:', detectedColors);
                } else {
                    console.error('❌ detectUniqueColors function not available');
                }

                // Now apply the custom colors using INDEX-BASED MAPPING
                // designColors array contains the CUSTOMIZED colors to apply (not original colors)
                // We map them by index to the detected SVG classes
                if (window.currentSVGColors && window.currentSVGColors.length > 0) {
                    const savedColors = designData.designColors || [];
                    console.log('🎨 Saved custom colors to apply:', savedColors);
                    console.log('📋 Detected SVG classes:', window.currentSVGColors.map(c => c.className));

                    // Apply each saved color to the corresponding class by index
                    // Skip rasterization for all colors except the last one to batch updates
                    const validColorCount = Math.min(savedColors.length, window.currentSVGColors.length);

                    savedColors.forEach((customColor, index) => {
                        if (index < window.currentSVGColors.length) {
                            const colorInfo = window.currentSVGColors[index];
                            const className = colorInfo.className;
                            const isLastColor = (index === validColorCount - 1);

                            console.log(`🎨 Applying saved color ${index + 1}: class "${className}" → ${customColor}`);

                            if (typeof updateSVGColorByClass === 'function') {
                                // Skip rasterization for all but the last color update
                                updateSVGColorByClass(className, customColor, !isLastColor);
                            } else {
                                console.error('❌ updateSVGColorByClass function not available');
                            }
                        } else {
                            console.warn(`⚠️ No SVG class found for color index ${index}`);
                        }
                    });

                    console.log('✅ All saved SVG design colors applied');
                } else {
                    console.error('❌ No colors detected from SVG');
                }
            } else {
                console.error('❌ SVG element never detected after', maxAttempts, 'attempts');
            }
        }

        // Apply ribbed collar state if available
        if (metadata.ribbedCollar !== undefined) {
            console.log('🎚️ Setting ribbed collar:', metadata.ribbedCollar);
            const ribbedCollarCheckboxes = [
                document.getElementById('ribbed-collar-checkbox-designs'),
                document.getElementById('ribbed-collar-checkbox-colors')
            ];

            ribbedCollarCheckboxes.forEach(checkbox => {
                if (checkbox) {
                    checkbox.checked = metadata.ribbedCollar;
                    // Trigger change event to update the 3D model
                    const event = new Event('change', { bubbles: true });
                    checkbox.dispatchEvent(event);
                }
            });
        }

        // Set active tab if specified
        if (metadata.activeTab) {
            console.log('📑 Setting active tab:', metadata.activeTab);
            const tabRadio = document.querySelector(`input[name="jersey-tab"][value="${metadata.activeTab}"]`);
            if (tabRadio) {
                tabRadio.checked = true;
                const event = new Event('change', { bubbles: true });
                tabRadio.dispatchEvent(event);
            }
        }

        console.log('🎉 Shared design loaded successfully!');

        // Hide the loading overlay to reveal the 3D viewer
        if (jerseyViewer && jerseyViewer.hideCanvasLoader) {
            setTimeout(() => {
                jerseyViewer.hideCanvasLoader();
                console.log('👁️ Loading overlay hidden, 3D viewer now visible');
            }, 1500); // Longer delay to ensure stripes are generated
        }

    } catch (error) {
        console.error('❌ Error loading shared design:', error);
    }
}

// Initialize language toggle
function initializeLanguageToggle() {
    const toggleSwitch = document.querySelector('.toggle-switch');
    if (!toggleSwitch) return;

    const currentLang = getCurrentLanguage();
    toggleSwitch.setAttribute('aria-pressed', currentLang === 'fr' ? 'true' : 'false');
    updateLanguage(currentLang);

    toggleSwitch.addEventListener('click', () => {
        const isPressed = toggleSwitch.getAttribute('aria-pressed') === 'true';
        const newLang = isPressed ? 'en' : 'fr';
        toggleSwitch.setAttribute('aria-pressed', newLang === 'fr' ? 'true' : 'false');
        localStorage.setItem('language', newLang);
        updateLanguage(newLang);
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Share page DOM loaded, initializing...');
    console.log('📍 Current URL:', window.location.href);

    // Wait for threeD-script.js module to load
    console.log('⏳ Waiting for threeD-script.js module to load...');
    let moduleLoadAttempts = 0;
    const maxModuleAttempts = 50; // 50 * 200ms = 10 seconds

    while (!window.JerseyViewer && moduleLoadAttempts < maxModuleAttempts) {
        await new Promise(resolve => setTimeout(resolve, 200));
        moduleLoadAttempts++;
        if (moduleLoadAttempts % 5 === 0) {
            console.log(`  ... still waiting for module (attempt ${moduleLoadAttempts}/${maxModuleAttempts})`);
        }
    }

    if (!window.JerseyViewer) {
        console.error('❌ JerseyViewer class not available after', maxModuleAttempts * 200, 'ms');
        console.error('   threeD-script.js module may have failed to load');
        return;
    }

    console.log('✅ threeD-script.js module loaded');

    // Manually initialize JerseyViewer for share page
    // (threeD-script.js skips auto-init on share pages - see line 3550)
    console.log('🎬 Manually initializing JerseyViewer...');
    try {
        const { JerseyViewer } = await import('../threeD-script.js');
        window.jerseyViewer = new JerseyViewer('.viewer-container');
        console.log('✅ JerseyViewer initialized successfully');

        // Now load the shared design
        console.log('⏰ Calling loadSharedDesign()...');
        await loadSharedDesign();

    } catch (error) {
        console.error('❌ Error initializing JerseyViewer:', error);
    }

    initializeLanguageToggle();
});
