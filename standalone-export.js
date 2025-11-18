// STANDALONE EXPORT - For live galleries only
// Creates export button and handles full gallery export process

async function exportStandaloneGallery() {
    try {
        // 1. Get current gallery data
        const currentData = await loadData();

        // 2. Get current palette
        const currentPalette = extractCurrentPalette();

        // 3. Create all three template versions with embedded GalleryUtils
        const templates = await createAllTemplateVersions(currentData, currentPalette);

        // 4. Create complete package
        await downloadCompleteGalleryPackage(templates, currentData.trip?.title || 'gallery');

        showNotification('Complete gallery package exported! Includes mystery, timeline, and grid templates.');

    } catch (error) {
        showNotification('Export failed: ' + error.message, 'error');
    }
}

async function createAllTemplateVersions(galleryData, palette) {
    // Get the GalleryUtils code to embed (from gallery-export.js)
    const galleryUtilsCode = await getGalleryUtilsCode();

    // Create the embedded data script that eliminates CORS issues
    const embeddedDataScript = `
// EMBEDDED GALLERY DATA - No CORS issues, no fetch needed!
let galleryData = ${JSON.stringify(galleryData, null, 2)};

${galleryUtilsCode}

// Override loadData to use embedded data instead of fetch
async function loadData() {
    return galleryData;
}

// Override any gallery data loading functions that use fetch
if (typeof loadGalleryData !== 'undefined') {
    async function loadGalleryData() {
        // Process embedded data for specific templates
        photoData = {};
        galleryData.photos.forEach(photo => {
            if (!photoData[photo.location]) {
                photoData[photo.location] = [];
            }
            photoData[photo.location].push(photo);
        });
        return galleryData;
    }
}
`;

    // Fetch templates
    const templates = {};
    const currentTemplate = detectCurrentTemplate();

    try {
        templates[currentTemplate] = document.documentElement.outerHTML;

        const templatePaths = {
            'grid': '/grid/',
            'mystery': '/mystery/',
            'timeline': '/timeline/'
        };

        for (const [type, path] of Object.entries(templatePaths)) {
            if (type !== currentTemplate) {
                try {
                    const response = await fetch(path);
                    templates[type] = await response.text();
                } catch (e) {
                    console.warn(`Could not fetch ${type} template:`, e);
                    templates[type] = createTemplatePlaceholder(type, galleryData);
                }
            }
        }

    } catch (error) {
        console.warn('Template fetching failed, using current template only');
        templates[currentTemplate] = document.documentElement.outerHTML;
    }

    // Process each template with embedded data
    const processedTemplates = {};
    for (const [type, html] of Object.entries(templates)) {
        processedTemplates[type] = processTemplateForStandalone(html, embeddedDataScript, type, palette);
    }

    return processedTemplates;
}

async function getGalleryUtilsCode() {
    // Fetch the GalleryUtils code from gallery-export.js
    try {
        const response = await fetch('./gallery-export.js');
        const fullCode = await response.text();

        // Extract just the GalleryUtils part
        const startMarker = '// GALLERY UTILS - Universal functionality for standalone galleries';
        const endMarker = '// Initialize when DOM is ready';

        const startIndex = fullCode.indexOf(startMarker);
        const endIndex = fullCode.indexOf(endMarker);

        if (startIndex !== -1 && endIndex !== -1) {
            return fullCode.substring(startIndex, endIndex + endMarker.length + fullCode.substring(endIndex).indexOf('});') + 3);
        }
    } catch (e) {
        console.warn('Could not fetch GalleryUtils from gallery-export.js:', e);
    }

    // Fallback: return basic GalleryUtils
    return getBasicGalleryUtils();
}

function getBasicGalleryUtils() {
    return `
// GALLERY UTILS - Basic version
const GalleryUtils = {
    saveGalleryData() {
        const blob = new Blob([JSON.stringify(galleryData, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gallery-data.json';
        a.click();
        URL.revokeObjectURL(url);
        this.showNotification('Gallery data saved!');
    },

    showNotification(message, type = 'success') {
        const div = document.createElement('div');
        const bgColor = type === 'success' ? '#28a745' : '#dc3545';
        div.style.cssText = \`
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: \${bgColor}; color: white; padding: 1rem; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-weight: 600; max-width: 300px;
        \`;
        div.textContent = message;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 4000);
    },

    init() {
        const params = new URLSearchParams(location.search);
        if (params.get('edit')) {
            this.enableEditMode();
        }
    },

    enableEditMode() {
        if (!document.getElementById('standalone-save')) {
            const saveBtn = document.createElement('button');
            saveBtn.id = 'standalone-save';
            saveBtn.textContent = '💾 Save Changes';
            saveBtn.style.cssText = \`
                position: fixed; top: 20px; left: 20px; z-index: 1000;
                padding: 8px 16px; background: #28a745; color: white; border: none;
                border-radius: 6px; font-weight: 600; cursor: pointer;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            \`;
            saveBtn.onclick = () => this.saveGalleryData();
            document.body.appendChild(saveBtn);
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    GalleryUtils.init();
});
`;
}

function processTemplateForStandalone(html, dataScript, templateType, palette) {
    let standalone = html;

    // 1. Inject embedded data and GalleryUtils at the very start of scripts
    standalone = standalone.replace('<script>', `<script>\n${dataScript}\n`);

    // 2. Remove server dependencies that could cause issues
    standalone = standalone.replace(/<link rel="stylesheet" href="[^"]*gallery-editor\.css"[^>]*>/g, '');
    standalone = standalone.replace(/<script src="[^"]*gallery-editor\.js"[^>]*><\/script>/g, '');

    // 3. Update navigation to work with local files
    const navReplacements = {
        'href="/grid/"': 'href="grid.html"',
        'href="/mystery/"': 'href="mystery.html"',
        'href="/timeline/"': 'href="timeline.html"',
        'href="/grid/?edit=1"': 'href="grid.html?edit=1"',
        'href="grid/"': 'href="grid.html"',
        'href="mystery/"': 'href="mystery.html"',
        'href="timeline/"': 'href="timeline.html"'
    };

    for (const [old, newVal] of Object.entries(navReplacements)) {
        standalone = standalone.replace(new RegExp(old, 'g'), newVal);
    }

    // 4. Remove localhost references
    standalone = standalone.replace(/http:\/\/[^.]+\.localhost:\d+\/galleries/g, '#');
    standalone = standalone.replace(/http:\/\/[^.]+\.localhost:\d+/g, '.');

    // 5. Update title
    standalone = standalone.replace(
        /<title>[^<]*<\/title>/,
        `<title>Gallery - ${templateType.charAt(0).toUpperCase() + templateType.slice(1)} (Standalone)</title>`
    );

    return standalone;
}

function detectCurrentTemplate() {
    const path = window.location.pathname;
    if (path.includes('/mystery')) return 'mystery';
    if (path.includes('/timeline')) return 'timeline';
    if (path.includes('/grid')) return 'grid';
    return 'grid'; // default
}

async function downloadCompleteGalleryPackage(templates, projectName) {
    // Create index.html with template selector
    const indexHTML = createGalleryIndex(projectName);

    // Create files object for zip
    const files = {
        'index.html': indexHTML,
        'grid.html': templates.grid || createTemplatePlaceholder('grid'),
        'mystery.html': templates.mystery || createTemplatePlaceholder('mystery'),
        'timeline.html': templates.timeline || createTemplatePlaceholder('timeline'),
        'gallery-data.json': JSON.stringify(await loadData(), null, 2),
        'README.md': createReadmeFile(projectName)
    };

    // Create and download zip (using JSZip if available, or individual files)
    if (window.JSZip) {
        const zip = new JSZip();
        for (const [filename, content] of Object.entries(files)) {
            zip.file(filename, content);
        }
        const blob = await zip.generateAsync({type: 'blob'});
        downloadBlob(blob, `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-complete.zip`);
    } else {
        // Fallback: download individual files
        for (const [filename, content] of Object.entries(files)) {
            const blob = new Blob([content], {type: filename.endsWith('.html') ? 'text/html' : 'text/plain'});
            downloadBlob(blob, filename);
        }
        showNotification('Individual files downloaded. Create a folder to organize them.');
    }
}

function createGalleryIndex(projectName) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName} - Gallery Collection</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 2rem; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 0.5rem; }
        .subtitle { color: #666; margin-bottom: 2rem; }
        .templates { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin: 2rem 0; }
        .template-card { background: #f8f9fa; padding: 1.5rem; border-radius: 8px; text-decoration: none; color: #333; transition: all 0.2s; }
        .template-card:hover { background: #e9ecef; transform: translateY(-2px); }
        .template-title { font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem; }
        .template-desc { font-size: 0.9rem; color: #666; }
        .note { background: #fff3cd; border: 1px solid #ffeaa7; padding: 1rem; border-radius: 6px; margin-top: 2rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📸 ${projectName}</h1>
        <p class="subtitle">Choose your viewing experience</p>

        <div class="templates">
            <a href="grid.html" class="template-card">
                <div class="template-title">🗂️ Grid View</div>
                <div class="template-desc">Grid layout with full editing capabilities. Best for organizing and managing photos.</div>
            </a>

            <a href="mystery.html" class="template-card">
                <div class="template-title">🔍 Mystery Dots</div>
                <div class="template-desc">Interactive discovery experience. Click dots to explore locations and photos.</div>
            </a>

            <a href="timeline.html" class="template-card">
                <div class="template-title">📅 Timeline</div>
                <div class="template-desc">Chronological journey through your photos. Perfect for storytelling.</div>
            </a>
        </div>

        <div class="note">
            <strong>💡 Editing:</strong> Add <code>?edit=1</code> to any URL to enable editing mode.
            Grid view has the most comprehensive editing features.
        </div>
    </div>
</body>
</html>`;
}

function createReadmeFile(projectName) {
    return `# ${projectName} - Standalone Gallery

This is a complete, self-contained gallery that works offline without any server.

## Files Included:
- **index.html** - Gallery selector page
- **grid.html** - Grid view with full editing capabilities
- **mystery.html** - Interactive mystery dots experience
- **timeline.html** - Chronological timeline view
- **gallery-data.json** - Your photo data
- **README.md** - This file

## How to Use:
1. Open \`index.html\` in your browser to choose a view
2. Add \`?edit=1\` to any URL to enable editing mode
3. Make changes and save to download updated gallery-data.json
4. Replace the gallery-data.json file with your downloaded version
5. Refresh to see changes

## Editing Features:
- **Grid**: Full drag-drop reordering, metadata editing, photo management
- **Mystery**: View-focused with basic editing capabilities
- **Timeline**: Chronological editing and date management

## Offline Capability:
This gallery works completely offline. No internet connection required after download.
Data is embedded directly in each HTML file - no external files needed!

Enjoy your standalone gallery!
`;
}

function createTemplatePlaceholder(type, galleryData) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>${type} Gallery - Placeholder</title>
</head>
<body>
    <h1>${type} template not available</h1>
    <p>This template could not be fetched. Please export from the ${type} page directly.</p>
</body>
</html>`;
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function extractCurrentPalette() {
    // Get palette from CSS custom properties
    const root = document.documentElement;
    const palette = {};

    // Extract all --c1, --c2, etc. variables
    const styles = getComputedStyle(root);
    for (let i = 1; i <= 6; i++) {
        palette[`--c${i}`] = styles.getPropertyValue(`--c${i}`).trim();
    }

    // Extract semantic variables
    ['--brand', '--accent', '--neutral-0', '--success', '--warning', '--danger', '--info'].forEach(prop => {
        palette[prop] = styles.getPropertyValue(prop).trim();
    });

    return palette;
}

function showNotification(message, type = 'success') {
    const div = document.createElement('div');
    const bgColor = type === 'success' ? '#28a745' : '#dc3545';
    div.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: ${bgColor}; color: white; padding: 1rem; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-weight: 600; max-width: 300px;
    `;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

// ADD EXPORT BUTTON TO LIVE GALLERIES
function addStandaloneExportButton() {
    // Find existing export button or create new one
    let exportBtn = document.getElementById('export-standalone');

    if (!exportBtn) {
        exportBtn = document.createElement('button');
        exportBtn.id = 'export-standalone';
        exportBtn.textContent = '📦 Export Standalone';
        exportBtn.style.cssText = `
            position: fixed; top: 70px; right: 20px; z-index: 1000;
            padding: 8px 16px; background: #28a745; color: white; border: none;
            border-radius: 6px; font-weight: 600; cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(exportBtn);
    }

    exportBtn.onclick = exportStandaloneGallery;
}

// Auto-add button when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(addStandaloneExportButton, 1000); // Wait for page to settle
});
