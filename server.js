require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const axios   = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── Scrape the client's existing website ──────────────────────────────────────
async function scrapeWebsite(url) {
  try {
    if (!url || !url.trim()) return null;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZyntrixBot/1.0)' }
    });

    const $ = cheerio.load(data);

    // Pull useful text off the page
    const title       = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content')
                      || $('meta[property="og:description"]').attr('content')
                      || '';
    const h1          = $('h1').first().text().trim();
    const h2s         = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 6);
    const paragraphs  = $('p').map((_, el) => $(el).text().trim()).get()
                          .filter(t => t.length > 40).slice(0, 4);
    const logo        = $('meta[property="og:image"]').attr('content') || '';

    return { title, description, h1, h2s, paragraphs, logo };
  } catch {
    return null;
  }
}

// ── Build a complete HTML website for the client ──────────────────────────────
// ── Niche theme detector ─────────────────────────────────────────────────────
function getNicheTheme(services = '', businessName = '', scraped = null, nicheKey = '') {
  // If client explicitly selected their niche, use it directly
  const keyMap = {
    restaurant: 'food', cafe: 'food', food: 'food',
    law: 'law', legal: 'law',
    fitness: 'fitness', gym: 'fitness',
    beauty: 'beauty', salon: 'beauty', spa: 'beauty',
    realestate: 'realestate', property: 'realestate',
    health: 'health', medical: 'health', dental: 'health',
    construction: 'construction', trades: 'construction',
    tech: 'tech', it: 'tech', software: 'tech',
    cleaning: 'cleaning',
    retail: 'retail', ecommerce: 'retail',
    hospitality: 'hospitality', hotel: 'hospitality',
    finance: 'finance', accounting: 'finance',
    education: 'education', tutoring: 'education',
    marketing: 'marketing', agency: 'marketing',
    automotive: 'automotive',
  };
  const explicit = keyMap[nicheKey?.toLowerCase()];

  const text = `${explicit || ''} ${services} ${businessName} ${scraped?.title || ''} ${scraped?.h1 || ''}`.toLowerCase();

  // Restaurant / Food / Cafe / Bar
  if (/restaurant|cafe|coffee|food|bar|bistro|bakery|pizza|sushi|grill|diner|eatery|catering|cuisine|tavern|pub|kitchen/.test(text)) {
    return {
      name: 'food',
      bg: '#0c0804', accent: '#c9a96e', accentRgb: '201,169,110',
      text: '#f5f0e8', muted: '#a09070', surface: 'rgba(201,169,110,0.06)',
      border: 'rgba(201,169,110,0.18)',
      headFont: "'Playfair Display', Georgia, serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600',
      heroVerb: 'Experience', heroNoun: 'Flavour',
      heroPitch: 'Every dish crafted with passion. Every visit an experience worth remembering.',
      cta: 'View Our Menu', ctaSecondary: 'Book a Table',
      emoji: '🍽️', serviceEmoji: ['🥗','☕','🍷','🎂','👨‍🍳','⭐'],
      aboutPoints: ['Fresh, locally sourced ingredients', 'Seasonal menus crafted with care', 'Warm, welcoming atmosphere', 'Private dining available'],
      gridPattern: `background-image:radial-gradient(circle,rgba(201,169,110,.03) 1px,transparent 1px);background-size:28px 28px;`
    };
  }

  // Law / Legal
  if (/law|legal|solicitor|attorney|barrister|firm|litigation|convey|notary|counsel|justice/.test(text)) {
    return {
      name: 'law',
      bg: '#060812', accent: '#b8960c', accentRgb: '184,150,12',
      text: '#e8e4d0', muted: '#9a9070', surface: 'rgba(184,150,12,0.05)',
      border: 'rgba(184,150,12,0.2)',
      headFont: "'Libre Baskerville', Georgia, serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Libre+Baskerville:wght@400;700&family=Inter:wght@300;400;500;600',
      heroVerb: 'Your Rights.', heroNoun: 'Our Expertise.',
      heroPitch: 'Trusted legal counsel delivered with integrity, clarity, and results. Your interests, protected.',
      cta: 'Free Consultation', ctaSecondary: 'Our Practice Areas',
      emoji: '⚖️', serviceEmoji: ['📋','🏛️','🤝','📜','🔍','💼'],
      aboutPoints: ['Decades of combined legal experience', 'Clear, honest advice at every stage', 'Proven results across all practice areas', 'Your case treated with full attention'],
      gridPattern: `background-image:linear-gradient(rgba(184,150,12,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(184,150,12,.03) 1px,transparent 1px);background-size:80px 80px;`
    };
  }

  // Fitness / Gym / Personal Training
  if (/gym|fitness|training|crossfit|yoga|pilates|sport|athlete|workout|personal trainer|bootcamp|martial|boxing|weight/.test(text)) {
    return {
      name: 'fitness',
      bg: '#0a0a0a', accent: '#f97316', accentRgb: '249,115,22',
      text: '#ffffff', muted: '#a0a0a0', surface: 'rgba(249,115,22,0.07)',
      border: 'rgba(249,115,22,0.2)',
      headFont: "'Bebas Neue', Impact, sans-serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Bebas+Neue&family=Inter:wght@300;400;500;600',
      heroVerb: 'PUSH YOUR', heroNoun: 'LIMITS.',
      heroPitch: 'Elite training. Real results. The gym that turns ambition into achievement.',
      cta: 'Start Free Trial', ctaSecondary: 'Our Programs',
      emoji: '💪', serviceEmoji: ['🏋️','🏃','🧘','🥊','⚡','🏆'],
      aboutPoints: ['Certified coaches & personal trainers', 'State-of-the-art equipment', 'Programs for all fitness levels', 'Community that keeps you accountable'],
      gridPattern: `background-image:repeating-linear-gradient(45deg,rgba(249,115,22,.03) 0,rgba(249,115,22,.03) 1px,transparent 0,transparent 50%);background-size:16px 16px;`
    };
  }

  // Beauty / Spa / Salon / Nails
  if (/salon|spa|beauty|hair|nails|lash|brow|skin|facial|massage|wax|aesthetic|cosmetic|makeup|barber/.test(text)) {
    return {
      name: 'beauty',
      bg: '#0d0408', accent: '#ec4899', accentRgb: '236,72,153',
      text: '#fdf2f8', muted: '#c090a8', surface: 'rgba(236,72,153,0.06)',
      border: 'rgba(236,72,153,0.18)',
      headFont: "'Playfair Display', Georgia, serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600',
      heroVerb: 'Feel', heroNoun: 'Beautiful.',
      heroPitch: 'A sanctuary where beauty meets artistry. Treatments tailored to you, results you\'ll love.',
      cta: 'Book Appointment', ctaSecondary: 'Our Treatments',
      emoji: '✨', serviceEmoji: ['💆','💅','👁️','🌸','💋','🌷'],
      aboutPoints: ['Qualified beauty therapists & stylists', 'Premium products & techniques', 'Relaxing, luxury environment', 'Personalised consultations included'],
      gridPattern: `background-image:radial-gradient(ellipse at 20% 50%,rgba(236,72,153,.06) 0%,transparent 60%),radial-gradient(ellipse at 80% 50%,rgba(236,72,153,.04) 0%,transparent 60%);`
    };
  }

  // Real Estate / Property
  if (/real estate|property|realestate|agent|mortgage|homes|housing|apartment|listing|buy.*home|rent/.test(text)) {
    return {
      name: 'realestate',
      bg: '#05080f', accent: '#0ea5e9', accentRgb: '14,165,233',
      text: '#e0f0ff', muted: '#7090a8', surface: 'rgba(14,165,233,0.05)',
      border: 'rgba(14,165,233,0.18)',
      headFont: "'Libre Franklin', sans-serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Libre+Franklin:wght@400;600;700;900&family=Inter:wght@300;400;500;600',
      heroVerb: 'Find Your', heroNoun: 'Perfect Home.',
      heroPitch: 'Expert local knowledge. Thousands of properties. One trusted agency to guide every step.',
      cta: 'Browse Properties', ctaSecondary: 'Get Appraisal',
      emoji: '🏡', serviceEmoji: ['🔑','🏘️','📊','🤝','🏙️','📋'],
      aboutPoints: ['Deep local market expertise', 'Transparent process, no hidden costs', 'Negotiation specialists on your side', 'End-to-end support from search to settlement'],
      gridPattern: `background-image:linear-gradient(rgba(14,165,233,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(14,165,233,.04) 1px,transparent 1px);background-size:50px 50px;`
    };
  }

  // Health / Medical / Dental / Physio
  if (/dental|dentist|medical|clinic|health|doctor|physio|chiro|osteo|psychology|therapy|allied|pharmacy|optom|vet/.test(text)) {
    return {
      name: 'health',
      bg: '#050c0e', accent: '#14b8a6', accentRgb: '20,184,166',
      text: '#e0f5f3', muted: '#6090a0', surface: 'rgba(20,184,166,0.05)',
      border: 'rgba(20,184,166,0.18)',
      headFont: "'Plus Jakarta Sans', sans-serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@300;400;500;600',
      heroVerb: 'Your Health,', heroNoun: 'Our Priority.',
      heroPitch: 'Compassionate, evidence-based care from an experienced team you can trust completely.',
      cta: 'Book Appointment', ctaSecondary: 'Our Services',
      emoji: '🏥', serviceEmoji: ['🦷','❤️','🧬','👁️','🩺','💊'],
      aboutPoints: ['Registered, experienced practitioners', 'Gentle, patient-centred approach', 'Modern equipment & techniques', 'Accepting new patients now'],
      gridPattern: `background-image:radial-gradient(circle at 50% 0%,rgba(20,184,166,.08) 0%,transparent 55%);`
    };
  }

  // Construction / Trades / Building
  if (/build|construct|trade|plumb|electr|renovate|carpenter|concreting|roofing|landscap|painting|handyman|hvac/.test(text)) {
    return {
      name: 'construction',
      bg: '#080603', accent: '#f59e0b', accentRgb: '245,158,11',
      text: '#f5efe6', muted: '#907060', surface: 'rgba(245,158,11,0.06)',
      border: 'rgba(245,158,11,0.2)',
      headFont: "'Bebas Neue', Impact, sans-serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Bebas+Neue&family=Inter:wght@300;400;500;600',
      heroVerb: 'BUILT TO', heroNoun: 'LAST.',
      heroPitch: 'Quality workmanship, on time, on budget. Trusted by homeowners and developers across the region.',
      cta: 'Get Free Quote', ctaSecondary: 'Our Work',
      emoji: '🔨', serviceEmoji: ['🏗️','🔧','⚡','🪟','🏠','🛠️'],
      aboutPoints: ['Licensed & fully insured tradespeople', 'Over a decade of quality workmanship', 'Transparent quotes, no surprises', 'All work guaranteed'],
      gridPattern: `background-image:repeating-linear-gradient(-45deg,rgba(245,158,11,.03) 0,rgba(245,158,11,.03) 1px,transparent 0,transparent 50%);background-size:20px 20px;`
    };
  }

  // Tech / IT / Software / Digital
  if (/tech|software|digital|it support|cyber|cloud|data|developer|app|saas|ai|automation|web dev/.test(text)) {
    return {
      name: 'tech',
      bg: '#050508', accent: '#7c3aed', accentRgb: '124,58,237',
      text: '#e0e0ff', muted: '#7070a0', surface: 'rgba(124,58,237,0.07)',
      border: 'rgba(124,58,237,0.2)',
      headFont: "'Space Grotesk', sans-serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Space+Grotesk:wght@400;600;700&family=Inter:wght@300;400;500;600',
      heroVerb: 'Powering', heroNoun: 'Digital Futures.',
      heroPitch: 'Cutting-edge technology solutions that scale with your business and deliver measurable results.',
      cta: 'Start Project', ctaSecondary: 'Our Solutions',
      emoji: '💻', serviceEmoji: ['⚡','🔒','☁️','📱','🤖','📊'],
      aboutPoints: ['Senior engineers & solution architects', 'Agile delivery with full transparency', 'Built to scale from day one', '24/7 monitoring & support'],
      gridPattern: `background-image:linear-gradient(rgba(124,58,237,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,.04) 1px,transparent 1px);background-size:40px 40px;`
    };
  }

  // Cleaning / Domestic / Commercial
  if (/clean|domestic|commercial clean|end.of.lease|carpet|window clean|janitorial/.test(text)) {
    return {
      name: 'cleaning',
      bg: '#050a0f', accent: '#22c55e', accentRgb: '34,197,94',
      text: '#e0ffe8', muted: '#508060', surface: 'rgba(34,197,94,0.05)',
      border: 'rgba(34,197,94,0.18)',
      headFont: "'Plus Jakarta Sans', sans-serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@300;400;500;600',
      heroVerb: 'Spotless.', heroNoun: 'Every Time.',
      heroPitch: 'Professional cleaning services that leave your home or workplace immaculate. Guaranteed.',
      cta: 'Get a Quote', ctaSecondary: 'Our Services',
      emoji: '✨', serviceEmoji: ['🏠','🏢','🪣','🪟','🛋️','♻️'],
      aboutPoints: ['Insured, vetted cleaning professionals', 'Eco-friendly products available', 'Flexible scheduling, 7 days a week', '100% satisfaction guarantee'],
      gridPattern: `background-image:radial-gradient(circle,rgba(34,197,94,.03) 1px,transparent 1px);background-size:24px 24px;`
    };
  }

  // Default — professional services / web design / marketing
  return {
    name: 'default',
    bg: '#050810', accent: '#00c8ff', accentRgb: '0,200,255',
    text: '#e0eaf5', muted: '#8aa0b8', surface: 'rgba(0,200,255,0.05)',
    border: 'rgba(0,200,255,0.18)',
    headFont: "'Orbitron', sans-serif",
    bodyFont: "'Inter', sans-serif",
    googleFonts: 'Orbitron:wght@700;900&family=Inter:wght@300;400;500;600',
    heroVerb: 'Built for', heroNoun: 'Results.',
    heroPitch: 'Professional services crafted around your goals — from strategy to delivery, we handle everything.',
    cta: 'Get Started', ctaSecondary: 'Learn More',
    emoji: '⭐', serviceEmoji: ['✦','◈','◉','▹','✿','❋'],
    aboutPoints: ['Professional, results-driven approach', 'Tailored solutions for every client', 'Experienced team dedicated to your success', 'Clear communication from start to finish'],
    gridPattern: `background-image:linear-gradient(rgba(0,200,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,.04) 1px,transparent 1px);background-size:60px 60px;`
  };
}

function generateWebsite({ firstName, lastName, businessName, email, phone, niche, services, websiteUrl, scraped }) {
  const displayName = businessName || `${firstName} ${lastName}`;
  const t = getNicheTheme(services, businessName, scraped, niche);

  const heroHeading = scraped?.h1 || scraped?.title || displayName;
  const heroSub     = scraped?.description || scraped?.paragraphs?.[0] || t.heroPitch;

  const serviceList = services.split(',').map(s => s.trim()).filter(Boolean);
  const serviceCards = serviceList.map((s, i) => {
    const icon = t.serviceEmoji[i % t.serviceEmoji.length];
    return `
      <div class="card">
        <div class="card-icon">${icon}</div>
        <h3>${s}</h3>
        <p>Expert ${s.toLowerCase()} tailored specifically to your business — delivered with care and precision.</p>
      </div>`;
  }).join('');

  const extraCards = (scraped?.h2s || []).filter(h => h.length > 3).slice(0, 3).map((h, i) => {
    const icon = t.serviceEmoji[(serviceList.length + i) % t.serviceEmoji.length];
    return `
      <div class="card">
        <div class="card-icon">${icon}</div>
        <h3>${h}</h3>
        <p>${scraped?.paragraphs?.shift() || 'Delivered with precision, passion, and professionalism.'}</p>
      </div>`;
  }).join('');

  const aboutBullets = t.aboutPoints.map(pt => `<li>${pt}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${displayName}</title>
  <link href="https://fonts.googleapis.com/css2?family=${t.googleFonts}&display=swap" rel="stylesheet"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --acc:${t.accent};--acc-rgb:${t.accentRgb};
      --bg:${t.bg};--text:${t.text};--muted:${t.muted};
      --surface:${t.surface};--border:${t.border};
    }
    html{scroll-behavior:smooth}
    body{font-family:${t.bodyFont};background:var(--bg);color:var(--text);overflow-x:hidden;font-size:16px;line-height:1.65}
    a{color:inherit;text-decoration:none}
    img{max-width:100%}

    /* NAV */
    nav{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;
        padding:0 6%;height:70px;background:rgba(${t.accentRgb},.03);
        backdrop-filter:blur(16px);border-bottom:1px solid var(--border)}
    .logo{font-family:${t.headFont};font-size:1.15rem;font-weight:900;letter-spacing:2px;
          color:var(--text);letter-spacing:3px}
    .nav-links{display:flex;gap:2rem;list-style:none}
    .nav-links a{font-size:.82rem;color:var(--muted);transition:.2s}
    .nav-links a:hover{color:var(--text)}
    .nav-cta{padding:.55rem 1.4rem;background:var(--acc);color:${t.bg};
             border-radius:8px;font-weight:700;font-size:.78rem;letter-spacing:.5px}
    .nav-cta:hover{opacity:.88}

    /* HERO */
    .hero{min-height:95vh;display:flex;flex-direction:column;align-items:center;
          justify-content:center;text-align:center;padding:5rem 6%;
          position:relative;overflow:hidden;${t.gridPattern}}
    .hero-glow{position:absolute;width:800px;height:800px;
               background:radial-gradient(circle,rgba(${t.accentRgb},.09) 0%,transparent 65%);
               top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:0}
    .hero-badge{display:inline-flex;align-items:center;gap:.5rem;
                padding:.4rem 1.1rem;border-radius:999px;
                border:1px solid rgba(${t.accentRgb},.25);
                background:rgba(${t.accentRgb},.06);
                font-size:.7rem;font-weight:600;letter-spacing:2px;
                text-transform:uppercase;color:var(--acc);margin-bottom:2rem;position:relative;z-index:1}
    .hero-badge::before{content:'';width:5px;height:5px;border-radius:50%;
                        background:var(--acc);box-shadow:0 0 6px var(--acc)}
    h1{font-family:${t.headFont};font-size:clamp(2.4rem,7vw,5rem);font-weight:900;
       line-height:1.05;margin-bottom:1.4rem;position:relative;z-index:1;
       letter-spacing:${t.name === 'fitness' || t.name === 'construction' ? '2px' : '-0.02em'}}
    h1 em{font-style:normal;color:var(--acc)}
    .hero-sub{font-size:clamp(1rem,2vw,1.15rem);color:var(--muted);max-width:560px;
              line-height:1.85;margin-bottom:2.8rem;position:relative;z-index:1}
    .hero-btns{display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;position:relative;z-index:1}
    .hero-stats{display:flex;gap:3rem;flex-wrap:wrap;justify-content:center;
                padding-top:3rem;border-top:1px solid var(--border);width:100%;
                max-width:700px;margin-top:3rem;position:relative;z-index:1}
    .stat-n{font-family:${t.headFont};font-size:2rem;font-weight:900;color:var(--acc)}
    .stat-l{font-size:.65rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-top:.3rem}

    /* BUTTONS */
    .btn{display:inline-flex;align-items:center;gap:.5rem;
         padding:.85rem 2.2rem;background:var(--acc);color:${t.bg};
         border-radius:10px;font-weight:700;font-size:.85rem;
         letter-spacing:.5px;transition:.2s}
    .btn:hover{opacity:.88;transform:translateY(-1px)}
    .btn-outline{background:transparent;color:var(--acc);
                 border:1px solid rgba(${t.accentRgb},.4)}
    .btn-outline:hover{background:rgba(${t.accentRgb},.08)}

    /* SECTIONS */
    section{padding:clamp(60px,10vw,100px) 6%}
    .section-inner{max-width:1100px;margin:0 auto}
    .eyebrow{font-size:.65rem;font-weight:700;letter-spacing:3px;text-transform:uppercase;
             color:var(--acc);margin-bottom:.8rem;display:flex;align-items:center;gap:.5rem}
    .eyebrow::before{content:'';width:24px;height:1px;background:var(--acc)}
    h2{font-family:${t.headFont};font-size:clamp(1.8rem,4vw,2.8rem);font-weight:700;
       line-height:1.1;letter-spacing:${t.name === 'fitness' || t.name === 'construction' ? '1px' : '-0.02em'};
       margin-bottom:1rem}
    h2 em{font-style:normal;color:var(--acc)}
    .section-desc{color:var(--muted);font-size:1rem;line-height:1.8;max-width:520px;margin-bottom:2.5rem}
    .divider{width:40px;height:2px;background:var(--acc);margin:1rem 0 2.5rem;
             box-shadow:0 0 8px rgba(${t.accentRgb},.4)}

    /* CARDS */
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.2rem}
    .card{background:var(--surface);border:1px solid var(--border);border-radius:14px;
          padding:2rem;transition:.25s;position:relative}
    .card:hover{border-color:rgba(${t.accentRgb},.4);transform:translateY(-4px);
                box-shadow:0 16px 48px rgba(${t.accentRgb},.08)}
    .card-icon{font-size:1.8rem;margin-bottom:1rem}
    .card h3{font-family:${t.headFont};font-size:.95rem;font-weight:700;
             margin-bottom:.5rem;letter-spacing:.5px}
    .card p{font-size:.87rem;color:var(--muted);line-height:1.7}

    /* ABOUT */
    .about-layout{display:grid;grid-template-columns:1fr 1.1fr;gap:4rem;align-items:center}
    .about-visual{border:1px solid var(--border);border-radius:20px;
                  background:var(--surface);aspect-ratio:1;
                  display:flex;align-items:center;justify-content:center;
                  font-family:${t.headFont};font-size:3rem;font-weight:900;
                  color:var(--text);letter-spacing:6px;
                  box-shadow:inset 0 0 80px rgba(${t.accentRgb},.06)}
    .about-list{list-style:none;margin-top:1.5rem;display:flex;flex-direction:column;gap:.2rem}
    .about-list li{display:flex;gap:.7rem;align-items:flex-start;
                   padding:.6rem 0;border-bottom:1px solid var(--border);
                   font-size:.9rem;color:var(--muted)}
    .about-list li::before{content:'→';color:var(--acc);flex-shrink:0;font-size:.85rem}

    /* CONTACT */
    .contact-wrap{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.2rem;margin-top:2.5rem}
    .ccard{background:var(--surface);border:1px solid var(--border);border-radius:12px;
           padding:1.6rem;display:flex;gap:1rem;align-items:flex-start;transition:.2s}
    .ccard:hover{border-color:rgba(${t.accentRgb},.35)}
    .cicon{width:44px;height:44px;background:rgba(${t.accentRgb},.08);
           border:1px solid var(--border);border-radius:10px;
           display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
    .ccard h4{font-size:.68rem;letter-spacing:1.5px;text-transform:uppercase;
              color:var(--muted);margin-bottom:.3rem}
    .ccard p{font-size:.9rem}

    /* FOOTER */
    footer{text-align:center;padding:2.5rem 6%;
           border-top:1px solid var(--border);
           color:var(--muted);font-size:.8rem}
    footer strong{color:var(--acc)}

    @media(max-width:768px){
      .about-layout,.nav-links{display:none}
      .about-visual{display:none}
      .hero-stats{gap:1.5rem}
    }
  </style>
</head>
<body>

<nav>
  <div class="logo">${displayName.substring(0,14).toUpperCase()}</div>
  <ul class="nav-links">
    <li><a href="#services">Services</a></li>
    <li><a href="#about">About</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
  <a href="#contact" class="nav-cta">${t.cta}</a>
</nav>

<section class="hero">
  <div class="hero-glow"></div>
  <div class="hero-badge">${t.emoji} ${displayName}</div>
  <h1>${t.heroVerb} <em>${t.heroNoun}</em></h1>
  <p class="hero-sub">${heroSub}</p>
  <div class="hero-btns">
    <a href="#contact" class="btn">${t.cta}</a>
    <a href="#services" class="btn btn-outline">${t.ctaSecondary}</a>
  </div>
  <div class="hero-stats">
    <div><div class="stat-n">5★</div><div class="stat-l">Client Rating</div></div>
    <div><div class="stat-n">100%</div><div class="stat-l">Satisfaction</div></div>
    <div><div class="stat-n">24h</div><div class="stat-l">Response Time</div></div>
  </div>
</section>

<section id="services" style="background:rgba(${t.accentRgb},.02)">
  <div class="section-inner">
    <div class="eyebrow">What We Offer</div>
    <h2>Our <em>Services</em></h2>
    <div class="divider"></div>
    <p class="section-desc">Everything you need, handled by one dedicated team.</p>
    <div class="grid">
      ${serviceCards}
      ${extraCards}
    </div>
  </div>
</section>

<section id="about">
  <div class="section-inner">
    <div class="about-layout">
      <div class="about-visual">${displayName.substring(0,4).toUpperCase()}</div>
      <div>
        <div class="eyebrow">Who We Are</div>
        <h2>About <em>${displayName}</em></h2>
        <div class="divider"></div>
        <p class="section-desc">${heroSub}</p>
        <ul class="about-list">
          ${aboutBullets}
        </ul>
      </div>
    </div>
  </div>
</section>

<section id="contact" style="background:rgba(${t.accentRgb},.02)">
  <div class="section-inner" style="text-align:center">
    <div class="eyebrow" style="justify-content:center">Get In Touch</div>
    <h2>Ready to <em>Get Started?</em></h2>
    <div class="divider" style="margin:1rem auto 2.5rem"></div>
    <p class="section-desc" style="margin:0 auto 0">Reach out today — we'd love to hear about your project.</p>
    <div class="contact-wrap" style="max-width:800px;margin:2.5rem auto 0">
      <div class="ccard">
        <div class="cicon">📧</div>
        <div><h4>Email</h4><p>${email}</p></div>
      </div>
      <div class="ccard">
        <div class="cicon">📞</div>
        <div><h4>Phone</h4><p>${phone || 'Contact us online'}</p></div>
      </div>
      ${websiteUrl ? `<div class="ccard">
        <div class="cicon">🌐</div>
        <div><h4>Website</h4><p>${websiteUrl}</p></div>
      </div>` : ''}
    </div>
  </div>
</section>

<footer>
  <p>© ${new Date().getFullYear()} <strong>${displayName}</strong>. All rights reserved.</p>
  <p style="margin-top:.4rem">Website designed &amp; built by <strong>Zyntrix</strong> — <a href="https://zyntrixai.co" style="color:var(--acc)">zyntrixai.co</a></p>
</footer>

</body>
</html>`;
}

// ── Contact form endpoint ──────────────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, email, subject, message } = req.body;

  if (!firstName || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: `"Zyntrix Website" <${process.env.EMAIL_USER}>`,
      to: process.env.BUSINESS_EMAIL,
      replyTo: email,
      subject: `New Enquiry: ${subject || 'General Question'} — ${firstName} ${lastName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#050810;color:#e0eaf5;border:1px solid rgba(0,200,255,0.2);border-radius:12px">
          <h1 style="color:#00c8ff;font-size:1.4rem;margin-bottom:1.5rem">New Website Enquiry</h1>
          <table style="width:100%;border-collapse:collapse;font-size:.95rem">
            <tr><td style="padding:.5rem 0;color:#8aa0b8;width:120px">Name</td><td><strong>${firstName} ${lastName}</strong></td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Email</td><td><a href="mailto:${email}" style="color:#00c8ff">${email}</a></td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Subject</td><td>${subject || '—'}</td></tr>
          </table>
          <hr style="border-color:rgba(0,200,255,0.15);margin:1.5rem 0"/>
          <p style="color:#8aa0b8;font-size:.85rem;margin-bottom:.5rem">Message:</p>
          <p style="background:rgba(0,200,255,0.05);border:1px solid rgba(0,200,255,0.12);border-radius:8px;padding:1rem;line-height:1.7">${message}</p>
          <p style="margin-top:1.5rem;color:#8aa0b8;font-size:.8rem">Reply directly to this email to respond to ${firstName}.</p>
        </div>
      `
    });

    res.json({ success: true });

    // Forward to booking app for the Inbound page (best-effort, don't block response)
    const bookingAppUrl = process.env.BOOKING_APP_URL;
    if (bookingAppUrl) {
      axios.post(`${bookingAppUrl}/api/enquiries`, {
        firstName, lastName, email,
        subject: subject || 'General Question',
        message,
        source: 'zyntrix-website'
      }).catch(err => console.warn('Could not forward to booking app:', err.message));
    }
  } catch (err) {
    console.error('Contact email error:', err.message);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

// ── Quote endpoint ─────────────────────────────────────────────────────────────
app.post('/api/quote', async (req, res) => {
  const { firstName, lastName, businessName, email, phone, niche, services, websiteUrl } = req.body;

  if (!firstName || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  // 1. Scrape their existing site (if provided)
  const scraped = websiteUrl ? await scrapeWebsite(websiteUrl) : null;

  // 2. Generate the website HTML
  const generatedHtml = generateWebsite({ firstName, lastName, businessName, email, phone, niche, services: services || 'Web Design', websiteUrl, scraped });
  const fileName = `${(businessName || `${firstName}-${lastName}`).replace(/\s+/g, '-')}-website.html`;

  // 3. Send email to business
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const scrapedSummary = scraped
    ? `<p><strong>Scraped from their site:</strong><br>${scraped.description || scraped.h1 || 'No description found.'}</p>`
    : '<p><em>No existing website provided.</em></p>';

  try {
    await transporter.sendMail({
      from: `"Zyntrix Quotes" <${process.env.EMAIL_USER}>`,
      to: process.env.BUSINESS_EMAIL,
      subject: `New Quote Request — ${businessName || `${firstName} ${lastName}`}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#050810;color:#e0eaf5;border:1px solid rgba(0,200,255,0.2);border-radius:12px">
          <h1 style="color:#00c8ff;font-size:1.5rem;margin-bottom:1.5rem">New Quote Request</h1>
          <table style="width:100%;border-collapse:collapse;font-size:.95rem">
            <tr><td style="padding:.5rem 0;color:#8aa0b8;width:140px">Name</td><td><strong>${firstName} ${lastName}</strong></td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Business</td><td><strong>${businessName || '—'}</strong></td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Email</td><td><a href="mailto:${email}" style="color:#00c8ff">${email}</a></td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Phone</td><td>${phone || '—'}</td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Services</td><td>${services}</td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Their Site</td><td>${websiteUrl || '—'}</td></tr>
          </table>
          <hr style="border-color:rgba(0,200,255,0.15);margin:1.5rem 0"/>
          ${scrapedSummary}
          <p style="margin-top:1.5rem;color:#8aa0b8;font-size:.85rem">The auto-generated website draft is attached as <strong>${fileName}</strong>. Open it in a browser to preview.</p>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: generatedHtml,
          contentType: 'text/html'
        }
      ]
    });

    const LEADS_URL = 'http://localhost:3002';

    // 1. Add as enquiry (shows in Enquiries tab)
    try {
      await axios.post(`${LEADS_URL}/api/enquiries`, {
        first_name: firstName,
        last_name:  lastName,
        email,
        phone,
        business_name: businessName,
        services,
        website_url: websiteUrl,
        subject: `Quote Request — ${businessName || `${firstName} ${lastName}`}`,
        message: `Services wanted: ${services}\nExisting website: ${websiteUrl || 'None'}\nGenerated website draft sent via email.`,
        source: 'quote-form'
      });
    } catch (fwdErr) {
      console.warn('Could not add enquiry to LeadFinder:', fwdErr.message);
    }

    // 2. Add as a proper lead (shows in All Leads tab)
    try {
      await axios.post(`${LEADS_URL}/api/leads/import`, {
        leads: [{
          business_name: businessName || `${firstName} ${lastName}`,
          category: services.split(',')[0].trim(),
          phone,
          email,
          website: websiteUrl || '',
          has_website: websiteUrl ? 1 : 0,
          city: '',
          state: 'AUS',
          status: 'interested',
          source: 'quote-form'
        }]
      });
    } catch (fwdErr) {
      console.warn('Could not add lead to LeadFinder:', fwdErr.message);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Email error:', err.message, err.code);
    res.status(500).json({ error: err.message || 'Failed to send email.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Zyntrix server running → http://localhost:${PORT}`);
});
