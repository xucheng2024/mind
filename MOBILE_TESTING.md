# Mobile PWA Testing Guide

## Quick Access URLs

### Development (Local Network)
- **URL**: `http://192.168.0.158:5173`
- **QR Code**: Scan the QR code displayed in terminal
- **Network**: Same WiFi network required

### Production Testing
- **Build**: `npm run build`
- **Serve**: `npx serve dist`
- **URL**: `http://192.168.0.158:3000`

## Testing Steps

### 1. Basic PWA Features
- [ ] App loads on mobile browser
- [ ] Install prompt appears (bottom-right button)
- [ ] App installs successfully
- [ ] App opens in standalone mode (no browser UI)
- [ ] App icon appears on home screen

### 2. PWA Functionality
- [ ] Offline access works
- [ ] App updates automatically
- [ ] Navigation works smoothly
- [ ] Forms and interactions work
- [ ] Camera/photo features work

### 3. Performance Testing
- [ ] Fast loading times
- [ ] Smooth animations
- [ ] Responsive design
- [ ] Touch interactions work

## Device Testing Checklist

### iOS (Safari)
- [ ] Install prompt appears
- [ ] "Add to Home Screen" works
- [ ] App runs in standalone mode
- [ ] Offline functionality works

### Android (Chrome)
- [ ] Install prompt appears
- [ ] "Add to Home Screen" works
- [ ] App runs in standalone mode
- [ ] Offline functionality works

### Android (Samsung Internet)
- [ ] Install prompt appears
- [ ] "Add to Home Screen" works
- [ ] App runs in standalone mode

## Chrome DevTools Mobile Testing

1. Open Chrome DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select device (iPhone/Android)
4. Test PWA features:
   - Application tab → Manifest
   - Application tab → Service Workers
   - Lighthouse → PWA audit

## Common Issues & Solutions

### Install Prompt Not Showing
- Ensure HTTPS in production
- Check manifest.json is valid
- Verify service worker is registered

### Offline Not Working
- Check service worker cache
- Verify workbox configuration
- Test network throttling

### App Icon Issues
- Ensure 192x192 and 512x512 icons exist
- Check icon paths in manifest.json
- Test on different devices

## Performance Optimization

### Lighthouse Score Targets
- **Performance**: 90+
- **Accessibility**: 90+
- **Best Practices**: 90+
- **SEO**: 90+
- **PWA**: 90+

### Testing Tools
- Chrome DevTools Lighthouse
- WebPageTest
- GTmetrix
- PageSpeed Insights

## Production Deployment

1. Build the app: `npm run build`
2. Deploy to hosting service (Vercel, Netlify, etc.)
3. Test on real devices
4. Monitor performance metrics
5. Gather user feedback

## Debug Commands

```bash
# Development with network access
npm run dev -- --host

# Production build
npm run build

# Serve production build
npx serve dist

# Check PWA manifest
curl http://localhost:5173/manifest.json

# Test service worker
curl http://localhost:5173/sw.js
``` 