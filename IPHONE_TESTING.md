# iPhone PWA Testing Guide (Mac Developer)

## Quick Setup

### 1. Network Access
```bash
# Start dev server with network access
npm run dev -- --host

# Your app will be available at:
# http://192.168.0.158:5173
```

### 2. iPhone Access Steps
1. **Connect to same WiFi** as your Mac
2. **Open Safari** on iPhone
3. **Navigate to**: `http://192.168.0.158:5173`
4. **Test PWA features**

## iPhone PWA Testing Checklist

### ✅ Basic PWA Features
- [ ] App loads in Safari
- [ ] "Add to Home Screen" option appears
- [ ] App installs to home screen
- [ ] App opens in standalone mode (no Safari UI)
- [ ] App icon appears correctly

### ✅ PWA Functionality
- [ ] Offline access works
- [ ] App updates automatically
- [ ] Navigation works smoothly
- [ ] Forms and interactions work
- [ ] Camera/photo features work (if applicable)

### ✅ iOS-Specific Features
- [ ] Status bar color matches theme
- [ ] Splash screen displays correctly
- [ ] Touch interactions work properly
- [ ] No horizontal scrolling issues
- [ ] Keyboard doesn't cover inputs

## iPhone Testing Methods

### Method 1: Direct Network Access
- **URL**: `http://192.168.0.158:5173`
- **Browser**: Safari
- **Network**: Same WiFi as Mac

### Method 2: QR Code (Easiest)
```bash
# Install QR code generator
npm install -g qrcode-terminal

# Generate QR code
qrcode-terminal "http://192.168.0.158:5173"
```
- Scan QR code with iPhone Camera app
- Tap notification to open in Safari

### Method 3: AirDrop (Alternative)
1. Open Safari on Mac
2. Navigate to `http://localhost:5173`
3. Share page via AirDrop to iPhone
4. Open on iPhone

## iOS PWA Specific Notes

### Safari Requirements
- **iOS 11.3+** required for PWA support
- **Safari only** - Chrome on iOS doesn't support PWA install
- **HTTPS required** for production (HTTP works for local testing)

### Install Process on iPhone
1. Open app in Safari
2. Tap **Share button** (square with arrow)
3. Scroll down to **"Add to Home Screen"**
4. Tap **"Add"**
5. App appears on home screen

### Standalone Mode
- App opens without Safari UI
- Status bar shows app theme color
- Full-screen experience
- No back button or address bar

## Debugging iPhone Issues

### Common Problems & Solutions

#### Install Option Not Showing
- Ensure you're using Safari (not Chrome)
- Check manifest.json is valid
- Verify service worker is registered
- Try refreshing the page

#### App Not Installing
- Check iOS version (11.3+)
- Ensure HTTPS in production
- Verify manifest.json paths
- Clear Safari cache

#### Offline Not Working
- Check service worker registration
- Verify cache strategies
- Test airplane mode
- Check console for errors

#### Layout Issues
- Test different iPhone screen sizes
- Check viewport meta tag
- Verify responsive design
- Test orientation changes

## iPhone Simulator (Alternative)

### Using Xcode Simulator
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Open iPhone Simulator
open -a Simulator

# Navigate to your app URL in simulator Safari
```

### Simulator Benefits
- Test different iPhone models
- Debug with Safari Web Inspector
- Test offline scenarios
- Faster iteration

## Production Testing

### Deploy to HTTPS
```bash
# Build for production
npm run build

# Deploy to Vercel/Netlify
# Test on real iPhone with HTTPS
```

### Real Device Testing
- Test on multiple iPhone models
- Test different iOS versions
- Test with different network conditions
- Gather user feedback

## Performance Testing

### Safari Web Inspector
1. Connect iPhone to Mac via USB
2. Open Safari on Mac
3. Develop → [Your iPhone] → [Your App]
4. Use Web Inspector for debugging

### Lighthouse Testing
1. Open Chrome DevTools
2. Run Lighthouse audit
3. Check PWA score
4. Optimize based on results

## Quick Commands

```bash
# Start dev server with network access
npm run dev -- --host

# Generate QR code
qrcode-terminal "http://192.168.0.158:5173"

# Build for production
npm run build

# Check current IP
ifconfig | grep "inet " | grep -v 127.0.0.1
``` 