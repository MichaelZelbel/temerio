# Supabase Email Confirmation Setup for Temerio

This guide configures Supabase to send branded confirmation emails from `support@temerio.com` via Resend, redirecting users to `https://temerio.com` instead of `localhost`.

---

## Step 1: Configure Resend as SMTP Provider

1. Go to **Supabase Dashboard** → [Authentication → Settings](https://supabase.com/dashboard/project/xquarhirsodrwzbglxjv/auth/settings)
2. Scroll to **SMTP Settings**
3. Toggle **Enable Custom SMTP** to ON
4. Fill in the following:

   | Field              | Value                      |
   |--------------------|----------------------------|
   | **Sender email**   | `support@temerio.com`      |
   | **Sender name**    | `Temerio`                  |
   | **Host**           | `smtp.resend.com`          |
   | **Port**           | `465`                      |
   | **Username**       | `resend`                   |
   | **Password**       | Your Resend API key (`re_...`) |

5. Set **Minimum interval between emails** to something reasonable (e.g. `30` seconds)
6. Click **Save**

---

## Step 2: Fix the Redirect URL (stop localhost)

This is the critical step that fixes the `localhost:3000` error.

1. Go to **Supabase Dashboard** → [Authentication → URL Configuration](https://supabase.com/dashboard/project/xquarhirsodrwzbglxjv/auth/url-configuration)
2. Set the **Site URL** to:
   ```
   https://temerio.com
   ```
3. Under **Redirect URLs**, add ALL of these (one per line, click "Add URL" for each):
   ```
   https://temerio.com/**
   https://www.temerio.com/**
   https://temerio.lovable.app/**
   https://id-preview--a768e174-89a8-4c7b-b68d-f64c481ee4c5.lovable.app/**
   ```
   > The `/**` wildcard allows any sub-path (e.g. `/auth`, `/dashboard`) to be a valid redirect target.

4. Click **Save**

---

## Step 3: Customize Email Templates

1. Go to **Supabase Dashboard** → [Authentication → Email Templates](https://supabase.com/dashboard/project/xquarhirsodrwzbglxjv/auth/templates)
2. Select the **Confirm signup** template
3. Replace the default template with something like:

   **Subject:**
   ```
   Confirm your Temerio account
   ```

   **Body (HTML):**
   ```html
   <html>
     <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background: #f9fafb;">
       <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
         <h2 style="margin-top: 0; color: #111827;">Welcome to Temerio 👋</h2>
         <p style="color: #4b5563; line-height: 1.6;">
           Thanks for signing up! Please confirm your email address by clicking the button below.
         </p>
         <div style="text-align: center; margin: 32px 0;">
           <a href="{{ .ConfirmationURL }}"
              style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
             Confirm Email Address
           </a>
         </div>
         <p style="color: #9ca3af; font-size: 13px;">
           If you didn't create an account, you can safely ignore this email.
         </p>
         <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
         <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
           Temerio · <a href="https://temerio.com" style="color: #6b7280;">temerio.com</a>
         </p>
       </div>
     </body>
   </html>
   ```

4. Click **Save**

5. **(Optional)** Repeat for the other templates:
   - **Magic Link** – same style, different wording
   - **Change Email Address**
   - **Reset Password**

---

## Step 4: Verify It Works

1. Open <https://temerio.com/auth> (or the preview URL)
2. Sign up with a new email address
3. Check inbox — the email should:
   - ✅ Come from `support@temerio.com` (sender name: **Temerio**)
   - ✅ Show the branded HTML template
   - ✅ The confirmation link should point to `https://temerio.com/...` (NOT `localhost`)
4. Click the link — you should land on the Temerio auth page, logged in

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Email still comes from `noreply@mail.app.supabase.io` | Custom SMTP is not enabled — recheck Step 1 |
| Link still points to `localhost:3000` | **Site URL** is wrong — must be `https://temerio.com` (Step 2) |
| Link points to Supabase URL and shows error | Add the redirect URLs from Step 2 |
| Email not arriving at all | Check Resend dashboard for delivery logs; verify domain is verified in Resend |
| "Invalid redirect URL" error after clicking link | The redirect URL is not in the allowlist — add it in Step 2 |

---

## Summary of Changes

| Setting | Where | Value |
|---------|-------|-------|
| SMTP Host | Auth → SMTP | `smtp.resend.com` |
| SMTP Port | Auth → SMTP | `465` |
| SMTP Username | Auth → SMTP | `resend` |
| SMTP Password | Auth → SMTP | Resend API key |
| Sender Email | Auth → SMTP | `support@temerio.com` |
| Site URL | Auth → URL Config | `https://temerio.com` |
| Redirect URLs | Auth → URL Config | See Step 2 |
| Email Template | Auth → Templates | Custom HTML |
