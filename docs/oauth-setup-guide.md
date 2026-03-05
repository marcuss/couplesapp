# OAuth Setup Guide — CouplesApp

This guide explains how to configure Google and Apple OAuth login for CouplesApp.

The code is already implemented. You only need to configure the external providers
and paste the credentials into Supabase Dashboard.

---

## 1. Supabase URL Configuration (do this first)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Authentication → URL Configuration**
3. Set **Site URL** to: `https://dlr56cmovhfn0.cloudfront.net`
4. Add to **Redirect URLs**:
   - `https://dlr56cmovhfn0.cloudfront.net/auth/callback`
   - `http://localhost:5173/auth/callback` (for local dev)
5. Click **Save**

---

## 2. Google OAuth Setup

### Google Cloud Console

1. Go to <https://console.cloud.google.com>
2. Create or select a project (you can reuse an existing one, e.g. from Google Calendar)
3. Navigate to **APIs & Services → Credentials**
4. Click **+ Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Name: `CouplesApp Web`
7. Add **Authorized JavaScript origins**:
   - `https://klpshxvjzsdqolkrabvb.supabase.co`
   - `https://dlr56cmovhfn0.cloudfront.net`
   - `http://localhost:5173` (for local dev)
8. Add **Authorized redirect URIs**:
   - `https://klpshxvjzsdqolkrabvb.supabase.co/auth/v1/callback`
9. Click **Create**
10. Copy your **Client ID** and **Client Secret**

### Enable in Supabase

1. Supabase Dashboard → **Authentication → Providers → Google**
2. Toggle **Enable**
3. Paste **Client ID** and **Client Secret**
4. Click **Save**

### Environment Variables

In your `.env` (already added to the file):
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

> Note: The client secret goes in Supabase, NOT in the frontend `.env`.

---

## 3. Apple OAuth Setup

> ⚠️ **BLOCKED**: Requires Apple Developer Account ($99/year).
> Skip this section until you have an Apple Developer Account.

### Apple Developer Console

1. Log in to <https://developer.apple.com>
2. Go to **Certificates, Identifiers & Profiles → Identifiers**
3. Create or select your **App ID** (`com.yourdomain.couplesapp`)
4. Enable capability: **Sign In with Apple** → Edit → Primary App ID
5. Create a new **Service ID**:
   - Identifier: `com.yourdomain.couplesapp.web`
   - Description: `CouplesApp Web`
   - Enable **Sign In with Apple** → Configure:
     - Primary App ID: select your app
     - Domains: `klpshxvjzsdqolkrabvb.supabase.co`
     - Return URLs: `https://klpshxvjzsdqolkrabvb.supabase.co/auth/v1/callback`
6. Create a **Key** for Sign In with Apple and download the `.p8` file

### Enable in Supabase

1. Supabase Dashboard → **Authentication → Providers → Apple**
2. Toggle **Enable**
3. Paste:
   - **Service ID** (the identifier above)
   - **Team ID** (from Apple Developer account)
   - **Key ID** (from the key you created)
   - **Private Key** (contents of the `.p8` file)
4. Click **Save**

### iOS Native (Capacitor / Xcode)

For native iOS builds, you also need:

1. **Xcode** → your target → **Signing & Capabilities** → **+ Capability**:
   - Add **Sign In with Apple**
   - Add **Associated Domains** → `applinks:dlr56cmovhfn0.cloudfront.net`
2. In `capacitor.config.ts`, configure deep link handling:
   ```ts
   server: {
     iosScheme: 'couplesapp',
   }
   ```
3. In your `App.tsx` (or a Capacitor plugin), listen for the app URL open event
   to pass deep link URLs back to the Supabase session handler:
   ```ts
   import { App as CapApp } from '@capacitor/app';
   CapApp.addListener('appUrlOpen', ({ url }) => {
     // Supabase handles the URL automatically if the session is set
     // You may navigate to /auth/callback if needed
   });
   ```

---

## 4. Local Development

Add to your `.env.local` (not committed to git):
```
VITE_SUPABASE_URL=https://klpshxvjzsdqolkrabvb.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173
```

Google OAuth should work immediately after following steps 1–2.

---

## 5. Testing the Flow

1. Start the app: `npm run dev`
2. Go to `/login`
3. Click **Continuar con Google**
4. Complete Google sign-in
5. Should redirect back to `/auth/callback` → then `/dashboard`

If you see an error on the callback page, check:
- Supabase Redirect URLs include `http://localhost:5173/auth/callback`
- Google authorized redirect URI matches exactly
- Google OAuth is enabled in Supabase

---

## Summary Table

| Provider | Status      | Requires              |
|----------|-------------|-----------------------|
| Google   | ✅ Ready     | Google Cloud Console  |
| Apple    | ⛔ Blocked  | Apple Developer ($99) |
