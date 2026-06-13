# ZyntrixLeads Deployment Guide

## Quick Deployment to Vercel

### Prerequisites
- GitHub account with the repository pushed
- Vercel account (free at vercel.com)

### Steps

1. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Select this GitHub repository
   - Click "Deploy"

2. **Configure Environment Variables**
   - No environment variables needed for the CRM app
   - Data is stored in browser localStorage

3. **Domain Setup**
   - Vercel will assign a default domain
   - Add a custom domain if desired (Settings > Domains)

4. **Deployment Complete!**
   - Your app is live at: https://your-domain.vercel.app/crm
   - Client portal available at: https://your-domain.vercel.app/portal?portal=YOUR_TOKEN

---

## Local Development

### Run Locally
```bash
# Python (simple HTTP server)
python -m http.server 3000

# Node.js
npx http-server -p 3000

# Using live-server
npx live-server --port=3000
```

Then visit: http://localhost:3000/crm

---

## Features Overview

### Admin CRM (crm.html)
- **Lead Management**: Find, import, manage leads
- **Pipeline**: Kanban board for deal stages
- **Clients**: Create and manage client profiles
- **Retainers**: Track recurring revenue (MRR/ARR)
- **Services**: Track deliverables and hours
- **Invoicing**: Create and send invoices
- **Reporting**: Revenue and business analytics
- **Automation**: Rules for auto-invoicing, reminders
- **Custom Fields**: Add custom lead attributes

### Client Portal (client-portal.html)
- Share token-based links with clients
- View services, retainers, invoices
- Track service progress
- Simple, clean interface

---

## Data Storage

All data is stored in **browser localStorage** - no database needed!

### Backup Data
```javascript
// In browser console:
localStorage.zyntrix_leads
localStorage.zyntrix_clients
localStorage.zyntrix_retainers
localStorage.zyntrix_invoices
```

### Export Data
- Use "Export CSV" in All Leads tab
- Download invoices from Invoices tab

---

## Support

For issues or feature requests:
- Check the README.md
- Review code comments
- Contact support at donhardtblake@gmail.com

---

## What's Included

✅ Lead discovery & outreach
✅ Sales pipeline management
✅ Client & retainer tracking
✅ Service delivery tracking
✅ Invoice generation & payment tracking
✅ Revenue reporting & analytics
✅ Automation engine
✅ Client portal
✅ Custom lead fields
✅ Mobile responsive design

**Built with**: HTML, CSS, JavaScript (vanilla - no dependencies!)
**Last Updated**: June 2026
