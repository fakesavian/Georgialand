# Google OAuth Setup — Georgia Land Finder

The app already renders Google auth buttons on `/signup` and `/login` and calls Supabase with:

```ts
supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/dashboard`,
  },
});
```

If Google sign-up/sign-in returns this live error:

```text
Unsupported provider: provider is not enabled
```

then the code is working, but the Google provider is not enabled in Supabase yet.

## 1. Create a Google OAuth client

Go to Google Cloud Console:

```text
APIs & Services → Credentials → Create Credentials → OAuth client ID
```

Use:

```text
Application type: Web application
Name: Georgia Land Finder
```

Authorized JavaScript origins:

```text
https://georgialand.vercel.app
```

If/when a custom domain is attached, also add it, for example:

```text
https://georgialandfinder.com
```

Authorized redirect URI for Supabase:

```text
https://mzrfwrgvjmodiozpllpu.supabase.co/auth/v1/callback
```

Copy the generated values:

```text
Google Client ID
Google Client Secret
```

Do not commit either value to this repo.

## 2. Enable Google in Supabase

Go to Supabase Dashboard:

```text
Authentication → Sign In / Providers → Google
```

Enable Google and paste:

```text
Client ID: <Google Client ID>
Client Secret: <Google Client Secret>
```

Save the provider settings.

## 3. Configure Supabase URL allow-list

Go to Supabase Dashboard:

```text
Authentication → URL Configuration
```

Set Site URL:

```text
https://georgialand.vercel.app
```

Add Redirect URLs:

```text
https://georgialand.vercel.app/**
https://georgialand.vercel.app/dashboard
https://georgialand.vercel.app/pricing
http://localhost:5173/**
http://127.0.0.1:5173/**
```

If/when a custom production domain is attached, also add:

```text
https://georgialandfinder.com/**
https://georgialandfinder.com/dashboard
https://georgialandfinder.com/pricing
```

## 4. Verify

After saving Supabase Google provider settings:

1. Open an incognito/private browser window.
2. Visit:

```text
https://georgialand.vercel.app/signup
```

3. Click:

```text
Sign up with Google
```

Expected result:

```text
Google account chooser → redirect back to /dashboard
```

If the user started from a paid plan, the app preserves checkout intent:

```text
/signup?plan=pro&billing=monthly
/login?plan=pro&billing=monthly
```

Expected result after Google auth:

```text
/pricing?plan=pro&billing=monthly
```

The pricing page then auto-starts the Stripe Checkout Session when the authenticated user returns.

## 5. Troubleshooting

### `Unsupported provider: provider is not enabled`

Google provider is still disabled in Supabase, or the provider settings were not saved.

### `redirect_uri_mismatch`

The Google OAuth client is missing this exact authorized redirect URI:

```text
https://mzrfwrgvjmodiozpllpu.supabase.co/auth/v1/callback
```

### Browser returns to app but user is not logged in

Check Supabase URL Configuration redirect allow-list. Add the exact production URL and wildcard:

```text
https://georgialand.vercel.app/**
```

### Facebook/Messenger in-app browser says `Load failed`

Open the site in Safari/Chrome. In-app browsers can block Google OAuth. The app keeps password login/signup as the fallback for those users.

## Security notes

- The Google Client Secret belongs only in Supabase provider settings.
- Do not add Google OAuth secrets to `.env.local`, `.env.example`, Vercel, or frontend code.
- The Supabase project URL and callback URL are public identifiers; the client secret is not.
