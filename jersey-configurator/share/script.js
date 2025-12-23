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
    
    let metadata = null;
    if (metadataString) {
        try {
            metadata = JSON.parse(decodeURIComponent(metadataString));
        } catch (error) {
            console.error('Error parsing metadata:', error);
        }
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
    
    // Wait for jerseyViewer to be available on window object
    let attempts = 0;
    const maxAttempts = 100;
    while ((!window.jerseyViewer) && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.jerseyViewer) {
        console.error('Jersey viewer not initialized');
        return;
    }
    
    const jerseyViewer = window.jerseyViewer;
    
    // Extract collar and shoulder from metadata
    let collar = 'insert';
    let shoulder = 'reglan';
    
    if (metadata.designs && metadata.designs.svgPath) {
        const extracted = extractCollarAndShoulder(metadata.designs.svgPath);
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
    
    console.log(`Loading shared design: ${modelPath}`);
    
    // Load the model
    jerseyViewer.loadModel(modelPath).then(() => {
        // Load the SVG design if available
        if (metadata.designs && metadata.designs.svgPath) {
            // Convert relative path to absolute if needed
            let svgPath = metadata.designs.svgPath;
            if (svgPath.startsWith('../')) {
                svgPath = svgPath.replace('../', '');
            }
            console.log('Loading SVG design:', svgPath);
            jerseyViewer.loadSVGDesign(svgPath);
        }
    }).catch(error => {
        console.error('Error loading shared design:', error);
    });
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
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the 3D viewer to initialize
    setTimeout(() => {
        loadSharedDesign();
    }, 1000);
    
    initializeLanguageToggle();
});

