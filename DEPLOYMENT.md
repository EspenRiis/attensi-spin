# Deployment Guide for Attensi Spin

## Quick Deployment Options

### Option 1: Vercel (Recommended - Easiest)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts and your app will be live!

**Advantages:**
- Free tier available
- Automatic HTTPS
- Custom domain support
- Instant global CDN
- Zero configuration needed

### Option 2: Netlify

1. Install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Build:
   ```bash
   npm run build
   ```

3. Deploy:
   ```bash
   netlify deploy --prod
   ```

**Advantages:**
- Free tier
- Drag-and-drop option available
- Form handling
- Serverless functions support

### Option 3: GitHub Pages

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to `package.json`:
   ```json
   {
     "homepage": "https://yourusername.github.io/attensi-spin",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. Update `vite.config.js`:
   ```javascript
   export default defineConfig({
     plugins: [react()],
     base: '/attensi-spin/'
   })
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

### Option 4: Traditional Web Hosting (cPanel, etc.)

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the contents of the `dist` folder to your web server

3. Configure your web server to serve `index.html` for all routes

**Apache (.htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**Nginx:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Environment Configuration

### For Production
Make sure to update the QR code URL in production. The app currently uses `window.location.origin`, which should work automatically.

If you need a fixed URL, modify `src/components/QRCodePanel.jsx`:
```javascript
const addNameUrl = `https://your-domain.com/add-name`;
```

## Backend Integration (Optional)

### Using Firebase

1. Install Firebase:
   ```bash
   npm install firebase
   ```

2. Create `src/firebase.js`:
   ```javascript
   import { initializeApp } from 'firebase/app';
   import { getDatabase } from 'firebase/database';

   const firebaseConfig = {
     // Your config here
   };

   const app = initializeApp(firebaseConfig);
   export const db = getDatabase(app);
   ```

3. Replace localStorage calls with Firebase Realtime Database calls

### Using Supabase

1. Install Supabase:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Create `src/supabase.js`:
   ```javascript
   import { createClient } from '@supabase/supabase-js';

   export const supabase = createClient(
     'YOUR_SUPABASE_URL',
     'YOUR_SUPABASE_ANON_KEY'
   );
   ```

3. Use Supabase real-time subscriptions for cross-device sync

## Testing Before Deployment

1. Build locally:
   ```bash
   npm run build
   ```

2. Preview the build:
   ```bash
   npm run preview
   ```

3. Test on your local network:
   - The preview command shows a network URL
   - Test the QR code functionality from your phone

## Post-Deployment Checklist

- [ ] Test the main wheel functionality
- [ ] Scan QR code from mobile device
- [ ] Add names via QR code
- [ ] Verify real-time updates work
- [ ] Test on different devices
- [ ] Check responsive design on mobile/tablet
- [ ] Verify localStorage persistence
- [ ] Test welcome modal on return visit
- [ ] Confirm confetti animations work
- [ ] Check all buttons and interactions

## Performance Optimization

### Before Deployment:

1. **Optimize Images**: If you add any images/logos
2. **Check Bundle Size**: 
   ```bash
   npm run build
   # Check the dist folder size
   ```

3. **Enable Gzip**: Most hosting providers do this automatically

4. **Add Service Worker** (Optional): For offline functionality

## Monitoring

Consider adding:
- Google Analytics
- Error tracking (Sentry)
- Performance monitoring

## Security Notes

- The app uses localStorage, which is client-side only
- No sensitive data is stored
- For production with backend, add proper authentication
- Consider rate limiting if using a backend API

## Troubleshooting

### QR Code Not Working
- Check if the URL is correct
- Ensure both devices are on the same browser (for localStorage sync)
- For cross-device, implement backend sync

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Routing Issues
- Ensure your hosting supports SPA routing
- Add proper redirects/rewrites configuration

## Support

For deployment issues, check:
- Vite documentation: https://vitejs.dev/guide/static-deploy.html
- React Router documentation: https://reactrouter.com/
- Hosting provider documentation

---

Need help? Contact the development team!
