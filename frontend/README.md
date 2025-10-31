# Frontend - Plant Disease Detection

Modern, responsive frontend for the Plant Disease Detection System.

## 🎨 Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean, professional interface with smooth animations
- **Dark Mode**: Toggle between light and dark themes
- **Real-time Stats**: Track predictions and confidence scores
- **History Management**: View and export prediction history
- **Treatment Display**: Interactive display of disease recommendations
- **Progressive Enhancement**: Works without JavaScript for basic functionality

## 📁 File Structure

```
frontend/
├── index.html           # Main HTML structure
├── css/
│   └── style.css       # All styles and animations
└── js/
    └── app.js          # Application logic
```

## 🚀 Usage

The frontend is served automatically by the FastAPI backend. Simply start the backend server and navigate to `http://localhost:8000`.

### Standalone Development

To work on the frontend independently:

1. Use a local web server (not just opening the HTML file):
```bash
# Using Python
python -m http.server 8080

# Using Node.js http-server
npx http-server .
```

2. Update API endpoints in `js/app.js` if needed

## 🎯 Key Components

### Image Detection Card
- File upload with preview
- Drag-and-drop support (in supported browsers)
- Real-time analysis with loading indicator
- Results display with confidence bar

### Text Detection Card
- Multi-line text input
- Symptom description analysis
- Formatted results display

### Recommendations Section
- Disease information display
- Symptoms list
- Treatment recommendations
- Prevention methods
- Organic solutions
- Conditional display (shows only when disease detected)

### History Section
- Chronological prediction list
- Confidence indicators
- Time-ago timestamps
- Clear history option
- Persistent storage using LocalStorage

### Statistics Bar
- Total predictions count
- Average confidence score
- Today's predictions count
- Real-time updates

## 💅 Styling

### Color Palette

- **Primary Green**: `#10b981` (Success, healthy states)
- **Dark Background**: `#0f172a`, `#1e293b` (Headers, cards in dark mode)
- **Light Background**: `#f8fafc` (Page background)
- **Error Red**: `#ef4444` (Errors, warnings)
- **Info Blue**: `#3b82f6` (Information cards)
- **Warning Yellow**: `#f59e0b` (Symptoms)

### Typography

- **Font Family**: System fonts (Apple system, Segoe UI, Roboto)
- **Headings**: 700 weight, various sizes
- **Body Text**: 400-600 weight
- **Monospace**: For code/technical content

### Responsive Breakpoints

- **Desktop**: > 768px (Full layout)
- **Mobile**: ≤ 768px (Stacked layout)

## 🔧 JavaScript Features

### LocalStorage Usage

The app stores:
- `predictionHistory`: Array of prediction objects
- `stats`: Statistics object (total, today, confidence sum)
- `darkMode`: Boolean for theme preference

### Data Structure

```javascript
// Prediction object
{
  type: 'Image' | 'Text',
  disease: 'Disease_Name',
  confidence: '95.50',
  input: 'filename or text',
  timestamp: '2025-10-31T...',
  recommendations: { /* full recommendation object */ }
}

// Stats object
{
  total: 10,
  confidenceSum: 950.5,
  today: 3,
  lastDate: 'Thu Oct 31 2025'
}
```

## 🎨 CSS Classes

### Utility Classes
- `.loading` - Loading spinner container
- `.loading.active` - Visible loading state
- `.result.success` - Success message styling
- `.result.error` - Error message styling
- `.modal` - Modal overlay
- `.toast` - Notification toast

### Component Classes
- `.card` - Main card containers
- `.recommendation-card` - Treatment recommendation cards
- `.history-item` - Individual history entries
- `.confidence-bar` - Progress bar for confidence
- `.stats-bar` - Statistics display

## ⌨️ Keyboard Shortcuts

- `Ctrl/Cmd + D` - Toggle dark mode
- `Ctrl/Cmd + E` - Export data

## 🔄 API Integration

The frontend communicates with these API endpoints:

```javascript
// Image prediction
POST /api/image-prediction
FormData: { file: <image> }

// Text prediction
POST /api/text-prediction
JSON: { input: "symptom description" }
```

## 🎭 Animations

- **Loading Screen**: 2-second fade-out on page load
- **Card Hover**: Subtle lift effect
- **Slide In**: Results and recommendations
- **Spinner**: Rotating loading indicator
- **Toast**: Slide up notification
- **Confidence Bar**: Smooth width transition

## 📱 Mobile Optimization

- Touch-friendly buttons and inputs
- Optimized font sizes
- Stacked card layout
- Simplified statistics display
- Bottom-aligned modals
- Reduced padding on smaller screens

## 🌙 Dark Mode

Dark mode automatically:
- Inverts color scheme
- Maintains readability
- Preserves user preference
- Smooth transitions

Toggle programmatically:
```javascript
toggleDarkMode();
```

## 🔍 Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile browsers**: Full support

Requires:
- ES6+ JavaScript support
- CSS Grid and Flexbox
- LocalStorage API
- Fetch API

## 📊 Performance

- Lazy loading of images
- Debounced scroll events
- Optimized CSS animations
- Minimal JavaScript bundle
- No external dependencies

## 🛠️ Customization

### Change Theme Colors

Edit `css/style.css`:
```css
:root {
  --primary-color: #10b981;
  --dark-bg: #0f172a;
  /* ... other variables ... */
}
```

### Modify Layout

All responsive breakpoints in `css/style.css`:
```css
@media (max-width: 768px) {
  /* Mobile styles */
}
```

## 🐛 Troubleshooting

### Styles not loading
- Check file paths in `index.html`
- Ensure server is serving static files correctly

### API calls failing
- Verify backend is running
- Check browser console for CORS errors
- Confirm API endpoint URLs

### LocalStorage not persisting
- Check browser privacy settings
- Ensure not in incognito/private mode
- Verify localStorage is enabled

## 🚀 Future Enhancements

- [ ] PWA support for offline functionality
- [ ] Image crop/rotate before upload
- [ ] Multiple image upload
- [ ] Comparison view for multiple predictions
- [ ] PDF export of recommendations
- [ ] Multi-language support

---

**Frontend - Plant Disease Detection System**
