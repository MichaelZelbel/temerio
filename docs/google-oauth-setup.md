# Google OAuth Setup for Temerio

This guide walks you through setting up "Sign in with Google" for Temerio, from creating the Google Cloud project to enabling it in Supabase.

---

## Prerequisites

- A Google account (preferably the one associated with `support@temerio.com`)
- Access to your Supabase project dashboard

---

## Part 1: Google Cloud Console Setup

### 1.1 Create or Select a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown in the top bar
3. Click **New Project**
   - **Project name:** `Temerio`
   - **Organization:** leave as default or select yours
4. Click **Create**, then select the new project

### 1.2 Configure the OAuth Consent Screen

1. In the left sidebar, go to **APIs & Services → OAuth consent screen**
2. Click **Get started** (or **Configure Consent Screen**)
3. Choose **External** as the user type (unless you have a Google Workspace org and want internal-only), then click **Create**
4. Fill in the consent screen details:

   | Field | Value |
   |---|---|
   | **App name** | `Temerio` |
   | **User support email** | `support@temerio.com` |
   | **App logo** | Upload the Temerio logo (optional but recommended) |
   | **App home page** | `https://temerio.lovable.app` |
   | **App privacy policy link** | `https://temerio.lovable.app/privacy` |
   | **App terms of service link** | `https://temerio.lovable.app/terms` |
   | **Authorized domains** | Add: `temerio.lovable.app` and `xquarhirsodrwzbglxjv.supabase.co` |
   | **Developer contact email** | `support@temerio.com` |

5. Click **Save and Continue**

### 1.3 Configure Scopes

1. Click **Add or Remove Scopes**
2. Select the following scopes:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
3. Click **Update**, then **Save and Continue**

### 1.4 Test Users (Optional)

- While in "Testing" publishing status, only listed test users can sign in
- Add any test emails you'd like, or skip this for now
- Click **Save and Continue**

### 1.5 Publish the App

> ⚠️ **Important:** While the app is in "Testing" mode, only explicitly added test users can log in. To allow any Google user to sign in:

1. Go back to **OAuth consent screen → Publishing status**
2. Click **Publish App**
3. Confirm the dialog

---

## Part 2: Create OAuth Client Credentials

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. Fill in:

   | Field | Value |
   |---|---|
   | **Application type** | `Web application` |
   | **Name** | `Temerio Web Client` |
   | **Authorized JavaScript origins** | `https://temerio.lovable.app` |
   | **Authorized redirect URIs** | `https://xquarhirsodrwzbglxjv.supabase.co/auth/v1/callback` |

   > 💡 For local development, also add `http://localhost:5173` to JavaScript origins and `http://localhost:54321/auth/v1/callback` to redirect URIs.

4. Click **Create**
5. **Copy the Client ID and Client Secret** — you'll need these in the next step

---

## Part 3: Configure Google Provider in Supabase

1. Go to your [Supabase Dashboard → Authentication → Providers](https://supabase.com/dashboard/project/xquarhirsodrwzbglxjv/auth/providers)
2. Find **Google** in the list and expand it
3. Toggle **Enable Sign in with Google** to ON
4. Paste your credentials:

   | Field | Value |
   |---|---|
   | **Client ID** | *(paste from Google Cloud)* |
   | **Client Secret** | *(paste from Google Cloud)* |

5. Note the **Callback URL** shown — verify it matches the redirect URI you added in Google Cloud (`https://xquarhirsodrwzbglxjv.supabase.co/auth/v1/callback`)
6. Click **Save**

### 3.1 Verify URL Configuration

1. Go to **Authentication → URL Configuration**
2. Ensure these are set:

   | Field | Value |
   |---|---|
   | **Site URL** | `https://temerio.lovable.app` |
   | **Redirect URLs** | `https://temerio.lovable.app/**` |

   > Add the preview URL too if needed: `https://id-preview--a768e174-89a8-4c7b-b68d-f64c481ee4c5.lovable.app/**`

---

## Part 4: Test the Integration

1. Go to [temerio.lovable.app/auth](https://temerio.lovable.app/auth)
2. Click **Continue with Google**
3. You should see the Google consent screen with "Temerio" branding
4. Sign in with a Google account
5. You should be redirected back to the Temerio dashboard

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `redirect_uri_mismatch` | Ensure the redirect URI in Google Cloud exactly matches the Supabase callback URL |
| `requested path is invalid` | Check Site URL and Redirect URLs in Supabase Auth → URL Configuration |
| Consent screen shows "unverified app" warning | This is normal until Google verifies your app; users can click "Advanced → Continue" |
| Only test users can sign in | Publish the app (Part 1.5) to allow all Google users |

---

## Reference Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Auth Providers](https://supabase.com/dashboard/project/xquarhirsodrwzbglxjv/auth/providers)
- [Supabase Google Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
