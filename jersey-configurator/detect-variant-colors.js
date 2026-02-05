/**
 * Utility script to detect colors in SVG variants and generate override JSON
 * 
 * Usage: node detect-variant-colors.js <family/design>
 * Example: node detect-variant-colors.js graphic/concrete
 * 
 * This script mimics the color detection logic from script.js to ensure accurate results.
 */

const fs = require('fs');
const path = require('path');

// All 8 variant keys
const VARIANT_KEYS = [
  'round_reglan', 'round_set_in',
  'insert_reglan', 'insert_set_in',
  'v_neck_reglan', 'v_neck_set_in',
  'v_neck_crossed_reglan', 'v_neck_crossed_set_in'
];

// Named color to hex mapping (subset of common colors)
const NAMED_COLORS = {
  'white': '#ffffff', 'black': '#000000', 'red': '#ff0000',
  'green': '#008000', 'blue': '#0000ff', 'yellow': '#ffff00',
  'gold': '#ffd700', 'silver': '#c0c0c0', 'gray': '#808080',
  'grey': '#808080', 'navy': '#000080', 'purple': '#800080',
  'orange': '#ffa500', 'pink': '#ffc0cb', 'cyan': '#00ffff',
  'magenta': '#ff00ff', 'lime': '#00ff00', 'maroon': '#800000',
  'olive': '#808000', 'teal': '#008080', 'aqua': '#00ffff'
};

/**
 * Normalize color to hex format
 */
function normalizeColorToHex(color) {
  if (!color) return null;
  color = color.trim().toLowerCase();
  
  // Already hex
  if (color.startsWith('#')) {
    // Normalize 3-char to 6-char
    if (/^#[a-f0-9]{3}$/i.test(color)) {
      return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    }
    return color;
  }
  
  // Named color
  if (NAMED_COLORS[color]) {
    return NAMED_COLORS[color];
  }
  
  // Skip url(), none, etc.
  if (color.startsWith('url(') || color === 'none') {
    return null;
  }
  
  return color;
}

/**
 * Extract colors from SVG content (mimics detectUniqueColors from script.js)
 */
function extractColorsFromSVG(svgContent) {
  const classMap = new Map();
  
  // Parse CSS style block
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const styleMatch = styleRegex.exec(svgContent);
  
  if (styleMatch && styleMatch[1]) {
    const cssContent = styleMatch[1];
    
    // Extract fill colors
    const fillClassRegex = /\.([a-zA-Z0-9_-]+)\s*\{[^}]*fill:\s*([^;}\s]+)[^}]*\}/g;
    let match;
    while ((match = fillClassRegex.exec(cssContent)) !== null) {
      const className = match[1];
      let color = normalizeColorToHex(match[2]);
      
      if (color && color !== 'none' && !color.startsWith('url(')) {
        classMap.set(className, { className, color, colorType: 'fill' });
      }
    }
    
    // Extract stroke colors
    const strokeClassRegex = /\.([a-zA-Z0-9_-]+)\s*\{[^}]*stroke:\s*([^;}\s]+)[^}]*\}/g;
    while ((match = strokeClassRegex.exec(cssContent)) !== null) {
      const className = match[1];
      let color = normalizeColorToHex(match[2]);
      
      if (color && color !== 'none' && !color.startsWith('url(')) {
        const strokeClassName = className + '__stroke';
        classMap.set(strokeClassName, { className: strokeClassName, originalClassName: className, color, colorType: 'stroke' });
      }
    }
  }
  
  // Check for elements without class (default black)
  // These are elements that would render with default black fill
  // Look for <path, <polygon, <rect, <circle, <ellipse that don't have a class attribute
  const elementRegex = /<(path|polygon|rect|circle|ellipse)\s+([^>]*)>/g;
  let elementMatch;
  let hasDefaultBlack = false;
  
  while ((elementMatch = elementRegex.exec(svgContent)) !== null) {
    const attributes = elementMatch[2];
    // Check if element has no class attribute OR has class but no fill defined for it
    if (!attributes.includes('class=')) {
      // Element without class - will use default black fill (unless fill attribute is set)
      if (!attributes.includes('fill=')) {
        hasDefaultBlack = true;
        break;
      }
    }
  }
  
  // Also check for elements with class that has no fill in CSS (they default to black)
  // This is a common pattern - path with class for grouping but no fill style
  if (!hasDefaultBlack) {
    const classedElementRegex = /<(path|polygon|rect)\s+[^>]*class="([^"]+)"[^>]*>/g;
    while ((elementMatch = classedElementRegex.exec(svgContent)) !== null) {
      const elementClasses = elementMatch[2].split(/\s+/);
      // Check if any of the classes have a fill defined
      let hasFillClass = false;
      for (const cls of elementClasses) {
        if (classMap.has(cls)) {
          hasFillClass = true;
          break;
        }
      }
      // If element has class but none with fill, it defaults to black
      if (!hasFillClass) {
        hasDefaultBlack = true;
        break;
      }
    }
  }
  
  if (hasDefaultBlack) {
    classMap.set('__default_black__', { className: '__default_black__', color: '#000000', colorType: 'fill' });
  }
  
  // Extract gradient colors
  const gradientRegex = /<(linearGradient|radialGradient)[^>]*id="([^"]+)"[^>]*>[\s\S]*?<\/\1>/gi;
  let gradientMatch;
  let gradientColorIndex = 0;
  
  while ((gradientMatch = gradientRegex.exec(svgContent)) !== null) {
    const gradientContent = gradientMatch[0];
    const stopRegex = /<stop[^>]*stop-color="([^"]+)"[^>]*>/g;
    let stopMatch;
    
    while ((stopMatch = stopRegex.exec(gradientContent)) !== null) {
      const color = normalizeColorToHex(stopMatch[1]);
      if (color) {
        const className = `__gradient_color_${gradientColorIndex}__`;
        if (!classMap.has(className)) {
          classMap.set(className, { className, color, colorType: 'gradient', isGradient: true });
          gradientColorIndex++;
        }
      }
    }
  }
  
  return Array.from(classMap.values());
}

/**
 * Get color signature (sorted list of unique colors)
 */
function getColorSignature(colors) {
  const uniqueColors = [...new Set(colors.map(c => c.color))].sort();
  return uniqueColors.join(', ');
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node detect-variant-colors.js <family/design>');
    console.log('Example: node detect-variant-colors.js graphic/concrete');
    process.exit(1);
  }
  
  const [family, design] = args[0].split('/');
  if (!family || !design) {
    console.error('Invalid format. Use: family/design');
    process.exit(1);
  }
  
  // SVG base path (relative to this script's location)
  const svgBasePath = path.join(__dirname, '..', 'designs', 'svg', family, design);
  
  if (!fs.existsSync(svgBasePath)) {
    console.error(`Design folder not found: ${svgBasePath}`);
    process.exit(1);
  }
  
  console.log(`\nAnalyzing: ${family}/${design}`);
  console.log('='.repeat(80));
  
  const variantColors = {};
  const colorSignatures = {};
  
  // Process each variant
  for (const variant of VARIANT_KEYS) {
    const svgFile = path.join(svgBasePath, `${variant}_${design}.svg`);
    
    if (!fs.existsSync(svgFile)) {
      console.log(`  [SKIP] ${variant}_${design}.svg - File not found`);
      continue;
    }
    
    const svgContent = fs.readFileSync(svgFile, 'utf8');
    const colors = extractColorsFromSVG(svgContent);
    
    variantColors[variant] = colors;
    colorSignatures[variant] = getColorSignature(colors);
  }
  
  // Find baseline (most common signature)
  const signatureCounts = {};
  Object.values(colorSignatures).forEach(sig => {
    signatureCounts[sig] = (signatureCounts[sig] || 0) + 1;
  });
  
  let baselineSignature = '';
  let maxCount = 0;
  for (const [sig, count] of Object.entries(signatureCounts)) {
    if (count > maxCount) {
      maxCount = count;
      baselineSignature = sig;
    }
  }
  
  // Find a baseline variant for class names
  let baselineVariant = null;
  for (const [variant, sig] of Object.entries(colorSignatures)) {
    if (sig === baselineSignature) {
      baselineVariant = variant;
      break;
    }
  }
  
  console.log(`\nBaseline Signature: ${baselineSignature}`);
  console.log(`Baseline Variant: ${baselineVariant}`);
  console.log('');
  
  // Print comparison table
  console.log('┌' + '─'.repeat(38) + '┬' + '─'.repeat(72) + '┬' + '─'.repeat(8) + '┐');
  console.log('│ ' + 'Variant'.padEnd(37) + '│ ' + 'Color Signature'.padEnd(71) + '│ ' + 'Match'.padEnd(7) + '│');
  console.log('├' + '─'.repeat(38) + '┼' + '─'.repeat(72) + '┼' + '─'.repeat(8) + '┤');
  
  const problemVariants = [];
  
  for (const variant of VARIANT_KEYS) {
    if (!colorSignatures[variant]) continue;
    
    const sig = colorSignatures[variant];
    const isMatch = sig === baselineSignature;
    const matchIcon = isMatch ? '✅' : '❌';
    
    const variantName = `${variant}_${design}.svg`;
    console.log('│ ' + variantName.padEnd(37) + '│ ' + sig.padEnd(71) + '│ ' + matchIcon.padEnd(6) + ' │');
    
    if (!isMatch) {
      problemVariants.push(variant);
    }
  }
  
  console.log('└' + '─'.repeat(38) + '┴' + '─'.repeat(72) + '┴' + '─'.repeat(8) + '┘');
  
  // Print detailed colors for each variant
  console.log('\n\n--- Detailed Colors Per Variant ---\n');
  
  for (const variant of VARIANT_KEYS) {
    if (!variantColors[variant]) continue;
    
    const isProblem = problemVariants.includes(variant);
    const marker = isProblem ? ' ❌ DIFFERENT' : '';
    
    console.log(`${variant}:${marker}`);
    variantColors[variant].forEach(c => {
      console.log(`  { "className": "${c.className}", "color": "${c.color}" }${c.isGradient ? ' // gradient' : ''}`);
    });
    console.log('');
  }
  
  // Generate JSON output
  if (problemVariants.length === 0) {
    console.log('\n✅ All variants match! No variant-specific overrides needed.');
    console.log('\nLegacy format JSON (if override needed):');
    console.log('```json');
    console.log(`"${design}": [`);
    if (variantColors[baselineVariant]) {
      variantColors[baselineVariant].forEach((c, i, arr) => {
        const comma = i < arr.length - 1 ? ',' : '';
        console.log(`  { "className": "${c.className}", "color": "${c.color}" }${comma}`);
      });
    }
    console.log(']');
    console.log('```');
  } else {
    console.log(`\n⚠️  ${problemVariants.length} variant(s) differ from baseline.`);
    console.log('\n--- JSON Override Structure ---\n');
    console.log('```json');
    console.log(`"${design}": {`);
    
    // Default (baseline)
    console.log('  "default": [');
    if (variantColors[baselineVariant]) {
      variantColors[baselineVariant].forEach((c, i, arr) => {
        const comma = i < arr.length - 1 ? ',' : '';
        console.log(`    { "className": "${c.className}", "color": "${c.color}" }${comma}`);
      });
    }
    console.log('  ],');
    
    // Problem variants
    console.log('  "variants": {');
    problemVariants.forEach((variant, vi) => {
      const isLast = vi === problemVariants.length - 1;
      console.log(`    "${variant}": [`);
      variantColors[variant].forEach((c, i, arr) => {
        const comma = i < arr.length - 1 ? ',' : '';
        console.log(`      { "className": "${c.className}", "color": "${c.color}" }${comma}`);
      });
      console.log(`    ]${isLast ? '' : ','}`);
    });
    console.log('  }');
    
    console.log('}');
    console.log('```');
  }
  
  console.log('\n📝 Note: Add "shouldSkip": true to colors you want to hide from the UI.');
}

main();
