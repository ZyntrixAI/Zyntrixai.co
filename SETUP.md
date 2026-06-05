# ZyntrixAI Website - Setup Guide

This website is configured for deployment on Vercel with Supabase as the backend for form submissions.

## Prerequisites

- Vercel account (connected to your GitHub repo)
- Supabase account
- Your domain (zyntrixai.co) configured to point to Vercel

## Step 1: Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and log in
2. Create a new project or use an existing one
3. Go to **Project Settings** → **API**
4. Copy your:
   - **Project URL** (looks like: `https://xxxxxxx.supabase.co`)
   - **Anon Key** (under "Project API keys")

5. Create the required database tables:

### contact_messages table
```sql
create table contact_messages (
  id bigint primary key generated always as identity,
  first_name text not null,
  last_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  submitted_at timestamp with time zone not null
);
```

### quote_requests table
```sql
create table quote_requests (
  id bigint primary key generated always as identity,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  business_name text not null,
  industry_niche text,
  services text,
  website_url text,
  has_website boolean,
  current_problems text,
  recommended_package text,
  status text default 'new',
  source text,
  submitted_at timestamp with time zone not null
);
```

6. You can run these SQL queries in the Supabase SQL editor under your project.

## Step 2: Configure Vercel Environment Variables

1. Go to [vercel.com](https://vercel.com) and select your ZyntrixAI project
2. Go to **Settings** → **Environment Variables**
3. Add these variables:
   - **SUPABASE_URL**: Your Supabase Project URL
   - **SUPABASE_ANON_KEY**: Your Supabase Anon Key

## Step 3: Deploy to Vercel

The deployment is automatic when you push to GitHub. If you need to manually deploy:

```bash
# Make sure all files are committed
git add .
git commit -m "Update API configuration and add serverless functions"
git push
```

Vercel will automatically:
- Build the static site
- Deploy the serverless API functions (`/api/contact` and `/api/quote`)
- Serve your site at `zyntrixai.co`

## Step 4: Test the Forms

1. Visit your website at `https://zyntrixai.co`
2. Try the contact form (scroll to bottom or click "Contact")
3. Try the quote request form (click "Start a Project")
4. Check Supabase to see if entries appear in the tables

## File Structure

```
.
├── index.html              # Main website (static)
├── package.json            # Dependencies
├── .env.example            # Environment variables template
├── .vercelignore           # Files to ignore
├── vercel.json             # Vercel configuration
├── api/
│   ├── contact.js          # Contact form API endpoint
│   └── quote.js            # Quote request API endpoint
├── logo.svg                # ZyntrixAI logo (if needed)
└── SETUP.md               # This file
```

## How It Works

1. **Frontend (HTML)**
   - User fills out contact or quote form
   - Form submits to `/api/contact` or `/api/quote`

2. **Backend (Serverless Functions)**
   - Vercel runs Node.js functions in `api/` folder
   - Functions receive form data
   - Functions save to Supabase database
   - Returns success/error response to frontend

3. **Database (Supabase)**
   - Stores all form submissions
   - Accessible from Supabase dashboard

## Optional: Send Email Notifications

To send email confirmations when someone submits a form, you can integrate SendGrid:

1. Create a SendGrid account and get an API key
2. Add to Vercel environment variables: `SENDGRID_API_KEY`
3. Update `api/contact.js` and `api/quote.js` to send emails

## Troubleshooting

### Forms not submitting?
- Check Vercel logs: Go to Vercel → Your Project → Deployments → View Logs
- Make sure environment variables are set in Vercel
- Check browser console (F12) for network errors

### Supabase connection error?
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct in Vercel
- Make sure tables exist in Supabase with correct names
- Check Supabase row-level security (RLS) is disabled for the tables

### 404 on API endpoints?
- Make sure `api/contact.js` and `api/quote.js` are committed and pushed
- Redeploy: Go to Vercel → Deployments → Redeploy latest

## Next Steps

1. ✅ Repository set up and deployed
2. ✅ Static HTML site running
3. ⬜ **Configure Supabase** (do this now)
4. ⬜ **Add environment variables to Vercel** (do this now)
5. ⬜ Test forms
6. Optional: Add email notifications
7. Optional: Add analytics (Google Analytics, Hotjar)

## Support

For issues with:
- **Vercel**: Visit [vercel.com/docs](https://vercel.com/docs)
- **Supabase**: Visit [supabase.com/docs](https://supabase.com/docs)
- **Your site**: Check Vercel deployment logs
