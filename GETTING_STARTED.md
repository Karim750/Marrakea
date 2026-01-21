# MARRAKEA ATLAS - Getting Started

## Quick Start

This is a **static website** that can be opened directly in a browser or served with a simple HTTP server.

### Option 1: Open Directly (Simplest)

Simply open `index.html` in your web browser:

```bash
open index.html
# or double-click index.html in your file explorer
```

**Note**: Some features (like loading JSON data) may not work when opening files directly due to browser CORS restrictions. Use Option 2 or 3 for full functionality.

### Option 2: Using Node.js HTTP Server (Recommended)

```bash
# Install http-server globally (one time only)
npm install -g http-server

# Start the server
npm run dev
# or
http-server -p 3000 -o
```

The site will open automatically at `http://localhost:3000`

### Option 3: Using Python (No Installation Required)

If you have Python installed:

```bash
# Python 3
python3 -m http.server 3000

# Python 2
python -m SimpleHTTPServer 3000
```

Then open `http://localhost:3000` in your browser.

### Option 4: Using Live Server (VS Code)

If you use VS Code:

1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Project Structure

```
marrakea-atlas/
├── index.html              # Homepage with interactive map
├── territoire.html         # Territory page template
├── objet.html             # Object/product page template
├── map.js                 # Interactive map JavaScript
├── territory.js           # Territory page logic
├── package.json           # Project metadata
├── styles/
│   ├── variables.css      # Design system & variables
│   ├── map.css           # Map-specific styles
│   └── territory.css     # Territory/object page styles
└── assets/
    ├── territories/       # Territory JSON data
    │   ├── haut-atlas.json
    │   ├── moyen-atlas.json
    │   ├── fes.json
    │   ├── rif.json
    │   └── sud.json
    └── images/           # Images (to be added)
        ├── territories/
        ├── objets/
        └── artisans/
```

## Features Implemented

### ✅ Phase 1: Interactive Map PoC

- [x] Interactive SVG map of Morocco
- [x] 5 territories documented (Haut Atlas, Moyen Atlas, Fès, Rif, Sud)
- [x] Hover tooltips on map regions
- [x] Click navigation to territory pages
- [x] Territory pages with geographic data
- [x] Object page template
- [x] Design system with "topographic map" aesthetic
- [x] Fully responsive layout
- [x] JSON-based territory data

## Navigation

1. **Homepage** (`index.html`)
   - Interactive map of Morocco
   - Click on any territory to explore
   - Preview cards of featured territories

2. **Territory Page** (`territoire.html?id=TERRITORY_ID`)
   - Geographic and climate data
   - Local materials and techniques
   - Objects from the territory
   - Examples:
     - `territoire.html?id=haut-atlas`
     - `territoire.html?id=moyen-atlas`
     - `territoire.html?id=fes`

3. **Object Page** (`objet.html?id=OBJECT_ID`)
   - Object details and specifications
   - Territory context
   - Artisan information
   - Example: `objet.html?id=tapis-azilal`

## Adding Content

### Adding a New Territory

1. Create a JSON file in `assets/territories/YOUR-TERRITORY-ID.json`:

```json
{
  "id": "your-territory-id",
  "name": "Territory Name",
  "geography": {
    "altitude": "500-1000m",
    "climate": "Description",
    "terrain": "Description"
  },
  "materials": ["Material 1", "Material 2"],
  "techniques": ["Technique 1", "Technique 2"],
  "context": [
    "Paragraph 1...",
    "Paragraph 2..."
  ],
  "crafts": [...]
}
```

2. Add the territory to the SVG map in `index.html`

3. Add territory data to `map.js` tooltips

### Adding Images

Place images in the appropriate directories:

- Territory photos: `assets/images/territories/`
- Object photos: `assets/images/objets/`
- Artisan photos: `assets/images/artisans/`

Update the `src` attributes in HTML files to reference your images.

## Design Philosophy

Following the README specifications:

- **Territory-centered**: Geography drives the narrative
- **Topographic aesthetic**: Inspired by maps, not decoration
- **Exploration-focused**: Encourages discovery
- **Geographic proof**: Every object linked to its territory

## Next Steps

### Phase 2 Enhancements (Future)

- [ ] Add more territories and objects
- [ ] Implement CMS for content management
- [ ] Add filters (by material, technique, territory)
- [ ] Zoom and pan functionality (D3.js)
- [ ] Animated transitions
- [ ] E-commerce integration

### Content Needed

- [ ] Territory photographs
- [ ] Object photographs (multiple angles)
- [ ] Artisan portraits
- [ ] More detailed territory data
- [ ] Object descriptions and stories

## Browser Compatibility

Tested and working on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

**Requirements**:
- CSS Grid support
- CSS Variables support
- ES6 JavaScript support
- SVG support

## Troubleshooting

**Territory data not loading?**
- Make sure you're using a local server (not opening files directly)
- Check browser console for errors
- Verify JSON files are valid

**Map not interactive?**
- Check that `map.js` is loading correctly
- Open browser console to check for JavaScript errors

**Styles not applying?**
- Verify CSS files are linked correctly in HTML
- Clear browser cache

## License

MIT License - See LICENSE file for details

---

**Version**: 2.0.0 — ATLAS / TERRITOIRES
**Status**: Phase 1 PoC Complete
