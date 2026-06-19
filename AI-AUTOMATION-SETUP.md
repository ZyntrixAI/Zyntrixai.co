# 🤖 ZyntrixAI - AI Automation Suite Setup

## Overview

Your website now has **5 AI automation features** powered by Claude API:

1. ✅ **Website Analyzer** - AI audits any URL for SEO, performance, conversion
2. ✅ **Content Generator** - Creates blog ideas, social posts, meta tags, emails
3. ✅ **Smart Quote Generator** - AI-powered project recommendations & pricing
4. ✅ **Project Scoping** - Auto-generates project roadmaps & timelines
5. ✅ **Chat Assistant** - 24/7 AI support bot (ready for integration)

---

## Quick Start (3 Steps)

### Step 1: Get Your Claude API Key

1. Go to [https://console.anthropic.com/api-keys](https://console.anthropic.com/api-keys)
2. Create a new API key
3. Copy it

### Step 2: Create .env File

In the `zyntrixai/` folder, create a `.env` file:

```
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
BUSINESS_EMAIL=zyntrixautomation@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
PORT=3000
```

(Copy from `.env.example` and add your Claude key)

### Step 3: Start the Server

```bash
cd "d:/Websites Built/Blakes website and leads/zyntrixai"
npm install  # (if not done yet)
npm start    # or: node server.js
```

Server runs at: **http://localhost:3000**

---

## API Endpoints

### 1. Website Analyzer
**POST** `/api/ai/analyze-website`
```json
{
  "url": "https://example.com"
}
```
**Returns:** SEO score, performance score, conversion score, issues, recommendations, competitor insights

### 2. Content Generator
**POST** `/api/ai/generate-content`
```json
{
  "businessName": "Acme Fitness",
  "niche": "fitness",
  "contentType": "blog" // or "social", "meta", "email", "faq"
}
```
**Returns:** Generated content based on type

### 3. Smart Quote Generator
**POST** `/api/ai/smart-quote`
```json
{
  "businessName": "Acme Fitness",
  "niche": "fitness",
  "services": "Web Design, SEO",
  "hasWebsite": false,
  "currentProblems": "Need more leads"
}
```
**Returns:** Recommended tier, price, breakdown, timeline, ROI

### 4. Project Onboarding
**POST** `/api/ai/onboarding`
```json
{
  "businessName": "Acme Fitness",
  "niche": "fitness",
  "currentWebsite": "none",
  "goals": "Build modern site to attract members"
}
```
**Returns:** Project phases, timeline, costs, risks, success metrics

### 5. Chat Assistant
**POST** `/api/ai/chat`
```json
{
  "message": "How much does web design cost?",
  "context": {
    "businessName": "Acme",
    "niche": "fitness"
  }
}
```
**Returns:** AI-generated response

---

## Frontend Pages

Access tools at:
- **http://localhost:3000/page-ai-tools** - Tools hub
- **http://localhost:3000/page-tool-analyzer** - Website Analyzer
- **http://localhost:3000/page-tool-content** - Content Generator
- **http://localhost:3000/page-tool-quote** - Smart Quote
- **http://localhost:3000/page-tool-onboard** - Project Scoping

Or use the `showPage()` function in the UI:
```javascript
showPage('ai-tools')      // Tools hub
showPage('tool-analyzer')  // Analyzer
showPage('tool-content')   // Content Generator
showPage('tool-quote')     // Quote
showPage('tool-onboard')   // Onboarding
```

---

## How to Integrate AI Tools on Your Pages

### Add Button to Any Page
```html
<button onclick="showPage('ai-tools')" class="btn-primary">
  Try Our AI Tools →
</button>
```

### Embed Analyzer Widget
```javascript
// Get analysis results
const response = await fetch('http://localhost:3000/api/ai/analyze-website', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' })
});
const data = await response.json();
console.log(data.analysis); // { seoScore, performanceScore, issues, recommendations }
```

---

## Customization

### Change AI Model
In `server.js`, update all Claude calls from:
```javascript
model: 'claude-3-5-sonnet-20241022'
```

To:
```javascript
model: 'claude-3-opus-20250219'  // Most capable
// or
model: 'claude-3-haiku-20250307'  // Fastest & cheapest
```

### Adjust Prompt Templates
In `server.js`, edit the prompt variables (around line 1370+):
- `analysisPrompt` - Website analyzer questions
- `typePrompts` - Content generation styles
- `onboardingPrompt` - Scoping questions
- `quotePrompt` - Quote logic

### Store Results in Supabase
Add after each response:
```javascript
const { data, error } = await supabase
  .from('ai_results')
  .insert([{ url, analysis, timestamp: new Date() }]);
```

---

## Pricing & Costs

**Claude API Pricing:**
- Sonnet (3-5): $3/M input, $15/M output
- Opus (most capable): $15/M input, $75/M output
- Haiku (fastest): $0.80/M input, $4/M output

**Rough Cost Per Tool:**
- Website Analyzer: ~$0.01-0.03
- Content Generator: ~$0.02-0.05
- Smart Quote: ~$0.01-0.02
- Onboarding: ~$0.02-0.04

**Monthly Estimate** (1000 tool uses):
- Using Sonnet: ~$30-50/month
- Using Haiku: ~$5-10/month

---

## What's Next?

### 1. Add Chat Widget to Homepage
```html
<!-- Add this before </body> -->
<div id="chat-widget" style="fixed bottom: 20px; right: 20px; width: 350px;">
  <!-- Chat UI will go here -->
</div>
```

### 2. Create Admin Dashboard
Track:
- Tool usage & analytics
- Lead quality from tools
- Cost tracking
- Most popular tools

### 3. Add Lead Scoring
Enhance Smart Quote to return lead quality score

### 4. Setup Webhooks
Send results to:
- Slack for notifications
- Email follow-ups
- CRM integration (HubSpot, Salesforce)

### 5. Monitor & Optimize
- Track conversion rates from each tool
- A/B test prompt variations
- Collect user feedback
- Continuously improve recommendations

---

## Troubleshooting

### "Could not reach the server"
- Make sure `npm start` is running
- Check port 3000 is not blocked
- Try `npx kill-port 3000` then restart

### "Invalid API key"
- Double-check `.env` file has `CLAUDE_API_KEY=sk-ant-...`
- API key must start with `sk-ant-`
- No spaces in the key

### Slow Responses
- Try Haiku model instead of Sonnet (faster)
- Reduce max_tokens in prompts
- Add timeout: `timeout: 30000` to fetch

### Results Not Making Sense
- Review the prompt templates
- Add more context to user inputs
- Try different Claude models
- Check token limits aren't being exceeded

---

## Resources

- [Claude API Docs](https://docs.anthropic.com)
- [Prompt Engineering Guide](https://docs.anthropic.com/en/docs/build-a-chatbot)
- [API Pricing](https://www.anthropic.com/pricing)
- [JavaScript SDK](https://github.com/anthropics/anthropic-sdk-python)

---

**Built with Claude API by Anthropic**
