
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// import { TweenMax, Power2 } from 'gsap';

let cameraPositions = {
    initial: { x: 1.58, y: 1.04, z: -6.67, zoom: 1, lookAtx: 0, lookAty: 4, lookAtz: 0 },
    foot: { x: 1.11, y: -2.03, z: -4.6, zoom: 2, lookAtx: 0, lookAty: 0, lookAtz: 0 },
    leg: { x: 0.8, y: 2, z: -3.5, zoom: 1, lookAtx: 0, lookAty: 4, lookAtz: 0 },
    cuff: { x: 0.8, y: 4, z: -3.56, zoom: 1.5, lookAtx: 0, lookAty: 0, lookAtz: 0 }
}

let lastSockMaterial = null;
let lastLegColor = 'rgb(234, 238, 241)';
let lastFootColor = 'rgb(234, 238, 241)';
let lastCuffColor = 'rgb(234, 238, 241)';
let lastSoleColor = 'rgb(234, 238, 241)';
let lastElasticRibFootColor = 'rgb(234, 238, 241)';
let lastElasticRibLegColor = 'rgb(234, 238, 241)';
let lastLegStripeColorTab1 = 'rgb(234, 238, 241)';
let lastLegStripeColorTab2 = 'rgb(234, 238, 241)';
let lastLegStripeColorTab3 = 'rgb(234, 238, 241)';
let lastLegStripeColorTab4 = 'rgb(234, 238, 241)';
let lastCuffStripeColorTab1 = 'rgb(234, 238, 241)';
let lastCuffStripeColorTab2 = 'rgb(234, 238, 241)';
let lastCuffStripeColorTab3 = 'rgb(234, 238, 241)';
let lastCuffStripeColorTab4 = 'rgb(234, 238, 241)';

// Select the viewer container
const viewerContainer = document.querySelector('.viewer-container');
const threeContainer = viewerContainer;

// Debug
const gui = new lil.GUI()
const debugObject = {
    foot_color: 0xffffff,
    leg_color: 0xffffff,
    cuff_color: 0xffffff,
}
debugObject.envMapIntensity = 1
gui.hide();

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
// const gltfLoader = new GLTFLoader()
const textureLoader = new THREE.TextureLoader();

// Adjust texture paths based on whether we're on the share page or admin-design page
const isSharePageForTextures = window.location.href.includes('/share/');
const isAdminDesignPageForTextures = window.location.href.includes('/admin-design/');
const textureBasePath = (isSharePageForTextures || isAdminDesignPageForTextures) ? '../textures/' : 'textures/';

const footBreathableNormalMap = textureLoader.load(textureBasePath + 'breathable_nm.jpg');
const footKnittedNormalMap = textureLoader.load(textureBasePath + 'knitted_nm.jpg');
footBreathableNormalMap.flipY = true;
footKnittedNormalMap.flipY = true;

const soleRibDifferentNormalMap = textureLoader.load(textureBasePath + 'sole_rib_diff_nm.png');
const soleRibSameNormalMap = textureLoader.load(textureBasePath + 'sole_rib_same_nm.jpg');
soleRibDifferentNormalMap.flipY = true;
soleRibSameNormalMap.flipY = true;

/**
 * Lights
 */
// Create an ambient light for base illumination
const lightsContainer = new THREE.Object3D();
scene.add(lightsContainer);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
lightsContainer.add(ambientLight);

// Add directional lights similar to model-viewer's default setup
const keyLight = new THREE.DirectionalLight(0xffffff, 1);
keyLight.position.set(-2, 2, 2);
lightsContainer.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(2, -1, -1);
lightsContainer.add(fillLight);

const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
backLight.position.set(1, 3, -2);
lightsContainer.add(backLight);

lightsContainer.rotation.y = Math.PI;

//rosendal_plains_2_1k
let environmentMap;
let nylonMaterialRoughness = 0.45; //0.5528;
let cottonMaterialRoughness = 0.75;

// Load GLB Sock Model -----------------------------------------------------------------------------------------------------------------------------------
let loadedGLTF = null;

// Update all materials
const updateAllInitial3DSettingsForSock = (config) => {
    // Sock
    const soleMaterialName = config["foot"]["soleMaterial"];
    const sockMaterialName = config["sock"]["material"];

    updateSockMaterial(sockMaterialName);

    // Foot ------------------------------------------------------------
    const footColor = config["foot"]["color"]["colorRGB"];
    const elasticRibFootColor = config["foot"]["elasticRibColor"]["colorRGB"];
    const soleColor = config["foot"]["soleColor"]["colorRGB"];
    const constructionMaterialName = config["foot"]["construction"];
    const tapeGripShouldShow = config["foot"]["siliconeTapeGrip"];

    updateSoleMaterial(soleMaterialName);
    updateFootColor(footColor);
    updateElasticRibFootColor(elasticRibFootColor);
    updateSoleColor(soleColor);
    updateFootBreathableNormalMap(constructionMaterialName);
    toggleSiliconGrip(tapeGripShouldShow);

    // Leg ------------------------------------------------------------
    const legColor = config["leg"]["color"]["colorRGB"];
    const elasticRibLegColor = config["leg"]["elasticRibColor"]["colorRGB"];
    legStripesOrientation = config["leg"]["stripes"]["orientation"];

    lastLegStripeColorTab1 = config["leg"]["stripes"]["tab1"]["color"]["colorRGB"];
    legNumberOfStripes['tab1'] = config["leg"]["stripes"]["tab1"]["count"];
    legStripesAngle['tab1'] = config["leg"]["stripes"]["tab1"]["rotation"];
    legStripesGapWidth['tab1'] = config["leg"]["stripes"]["tab1"]["gap"] * 10;
    legStripeHeight['tab1'] = config["leg"]["stripes"]["tab1"]["thickness"] * 10;
    legStripesOffsetTop['tab1'] = config["leg"]["stripes"]["tab1"]["position"] * 10;

    lastLegStripeColorTab2 = config["leg"]["stripes"]["tab2"]["color"]["colorRGB"];
    legNumberOfStripes['tab2'] = config["leg"]["stripes"]["tab2"]["count"];
    legStripesAngle['tab2'] = config["leg"]["stripes"]["tab2"]["rotation"];
    legStripesGapWidth['tab2'] = config["leg"]["stripes"]["tab2"]["gap"] * 10;
    legStripeHeight['tab2'] = config["leg"]["stripes"]["tab2"]["thickness"] * 10;
    legStripesOffsetTop['tab2'] = config["leg"]["stripes"]["tab2"]["position"] * 10;

    lastLegStripeColorTab3 = config["leg"]["stripes"]["tab3"]["color"]["colorRGB"];
    legNumberOfStripes['tab3'] = config["leg"]["stripes"]["tab3"]["count"];
    legStripesAngle['tab3'] = config["leg"]["stripes"]["tab3"]["rotation"];
    legStripesGapWidth['tab3'] = config["leg"]["stripes"]["tab3"]["gap"] * 10;
    legStripeHeight['tab3'] = config["leg"]["stripes"]["tab3"]["thickness"] * 10;
    legStripesOffsetTop['tab3'] = config["leg"]["stripes"]["tab3"]["position"] * 10;

    lastLegStripeColorTab4 = config["leg"]["stripes"]["tab4"]["color"]["colorRGB"];
    legNumberOfStripes['tab4'] = config["leg"]["stripes"]["tab4"]["count"];
    legStripesAngle['tab4'] = config["leg"]["stripes"]["tab4"]["rotation"];
    legStripesGapWidth['tab4'] = config["leg"]["stripes"]["tab4"]["gap"] * 10;
    legStripeHeight['tab4'] = config["leg"]["stripes"]["tab4"]["thickness"] * 10;
    legStripesOffsetTop['tab4'] = config["leg"]["stripes"]["tab4"]["position"] * 10;

    updateLegColor(legColor);
    updateElasticRibLegColor(elasticRibLegColor);

    generateStripedTextureForLeg('tab1');
    generateStripedTextureForLeg('tab2');
    generateStripedTextureForLeg('tab3');
    generateStripedTextureForLeg('tab4');

    const legImageDataArray = config["leg"]["logo"];
    reconstructImages(legFabricCanvas, legImageDataArray);

    // Cuff ------------------------------------------------------------
    const cuffColor = config["cuff"]["color"]["colorRGB"];
    const cuffHeight = config["cuff"]["height"];
    cuffStripesOrientation = config["cuff"]["stripes"]["orientation"];

    lastCuffStripeColorTab1 = config["cuff"]["stripes"]["tab1"]["color"]["colorRGB"];
    cuffNumberOfStripes['tab1'] = config["cuff"]["stripes"]["tab1"]["count"];
    cuffStripesAngle['tab1'] = config["cuff"]["stripes"]["tab1"]["rotation"];
    cuffStripesGapWidth['tab1'] = config["cuff"]["stripes"]["tab1"]["gap"] * 10;
    cuffStripeHeight['tab1'] = config["cuff"]["stripes"]["tab1"]["thickness"] * 10;
    cuffStripesOffsetTop['tab1'] = config["cuff"]["stripes"]["tab1"]["position"] * 10;

    lastCuffStripeColorTab2 = config["cuff"]["stripes"]["tab2"]["color"]["colorRGB"];
    cuffNumberOfStripes['tab2'] = config["cuff"]["stripes"]["tab2"]["count"];
    cuffStripesAngle['tab2'] = config["cuff"]["stripes"]["tab2"]["rotation"];
    cuffStripesGapWidth['tab2'] = config["cuff"]["stripes"]["tab2"]["gap"] * 10;
    cuffStripeHeight['tab2'] = config["cuff"]["stripes"]["tab2"]["thickness"] * 10;
    cuffStripesOffsetTop['tab2'] = config["cuff"]["stripes"]["tab2"]["position"] * 10;

    lastCuffStripeColorTab3 = config["cuff"]["stripes"]["tab3"]["color"]["colorRGB"];
    cuffNumberOfStripes['tab3'] = config["cuff"]["stripes"]["tab3"]["count"];
    cuffStripesAngle['tab3'] = config["cuff"]["stripes"]["tab3"]["rotation"];
    cuffStripesGapWidth['tab3'] = config["cuff"]["stripes"]["tab3"]["gap"] * 10;
    cuffStripeHeight['tab3'] = config["cuff"]["stripes"]["tab3"]["thickness"] * 10;
    cuffStripesOffsetTop['tab3'] = config["cuff"]["stripes"]["tab3"]["position"] * 10;

    lastCuffStripeColorTab4 = config["cuff"]["stripes"]["tab4"]["color"]["colorRGB"];
    cuffNumberOfStripes['tab4'] = config["cuff"]["stripes"]["tab4"]["count"];
    cuffStripesAngle['tab4'] = config["cuff"]["stripes"]["tab4"]["rotation"];
    cuffStripesGapWidth['tab4'] = config["cuff"]["stripes"]["tab4"]["gap"] * 10;
    cuffStripeHeight['tab4'] = config["cuff"]["stripes"]["tab4"]["thickness"] * 10;
    cuffStripesOffsetTop['tab4'] = config["cuff"]["stripes"]["tab4"]["position"] * 10;

    updateCuffColor(cuffColor);
    manageOpacityMapOfCuff(cuffHeight);

    generateStripedTextureForCuff('tab1');
    generateStripedTextureForCuff('tab2');
    generateStripedTextureForCuff('tab3');
    generateStripedTextureForCuff('tab4');
    
}

// Load Initial Config if available 
export function loadInitialConfig(config) {
    const gltfLoader = new GLTFLoader();
    // Adjust model path based on whether we're on the share page or admin-design page
    const isSharePage = window.location.href.includes('/share/');
    const isAdminDesignPage = window.location.href.includes('/admin-design/');
    const modelPath = (isSharePage || isAdminDesignPage) ? '../models/Sock_05_Jan29.glb' : './models/Sock_05_Jan29.glb';
    gltfLoader.load(modelPath,
        (gltf) => {
            gltf.scene.scale.set(5, 5, 5)
            gltf.scene.position.set(0.5, -1.5, 0)
            gltf.scene.rotation.y = 1.5 * Math.PI / 2
            scene.add(gltf.scene)

            if (config) {
                updateAllInitial3DSettingsForSock(config);
            } else {
                manageOpacityMapOfCuff(0);
                updateLegColor(lastLegColor);
                updateCuffColor(lastCuffColor);
                updateSoleRibMaterial(soleRibSameNormalMap);

                generateStripedTextureForLeg('tab1');
                generateStripedTextureForCuff('tab1');
            }

            // Store the gltf
            loadedGLTF = gltf;
        }
    )
}
// Load GLB Sock Model End -----------------------------------------------------------------------------------------------------------------------------------

// Sock Material -----------------------------------------------------------------------------------------------------------------------------------
const sockMaterialDropdown = document.getElementById('sock-material-select');
sockMaterialDropdown.addEventListener('change', (event) => {
    const selectedOption = event.target.value;

    updateSockMaterial(selectedOption);

    soleMaterialDropdown.value = selectedOption;
});
const updateSockMaterial = (selectionMaterialName) => {
    lastSockMaterial = selectionMaterialName;
    // Toggle logic based on the selected option
    if (selectionMaterialName === 'nylon') {
        updateRoughnessofAllMaterials(nylonMaterialRoughness);
    } else if (selectionMaterialName === 'cotton') {
        updateRoughnessofAllMaterials(cottonMaterialRoughness);
    }

    updateSoleRibMaterial(soleRibSameNormalMap);
};
const updateRoughnessofAllMaterials = (roughnessValue) => {
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.envMap = environmentMap;
            child.material.envMapIntensity = debugObject.envMapIntensity;
            child.material.roughness = roughnessValue;

            child.castShadow = true;
            child.receiveShadow = true;
        }
    })
}
const updateSoleRibMaterial = (normalMapName) => {
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            if (child.material.name.includes('sole_rib')) {
                child.material.normalMap = normalMapName;
                child.material.normalMap.wrapS = THREE.RepeatWrapping;
                child.material.normalMap.wrapT = THREE.RepeatWrapping;
                child.material.normalMap.repeat.set(8, 8); // Set UV repeat
                child.material.normalMap.needsUpdate = true; // Ensure update
            }
        }
    })
}

// Sock Material End -----------------------------------------------------------------------------------------------------------------------------------

// Sole Material -----------------------------------------------------------------------------------------------------------------------------------
const soleMaterialDropdown = document.getElementById('sole-material-select');
soleMaterialDropdown.addEventListener('change', (event) => {
    const selectedOption = event.target.value;

    updateSoleMaterial(selectedOption);
});
const updateSoleMaterial = (selectionMaterialName) => {
    // Toggle logic based on the selected option
    if (selectionMaterialName === 'nylon') {
        updateRoughnessofSoleMaterial(nylonMaterialRoughness);
    } else if (selectionMaterialName === 'cotton') {
        updateRoughnessofSoleMaterial(cottonMaterialRoughness);
    }

    if (selectionMaterialName !== lastSockMaterial) {
        updateSoleRibMaterial(soleRibDifferentNormalMap);
    } else {
        updateSoleRibMaterial(soleRibSameNormalMap);
    }
};
const updateRoughnessofSoleMaterial = (roughnessValue) => {
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            if (child.material.name.includes('sole') || child.material.name.includes('toe') || child.material.name.includes('angle above')) {
                child.material.envMap = environmentMap;
                child.material.envMapIntensity = debugObject.envMapIntensity;
                child.material.roughness = roughnessValue;

                child.castShadow = true;
                child.receiveShadow = true;
            }
        }
    })
}
// Sole Material End -----------------------------------------------------------------------------------------------------------------------------------

// Foot Construction -----------------------------------------------------------------------------------------------------------------------------------
const constructionDropdown = document.getElementById('construction-select');
constructionDropdown.addEventListener('change', (event) => {
    const selectedOption = event.target.value;

    updateFootBreathableNormalMap(selectedOption);
});
const updateFootBreathableNormalMap = (selectedOption) => {
    // Toggle logic based on the selected option
    if (selectedOption === 'Regular knit') {
        switchVariant(loadedGLTF, footKnittedNormalMap);
    } else if (selectedOption === 'Breathable mesh') {
        switchVariant(loadedGLTF, footBreathableNormalMap);
    }
};
function switchVariant(gltf, normalMapName) {
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            if (child.material.name.includes('breathable')) {
                child.material.normalMap = normalMapName;
                child.material.normalMap.wrapS = THREE.RepeatWrapping;
                child.material.normalMap.wrapT = THREE.RepeatWrapping;
                child.material.normalMap.repeat.set(10, 10); // Set UV repeat
                child.material.normalMap.needsUpdate = true; // Ensure update
            }
        }
    })
}
// Foot Construction End -----------------------------------------------------------------------------------------------------------------------------------

// Color Changes -----------------------------------------------------------------------------------------------------------------------------------
function sRGBToLinearRGB(rgbString) {
    // Extract RGB values from the string
    const match = rgbString.match(/\d+/g);
    if (!match || match.length < 3) return null;

    let [r, g, b] = match.map(Number).map(c => c / 255); // Normalize to 0-1 range

    function toLinear(channel) {
        return channel <= 0.04045
            ? channel / 12.92
            : Math.pow((channel + 0.055) / 1.055, 2.3); // Using 2.2 instead of 2.4 for a slightly lighter result
    }

    // Convert each channel
    r = toLinear(r);
    g = toLinear(g);
    b = toLinear(b);

    // Convert back to 0-255 range
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}
function threeColorToFabric(threeColor) {
    if (threeColor.isColor) {
        // Convert RGB components to integers between 0-255
        const r = Math.round(threeColor.r * 255);
        const g = Math.round(threeColor.g * 255);
        const b = Math.round(threeColor.b * 255);

        return `rgb(${r}, ${g}, ${b})`;
    }
    throw new Error('Invalid color input');
}

function getLinearColorSpace(rgbString) {
    // Extract RGB values from the string
    const match = rgbString.match(/\d+/g);
    if (!match || match.length < 3) return null;

    let [r, g, b] = match.map(Number).map(c => c / 255); // Normalize to 0-1 range

    // Create a THREE.Color object
    const threeColor = new THREE.Color(r, g, b);

    const linearColor = threeColor.convertSRGBToLinear();
    return threeColorToFabric(linearColor);
}
function getLighterColor(rgbColor, percentage = 20) {
    // Extract RGB values from "rgb(r, g, b)" string
    const match = rgbColor.match(/\d+/g);
    if (!match) return rgbColor; // Return original if invalid format

    let [r, g, b] = match.map(Number);

    // Function to blend with white (255)
    const lightenChannel = (channel) => Math.min(255, Math.round(channel + (255 - channel) * (percentage / 100)));

    // Apply lightening
    r = lightenChannel(r);
    g = lightenChannel(g);
    b = lightenChannel(b);

    // Return in "rgb(r, g, b)" format
    return `rgb(${r}, ${g}, ${b})`;
}

const updateFootColor = (color) => {
    lastFootColor = color;
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            if (child.material.name.includes('breathable') || child.material.name.includes('foot') || child.material.name.includes('sole')) {
                child.material.color.set(color);
            }
        }
    })
}
const updateLegColor = (color) => {
    lastLegColor = color;

    // const fabricColor = sRGBToLinearRGB(color);
    // const fabricColor2 = getLinearColorSpace(color);
    const lighterColor = getLighterColor(color, 50);

    legFabricCanvas.setBackgroundColor(color, legFabricCanvas.renderAll.bind(legFabricCanvas));
    legCanvasTexture.needsUpdate = true;
    applyImageToLeg();

    updateElasticRibLegColor(color);
}
const updateCuffColor = (color) => {
    lastCuffColor = color;

    const fabricColor = sRGBToLinearRGB(color);
    cuffFabricCanvas.setBackgroundColor(color, cuffFabricCanvas.renderAll.bind(cuffFabricCanvas));
    cuffCanvasTexture.needsUpdate = true;
    applyImageToCuff();
}
const updateElasticRibFootColor = (color) => {
    lastElasticRibFootColor = color;
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            if (child.material.name.includes('rib_foot')) {
                child.material.color.set(color);
            }
        }
    })
}
const updateElasticRibLegColor = (color) => {
    lastElasticRibLegColor = color;
    // scene.traverse((child) => {
    //     if (child instanceof THREE.Mesh) {
    //         if (child.material.name.includes('rib_leg')) {
    //             child.material.color.set(color);
    //             child.material.blending = THREE.NormalBlending;
    //         }
    //     }
    // })

    legRibFabricCanvas.setBackgroundColor(color, legRibFabricCanvas.renderAll.bind(legRibFabricCanvas));
    legRibCanvasTexture.needsUpdate = true;
    applyImageToLeg();
}
const updateSoleColor = (color) => {
    lastSoleColor = color;
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            if (child.material.name.includes('sole') || child.material.name.includes('toe') || child.material.name.includes('angle above')) {
                child.material.color.set(color);
            }
        }
    })
}

export function handleColorChange(color, selectorId) {
    if (selectorId == "foot-color") {
        updateFootColor(color);
    }
    else if (selectorId == "sole-color") {
        updateSoleColor(color);
    }
    else if (selectorId == "leg-color") {
        updateLegColor(color);
    }
    else if (selectorId == "cuff-color") {
        updateCuffColor(color);
    }
    else if (selectorId == "elastic-rib-foot-color") {
        updateElasticRibFootColor(color);
    }
    else if (selectorId == "elastic-rib-leg-color") {
        updateElasticRibLegColor(color);
    }
    else if (selectorId == "leg-stripes-color-tab1") {
        lastLegStripeColorTab1 = color;
        generateStripedTextureForLeg('tab1');
    }
    else if (selectorId == "leg-stripes-color-tab2") {
        lastLegStripeColorTab2 = color;
        generateStripedTextureForLeg('tab2');
    }
    else if (selectorId == "leg-stripes-color-tab3") {
        lastLegStripeColorTab3 = color;
        generateStripedTextureForLeg('tab3');
    }
    else if (selectorId == "leg-stripes-color-tab4") {
        lastLegStripeColorTab4 = color;
        generateStripedTextureForLeg('tab4');
    }
    else if (selectorId == "cuff-stripes-color-tab1") {
        lastCuffStripeColorTab1 = color;
        generateStripedTextureForCuff('tab1');
    }
    else if (selectorId == "cuff-stripes-color-tab2") {
        lastCuffStripeColorTab2 = color;
        generateStripedTextureForCuff('tab2');
    }
    else if (selectorId == "cuff-stripes-color-tab3") {
        lastCuffStripeColorTab3 = color;
        generateStripedTextureForCuff('tab3');
    }
    else if (selectorId == "cuff-stripes-color-tab4") {
        lastCuffStripeColorTab4 = color;
        generateStripedTextureForCuff('tab4');
    }
    console.log("Color ----->", color);
}
// Color Changes End -----------------------------------------------------------------------------------------------------------------------------------

// Silicon Grip -----------------------------------------------------------------------------------------------------------------------------------
const siliconeTapeCheckbox = document.getElementById('silicone-tape-checkbox');
siliconeTapeCheckbox.addEventListener('change', (event) => {
    if (event.target.checked) {
        // Add silicone tape grip
        toggleSiliconGrip(true);
    } else {
        // Remove silicone tape grip
        toggleSiliconGrip(false);
    }
});
const toggleSiliconGrip = (shouldShow) => {
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            if (child.name.includes('silicon')) {
                child.visible = shouldShow;
            }
        }
    })
}
// Silicon Grip End -----------------------------------------------------------------------------------------------------------------------------------

// Logo Addition -----------------------------------------------------------------------------------------------------------------------------------
const container = viewerContainer;

// Fabric.js Canvas Section
const fabricContainer = document.createElement('div');
fabricContainer.id = "fabricContainer";
fabricContainer.style.width = '1px';
fabricContainer.style.left = '-100px';
fabricContainer.style.height = '50%';
fabricContainer.style.borderRight = '1px solid #ccc';
fabricContainer.style.overflow = 'hidden';
fabricContainer.style.position = 'relative';
container.appendChild(fabricContainer);

const legFabricCanvasElement = document.createElement('canvas');
legFabricCanvasElement.width = 1024;
legFabricCanvasElement.height = 1024;
legFabricCanvasElement.style.width = '100%';
legFabricCanvasElement.style.height = '100%';
fabricContainer.appendChild(legFabricCanvasElement);

const legFabricCanvas = new fabric.Canvas(legFabricCanvasElement);
legFabricCanvas.setBackgroundColor('white', legFabricCanvas.renderAll.bind(legFabricCanvas));
legFabricCanvas.on('after:render', () => {
    legCanvasTexture.needsUpdate = true;
});

const legRibFabricCanvasElement = document.createElement('canvas');
legRibFabricCanvasElement.width = 1024;
legRibFabricCanvasElement.height = 1024;
legRibFabricCanvasElement.style.width = '100%';
legRibFabricCanvasElement.style.height = '100%';
fabricContainer.appendChild(legRibFabricCanvasElement);

const legRibFabricCanvas = new fabric.Canvas(legRibFabricCanvasElement);
legRibFabricCanvas.setBackgroundColor('white', legRibFabricCanvas.renderAll.bind(legRibFabricCanvas));
legRibFabricCanvas.on('after:render', () => {
    legRibCanvasTexture.needsUpdate = true;
});

const cuffFabricCanvasElement = document.createElement('canvas');
cuffFabricCanvasElement.width = 1024;
cuffFabricCanvasElement.height = 1024;
cuffFabricCanvasElement.style.width = '100%';
cuffFabricCanvasElement.style.height = '100%';
fabricContainer.appendChild(cuffFabricCanvasElement);

const cuffFabricCanvas = new fabric.Canvas(cuffFabricCanvasElement);
cuffFabricCanvas.setBackgroundColor('white', cuffFabricCanvas.renderAll.bind(cuffFabricCanvas));
cuffFabricCanvas.on('after:render', () => {
    cuffCanvasTexture.needsUpdate = true;
});

const legCanvasTexture = new THREE.CanvasTexture(legFabricCanvasElement);
const cuffCanvasTexture = new THREE.CanvasTexture(cuffFabricCanvasElement);
const legRibCanvasTexture = new THREE.CanvasTexture(legRibFabricCanvasElement);

// Adjust icon paths based on whether we're on the share page or admin-design page
const isSharePageForIcons = window.location.href.includes('/share/');
const isAdminDesignPageForIcons = window.location.href.includes('/admin-design/');
const iconBasePath = (isSharePageForIcons || isAdminDesignPageForIcons) ? '../../../images/' : '../images/';

const deleteImg = document.createElement('img');
deleteImg.src = iconBasePath + 'delete.svg';

const cloneImg = document.createElement('img');
cloneImg.src = iconBasePath + 'copy.svg';

let imageLogo = null;
let legImageLogos = [];

const applyImageToLeg = () => {
    syncCanvases(legFabricCanvas, legRibFabricCanvas, lastElasticRibLegColor);

    legCanvasTexture.needsUpdate = true;
    legRibCanvasTexture.needsUpdate = true;

    scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {

            if (child.material.name == 'leg') {
                child.material.map = legCanvasTexture;
                child.material.color.set('rgb(255, 255, 255)');
                child.material.map.colorSpace = THREE.SRGBColorSpace;
                child.material.needsUpdate = true;

                // child.material = canvasMaterial;
                const objects = legFabricCanvas.getObjects();
                for (let obj of objects) {
                    if (obj.name == "imageLayer") {
                        obj.bringToFront();
                    }
                }
            }
            else if (child.material.name == 'rib_leg') {
                child.material.map = legRibCanvasTexture;
                child.material.color.set('rgb(255, 255, 255)');
                child.material.map.colorSpace = THREE.SRGBColorSpace;
                child.material.needsUpdate = true;

                // child.material = canvasMaterial;
                const objects = legRibFabricCanvas.getObjects();
                for (let obj of objects) {
                    if (obj.name == "imageLayer") {
                        obj.bringToFront();
                    }
                }
            }
        }
    })
}

// Function to sync the canvases but with different backgrounds
function syncCanvases(sourceCanvas, targetCanvas, backgroundColor) {
    sourceCanvas.clone((clonedCanvas) => {
        targetCanvas.clear();  // Clear previous content
        targetCanvas.setBackgroundColor(backgroundColor, () => {
            clonedCanvas.getObjects().forEach(obj => {
                targetCanvas.add(obj);
            });
            targetCanvas.renderAll();
        });
    });
}

// export function readLogo(file) {
//     const reader = new FileReader();
//     reader.onload = (event) => {
//         const logoRect = fabric.Image.fromURL(event.target.result, (img) => {
//             createImageObject(img, 50, legFabricCanvas.height/2 - img.height/2, 1);
//             imageLogo = img;
//             //legFabricCanvas.setActiveObject(img);
//         });
//     };
//     reader.readAsDataURL(file);

//     applyImageToLeg();
// }

export function readLogo(publicUrl) {
    fabric.Image.fromURL(publicUrl, (img) => {
        createImageObject(img, 50, legFabricCanvas.height / 2 - img.height / 2, 1);
        imageLogo = img;
    }, {
        crossOrigin: 'anonymous'
    });

    applyImageToLeg();
    legFabricCanvas.renderAll();
}

function createImageObject(img, left, top, scale, angle = 0) {
    img.set({
        left: left,
        top: top,
        scaleX: scale,
        scaleY: scale,
        angle: angle,
        cornerSize: 10,
        transparentCorners: false,
        cornerColor: 'blue',
        borderColor: 'blue',
        cornerStyle: 'circle',
        //hasRotatingPoint: false,
        centeredScaling: true,
        padding: 5,
        name: "imageLayer",
        flipY: true
    });

    // Enable uniform scaling (maintain aspect ratio)
    img.setControlsVisibility({
        mt: false,    // middle top
        mb: false,    // middle bottom
        ml: false,    // middle left
        mr: false,    // middle right
        mtr: false
    });

    img.controls.deleteControl = new fabric.Control({
        x: 0.5,
        y: 0.0, //-0.5
        offsetY: 0, //-16,
        offsetX: 16,
        cursorStyle: 'pointer',
        mouseUpHandler: deleteObject,
        render: renderIcon(deleteImg),
        cornerSize: 24,
    });
    img.controls.cloneControl = new fabric.Control({
        x: -0.5,
        y: 0.0, //0.5
        offsetY: 0, //-16,
        offsetX: -16,
        cursorStyle: 'pointer',
        mouseUpHandler: cloneObject,
        render: renderIcon(cloneImg),
        cornerSize: 24,
    });

    legFabricCanvas.add(img);
    img.bringToFront();
}

let legLogoScaleInput = document.getElementById('logo-scale');
let legLogoRotateInput = document.getElementById('logo-rotate');
legLogoScaleInput.addEventListener('input', (event) => {
    const legLogoScale = parseFloat(event.target.value);
    scaleLogo(legLogoScale);
});
legLogoRotateInput.addEventListener('input', (event) => {
    const legLogoRotate = parseFloat(event.target.value);
    rotateLogo(legLogoRotate);
});

export function rotateLogo(rotationAngle) {
    const activeObject = legFabricCanvas.getActiveObject();

    if (activeObject && activeObject.type === 'image') {
        activeObject.rotate(rotationAngle);
        legFabricCanvas.renderAll();
    }
    syncCanvases(legFabricCanvas, legRibFabricCanvas, lastElasticRibLegColor);
}
export function scaleLogo(scaleValue) {
    const activeObject = legFabricCanvas.getActiveObject();

    if (activeObject && activeObject.type === 'image') {
        activeObject.centeredScaling = true;
        activeObject.scaleX = scaleValue;
        activeObject.scaleY = scaleValue;
        activeObject.setCoords();
        legFabricCanvas.renderAll();
    }
    syncCanvases(legFabricCanvas, legRibFabricCanvas, lastElasticRibLegColor);
}

function deleteObject(_eventData, transform) {
    const canvas = transform.target.canvas;
    canvas.remove(transform.target);
    canvas.requestRenderAll();
}
//event listener to handle the delete key press
document.addEventListener('keydown', function (event) {
    if (event.key === 'Delete') {
        const activeObject = legFabricCanvas.getActiveObject();
        if (activeObject) {
            deleteObject(null, { target: activeObject });
            syncCanvases(legFabricCanvas, legRibFabricCanvas, lastElasticRibLegColor);
        }
    }
});

function cloneObject(_eventData, transform) {
    const canvas = transform.target.canvas;
    transform.target.clone().then((cloned) => {
        cloned.left += 10;
        cloned.top += 10;
        cloned.controls.deleteControl = transform.target.controls.deleteControl;
        cloned.controls.cloneControl = transform.target.controls.cloneControl;
        canvas.add(cloned);
    });
}
function renderIcon(icon) {
    return function (ctx, left, top, _styleOverride, fabricObject) {
        const size = this.cornerSize;
        ctx.save();
        ctx.translate(left, top);
        ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
        ctx.drawImage(icon, -size / 2, -size / 2, size, size);
        ctx.restore();
    };
}

export function getLogosInfo() {
    legImageLogos = [];
    const objects = legFabricCanvas.getObjects();

    // Find image under point
    for (let obj of objects) {
        if (obj.name == "imageLayer") {
            const imageData = {
                scale: obj.scaleX,
                top: obj.top,
                left: obj.left,
                angle: obj.angle,
                data: obj._element.currentSrc
            }
            legImageLogos.push(imageData);
        }
    }
    console.log("legImageLogos -> ", legImageLogos);

    return legImageLogos;
}
function reconstructImages(canvas, imageDataArray) {
    imageDataArray.forEach(imageData => {
        // Create a new fabric.Image instance
        fabric.Image.fromURL(imageData.data, function (img) {
            createImageObject(img, imageData.left, imageData.top, imageData.scale, imageData.angle)
        }, {
            crossOrigin: 'anonymous' // Add this if loading from external URLs
        });
    });
    canvas.renderAll();
}

// Leg Stripes -----------------------------------------------------------------------------------------------------------------------------------
// Get input values
let legStripesGapWidth = {
    tab1: 100,
    tab2: 100,
    tab3: 100,
    tab4: 100
};
let legStripesAngle = {
    tab1: 0,
    tab2: 0,
    tab3: 0,
    tab4: 0
};
let legStripesOffsetTop = {
    tab1: 50,
    tab2: 0,
    tab3: 0,
    tab4: 0
};
let legStripeHeight = {
    tab1: 50,
    tab2: 50,
    tab3: 50,
    tab4: 50
};
let legNumberOfStripes = {
    tab1: 1,
    tab2: 0,
    tab3: 0,
    tab4: 0
};
let legStripesOrientation = "horizontal";

const legStripesOrientationSelect = document.getElementById('leg-stripes-orientation') //.querySelectorAll('input[type="radio"]');
legStripesOrientationSelect.addEventListener('change', (event) => {
    if (event.target.type === 'radio') {
        const orientation = event.target.value;
        legStripesOrientation = orientation;
        console.log(`Selected orientation: ${orientation}`);

        generateStripedTextureForLeg('tab1');
        generateStripedTextureForLeg('tab2');
        generateStripedTextureForLeg('tab3');
        generateStripedTextureForLeg('tab4');
    }
});

// --- Leg Stipes - Tab 1
let legStripeDropdownTab1 = document.getElementById('leg-stripes-select-tab1');
legStripeDropdownTab1.addEventListener('change', (event) => {
    const selectedOption = event.target.value;

    // Toggle logic based on the selected option
    if (selectedOption === '1') {
        legNumberOfStripes['tab1'] = 1;
    } else if (selectedOption === '2') {
        legNumberOfStripes['tab1'] = 2;
    } else if (selectedOption === '3') {
        legNumberOfStripes['tab1'] = 3;
    } else if (selectedOption === '4') {
        legNumberOfStripes['tab1'] = 4;
    } else {
        legNumberOfStripes['tab1'] = 0;
    }
    generateStripedTextureForLeg('tab1');
});

let legStripesPositionFromTopInputTab1 = document.getElementById('leg-stripes-position-top-tab1');
let legStripesRotationInputTab1 = document.getElementById('leg-stripes-rotation-tab1');
let legStripesGapInputTab1 = document.getElementById('leg-stripes-gap-tab1');
let legStripesThicknessInputTab1 = document.getElementById('leg-stripes-thickness-tab1');
legStripesPositionFromTopInputTab1.addEventListener('input', (event) => {
    legStripesOffsetTop['tab1'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForLeg('tab1');
});
legStripesRotationInputTab1.addEventListener('input', (event) => {
    legStripesAngle['tab1'] = parseFloat(event.target.value);
    generateStripedTextureForLeg('tab1');
});
legStripesGapInputTab1.addEventListener('input', (event) => {
    legStripesGapWidth['tab1'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForLeg('tab1');
});
legStripesThicknessInputTab1.addEventListener('input', (event) => {
    legStripeHeight['tab1'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForLeg('tab1');
});

// --- Leg Stipes - Tab 2
let legStripeDropdownTab2 = document.getElementById('leg-stripes-select-tab2');
legStripeDropdownTab2.addEventListener('change', (event) => {
    const selectedOption = event.target.value;

    // Toggle logic based on the selected option
    if (selectedOption === '1') {
        legNumberOfStripes['tab2'] = 1;
    } else if (selectedOption === '2') {
        legNumberOfStripes['tab2'] = 2;
    } else if (selectedOption === '3') {
        legNumberOfStripes['tab2'] = 3;
    } else if (selectedOption === '4') {
        legNumberOfStripes['tab2'] = 4;
    } else {
        legNumberOfStripes['tab2'] = 0;
    }
    generateStripedTextureForLeg('tab2');
});

let legStripesPositionFromTopInputTab2 = document.getElementById('leg-stripes-position-top-tab2');
let legStripesRotationInputTab2 = document.getElementById('leg-stripes-rotation-tab2');
let legStripesGapInputTab2 = document.getElementById('leg-stripes-gap-tab2');
let legStripesThicknessInputTab2 = document.getElementById('leg-stripes-thickness-tab2');
legStripesPositionFromTopInputTab2.addEventListener('input', (event) => {
    legStripesOffsetTop['tab2'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForLeg('tab2');
});
legStripesRotationInputTab2.addEventListener('input', (event) => {
    legStripesAngle['tab2'] = parseFloat(event.target.value);
    generateStripedTextureForLeg('tab2');
});
legStripesGapInputTab2.addEventListener('input', (event) => {
    legStripesGapWidth['tab2'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForLeg('tab2');
});
legStripesThicknessInputTab2.addEventListener('input', (event) => {
    legStripeHeight['tab2'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForLeg('tab2');
});

// --- Leg Stipes - Tab 3
let legStripeDropdownTab3 = document.getElementById('leg-stripes-select-tab3');
legStripeDropdownTab3.addEventListener('change', (event) => {
    const selectedOption = event.target.value;

    // Toggle logic based on the selected option
    if (selectedOption === '1') {
        legNumberOfStripes['tab3'] = 1;
    } else if (selectedOption === '2') {
        legNumberOfStripes['tab3'] = 2;
    } else if (selectedOption === '3') {
        legNumberOfStripes['tab3'] = 3;
    } else if (selectedOption === '4') {
        legNumberOfStripes['tab3'] = 4;
    } else {
        legNumberOfStripes['tab3'] = 0;
    }
    generateStripedTextureForLeg('tab3');
});

let legStripesPositionFromTopInputTab3 = document.getElementById('leg-stripes-position-top-tab3');
let legStripesRotationInputTab3 = document.getElementById('leg-stripes-rotation-tab3');
let legStripesGapInputTab3 = document.getElementById('leg-stripes-gap-tab3');
let legStripesThicknessInputTab3 = document.getElementById('leg-stripes-thickness-tab3');
legStripesPositionFromTopInputTab3.addEventListener('input', (event) => {
    legStripesOffsetTop['tab3'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForLeg('tab3');
});
legStripesRotationInputTab3.addEventListener('input', (event) => {
    legStripesAngle['tab3'] = parseFloat(event.target.value);
    generateStripedTextureForLeg('tab3');
});
legStripesGapInputTab3.addEventListener('input', (event) => {
    legStripesGapWidth['tab3'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForLeg('tab3');
});
legStripesThicknessInputTab3.addEventListener('input', (event) => {
    legStripeHeight['tab3'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForLeg('tab3');
});

// --- Leg Stipes - Tab 4
let legStripeDropdownTab4 = document.getElementById('leg-stripes-select-tab4');
legStripeDropdownTab4.addEventListener('change', (event) => {
    const selectedOption = event.target.value;

    // Toggle logic based on the selected option
    if (selectedOption === '1') {
        legNumberOfStripes['tab4'] = 1;
    } else if (selectedOption === '2') {
        legNumberOfStripes['tab4'] = 2;
    } else if (selectedOption === '3') {
        legNumberOfStripes['tab4'] = 3;
    } else if (selectedOption === '4') {
        legNumberOfStripes['tab4'] = 4;
    } else {
        legNumberOfStripes['tab4'] = 0;
    }
    generateStripedTextureForLeg('tab4');
});

let legStripesPositionFromTopInputTab4 = document.getElementById('leg-stripes-position-top-tab4');
let legStripesRotationInputTab4 = document.getElementById('leg-stripes-rotation-tab4');
let legStripesGapInputTab4 = document.getElementById('leg-stripes-gap-tab4');
let legStripesThicknessInputTab4 = document.getElementById('leg-stripes-thickness-tab4');
legStripesPositionFromTopInputTab4.addEventListener('input', (event) => {
    legStripesOffsetTop['tab4'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForLeg('tab4');
});
legStripesRotationInputTab4.addEventListener('input', (event) => {
    legStripesAngle['tab4'] = parseFloat(event.target.value);
    generateStripedTextureForLeg('tab4');
});
legStripesGapInputTab4.addEventListener('input', (event) => {
    legStripesGapWidth['tab4'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForLeg('tab4');
});
legStripesThicknessInputTab4.addEventListener('input', (event) => {
    legStripeHeight['tab4'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForLeg('tab4');
});


// Function to generate striped texture
function generateStripedTextureForLeg(tab) {

    // Set background color for the gaps
    legFabricCanvas.setBackgroundColor(lastLegColor, legFabricCanvas.renderAll.bind(legFabricCanvas));

    let legStripesGapWidthLeg = legStripesGapWidth[tab];
    let legStripesAngleLeg = legStripesAngle[tab];
    let legNumberOfStripesLeg = legNumberOfStripes[tab];
    let legStripeHeightLeg = legStripeHeight[tab];
    let legStripesOffsetTopLeg = legStripesOffsetTop[tab];

    if (tab == 'tab1') {
        getStripes(legStripesOrientation, legNumberOfStripesLeg, legStripeHeightLeg, legStripesGapWidthLeg, lastLegStripeColorTab1, legStripesOffsetTopLeg, legStripesAngleLeg, 'legStripesLayer1')
    } else if (tab == 'tab2') {
        getStripes(legStripesOrientation, legNumberOfStripesLeg, legStripeHeightLeg, legStripesGapWidthLeg, lastLegStripeColorTab2, legStripesOffsetTopLeg, legStripesAngleLeg, 'legStripesLayer2')
    } else if (tab == 'tab3') {
        getStripes(legStripesOrientation, legNumberOfStripesLeg, legStripeHeightLeg, legStripesGapWidthLeg, lastLegStripeColorTab3, legStripesOffsetTopLeg, legStripesAngleLeg, 'legStripesLayer3')
    } if (tab == 'tab4') {
        getStripes(legStripesOrientation, legNumberOfStripesLeg, legStripeHeightLeg, legStripesGapWidthLeg, lastLegStripeColorTab4, legStripesOffsetTopLeg, legStripesAngleLeg, 'legStripesLayer4')
    }
    else {

    }

    // Update Three.js texture
    legCanvasTexture.colorSpace = THREE.SRGBColorSpace;
    legCanvasTexture.needsUpdate = true;

    applyImageToLeg();
}

const getStripes = (orientation, numStripes, stripeHeight, stripeGap, stripeColor, stripesOffsetTop, stripesAngle, layerName) => {
    // Calculate canvas dimensions
    const isLeg = layerName.includes('leg');

    const canvasWidth = legFabricCanvas.width;
    const canvasHeight = legFabricCanvas.height;

    // Clear existing objects from the canvas (optional, depending on your use case)
    clearLayer(layerName);

    // Calculate the vertical shift for each stripe based on the angle
    const angleRadians = (stripesAngle * Math.PI) / 180; // Convert angle to radians
    const effectiveGap = stripeGap + stripeHeight; // Total gap including the height of the stripe
    const verticalShift = effectiveGap / Math.cos(angleRadians); // Adjusted gap based on angle

    const imageOffsetY = isLeg ? 335 : 167;

    const canvas = isLeg ? legFabricCanvas : cuffFabricCanvas;

    if (orientation == "horizontal") {

        // Loop through and create the stripes
        for (let i = 0; i < numStripes; i++) {
            const stripe = new fabric.Rect({
                left: (canvasWidth / 4),
                top: canvasHeight - (imageOffsetY + i * verticalShift + stripesOffsetTop), //canvasHeight - (392 + (i + 1) * stripeHeight + i * stripeGap + stripesOffsetTop),
                width: canvasWidth * 4,
                height: stripeHeight,
                fill: stripeColor,
                backgroundColor: 'transparent',
                selectable: false,
                angle: stripesAngle,
                originX: 'center',
                originY: 'center',
                name: layerName
            });

            // Add stripe to the canvas
            canvas.add(stripe);
        }
    }
    else {

        let numStripesVertical = (numStripes == 0) ? 0 : Math.ceil((600 + stripeGap) / (stripeHeight + stripeGap));

        // Loop through and create the stripes
        for (let i = 0; i < numStripesVertical; i++) {
            const stripe = new fabric.Rect({
                left: stripesOffsetTop + (i * (stripeHeight + stripeGap)) + 6,
                top: canvasHeight - imageOffsetY,
                width: stripeHeight,
                height: canvasHeight * 2,
                fill: stripeColor,
                backgroundColor: 'transparent',
                selectable: false,
                angle: 0, //3,
                originX: 'center',
                originY: 'center',
                name: layerName
            });

            // Add stripe to the canvas
            canvas.add(stripe);
        }
    }

    // Add the group to the canvas
    canvas.renderAll();

};

const clearLayer = (layerName) => {
    if (layerName.includes('leg')) {
        const objectsToRemove = legFabricCanvas.getObjects().filter(obj => obj.name === layerName);

        // Remove each object in the filtered list
        objectsToRemove.forEach(obj => legFabricCanvas.remove(obj));

        // Render the canvas after removal
        legFabricCanvas.renderAll();
    }
    else if (layerName.includes('cuff')) {
        const objectsToRemove = cuffFabricCanvas.getObjects().filter(obj => obj.name === layerName);

        // Remove each object in the filtered list
        objectsToRemove.forEach(obj => cuffFabricCanvas.remove(obj));

        // Render the canvas after removal
        cuffFabricCanvas.renderAll();
    }
};

// Leg Stripes End -----------------------------------------------------------------------------------------------------------------------------------

// Cuff Stripes -----------------------------------------------------------------------------------------------------------------------------------
// Get input values
let cuffStripesGapWidth = {
    tab1: 40,
    tab2: 40,
    tab3: 40,
    tab4: 40
};
let cuffStripesAngle = {
    tab1: 0,
    tab2: 0,
    tab3: 0,
    tab4: 0
};
let cuffStripesOffsetTop = {
    tab1: 70,
    tab2: 70,
    tab3: 70,
    tab4: 70
};
let cuffStripeHeight = {
    tab1: 20,
    tab2: 20,
    tab3: 20,
    tab4: 20
};
let cuffNumberOfStripes = {
    tab1: 1,
    tab2: 0,
    tab3: 0,
    tab4: 0
};
let cuffStripesOrientation = "horizontal";


const cuffStripesOrientationSelect = document.getElementById('cuff-stripes-orientation') //.querySelectorAll('input[type="radio"]');
cuffStripesOrientationSelect.addEventListener('change', (event) => {
    if (event.target.type === 'radio') {
        const orientation = event.target.value;
        cuffStripesOrientation = orientation;

        generateStripedTextureForCuff('tab1');
        generateStripedTextureForCuff('tab2');
        generateStripedTextureForCuff('tab3');
        generateStripedTextureForCuff('tab4');
    }
});


// --- Cuff Stipes - Tab 1
let cuffStripeDropdownTab1 = document.getElementById('cuff-stripes-select-tab1');
cuffStripeDropdownTab1.addEventListener('change', (event) => {
    const selectedOption = event.target.value;

    // Toggle logic based on the selected option
    if (selectedOption === '1') {
        cuffNumberOfStripes['tab1'] = 1;
    } else if (selectedOption === '2') {
        cuffNumberOfStripes['tab1'] = 2;
    } else if (selectedOption === '3') {
        cuffNumberOfStripes['tab1'] = 3;
    } else if (selectedOption === '4') {
        cuffNumberOfStripes['tab1'] = 4;
    } else {
        cuffNumberOfStripes['tab1'] = 0;
    }
    generateStripedTextureForCuff('tab1');
});

let cuffStripesPositionFromTopInputTab1 = document.getElementById('cuff-stripes-position-top-tab1');
let cuffStripesRotationInputTab1 = document.getElementById('cuff-stripes-rotation-tab1');
let cuffStripesGapInputTab1 = document.getElementById('cuff-stripes-gap-tab1');
let cuffStripesThicknessInputTab1 = document.getElementById('cuff-stripes-thickness-tab1');
cuffStripesPositionFromTopInputTab1.addEventListener('input', (event) => {
    cuffStripesOffsetTop['tab1'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForCuff('tab1');
});
cuffStripesRotationInputTab1.addEventListener('input', (event) => {
    cuffStripesAngle['tab1'] = parseFloat(event.target.value);
    generateStripedTextureForCuff('tab1');
});
cuffStripesGapInputTab1.addEventListener('input', (event) => {
    cuffStripesGapWidth['tab1'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForCuff('tab1');
});
cuffStripesThicknessInputTab1.addEventListener('input', (event) => {
    cuffStripeHeight['tab1'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForCuff('tab1');
});

// --- Cuff Stipes - Tab 2
let cuffStripeDropdownTab2 = document.getElementById('cuff-stripes-select-tab2');
cuffStripeDropdownTab2.addEventListener('change', (event) => {
    const selectedOption = event.target.value;

    // Toggle logic based on the selected option
    if (selectedOption === '1') {
        cuffNumberOfStripes['tab2'] = 1;
    } else if (selectedOption === '2') {
        cuffNumberOfStripes['tab2'] = 2;
    } else if (selectedOption === '3') {
        cuffNumberOfStripes['tab2'] = 3;
    } else if (selectedOption === '4') {
        cuffNumberOfStripes['tab2'] = 4;
    } else {
        cuffNumberOfStripes['tab2'] = 0;
    }
    generateStripedTextureForCuff('tab2');
});

let cuffStripesPositionFromTopInputTab2 = document.getElementById('cuff-stripes-position-top-tab2');
let cuffStripesRotationInputTab2 = document.getElementById('cuff-stripes-rotation-tab2');
let cuffStripesGapInputTab2 = document.getElementById('cuff-stripes-gap-tab2');
let cuffStripesThicknessInputTab2 = document.getElementById('cuff-stripes-thickness-tab2');
cuffStripesPositionFromTopInputTab2.addEventListener('input', (event) => {
    cuffStripesOffsetTop['tab2'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForCuff('tab2');
});
cuffStripesRotationInputTab2.addEventListener('input', (event) => {
    cuffStripesAngle['tab2'] = parseFloat(event.target.value);
    generateStripedTextureForCuff('tab2');
});
cuffStripesGapInputTab2.addEventListener('input', (event) => {
    cuffStripesGapWidth['tab2'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForCuff('tab2');
});
cuffStripesThicknessInputTab2.addEventListener('input', (event) => {
    cuffStripeHeight['tab2'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForCuff('tab2');
});

// --- Cuff Stipes - Tab 3
let cuffStripeDropdownTab3 = document.getElementById('cuff-stripes-select-tab3');
cuffStripeDropdownTab3.addEventListener('change', (event) => {
    const selectedOption = event.target.value;

    // Toggle logic based on the selected option
    if (selectedOption === '1') {
        cuffNumberOfStripes['tab3'] = 1;
    } else if (selectedOption === '2') {
        cuffNumberOfStripes['tab3'] = 2;
    } else if (selectedOption === '3') {
        cuffNumberOfStripes['tab3'] = 3;
    } else if (selectedOption === '4') {
        cuffNumberOfStripes['tab3'] = 4;
    } else {
        cuffNumberOfStripes['tab3'] = 0;
    }
    generateStripedTextureForCuff('tab3');
});

let cuffStripesPositionFromTopInputTab3 = document.getElementById('cuff-stripes-position-top-tab3');
let cuffStripesRotationInputTab3 = document.getElementById('cuff-stripes-rotation-tab3');
let cuffStripesGapInputTab3 = document.getElementById('cuff-stripes-gap-tab3');
let cuffStripesThicknessInputTab3 = document.getElementById('cuff-stripes-thickness-tab3');
cuffStripesPositionFromTopInputTab3.addEventListener('input', (event) => {
    cuffStripesOffsetTop['tab3'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForCuff('tab3');
});
cuffStripesRotationInputTab3.addEventListener('input', (event) => {
    cuffStripesAngle['tab3'] = parseFloat(event.target.value);
    generateStripedTextureForCuff('tab3');
});
cuffStripesGapInputTab3.addEventListener('input', (event) => {
    cuffStripesGapWidth['tab3'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForCuff('tab3');
});
cuffStripesThicknessInputTab3.addEventListener('input', (event) => {
    cuffStripeHeight['tab3'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForCuff('tab3');
});

// --- Cuff Stipes - Tab 4
let cuffStripeDropdownTab4 = document.getElementById('cuff-stripes-select-tab4');
cuffStripeDropdownTab4.addEventListener('change', (event) => {
    const selectedOption = event.target.value;

    // Toggle logic based on the selected option
    if (selectedOption === '1') {
        cuffNumberOfStripes['tab4'] = 1;
    } else if (selectedOption === '2') {
        cuffNumberOfStripes['tab4'] = 2;
    } else if (selectedOption === '3') {
        cuffNumberOfStripes['tab4'] = 3;
    } else if (selectedOption === '4') {
        cuffNumberOfStripes['tab4'] = 4;
    } else {
        cuffNumberOfStripes['tab4'] = 0;
    }
    generateStripedTextureForCuff('tab4');
});

let cuffStripesPositionFromTopInputTab4 = document.getElementById('cuff-stripes-position-top-tab4');
let cuffStripesRotationInputTab4 = document.getElementById('cuff-stripes-rotation-tab4');
let cuffStripesGapInputTab4 = document.getElementById('cuff-stripes-gap-tab4');
let cuffStripesThicknessInputTab4 = document.getElementById('cuff-stripes-thickness-tab4');
cuffStripesPositionFromTopInputTab4.addEventListener('input', (event) => {
    cuffStripesOffsetTop['tab4'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForCuff('tab4');
});
cuffStripesRotationInputTab4.addEventListener('input', (event) => {
    cuffStripesAngle['tab4'] = parseFloat(event.target.value);
    generateStripedTextureForCuff('tab4');
});
cuffStripesGapInputTab4.addEventListener('input', (event) => {
    cuffStripesGapWidth['tab4'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForCuff('tab4');
});
cuffStripesThicknessInputTab4.addEventListener('input', (event) => {
    cuffStripeHeight['tab4'] = parseFloat(event.target.value) * 10;
    generateStripedTextureForCuff('tab4');
});

function generateStripedTextureForCuff(tab) {

    // Set background color for the gaps
    cuffFabricCanvas.setBackgroundColor(lastCuffColor, cuffFabricCanvas.renderAll.bind(cuffFabricCanvas));

    let cuffStripesGapWidthCuff = cuffStripesGapWidth[tab];
    let cuffStripesAngleCuff = cuffStripesAngle[tab];
    let cuffNumberOfStripesCuff = cuffNumberOfStripes[tab];
    let cuffStripeHeightCuff = cuffStripeHeight[tab];
    let cuffStripesOffsetTopCuff = cuffStripesOffsetTop[tab];

    if (tab == 'tab1') {
        getStripes(cuffStripesOrientation, cuffNumberOfStripesCuff, cuffStripeHeightCuff, cuffStripesGapWidthCuff, lastCuffStripeColorTab1, cuffStripesOffsetTopCuff, cuffStripesAngleCuff, 'cuffStripesLayer1')
    } else if (tab == 'tab2') {
        getStripes(cuffStripesOrientation, cuffNumberOfStripesCuff, cuffStripeHeightCuff, cuffStripesGapWidthCuff, lastCuffStripeColorTab2, cuffStripesOffsetTopCuff, cuffStripesAngleCuff, 'cuffStripesLayer2')
    } else if (tab == 'tab3') {
        getStripes(cuffStripesOrientation, cuffNumberOfStripesCuff, cuffStripeHeightCuff, cuffStripesGapWidthCuff, lastCuffStripeColorTab3, cuffStripesOffsetTopCuff, cuffStripesAngleCuff, 'cuffStripesLayer3')
    } if (tab == 'tab4') {
        getStripes(cuffStripesOrientation, cuffNumberOfStripesCuff, cuffStripeHeightCuff, cuffStripesGapWidthCuff, lastCuffStripeColorTab4, cuffStripesOffsetTopCuff, cuffStripesAngleCuff, 'cuffStripesLayer4')
    }
    else {

    }

    // Update Three.js texture
    cuffCanvasTexture.colorSpace = THREE.SRGBColorSpace;
    cuffCanvasTexture.needsUpdate = true;
}

const applyImageToCuff = () => {
    cuffCanvasTexture.needsUpdate = true;
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {

            if (child.material.name.includes('cuff')) {
                // Store the existing normal map and its properties
                const existingMaterial = child.material;
                const normalMap = existingMaterial.normalMap;
                const diffuseMap = existingMaterial.map;

                child.material.map = cuffCanvasTexture;
                child.material.color.set('rgb(255, 255, 255)');
                child.material.map.colorSpace = THREE.SRGBColorSpace;
                child.material.needsUpdate = true;
            }
        }
    })
}

// Cuff Stripes End -----------------------------------------------------------------------------------------------------------------------------------


// Cuff Height -----------------------------------------------------------------------------------------------------------------------------------
let cuffHeightDropdown = document.getElementById('cuff-height-select');
// let cuffOpacityTexture = textureLoader.load('textures/socks_cuff_transparency_1k.png');
// cuffOpacityTexture.wrapT = THREE.RepeatWrapping; // Allow wrapping in the Y direction
// cuffOpacityTexture.flipY = true;               // Flip the texture vertically
// cuffOpacityTexture.offset.y = 0.5;
// cuffOpacityTexture.needsUpdate = true;
const normal = new THREE.Vector3(0, -1, 0);
const euler = new THREE.Euler(0, 0, Math.PI * -3.5 / 180); // Rotate around X axis
normal.applyEuler(euler);
const initialPosOfClippingPlane = 1.7;
const clippingPlane = new THREE.Plane(normal, initialPosOfClippingPlane);
// const planeHelper = new THREE.PlaneHelper(clippingPlane, 1.7, 0x00ff00); // Size 2, green color
// scene.add(planeHelper);

cuffHeightDropdown.addEventListener('change', (event) => {
    const selectedOption = event.target.value;

    manageOpacityMapOfCuff(parseInt(selectedOption));

});
const manageOpacityMapOfCuff = (height) => {
    //cuffOpacityTexture.offset.y = 0.01 * height;
    clippingPlane.constant = initialPosOfClippingPlane - (0.03 * (6 - height));
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            if (child.material.name.includes('cuff')) {
                // child.material.transparent = true;
                // child.material.alphaMap = cuffOpacityTexture;
                child.material.clippingPlanes = [clippingPlane];
                child.material.needsUpdate = true;
            }
        }
    })
}
// Cuff Height End -----------------------------------------------------------------------------------------------------------------------------------

// Three.js Section 
// Add raycaster and mouse position tracking
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let selectedImage = null;
let dragStartPosition = { x: 0, y: 0 };
let imageStartPosition = { x: 0, y: 0 };

const isSharedPage = window.location.href.includes('/share/');

if (!isSharedPage) {
    threeContainer.addEventListener('mousedown', (event) => {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(loadedGLTF.scene);

        if (intersects.length > 0) {
            isDragging = true;
            const uv = intersects[0].uv;
            dragStartPosition = { x: uv.x, y: uv.y };

            const clickPositionCanvas = {
                x: uv.x * 1024,
                y: uv.y * 1024
            }

            // Get pointer coordinates
            // const pointer = legFabricCanvas.getPointer(event);

            //const point = new fabric.Point(pointer.x, pointer.y);

            // Check for selected image on fabric canvas
            let activeObject = legFabricCanvas.getActiveObject();

            if (activeObject == null) {

                // Get all objects on canvas
                const objects = legFabricCanvas.getObjects();

                // Find image under point
                for (let obj of objects) {
                    if (obj.name == "imageLayer" && obj.containsPoint({ x: clickPositionCanvas.x, y: 1024 - clickPositionCanvas.y })) {
                        legFabricCanvas.setActiveObject(obj);
                        // Your other code for handling the selected image
                        activeObject = obj;
                        break;
                    }
                }

                syncCanvases(legFabricCanvas, legRibFabricCanvas, lastElasticRibLegColor);

                legFabricCanvas.renderAll();
            }


            if (activeObject) {
                // Get pointer coordinates relative to canvas
                //const pointer = legFabricCanvas.getPointer(event);

                // Check if click is on delete control
                if (activeObject.controls.deleteControl) {
                    const deleteControl = activeObject.controls.deleteControl;
                    const cloneControl = activeObject.controls.cloneControl;
                    const angle = activeObject.angle * Math.PI / 180;
                    const objectCenter = activeObject.getCenterPoint();

                    // // Calculate delete icon position
                    // const deleteIconLeft = objectCenter.x + (deleteControl.x * activeObject.width * activeObject.scaleX) + deleteControl.offsetX;
                    // const deleteIconTop = 1024 - objectCenter.y; //(activeObject.top) + 16; // + (2 * -deleteControl.offsetY + 1 * activeObject.height * activeObject.scaleY);


                    // Calculate offsets including scale
                    const offsetFromCenterX = (deleteControl.x * activeObject.width * activeObject.scaleX) + deleteControl.offsetX;
                    const offsetFromCenterY = (deleteControl.y * activeObject.height * activeObject.scaleY) + deleteControl.offsetY;

                    // Apply rotation to the offset
                    const rotatedOffsetX = offsetFromCenterX * Math.cos(angle) - offsetFromCenterY * Math.sin(angle);
                    const rotatedOffsetY = offsetFromCenterX * Math.sin(angle) + offsetFromCenterY * Math.cos(angle);

                    // Final position
                    const deleteIconLeft = objectCenter.x + rotatedOffsetX;
                    const deleteIconTop = 1024 - (objectCenter.y + rotatedOffsetY);


                    // Define hit area size (adjust these values based on your icon size)
                    const iconSize = deleteControl.cornerSize;



                    // Calculate offsets including scale for clone control
                    const cloneOffsetFromCenterX = (cloneControl.x * activeObject.width * activeObject.scaleX) + cloneControl.offsetX;
                    const cloneOffsetFromCenterY = (cloneControl.y * activeObject.height * activeObject.scaleY) + cloneControl.offsetY;

                    // Apply rotation to the offset
                    const rotatedCloneOffsetX = cloneOffsetFromCenterX * Math.cos(angle) - cloneOffsetFromCenterY * Math.sin(angle);
                    const rotatedCloneOffsetY = cloneOffsetFromCenterX * Math.sin(angle) + cloneOffsetFromCenterY * Math.cos(angle);

                    // Final position
                    const cloneIconLeft = objectCenter.x + rotatedCloneOffsetX;
                    const cloneIconTop = 1024 - (objectCenter.y + rotatedCloneOffsetY);

                    // Check if pointer is within delete icon bounds
                    if (clickPositionCanvas.x >= deleteIconLeft - iconSize / 2 &&
                        clickPositionCanvas.x <= deleteIconLeft + iconSize / 2 &&
                        clickPositionCanvas.y >= deleteIconTop - iconSize / 2 &&
                        clickPositionCanvas.y <= deleteIconTop + iconSize / 2) {
                        // Click is on delete icon
                        legFabricCanvas.remove(activeObject);
                        legFabricCanvas.renderAll();
                        syncCanvases(legFabricCanvas, legRibFabricCanvas, lastElasticRibLegColor);

                        return; // Exit early to prevent dragging
                    }
                    else if (clickPositionCanvas.x >= cloneIconLeft - iconSize / 2 &&
                        clickPositionCanvas.x <= cloneIconLeft + iconSize / 2 &&
                        clickPositionCanvas.y >= cloneIconTop - iconSize / 2 &&
                        clickPositionCanvas.y <= cloneIconTop + iconSize / 2) {
                        activeObject.clone(function (cloned) {
                            createImageObject(cloned, cloned.left + 40, cloned.top + 40, cloned.scaleX, cloned.angle);
                            legFabricCanvas.setActiveObject(cloned);
                            legFabricCanvas.renderAll();
                            syncCanvases(legFabricCanvas, legRibFabricCanvas, lastElasticRibLegColor);
                        });

                        return;
                    }
                }

                // If not clicking delete icon, proceed with normal dragging
                selectedImage = activeObject;
                imageStartPosition = {
                    x: selectedImage.left,
                    y: selectedImage.top
                };

                isDragging = true;

                // Disable OrbitControls
                controls.enabled = false;
            }
        } else {
            legFabricCanvas.discardActiveObject();
            legFabricCanvas.requestRenderAll();
        }
    });

    // Track mouse position in normalized device coordinates
    threeContainer.addEventListener('mousemove', (event) => {
        const rect = threeContainer.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        if (isDragging && selectedImage) {
            // Calculate the movement in UV coordinates
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(loadedGLTF.scene);

            if (intersects.length > 0) {
                const uv = intersects[0].uv;
                const deltaX = uv.x - dragStartPosition.x;
                const deltaY = -(uv.y - dragStartPosition.y);

                // Update image position on the fabric canvas
                selectedImage.set({
                    left: (imageStartPosition.x + deltaX * legFabricCanvas.width),
                    top: (imageStartPosition.y + deltaY * legFabricCanvas.height)
                });

                syncCanvases(legFabricCanvas, legRibFabricCanvas, lastElasticRibLegColor);

                legFabricCanvas.renderAll();

                controls.enabled = false;
            }
        }
    });

    // Event Listener for Mouse Up
    threeContainer.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            selectedImage = null;

            // Re-enable OrbitControls
            controls.enabled = true;
        }
    });

    // Event Listener for Mouse Leave
    threeContainer.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            selectedImage = null;

            // Re-enable OrbitControls
            controls.enabled = true;
        }
    });
}

// Renderer, Camera, OrbitControls -----------------------------------------------------------------------------------------------------------------------------------
const sizes = {
    width: threeContainer.clientWidth - 1,
    height: threeContainer.clientHeight
}

window.addEventListener('resize', () => {
    // // Update sizes
    // sizes.width = threeContainer.clientWidth
    // sizes.height = threeContainer.clientHeight

    // // Update camera
    // camera.aspect = sizes.width / sizes.height
    // camera.updateProjectionMatrix()

    // // Update renderer
    // renderer.setSize(sizes.width, sizes.height)
    // renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(40, sizes.width / sizes.height, 0.1, 100);
setCameraPositionWithAnimation('initial');
camera.lookAt(0, 4, 0);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, threeContainer);
controls.enableDamping = true;
controls.minDistance = 1;
controls.maxDistance = 15;

function setCameraPositionWithAnimation(positionName) {
    let cam = cameraPositions[positionName];
    camera.position.set(cam.x, cam.y, cam.z);
    camera.zoom = (cam.zoom);
    camera.lookAt(cam.lookAtx, cam.lookAty, cam.lookAtz);

    // if (cameraPositions.hasOwnProperty(positionName)) {
    //     const targetPosition = cam;

    //     TweenMax.to(camera.position, 1, { 
    //         x: targetPosition.x, 
    //         y: targetPosition.y, 
    //         z: targetPosition.z, 
    //         ease: Power2.easeOut 
    //     });
    // } else {
    //     console.warn("Invalid camera position name:", positionName);
    // }
}

let sockPartSelect = document.getElementById('sock-part-select');
const partButtons = sockPartSelect.querySelectorAll('.part-button');

partButtons.forEach(button => {
    button.addEventListener('click', () => {

        // Get the selected part (you can customize this logic)
        const selectedPart = button.querySelector('span[data-en]').textContent;
        console.log('Selected Part:', selectedPart);

        // Perform actions based on the selected part
        // if (selectedPart === 'Foot') {
        //     setCameraPositionWithAnimation('foot');
        // } else if (selectedPart === 'Leg') {
        //     setCameraPositionWithAnimation('leg');
        // } else if (selectedPart === 'Cuff') {
        //     setCameraPositionWithAnimation('cuff');
        // }
    });
});

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(sizes.width, sizes.height);
renderer.domElement.style.width = sizes.width;
renderer.domElement.style.height = sizes.height;
threeContainer.appendChild(renderer.domElement);

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.useLegacyLights = true; //renderer.physicallyCorrectLights = true;
renderer.localClippingEnabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 0.3;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/**
 * Tick - 60 fps
 */
const tick = () => {
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick();

// Function to take screenshot
export async function takeScreenshot() {
    // Save original camera state
    const originalPosition = camera.position.clone();
    const originalZoom = camera.zoom;
    const originalQuaternion = camera.quaternion.clone();
    const originalAspect = camera.aspect;
    const originalRenderTarget = renderer.getRenderTarget();
    const originalToneMapping = renderer.toneMapping;
    const originalExposure = renderer.toneMappingExposure;
    const originalEncoding = renderer.outputEncoding;

    // Set camera to screenshot position
    const screenshotPosition = {
        x: 1.58, y: 1.04, z: -6.67, zoom: 1, lookAtx: 0, lookAty: 0, lookAtz: 0
    };
    camera.position.set(screenshotPosition.x, screenshotPosition.y, screenshotPosition.z);
    camera.zoom = screenshotPosition.zoom;
    camera.lookAt(screenshotPosition.lookAtx, screenshotPosition.lookAty, screenshotPosition.lookAtz);

    // Set camera aspect ratio for 16:9 output
    camera.aspect = 3200 / 1800;
    camera.updateProjectionMatrix();

    // Create an offscreen render target
    const renderTarget = new THREE.WebGLRenderTarget(3200, 1800, {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        encoding: renderer.outputEncoding, // Preserve renderer's encoding
    });

    // Preserve renderer settings
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);

    // Read pixel data
    const gl = renderer.getContext();
    const pixels = new Uint8Array(3200 * 1800 * 4);
    gl.readPixels(0, 0, 3200, 1800, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Create an offscreen canvas
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = 3200;
    offscreenCanvas.height = 1800;
    const ctx = offscreenCanvas.getContext('2d');

    // Correct WebGL's bottom-to-top issue
    const imageData = ctx.createImageData(3200, 1800);
    for (let y = 0; y < 1800; y++) {
        const sourceY = 1800 - y - 1;
        const sourceOffset = sourceY * 3200 * 4;
        const destOffset = y * 3200 * 4;
        imageData.data.set(pixels.subarray(sourceOffset, sourceOffset + 3200 * 4), destOffset);
    }
    ctx.putImageData(imageData, 0, 0);

    // Restore original camera and renderer settings
    camera.position.copy(originalPosition);
    camera.zoom = originalZoom;
    camera.quaternion.copy(originalQuaternion);
    camera.aspect = originalAspect;
    camera.updateProjectionMatrix();
    renderer.setRenderTarget(originalRenderTarget);
    renderer.toneMapping = originalToneMapping;
    renderer.toneMappingExposure = originalExposure;
    renderer.outputEncoding = originalEncoding;
    renderer.render(scene, camera);

    // Convert the canvas to a Blob and return it
    return new Promise(resolve => {
        offscreenCanvas.toBlob(resolve, 'image/webp', 0.8);
    });
}

export function takeCurrentViewScreenshot() {
    // Store original render settings
    const originalRenderTarget = renderer.getRenderTarget();
    const originalAspect = camera.aspect;
    const originalToneMapping = renderer.toneMapping;
    const originalExposure = renderer.toneMappingExposure;
    const originalOutputEncoding = renderer.outputEncoding;


    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const aspectRatio = viewportWidth / viewportHeight;

    let newWidth, newHeight;
    if (aspectRatio > 16 / 9) {
        newWidth = 3200;
        newHeight = Math.round(3200 / aspectRatio);
    } else {
        newHeight = 1800;
        newWidth = Math.round(1800 * aspectRatio);
    }

    // Adjust camera aspect ratio
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();

    const renderTarget = new THREE.WebGLRenderTarget(newWidth, newHeight, {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        encoding: renderer.outputEncoding, // Preserve renderer's encoding
    });

    // Render to offscreen target
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);

    // Read pixels from the render target
    const gl = renderer.getContext();
    const pixels = new Uint8Array(newWidth * newHeight * 4);
    gl.readPixels(0, 0, newWidth, newHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Create an offscreen canvas
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = newWidth;
    offscreenCanvas.height = newHeight;
    const ctx = offscreenCanvas.getContext('2d');

    // Convert linear colors to sRGB for correct brightness
    const imageData = ctx.createImageData(newWidth, newHeight);
    for (let y = 0; y < newHeight; y++) {
        const sourceY = newHeight - y - 1;
        const sourceOffset = sourceY * newWidth * 4;
        const destOffset = y * newWidth * 4;

        imageData.data.set(pixels.subarray(sourceOffset, sourceOffset + newWidth * 4), destOffset);
    }
    ctx.putImageData(imageData, 0, 0);

    // Restore original render settings
    renderer.setRenderTarget(originalRenderTarget);
    camera.aspect = originalAspect;
    camera.updateProjectionMatrix();
    renderer.toneMapping = originalToneMapping;
    renderer.toneMappingExposure = originalExposure;
    renderer.outputEncoding = originalOutputEncoding;
    renderer.render(scene, camera);

    // Convert canvas to Blob and trigger download
    offscreenCanvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'current_view_screenshot.png';
        link.click();
        URL.revokeObjectURL(link.href);
    }, 'image/png');

    // Cleanup
    renderTarget.dispose();
}