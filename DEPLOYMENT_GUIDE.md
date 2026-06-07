# Deployment to Vercel & Domain Setup

## Status: Package Fixed ✓
- Node version constraint updated (now supports Node 18+)
- Dependencies cleaned and reinstalled
- Vercel configuration ready

---

## Step 1: Push to GitHub (if not already done)

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin master
```

Or if using main branch:
```bash
git push origin main
```

---

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

```bash
npm install -g vercel
vercel login  # Follow prompts to connect your Vercel account
vercel       # Deploy from project directory
```

### Option B: Via Vercel Dashboard (Easiest)

1. Go to **https://vercel.com/dashboard**
2. Click **"Add New..." → "Project"**
3. Select your GitHub repository (ZyntrixAI / Vexa Website)
4. Click **"Import"**
5. Leave build settings as default (Vercel auto-detects Next.js)
6. Add Environment Variables (see Step 3)
7. Click **"Deploy"**

---

## Step 3: Set Environment Variables in Vercel

These are needed for Supabase integration:

1. Go to your Vercel project → **Settings → Environment Variables**
2. Add these variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | From supabase.com dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Public key from Supabase |

Get these values:
- Go to https://supabase.com/dashboard
- Select your project
- Click Settings → API
- Copy the URL and public anon key

---

## Step 4: Setup Domain (leads.zyntrixai.co)

### A. Add Domain to Vercel

1. In Vercel dashboard → Your project → **Settings → Domains**
2. Click **"Add Domain"**
3. Enter: `leads.zyntrixai.co`
4. Vercel will show you the DNS records to add

### B. Configure DNS Records

Go to your domain registrar (GoDaddy, Namecheap, etc.):

1. Go to DNS settings
2. Add the records Vercel shows:
   - **CNAME record** or **A record** (depending on Vercel's config)
   - Point to Vercel's nameserver

**Example (varies by registrar):**
```
Name: leads
Type: CNAME
Value: cname.vercel-dns.com (or your-project.vercel.app)
```

3. **Wait 5-30 minutes** for DNS to propagate

### C. Enable HTTPS (Automatic)

Once DNS is set:
- Vercel automatically generates SSL certificate
- https://leads.zyntrixai.co will work automatically

---

## Step 5: Verify Deployment

### Check Vercel Deployment
```bash
vercel status
# or check dashboard at https://vercel.com/dashboard
```

### Test Your Domain
1. Open https://leads.zyntrixai.co in browser
2. You should see your site
3. Check console for errors (F12)

### DNS Check
```bash
nslookup leads.zyntrixai.co
# Should resolve to Vercel's IP
```

---

## Step 6: Update CRM App Domain (crm.html)

In your CRM app, update the App URL setting:

1. Open `crm.html` or navigate to your CRM
2. Go to **Settings tab**
3. Set **App URL** to: `https://leads.zyntrixai.co`
4. Save settings

This enables:
- Email tracking pixels
- Webhook callbacks
- Any server-dependent features

---

## Post-Deployment Checklist

- [ ] Package dependencies installed (`npm install` completed)
- [ ] Code pushed to GitHub
- [ ] Vercel project created and deployed
- [ ] Environment variables set in Vercel
- [ ] Domain added to Vercel
- [ ] DNS records configured at registrar
- [ ] SSL certificate active (green lock)
- [ ] Site loads at https://leads.zyntrixai.co
- [ ] CRM app updated with new domain URL
- [ ] Email provider configured (SendGrid/Gmail)

---

## Troubleshooting

### Domain Not Resolving
- **Wait longer** - DNS can take 5-30 minutes
- **Check DNS records** - Verify at your registrar they're correct
- **Use propagation checker** - https://dnschecker.org

### Build Fails on Vercel
- Check Vercel deployment logs (Deployments tab)
- Run `npm run build` locally to test
- Check Node version matches (18+)

### HTTPS Not Working
- Wait for SSL cert generation (can take 24 hours)
- Check Vercel dashboard → Domains → SSL certificate status
- Refresh browser cache (Ctrl+Shift+Delete)

### Environment Variables Not Working
- Verify variables are set in Vercel Settings
- Restart deployment after adding vars (redeploy)
- Check variable names are exact (case-sensitive)

---

## Available URLs After Deployment

| URL | Purpose |
|-----|---------|
| `https://leads.zyntrixai.co` | CRM App (crm.html) |
| `https://zyntrixai.co` | Main site (index.html) |
| `https://www.zyntrixai.co` | Main site with www |

---

## Next Steps

1. **Share the URL** - Send clients to `https://leads.zyntrixai.co`
2. **Invite team** - Add team members in Vercel → Settings
3. **Monitor analytics** - Use Vercel Web Analytics (optional paid)
4. **Set up backups** - Export data regularly from CRM

---

## Questions?

- **Vercel help:** https://vercel.com/docs
- **Next.js help:** https://nextjs.org/docs
- **DNS help:** https://dnschecker.org or contact your registrar

---

**Ready to deploy!** 🚀
