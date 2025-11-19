# Waypoint Universe - Complete Usage Guide

## Overview

The Waypoint Universe system allows you to:
1. **Export** spatial galleries as standalone, offline-capable packages
2. **Share** waypoints from galleries to a central Universe hub
3. **Connect** waypoints across multiple galleries through semantic tags (infoTerms)
4. **Explore** relationships between waypoints from different sources

---

## Quick Start

### For Gallery Creators:

1. **Add the export script to your live gallery:**
   ```html
   <script src="standalone-export.js"></script>
   ```

2. **Export your gallery:**
   - Click the "📦 Export Standalone" button
   - Download the complete ZIP package
   - Extract and open `index.html`

3. **Share to Universe:**
   - Open your exported gallery
   - Click "🌐 Open Universe"
   - Click "🌌 Share to Universe"
   - Your waypoints are now in the Universe!

### For Universe Users:

1. **Open the Waypoint Universe:**
   - Navigate to `index.html` in your browser
   - Or visit the hosted version at `https://alethal.github.io/waypoint-universe/`

2. **Receive waypoints:**
   - Waypoints are automatically received from galleries via postMessage
   - Search and explore waypoints by title, tags, or gallery
   - See connections between waypoints with shared infoTerms

---

## Detailed Workflow

### 1. Gallery Export Process

#### What Gets Exported:
- **3 HTML templates**: Grid, Mystery, Timeline views
- **Embedded data**: Gallery data baked directly into HTML
- **GalleryUtils**: JavaScript utilities for editing and sharing
- **Color palette**: Current CSS custom properties preserved
- **README.md**: Complete usage instructions

#### Export Package Structure:
```
project-name-complete.zip
├── index.html           # Template selector
├── grid.html           # Grid view + embedded data
├── mystery.html        # Mystery dots + embedded data
├── timeline.html       # Timeline + embedded data
├── gallery-data.json   # Data backup
└── README.md           # Instructions
```

#### Technical Details:
- **No CORS issues**: Data is embedded directly in HTML
- **Offline-capable**: Works without internet connection
- **Edit mode**: Add `?edit=1` to any URL to enable editing
- **Self-contained**: No external dependencies

---

### 2. Universe Integration

#### Communication Protocol:

**Gallery → Universe (Share)**
```javascript
{
  type: 'share',
  projectId: 'gallery-name',
  galleryData: {
    photos: [
      {
        title: 'Photo name',
        'sub-points': [
          {
            id: 'waypoint-id',
            title: 'Waypoint name',
            infoTerms: ['tag1', 'tag2'],
            perspectiveDesc: 'Description',
            emoji: '📍'
          }
        ]
      }
    ]
  }
}
```

**Universe → Gallery (Acknowledgment)**
```javascript
{
  type: 'universe-ack',
  waypointsReceived: 42
}
```

#### Three Ways to Share:

1. **Popup Mode** (Recommended):
   - Click "🌐 Open Universe" in gallery
   - Enter Universe URL
   - Universe opens in popup window
   - Click "🌌 Share to Universe"
   - Visual feedback confirms sharing

2. **iframe Mode** (Automatic):
   - Load gallery inside Universe iframe
   - Sharing happens automatically to parent window
   - Best for embedded galleries

3. **Manual Mode** (Advanced):
   ```javascript
   // In gallery console:
   GalleryUtils.shareToUniverse();
   ```

---

### 3. Waypoint Data Structure

#### Waypoint Object:
```javascript
{
  id: 'unique-id',                    // Waypoint identifier
  title: 'Waypoint Name',             // Display name
  gallery_id: 'source-gallery',       // Source gallery
  photo_title: 'Photo Name',          // Associated photo
  infoTerms: [                        // Semantic tags
    'authentic-italian',
    'culinary-heritage',
    'family-recipe'
  ],
  perspectiveDesc: 'User perspective', // Description
  linkedPhotoId: 'photo-123',         // Photo reference
  emoji: '🍝',                        // Visual marker
  received_at: '2025-11-18T...',      // Timestamp
  similarity: 0.85,                   // Connection strength
  groupers: ['trip-2024']             // Categories
}
```

#### InfoTerms (Semantic Tags):
InfoTerms are the **key to connecting waypoints** across galleries:
- Tags that describe concepts, themes, or attributes
- Example: `authentic-italian`, `culinary-heritage`, `street-food`
- Waypoints with overlapping infoTerms create **connections**
- Universe calculates connection strength based on shared terms

---

### 4. Universe Features

#### Statistics Dashboard:
- **Total Waypoints**: Count of all waypoints in universe
- **Total Galleries**: Number of connected galleries
- **Connections**: Waypoints with shared infoTerms
- **Unique Terms**: Distinct infoTerms across all waypoints

#### Search Capabilities:
- **Title search**: Find waypoints by name
- **Gallery search**: Filter by source gallery
- **Tag search**: Search by infoTerms
- **Real-time filtering**: Instant results as you type

#### Data Persistence:
- **localStorage**: All data stored locally in browser
- **JSON export**: Download complete universe data
- **Import capability**: Restore from backup
- **No server required**: Fully client-side

---

## Advanced Usage

### Custom Universe URLs

You can customize the default Universe URL in `standalone-export.js`:

```javascript
// Line 154 - Change default URL
const universeUrl = prompt(
    'Enter the URL of your Waypoint Universe:',
    'https://YOUR-CUSTOM-URL.com/waypoint-universe/'  // ← Change this
);
```

### Self-Hosting the Universe

1. Clone or download this repository
2. Host `index.html` on any web server (GitHub Pages, Netlify, etc.)
3. Update gallery export scripts to point to your URL
4. Share URL with other gallery creators

### Multiple Universes

You can create specialized universes for different purposes:
- **Personal Universe**: Your own waypoints only
- **Team Universe**: Shared waypoints for a group
- **Public Universe**: Open to anyone
- **Topic Universe**: Specific themes (food, travel, art, etc.)

### Extending the System

#### Add Custom Fields:
```javascript
// In Universe, extend waypoint processing:
const enrichedWaypoint = {
    ...waypoint,
    gallery_id: galleryId,
    photo_title: photo.title,
    received_at: new Date().toISOString(),
    // Add custom fields:
    custom_category: photo.category,
    custom_rating: photo.rating
};
```

#### Add Visualizations:
- Graph view of waypoint connections
- Map view of geographic waypoints
- Timeline of waypoints over time
- Tag cloud of infoTerms

---

## Troubleshooting

### Export Issues

**Problem**: Export button doesn't appear
- **Solution**: Ensure `standalone-export.js` is loaded
- **Check**: Console for script errors
- **Verify**: Button auto-adds 1 second after page load

**Problem**: Templates missing from export
- **Solution**: Export from the template page directly
- **Alternative**: Templates fall back to placeholders if unavailable

### Sharing Issues

**Problem**: "Please open Waypoint Universe first!"
- **Solution**: Click "🌐 Open Universe" before sharing
- **Alternative**: Load gallery in iframe within Universe

**Problem**: Popup blocked
- **Solution**: Allow popups in browser settings
- **Alternative**: Manually open Universe in new tab

**Problem**: No acknowledgment received
- **Solution**: Check browser console for errors
- **Verify**: Universe is actually open and loaded
- **Check**: Cross-origin restrictions (use same protocol)

### Universe Issues

**Problem**: Waypoints not appearing
- **Solution**: Check localStorage for data
- **Verify**: postMessage listener is active
- **Console**: Look for "Received waypoint data" message

**Problem**: Lost all waypoints
- **Solution**: Check browser localStorage (DevTools → Application → localStorage)
- **Recovery**: If you have backup gallery data, re-share to Universe

---

## Best Practices

### For Gallery Creators:

1. **Use descriptive infoTerms**: Choose tags that others might use
2. **Be consistent**: Use similar tagging conventions across galleries
3. **Include context**: Add perspectiveDesc to explain waypoints
4. **Test locally**: Export and test before sharing widely
5. **Backup data**: Download `gallery-data.json` regularly

### For Universe Operators:

1. **Document your URL**: Make it easy for galleries to find
2. **Monitor storage**: localStorage has limits (~5-10MB)
3. **Export regularly**: Download universe data as backup
4. **Curate terms**: Consider standardizing infoTerms
5. **Security**: In production, validate `event.origin` in postMessage listener

### For Users:

1. **Search effectively**: Use partial matches (e.g., "ital" finds "italian")
2. **Explore connections**: Click waypoints to see shared terms
3. **Track sources**: Note which galleries contribute which waypoints
4. **Contribute back**: Create your own galleries and share waypoints

---

## Security Considerations

### Current Implementation (Development):
```javascript
// Accepts messages from any origin (line 328)
window.addEventListener('message', (event) => {
    // ⚠️ No origin check
    const data = event.data;
    // ...
});
```

### Production Implementation:
```javascript
window.addEventListener('message', (event) => {
    // ✅ Validate origin
    const allowedOrigins = [
        'https://yoursite.com',
        'https://trusted-gallery.com'
    ];

    if (!allowedOrigins.includes(event.origin)) {
        console.warn('Rejected message from:', event.origin);
        return;
    }

    const data = event.data;
    // ... process message
});
```

### Recommendations:

1. **Whitelist origins**: Only accept messages from trusted sources
2. **Validate data**: Check message structure before processing
3. **Sanitize input**: Clean data before displaying (XSS prevention)
4. **Rate limiting**: Prevent spam from malicious galleries
5. **User consent**: Ask before receiving large datasets

---

## API Reference

### GalleryUtils Methods

#### `saveGalleryData()`
Download current gallery data as JSON file.

#### `showNotification(message, type = 'success')`
Display toast notification.
- `message`: String to display
- `type`: 'success' or 'error'

#### `openWaypointUniverse()`
Open Universe in popup window.
- Prompts for Universe URL
- Opens centered popup window
- Stores window reference for sharing

#### `shareToUniverse()`
Send waypoint data to Universe.
- Detects popup or parent window
- Sends postMessage with gallery data
- Displays confirmation notification

#### `init()`
Initialize GalleryUtils.
- Checks for `?edit=1` parameter
- Adds Universe buttons
- Sets up message listeners

#### `addUniverseButtons()`
Add "Share to Universe" and "Open Universe" buttons to page.

#### `enableEditMode()`
Add "Save Changes" button for editing.

---

## Roadmap

### Planned Features:

- [ ] Graph visualization of waypoint connections
- [ ] Export Universe data as JSON/CSV
- [ ] Import Universe data from backup
- [ ] User accounts and permissions
- [ ] Server-side storage option
- [ ] Real-time sync between galleries
- [ ] Mobile-responsive design improvements
- [ ] Advanced search (boolean operators, filters)
- [ ] Waypoint similarity scoring
- [ ] Automated term suggestions
- [ ] Gallery statistics and analytics
- [ ] Embeddable Universe widget
- [ ] API for programmatic access

---

## Contributing

### How to Contribute:

1. **Report issues**: Found a bug? Let us know!
2. **Suggest features**: Ideas for improvements welcome
3. **Share galleries**: Create and share interesting waypoints
4. **Improve docs**: Help make this guide better
5. **Code contributions**: Submit pull requests

---

## License & Credits

**Waypoint Universe** is part of the ACCID (Accessible Creative Content & Interactive Discovery) ecosystem.

For questions, feedback, or support, please open an issue on GitHub.

---

## Quick Reference Card

### Gallery Creator Commands:
```
Export Gallery:    Click "📦 Export Standalone"
Open Universe:     Click "🌐 Open Universe"
Share Waypoints:   Click "🌌 Share to Universe"
Enable Editing:    Add ?edit=1 to URL
Save Changes:      Click "💾 Save Changes"
```

### Universe Commands:
```
Search:            Type in search box
View Stats:        Check dashboard
Clear Data:        localStorage.clear()
Export Data:       (Coming soon)
```

### Console Commands:
```javascript
// Gallery:
GalleryUtils.shareToUniverse()
GalleryUtils.saveGalleryData()

// Universe:
universe.waypoints              // View all waypoints
localStorage.getItem('waypoint_universe_data')  // Raw data
```

---

**Happy waypoint hunting! 🌌**
