# Troubleshooting Guide - Attensi Spin

## 🔧 Common Issues & Solutions

### Installation Issues

#### Problem: `npm install` fails
**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try with legacy peer deps
npm install --legacy-peer-deps

# Update npm
npm install -g npm@latest
```

#### Problem: Node version incompatible
**Solution:**
```bash
# Check your Node version
node --version

# Need Node 14+ (18+ recommended)
# Use nvm to switch versions:
nvm install 18
nvm use 18
```

---

### Development Server Issues

#### Problem: Port 5173 already in use
**Solutions:**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

#### Problem: Server won't start
**Solutions:**
```bash
# Check for errors
npm run dev

# Clear Vite cache
rm -rf node_modules/.vite

# Restart from scratch
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

### QR Code Issues

#### Problem: QR code doesn't scan
**Possible causes & solutions:**

1. **QR code too small**
   - Increase size in `QRCodePanel.jsx`:
   ```javascript
   <QRCodeSVG size={250} />  // Increase from 180
   ```

2. **URL not accessible**
   - Check firewall settings
   - Ensure mobile is on same network (for localhost)
   - Use the Network URL instead of localhost

3. **QR code blurry**
   - Increase `level` prop:
   ```javascript
   <QRCodeSVG level="H" />  // Already at highest
   ```

#### Problem: Scanned QR but page won't load
**Solutions:**
- Check if dev server is running
- Verify URL is correct
- Try accessing URL directly in mobile browser
- Check mobile browser console for errors

---

### Name Sync Issues

#### Problem: Names not syncing between devices
**This is expected!** 

The current version uses localStorage which is:
- ✅ Per-device storage
- ❌ Not synced across devices

**Solutions:**
1. **Same Device**: Works automatically
2. **Different Devices**: Need backend integration

**Quick fix for testing:**
Use the same browser on different tabs - it will sync!

**Permanent fix:**
Integrate Firebase or Supabase (see DEPLOYMENT.md)

---

### Wheel Issues

#### Problem: Wheel not spinning
**Check:**
1. Are there at least 2 names?
2. Is button disabled? (should be cyan, not gray)
3. Check browser console for errors

**Solutions:**
```javascript
// In Wheel.jsx, add console logs:
console.log('Spin started', names.length);
```

#### Problem: Wheel segments overlapping text
**Solution:**
Reduce text size or segment count in `Wheel.jsx`:
```javascript
ctx.font = 'bold 14px Arial';  // Reduce from 16px
```

#### Problem: Winner always the same
**Check randomization in Wheel.jsx:**
```javascript
// Should have random calculation:
const extraDegrees = Math.random() * 360;
```

#### Problem: Wheel looks pixelated
**Solution:**
Increase canvas resolution:
```javascript
<canvas width={600} height={600} />  // Increase from 500
```

---

### Animation Issues

#### Problem: Animations stuttering
**Solutions:**
1. **Close other tabs/apps** (free up memory)
2. **Reduce confetti duration** in `WinnerModal.jsx`:
```javascript
const duration = 2000;  // Reduce from 3000
```
3. **Disable animations** (for testing):
```css
* {
  animation: none !important;
  transition: none !important;
}
```

#### Problem: Confetti not showing
**Check:**
1. Modal is actually showing
2. Browser supports canvas
3. No console errors

**Debug:**
```javascript
// In WinnerModal.jsx
console.log('Confetti triggered');
```

---

### Mobile Issues

#### Problem: Layout broken on mobile
**Check:**
1. Viewport meta tag in `index.html`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

2. Test responsive breakpoints:
- Open DevTools
- Toggle device toolbar
- Test different screen sizes

#### Problem: Buttons too small on mobile
**Solution in CSS:**
```css
@media (max-width: 480px) {
  .spin-button {
    padding: 20px 50px;  /* Increase padding */
    font-size: 24px;     /* Increase font */
  }
}
```

#### Problem: Input keyboard covers form
**Solution:**
Add in CSS:
```css
.add-name-page {
  padding-bottom: 300px; /* Extra space for keyboard */
}
```

---

### Build Issues

#### Problem: Build fails
**Check for:**
1. **Syntax errors** in code
2. **Missing dependencies**
3. **Import errors**

**Solutions:**
```bash
# Clear everything
rm -rf node_modules dist .vite package-lock.json

# Fresh install
npm install

# Try build again
npm run build

# Check specific errors
npm run build 2>&1 | tee build.log
```

#### Problem: Build succeeds but app broken
**Common causes:**
1. **Routing issues** - Add `.htaccess` or nginx config
2. **Asset paths** - Check `vite.config.js` base path
3. **Environment vars** - Check if any are missing

---

### localStorage Issues

#### Problem: Names not persisting
**Check:**
1. localStorage enabled in browser
2. Not in incognito/private mode
3. Storage not full

**Test:**
```javascript
// In browser console:
localStorage.setItem('test', 'value');
console.log(localStorage.getItem('test'));
```

#### Problem: Old data causing issues
**Solution:**
```javascript
// Clear all storage
localStorage.clear();

// Or just app data
localStorage.removeItem('attensi-spin-names');
localStorage.removeItem('attensi-spin-winners');
```

---

### Performance Issues

#### Problem: App running slow
**Quick fixes:**
1. **Reduce participants** (if 100+)
2. **Disable confetti** temporarily
3. **Close other tabs**
4. **Update browser**

**Optimization in code:**
```javascript
// In Wheel.jsx, reduce draw frequency:
if (progress < 1) {
  setTimeout(() => requestAnimationFrame(animate), 16); // ~60fps
}
```

---

### Browser-Specific Issues

#### Safari Issues
**Known problems:**
- Backdrop blur may not work
- Some animations may be different

**Solutions:**
```css
/* Fallback for Safari */
@supports not (backdrop-filter: blur(10px)) {
  .modal-overlay {
    background: rgba(10, 22, 40, 0.98);
  }
}
```

#### iOS Safari Issues
**Problem:** Input zooms in
**Solution:**
```css
input {
  font-size: 16px; /* Prevents zoom on iOS */
}
```

---

### Debugging Tips

#### Enable Debug Mode
Add to `WheelPage.jsx`:
```javascript
const DEBUG = true;

if (DEBUG) {
  console.log('Names:', names);
  console.log('Winners:', winners);
  console.log('IsSpinning:', isSpinning);
}
```

#### Check Console
Always check browser console:
- Right-click → Inspect
- Console tab
- Look for red errors

#### Network Tab
Check if resources loading:
- Open DevTools
- Network tab
- Reload page
- Check for 404 errors

#### React DevTools
Install React DevTools extension:
- View component tree
- Check state values
- Monitor re-renders

---

### Getting Help

If you're still stuck:

1. **Check GitHub Issues** (if repo exists)
2. **Review documentation:**
   - README.md
   - DEPLOYMENT.md
   - This file!
3. **Check logs:**
   ```bash
   npm run dev 2>&1 | tee dev.log
   ```
4. **Minimal reproduction:**
   - Comment out code until it works
   - Find what breaks it

---

### Emergency Reset

If everything is broken:

```bash
# Nuclear option - start completely fresh
cd ..
rm -rf attensi-spin
# Re-extract from backup/outputs
cd attensi-spin
npm install
npm run dev
```

---

### Known Limitations

These are **not bugs**, they're design choices:

1. ❌ No cross-device sync (need backend)
2. ❌ No sound effects (can be added)
3. ❌ Wheel text unreadable with 50+ names (by design)
4. ❌ No undo function (could be added)
5. ❌ No export to file (could be added)

---

### Prevention Tips

**Avoid issues by:**
- ✅ Testing locally before deploying
- ✅ Using supported browsers
- ✅ Keeping dependencies updated
- ✅ Reading console warnings
- ✅ Testing on mobile devices
- ✅ Checking responsive design

---

## 🆘 Still Need Help?

Create an issue with:
1. **What you tried** (exact steps)
2. **What happened** (error messages)
3. **What you expected**
4. **Environment** (OS, browser, Node version)
5. **Screenshots** if possible

Remember: Most issues are simple fixes! 🎯
