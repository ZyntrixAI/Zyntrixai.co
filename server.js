require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const axios    = require('axios');
const cheerio  = require('cheerio');
const nodemailer = require('nodemailer');
const path     = require('path');
const crypto   = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ── Scrape the client's existing website ──────────────────────────────────────
async function scrapeWebsite(url) {
  try {
    if (!url || !url.trim()) return null;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZyntrixAIBot/1.0)' }
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

  // ── Shared luxury grid patterns ───────────────────────────────────────────────
  const diamondGrid = (r,g,b) => `background-image:repeating-linear-gradient(45deg,rgba(${r},${g},${b},.025) 0,rgba(${r},${g},${b},.025) 1px,transparent 0,transparent 50%),repeating-linear-gradient(-45deg,rgba(${r},${g},${b},.025) 0,rgba(${r},${g},${b},.025) 1px,transparent 0,transparent 50%);background-size:32px 32px;`;
  const fineGrid   = (r,g,b) => `background-image:linear-gradient(rgba(${r},${g},${b},.04) 1px,transparent 1px),linear-gradient(90deg,rgba(${r},${g},${b},.04) 1px,transparent 1px);background-size:64px 64px;`;
  const dotsGrid   = (r,g,b) => `background-image:radial-gradient(circle,rgba(${r},${g},${b},.06) 1px,transparent 1px);background-size:30px 30px;`;

  // Restaurant / Food / Cafe / Bar — warm champagne gold
  if (/restaurant|cafe|coffee|food|bar|bistro|bakery|pizza|sushi|grill|diner|eatery|catering|cuisine|tavern|pub|kitchen/.test(text)) {
    return {
      name: 'food',
      bg: '#09070400', accent: '#c8a96a', accentRgb: '200,169,106',
      text: '#f2ede4', muted: '#9c8c74', surface: 'rgba(200,169,106,0.05)',
      border: 'rgba(200,169,106,0.14)',
      headFont: "'Cormorant Garamond', Georgia, serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600',
      heroVerb: 'A Taste of', heroNoun: 'Excellence.',
      heroPitch: 'Every dish crafted with passion. Every visit an experience worth savouring and remembering.',
      cta: 'Reserve a Table', ctaSecondary: 'View Our Menu',
      emoji: '🍽️', serviceEmoji: ['🥗','☕','🍷','🎂','👨‍🍳','⭐'],
      aboutPoints: ['Finest locally sourced, seasonal ingredients', 'Award-winning culinary craftsmanship', 'Intimate and welcoming atmosphere', 'Private dining & bespoke events available'],
      gridPattern: diamondGrid(200,169,106)
    };
  }

  // Law / Legal — deep midnight + antique gold
  if (/law|legal|solicitor|attorney|barrister|firm|litigation|convey|notary|counsel|justice/.test(text)) {
    return {
      name: 'law',
      bg: '#07060f', accent: '#c4a84f', accentRgb: '196,168,79',
      text: '#eae6d8', muted: '#9a9278', surface: 'rgba(196,168,79,0.05)',
      border: 'rgba(196,168,79,0.14)',
      headFont: "'Cormorant Garamond', Georgia, serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600',
      heroVerb: 'Counsel You', heroNoun: 'Can Trust.',
      heroPitch: 'Trusted legal counsel delivered with integrity, discretion, and a relentless focus on your outcome.',
      cta: 'Book a Consultation', ctaSecondary: 'Our Practice Areas',
      emoji: '⚖️', serviceEmoji: ['📋','🏛️','🤝','📜','🔍','💼'],
      aboutPoints: ['Decades of distinguished legal expertise', 'Absolute discretion and confidentiality', 'Proven results across all practice areas', 'Your interests remain our singular focus'],
      gridPattern: fineGrid(196,168,79)
    };
  }

  // Fitness / Gym — carbon black + burnished gold
  if (/gym|fitness|training|crossfit|yoga|pilates|sport|athlete|workout|personal trainer|bootcamp|martial|boxing|weight/.test(text)) {
    return {
      name: 'fitness',
      bg: '#080807', accent: '#c9a84c', accentRgb: '201,168,76',
      text: '#f0ece4', muted: '#908070', surface: 'rgba(201,168,76,0.06)',
      border: 'rgba(201,168,76,0.16)',
      headFont: "'Bebas Neue', Impact, sans-serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Bebas+Neue&family=Inter:wght@300;400;500;600',
      heroVerb: 'FORGE YOUR', heroNoun: 'LEGACY.',
      heroPitch: 'Elite performance training in a premium environment. Where ambition meets excellence.',
      cta: 'Begin Your Journey', ctaSecondary: 'Our Programs',
      emoji: '🏆', serviceEmoji: ['🏋️','🏃','🧘','🥊','⚡','🎯'],
      aboutPoints: ['Elite certified coaches & performance specialists', 'Premium, state-of-the-art facilities', 'Bespoke programs for every goal', 'An exclusive community of high achievers'],
      gridPattern: diamondGrid(201,168,76)
    };
  }

  // Beauty / Spa — near black + rose gold
  if (/salon|spa|beauty|hair|nails|lash|brow|skin|facial|massage|wax|aesthetic|cosmetic|makeup|barber/.test(text)) {
    return {
      name: 'beauty',
      bg: '#0b0709', accent: '#c9957a', accentRgb: '201,149,122',
      text: '#f5ede8', muted: '#a08070', surface: 'rgba(201,149,122,0.05)',
      border: 'rgba(201,149,122,0.14)',
      headFont: "'Cormorant Garamond', Georgia, serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600',
      heroVerb: 'Redefine', heroNoun: 'Radiance.',
      heroPitch: 'A sanctuary where beauty becomes artistry. Treatments crafted exclusively for you.',
      cta: 'Book an Appointment', ctaSecondary: 'Our Treatments',
      emoji: '✨', serviceEmoji: ['💆','💅','🌹','🕯️','💋','🌷'],
      aboutPoints: ['Master-trained therapists & stylists', 'Exclusive, curated luxury product lines', 'Intimate, private treatment suites', 'Bespoke consultations as standard'],
      gridPattern: dotsGrid(201,149,122)
    };
  }

  // Real Estate / Property — deep charcoal + platinum gold
  if (/real estate|property|realestate|agent|mortgage|homes|housing|apartment|listing|buy.*home|rent/.test(text)) {
    return {
      name: 'realestate',
      bg: '#07080c', accent: '#c2ab76', accentRgb: '194,171,118',
      text: '#ede8dc', muted: '#90887a', surface: 'rgba(194,171,118,0.05)',
      border: 'rgba(194,171,118,0.14)',
      headFont: "'Cormorant Garamond', Georgia, serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Cormorant+Garamond:wght@400;600;700&family=Inter:wght@300;400;500;600',
      heroVerb: 'Exceptional', heroNoun: 'Properties.',
      heroPitch: 'Curated real estate expertise for discerning buyers and sellers. Your next chapter, handled with distinction.',
      cta: 'View Properties', ctaSecondary: 'Get a Private Appraisal',
      emoji: '🏛️', serviceEmoji: ['🔑','🏡','📊','🤝','🏙️','📋'],
      aboutPoints: ['Deep knowledge of premium local markets', 'White-glove, fully transparent service', 'Expert negotiation on your behalf', 'End-to-end concierge support'],
      gridPattern: fineGrid(194,171,118)
    };
  }

  // Health / Medical / Dental — deep slate + warm gold
  if (/dental|dentist|medical|clinic|health|doctor|physio|chiro|osteo|psychology|therapy|allied|pharmacy|optom|vet/.test(text)) {
    return {
      name: 'health',
      bg: '#07090c', accent: '#b8a06a', accentRgb: '184,160,106',
      text: '#eae4d8', muted: '#908070', surface: 'rgba(184,160,106,0.05)',
      border: 'rgba(184,160,106,0.14)',
      headFont: "'Cormorant Garamond', Georgia, serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Cormorant+Garamond:wght@400;600;700&family=Inter:wght@300;400;500;600',
      heroVerb: 'Care Beyond', heroNoun: 'Compare.',
      heroPitch: 'Compassionate, evidence-based care from practitioners who take the time to truly listen.',
      cta: 'Book an Appointment', ctaSecondary: 'Our Services',
      emoji: '🏥', serviceEmoji: ['🦷','❤️','🧬','👁️','🩺','💊'],
      aboutPoints: ['Registered, experienced clinical practitioners', 'Gentle, patient-centred approach', 'Modern precision equipment & techniques', 'Welcoming new patients — book today'],
      gridPattern: dotsGrid(184,160,106)
    };
  }

  // Construction / Trades — dark earth + raw gold
  if (/build|construct|trade|plumb|electr|renovate|carpenter|concreting|roofing|landscap|painting|handyman|hvac/.test(text)) {
    return {
      name: 'construction',
      bg: '#080604', accent: '#c4982a', accentRgb: '196,152,42',
      text: '#f0e8da', muted: '#907858', surface: 'rgba(196,152,42,0.05)',
      border: 'rgba(196,152,42,0.15)',
      headFont: "'Bebas Neue', Impact, sans-serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Bebas+Neue&family=Inter:wght@300;400;500;600',
      heroVerb: 'CRAFTED TO', heroNoun: 'ENDURE.',
      heroPitch: 'Uncompromising craftsmanship. Premium materials. Projects delivered with pride and precision.',
      cta: 'Get a Quote', ctaSecondary: 'Our Work',
      emoji: '🏗️', serviceEmoji: ['🏗️','🔧','⚡','🪟','🏠','🛠️'],
      aboutPoints: ['Fully licensed & comprehensively insured', 'Premium materials, zero shortcuts', 'Transparent, fixed-price quoting', 'All work certified and guaranteed'],
      gridPattern: diamondGrid(196,152,42)
    };
  }

  // Tech / IT / Software — space black + silver-gold
  if (/tech|software|digital|it support|cyber|cloud|data|developer|app|saas|ai|automation|web dev/.test(text)) {
    return {
      name: 'tech',
      bg: '#06060a', accent: '#b8a878', accentRgb: '184,168,120',
      text: '#e8e4d8', muted: '#888070', surface: 'rgba(184,168,120,0.05)',
      border: 'rgba(184,168,120,0.14)',
      headFont: "'Cormorant Garamond', Georgia, serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Cormorant+Garamond:wght@400;600;700&family=Inter:wght@300;400;500;600',
      heroVerb: 'Precision', heroNoun: 'Technology.',
      heroPitch: 'Sophisticated digital solutions engineered for performance, security, and lasting impact.',
      cta: 'Start a Project', ctaSecondary: 'Our Solutions',
      emoji: '⚡', serviceEmoji: ['⚡','🔒','☁️','📱','🤖','📊'],
      aboutPoints: ['Senior engineers & solution architects', 'Rigorous, transparent delivery process', 'Engineered to scale from day one', 'Enterprise-grade security & support'],
      gridPattern: fineGrid(184,168,120)
    };
  }

  // Cleaning / Domestic — deep navy + champagne
  if (/clean|domestic|commercial clean|end.of.lease|carpet|window clean|janitorial/.test(text)) {
    return {
      name: 'cleaning',
      bg: '#07080c', accent: '#c0a96a', accentRgb: '192,169,106',
      text: '#eae6dc', muted: '#90887a', surface: 'rgba(192,169,106,0.05)',
      border: 'rgba(192,169,106,0.14)',
      headFont: "'Cormorant Garamond', Georgia, serif",
      bodyFont: "'Inter', sans-serif",
      googleFonts: 'Cormorant+Garamond:wght@400;600;700&family=Inter:wght@300;400;500;600',
      heroVerb: 'Immaculate.', heroNoun: 'Always.',
      heroPitch: 'White-glove cleaning services that restore and maintain your space to an impeccable standard.',
      cta: 'Book a Clean', ctaSecondary: 'Our Services',
      emoji: '✨', serviceEmoji: ['🏠','🏢','🪣','🪟','🛋️','♻️'],
      aboutPoints: ['Vetted, insured cleaning professionals', 'Premium, eco-certified products', 'Flexible scheduling, 7 days a week', '100% satisfaction, every visit'],
      gridPattern: dotsGrid(192,169,106)
    };
  }

  // Default — pure luxury dark + champagne gold
  return {
    name: 'default',
    bg: '#080709', accent: '#c4a96e', accentRgb: '196,169,110',
    text: '#ede8dc', muted: '#9a9282', surface: 'rgba(196,169,110,0.05)',
    border: 'rgba(196,169,110,0.14)',
    headFont: "'Cormorant Garamond', Georgia, serif",
    bodyFont: "'Inter', sans-serif",
    googleFonts: 'Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600',
    heroVerb: 'Crafted for', heroNoun: 'Excellence.',
    heroPitch: 'Premium services built around your goals — delivered with discretion, precision, and care.',
    cta: 'Get Started', ctaSecondary: 'Learn More',
    emoji: '✦', serviceEmoji: ['✦','◈','◉','▹','✿','❋'],
    aboutPoints: ['Uncompromising attention to detail', 'Bespoke solutions for every client', 'A team deeply invested in your success', 'Clear, honest communication throughout'],
    gridPattern: diamondGrid(196,169,110)
  };
}

function generateWebsite({ firstName, lastName, businessName, email, phone, niche, services, websiteUrl, scraped }) {
  const displayName = businessName || `${firstName} ${lastName}`;
  const t = getNicheTheme(services, businessName, scraped, niche);

  const heroSub     = scraped?.description || scraped?.paragraphs?.[0] || t.heroPitch;
  const isBold      = t.name === 'fitness' || t.name === 'construction';

  const serviceList = services.split(',').map(s => s.trim()).filter(Boolean);
  const allCards = [
    ...serviceList.map((s, i) => ({
      icon: t.serviceEmoji[i % t.serviceEmoji.length],
      title: s,
      desc: `Expert ${s.toLowerCase()} tailored to your business — delivered with care and precision.`
    })),
    ...(scraped?.h2s || []).filter(h => h.length > 3).slice(0, 3).map((h, i) => ({
      icon: t.serviceEmoji[(serviceList.length + i) % t.serviceEmoji.length],
      title: h,
      desc: scraped?.paragraphs?.shift() || 'Delivered with precision, passion, and professionalism.'
    }))
  ];

  const serviceCardsHtml = allCards.map((c, i) => `
    <div class="card reveal" style="--delay:${i * 80}ms">
      <div class="card-num">0${i + 1}</div>
      <div class="card-icon">${c.icon}</div>
      <h3>${c.title}</h3>
      <p>${c.desc}</p>
      <div class="card-line"></div>
    </div>`).join('');

  const aboutBullets = t.aboutPoints.map((pt, i) => `
    <li class="reveal" style="--delay:${i * 100}ms">
      <span class="bullet-num">0${i+1}</span>
      <span>${pt}</span>
    </li>`).join('');

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
    body{font-family:${t.bodyFont};background:var(--bg);color:var(--text);overflow-x:hidden;line-height:1.65;-webkit-font-smoothing:antialiased}
    a{color:inherit;text-decoration:none}
    img{max-width:100%}

    /* ── SCROLL REVEAL ── */
    .reveal{opacity:0;transform:translateY(28px);transition:opacity .65s cubic-bezier(.22,1,.36,1) var(--delay,0ms),transform .65s cubic-bezier(.22,1,.36,1) var(--delay,0ms)}
    .reveal.visible{opacity:1;transform:none}
    .reveal-left{opacity:0;transform:translateX(-36px);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1)}
    .reveal-left.visible{opacity:1;transform:none}
    .reveal-right{opacity:0;transform:translateX(36px);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1)}
    .reveal-right.visible{opacity:1;transform:none}

    /* ── KEYFRAMES ── */
    @keyframes floatA{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-22px) scale(1.04)}}
    @keyframes floatB{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-14px) rotate(6deg)}}
    @keyframes pulseGlow{0%,100%{opacity:.55}50%{opacity:1}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes fadeSlideDown{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:none}}
    @keyframes gradientShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
    @keyframes borderSpin{to{--angle:360deg}}
    @keyframes countUp{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}
    @keyframes lineGrow{from{width:0}to{width:100%}}

    /* ── NAV ── */
    nav{position:fixed;top:0;left:0;right:0;z-index:999;
        display:flex;align-items:center;justify-content:space-between;
        padding:0 6%;height:68px;
        transition:background .3s,border-color .3s,backdrop-filter .3s}
    nav.scrolled{background:rgba(${t.bg.replace('#','').match(/../g).map(x=>parseInt(x,16)).join(',') || '5,8,16'},.88);
                 backdrop-filter:blur(18px);border-bottom:1px solid var(--border)}
    .logo{font-family:${t.headFont};font-size:1.1rem;font-weight:900;
          letter-spacing:3px;color:var(--text);cursor:pointer}
    .logo span{color:var(--acc)}
    .nav-links{display:flex;gap:2.2rem;list-style:none;align-items:center}
    .nav-links a{font-size:.8rem;color:var(--muted);transition:color .2s;letter-spacing:.5px}
    .nav-links a:hover{color:var(--text)}
    .nav-cta{padding:.5rem 1.3rem;background:var(--acc);color:${t.bg};
             border-radius:8px;font-weight:700;font-size:.75rem;letter-spacing:.8px;
             transition:all .2s;white-space:nowrap}
    .nav-cta:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(${t.accentRgb},.35)}
    .hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:4px}
    .hamburger span{display:block;width:22px;height:1.5px;background:var(--text);border-radius:2px;transition:.25s}
    .hamburger.open span:nth-child(1){transform:rotate(45deg) translate(4.5px,4.5px)}
    .hamburger.open span:nth-child(2){opacity:0}
    .hamburger.open span:nth-child(3){transform:rotate(-45deg) translate(4.5px,-4.5px)}
    .mobile-menu{display:none;position:fixed;top:68px;left:0;right:0;z-index:998;
                 background:rgba(${t.bg.replace('#','').match(/../g).map(x=>parseInt(x,16)).join(',') || '5,8,16'},.97);
                 backdrop-filter:blur(20px);border-bottom:1px solid var(--border);
                 padding:1.5rem 6% 2rem;flex-direction:column;gap:1.2rem;
                 animation:fadeSlideDown .2s ease}
    .mobile-menu.open{display:flex}
    .mobile-menu a{font-size:.95rem;color:var(--muted);padding:.4rem 0;border-bottom:1px solid var(--border);transition:color .2s}
    .mobile-menu a:hover{color:var(--text)}

    /* ── HERO ── */
    .hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;
          justify-content:center;text-align:center;padding:8rem 6% 5rem;
          position:relative;overflow:hidden;${t.gridPattern}}
    .hero-orb-1{position:absolute;width:600px;height:600px;border-radius:50%;
                background:radial-gradient(circle,rgba(${t.accentRgb},.13) 0%,transparent 70%);
                top:-100px;left:-150px;pointer-events:none;
                animation:floatA 9s ease-in-out infinite}
    .hero-orb-2{position:absolute;width:500px;height:500px;border-radius:50%;
                background:radial-gradient(circle,rgba(${t.accentRgb},.09) 0%,transparent 70%);
                bottom:-80px;right:-120px;pointer-events:none;
                animation:floatA 11s ease-in-out infinite reverse}
    .hero-orb-3{position:absolute;width:300px;height:300px;border-radius:50%;
                background:radial-gradient(circle,rgba(${t.accentRgb},.06) 0%,transparent 70%);
                top:30%;right:10%;pointer-events:none;
                animation:floatB 7s ease-in-out infinite}
    .hero-badge{display:inline-flex;align-items:center;gap:.6rem;
                padding:.45rem 1.2rem;border-radius:999px;
                border:1px solid rgba(${t.accentRgb},.3);
                background:rgba(${t.accentRgb},.07);
                font-size:.68rem;font-weight:700;letter-spacing:2.5px;
                text-transform:uppercase;color:var(--acc);margin-bottom:2rem;
                position:relative;z-index:1;animation:fadeSlideDown .6s ease both}
    .hero-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--acc);
                    box-shadow:0 0 8px rgba(${t.accentRgb},.8);
                    animation:pulseGlow 2s ease-in-out infinite}
    h1{font-family:${t.headFont};font-size:clamp(2.6rem,7vw,5.2rem);font-weight:900;
       line-height:1.04;margin-bottom:1.5rem;position:relative;z-index:1;
       letter-spacing:${isBold ? '2px' : '-0.03em'};
       animation:fadeSlideDown .7s .1s ease both}
    h1 em{font-style:normal;
          background:linear-gradient(135deg,var(--acc),rgba(${t.accentRgb},.7) 50%,var(--acc));
          background-size:200% auto;
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
          animation:shimmer 3s linear infinite}
    .hero-sub{font-size:clamp(.95rem,2vw,1.12rem);color:var(--muted);max-width:540px;
              line-height:1.9;margin-bottom:3rem;position:relative;z-index:1;
              animation:fadeSlideDown .7s .2s ease both}
    .hero-btns{display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;
               position:relative;z-index:1;animation:fadeSlideDown .7s .3s ease both}
    .hero-stats{display:flex;gap:0;flex-wrap:wrap;justify-content:center;
                margin-top:4rem;position:relative;z-index:1;
                border:1px solid var(--border);border-radius:16px;
                overflow:hidden;max-width:640px;width:100%;
                animation:fadeSlideDown .7s .4s ease both;
                background:rgba(${t.accentRgb},.02);backdrop-filter:blur(8px)}
    .stat{flex:1;min-width:140px;padding:1.4rem 1rem;text-align:center;
          border-right:1px solid var(--border);transition:background .2s}
    .stat:last-child{border-right:none}
    .stat:hover{background:rgba(${t.accentRgb},.05)}
    .stat-n{font-family:${t.headFont};font-size:1.8rem;font-weight:900;color:var(--acc);
            line-height:1;animation:countUp .8s .6s both}
    .stat-l{font-size:.6rem;letter-spacing:1.8px;text-transform:uppercase;color:var(--muted);margin-top:.4rem}

    /* ── BUTTONS ── */
    .btn{display:inline-flex;align-items:center;gap:.5rem;
         padding:.9rem 2.2rem;background:var(--acc);color:${t.bg};
         border-radius:10px;font-weight:700;font-size:.85rem;letter-spacing:.5px;
         transition:all .2s;position:relative;overflow:hidden}
    .btn::after{content:'';position:absolute;inset:0;
                background:linear-gradient(rgba(255,255,255,.15),rgba(255,255,255,0));
                opacity:0;transition:.2s}
    .btn:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(${t.accentRgb},.4)}
    .btn:hover::after{opacity:1}
    .btn-outline{background:transparent;color:var(--acc);
                 border:1px solid rgba(${t.accentRgb},.45)}
    .btn-outline::after{display:none}
    .btn-outline:hover{background:rgba(${t.accentRgb},.1);border-color:var(--acc);
                       box-shadow:0 6px 20px rgba(${t.accentRgb},.15)}

    /* ── SECTIONS ── */
    section{padding:clamp(80px,12vw,120px) 6%}
    .section-inner{max-width:1100px;margin:0 auto}
    .eyebrow{font-size:.62rem;font-weight:700;letter-spacing:3px;text-transform:uppercase;
             color:var(--acc);margin-bottom:.9rem;display:inline-flex;align-items:center;gap:.6rem}
    .eyebrow::before{content:'';width:20px;height:1px;background:var(--acc);flex-shrink:0}
    h2{font-family:${t.headFont};font-size:clamp(1.9rem,4vw,3rem);font-weight:800;
       line-height:1.08;letter-spacing:${isBold ? '1px' : '-0.025em'};margin-bottom:1rem}
    h2 em{font-style:normal;color:var(--acc)}
    .section-desc{color:var(--muted);font-size:1rem;line-height:1.85;max-width:500px;margin-bottom:2.8rem}
    .divider{display:flex;align-items:center;gap:.8rem;margin:1rem 0 2.5rem}
    .divider-line{height:1px;width:40px;background:linear-gradient(to right,var(--acc),transparent)}
    .divider-dot{width:5px;height:5px;border-radius:50%;background:var(--acc);box-shadow:0 0 8px rgba(${t.accentRgb},.7)}

    /* ── SERVICE CARDS ── */
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:1.4rem}
    .card{background:var(--surface);border:1px solid var(--border);border-radius:16px;
          padding:2.2rem;transition:all .3s cubic-bezier(.22,1,.36,1);position:relative;overflow:hidden;cursor:default}
    .card::before{content:'';position:absolute;inset:0;border-radius:inherit;
                  background:linear-gradient(135deg,rgba(${t.accentRgb},.07),transparent 60%);
                  opacity:0;transition:.3s}
    .card:hover{border-color:rgba(${t.accentRgb},.45);transform:translateY(-6px);
                box-shadow:0 20px 60px rgba(${t.accentRgb},.12)}
    .card:hover::before{opacity:1}
    .card-num{font-size:.58rem;font-family:monospace;color:var(--acc);opacity:.4;
              letter-spacing:2px;margin-bottom:1.2rem;transition:.2s}
    .card:hover .card-num{opacity:1}
    .card-icon{font-size:2rem;margin-bottom:1rem;display:block}
    .card h3{font-family:${t.headFont};font-size:1rem;font-weight:700;
             margin-bottom:.6rem;letter-spacing:.3px}
    .card p{font-size:.87rem;color:var(--muted);line-height:1.75;flex:1}
    .card-line{position:absolute;bottom:0;left:0;height:2px;width:0;
               background:linear-gradient(to right,var(--acc),transparent);
               transition:width .4s cubic-bezier(.22,1,.36,1)}
    .card:hover .card-line{width:100%}

    /* ── WHY US STRIP ── */
    .why-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
               gap:1px;background:var(--border);border:1px solid var(--border);
               border-radius:16px;overflow:hidden;margin-top:3rem}
    .why-item{background:var(--bg);padding:2rem 1.6rem;text-align:center;transition:background .2s}
    .why-item:hover{background:var(--surface)}
    .why-icon{font-size:1.6rem;margin-bottom:.8rem}
    .why-item h4{font-size:.9rem;font-weight:700;color:var(--text);margin-bottom:.4rem}
    .why-item p{font-size:.82rem;color:var(--muted);line-height:1.6}

    /* ── ABOUT ── */
    .about-layout{display:grid;grid-template-columns:1fr 1.15fr;gap:5rem;align-items:center}
    .about-visual-wrap{position:relative}
    .about-visual{border:1px solid var(--border);border-radius:24px;
                  background:linear-gradient(135deg,rgba(${t.accentRgb},.08),rgba(${t.accentRgb},.02));
                  aspect-ratio:1;max-width:420px;width:100%;
                  display:flex;align-items:center;justify-content:center;
                  font-family:${t.headFont};font-size:clamp(2rem,5vw,3.5rem);font-weight:900;
                  color:var(--text);letter-spacing:6px;position:relative;overflow:hidden}
    .about-visual::before{content:'';position:absolute;inset:-1px;border-radius:inherit;
                          background:linear-gradient(135deg,rgba(${t.accentRgb},.3),transparent,rgba(${t.accentRgb},.15));
                          z-index:0}
    .about-visual-inner{position:relative;z-index:1;text-align:center}
    .about-orb{position:absolute;width:200px;height:200px;border-radius:50%;
               background:radial-gradient(circle,rgba(${t.accentRgb},.18) 0%,transparent 70%);
               top:-30px;right:-30px;animation:floatB 8s ease-in-out infinite;z-index:0}
    .about-badge{position:absolute;bottom:-16px;right:-16px;
                 background:var(--acc);color:${t.bg};border-radius:12px;
                 padding:.8rem 1.2rem;font-size:.75rem;font-weight:800;
                 letter-spacing:.5px;box-shadow:0 8px 24px rgba(${t.accentRgb},.4);
                 z-index:2;white-space:nowrap}
    .about-list{list-style:none;margin-top:2rem;display:flex;flex-direction:column;gap:.3rem}
    .about-list li{display:flex;gap:1rem;align-items:flex-start;
                   padding:.75rem 0;border-bottom:1px solid var(--border);
                   font-size:.9rem;color:var(--muted);transition:color .2s}
    .about-list li:hover{color:var(--text)}
    .bullet-num{font-size:.6rem;font-family:monospace;color:var(--acc);
                background:rgba(${t.accentRgb},.1);border:1px solid rgba(${t.accentRgb},.2);
                border-radius:4px;padding:.15rem .45rem;flex-shrink:0;margin-top:1px}

    /* ── TESTIMONIALS ── */
    .testi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.4rem;margin-top:3rem}
    .testi-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;
                padding:2rem;transition:all .3s;position:relative;overflow:hidden}
    .testi-card::before{content:'"';position:absolute;top:-10px;right:20px;
                        font-size:6rem;font-family:Georgia,serif;color:var(--acc);opacity:.06;line-height:1}
    .testi-card:hover{border-color:rgba(${t.accentRgb},.3);transform:translateY(-4px);
                      box-shadow:0 16px 40px rgba(${t.accentRgb},.08)}
    .testi-stars{font-size:.75rem;letter-spacing:3px;color:var(--acc);margin-bottom:1rem}
    .testi-text{font-size:.92rem;color:rgba(${t.text.replace('#','').match(/../g).map(x=>parseInt(x,16)).join(',') || '225,235,245'},.75);
                line-height:1.8;margin-bottom:1.4rem;font-style:italic}
    .testi-author{font-size:.85rem;font-weight:700;color:var(--text)}
    .testi-role{font-size:.72rem;color:var(--acc);margin-top:2px;font-family:monospace}

    /* ── CTA SECTION ── */
    .cta-section{position:relative;overflow:hidden;text-align:center;
                 background:linear-gradient(135deg,rgba(${t.accentRgb},.06) 0%,rgba(${t.accentRgb},.02) 100%);
                 border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
    .cta-glow{position:absolute;width:700px;height:400px;border-radius:50%;
              background:radial-gradient(ellipse,rgba(${t.accentRgb},.1) 0%,transparent 70%);
              top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;
              animation:pulseGlow 4s ease-in-out infinite}
    .cta-section h2{font-size:clamp(2rem,5vw,3.4rem)}

    /* ── CONTACT ── */
    .contact-wrap{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.2rem;margin-top:3rem}
    .ccard{background:var(--surface);border:1px solid var(--border);border-radius:14px;
           padding:1.8rem;display:flex;gap:1.1rem;align-items:flex-start;
           transition:all .25s;position:relative;overflow:hidden}
    .ccard::after{content:'';position:absolute;bottom:0;left:0;height:2px;width:0;
                  background:var(--acc);transition:width .35s}
    .ccard:hover{border-color:rgba(${t.accentRgb},.35);transform:translateY(-3px)}
    .ccard:hover::after{width:100%}
    .cicon{width:46px;height:46px;background:rgba(${t.accentRgb},.1);
           border:1px solid rgba(${t.accentRgb},.2);border-radius:12px;
           display:flex;align-items:center;justify-content:center;font-size:1.15rem;flex-shrink:0;
           transition:.2s}
    .ccard:hover .cicon{background:rgba(${t.accentRgb},.18)}
    .ccard h4{font-size:.62rem;letter-spacing:2px;text-transform:uppercase;
              color:var(--muted);margin-bottom:.35rem}
    .ccard p{font-size:.9rem;color:var(--text)}

    /* ── LUXURY OVERRIDES ── */
    h1,h2,h3,h4{font-weight:600}
    .card{border-radius:4px}
    .btn{border-radius:3px;letter-spacing:1.5px;font-size:.78rem;text-transform:uppercase}
    .btn-outline{border-radius:3px}
    .nav-cta{border-radius:3px;letter-spacing:1.5px;text-transform:uppercase;font-size:.7rem}
    .about-visual{border-radius:4px}
    .testi-card{border-radius:4px}
    .ccard{border-radius:4px}
    .why-strip{border-radius:4px}
    .hero-badge{border-radius:3px;letter-spacing:3px}
    .eyebrow{letter-spacing:4px}
    .hero-stats{border-radius:4px}
    .stat{padding:1.6rem 1.2rem}
    /* thin gold top rule on cards */
    .card::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;
                 background:linear-gradient(to right,transparent,rgba(var(--acc-rgb),.5),transparent)}
    /* refined divider */
    .divider-line{background:linear-gradient(to right,var(--acc),rgba(var(--acc-rgb),.2))}
    /* italic hero sub for elegance */
    .hero-sub{font-style:italic;font-size:clamp(.95rem,1.8vw,1.08rem)}

    /* ── FOOTER ── */
    footer{padding:3rem 6%;border-top:1px solid var(--border);
           display:flex;flex-direction:column;align-items:center;
           gap:1.2rem;text-align:center}
    .foot-logo{font-family:${t.headFont};font-size:1rem;font-weight:900;letter-spacing:3px;color:var(--text)}
    .foot-logo span{color:var(--acc)}
    .foot-links{display:flex;gap:2rem;flex-wrap:wrap;justify-content:center}
    .foot-links a{font-size:.78rem;color:var(--muted);transition:color .2s}
    .foot-links a:hover{color:var(--text)}
    .foot-copy{font-size:.72rem;color:rgba(${t.muted.replace('#','').match(/../g)?.map(x=>parseInt(x,16)).join(',') || '138,160,184'},.6)}

    /* ── RESPONSIVE ── */
    @media(max-width:900px){
      .about-layout{grid-template-columns:1fr}
      .about-visual{max-width:320px;margin:0 auto}
    }
    @media(max-width:640px){
      .nav-links,.nav-cta{display:none}
      .hamburger{display:flex}
      .hero-stats .stat{min-width:100px}
      .hero{padding:7rem 5% 4rem}
      section{padding:60px 5%}
    }
  </style>
</head>
<body>

<!-- NAV -->
<nav id="mainNav">
  <div class="logo">${displayName.substring(0,12).toUpperCase().replace(/(.{4})/,'$1')}<span>.</span></div>
  <ul class="nav-links">
    <li><a href="#services">Services</a></li>
    <li><a href="#about">About</a></li>
    <li><a href="#why">Why Us</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
  <a href="#contact" class="nav-cta">${t.cta}</a>
  <button class="hamburger" id="hamburger" aria-label="Menu">
    <span></span><span></span><span></span>
  </button>
</nav>
<div class="mobile-menu" id="mobileMenu">
  <a href="#services" onclick="closeMenu()">Services</a>
  <a href="#about" onclick="closeMenu()">About</a>
  <a href="#why" onclick="closeMenu()">Why Us</a>
  <a href="#contact" onclick="closeMenu()">${t.cta} →</a>
</div>

<!-- HERO -->
<section class="hero">
  <div class="hero-orb-1"></div>
  <div class="hero-orb-2"></div>
  <div class="hero-orb-3"></div>
  <div class="hero-badge"><span class="hero-badge-dot"></span>${t.emoji} ${displayName}</div>
  <h1>${t.heroVerb} <em>${t.heroNoun}</em></h1>
  <p class="hero-sub">${heroSub}</p>
  <div class="hero-btns">
    <a href="#contact" class="btn">${t.cta} →</a>
    <a href="#services" class="btn btn-outline">${t.ctaSecondary}</a>
  </div>
  <div class="hero-stats">
    <div class="stat"><div class="stat-n counter" data-target="5" data-suffix="★">5★</div><div class="stat-l">Client Rating</div></div>
    <div class="stat"><div class="stat-n counter" data-target="100" data-suffix="%">100%</div><div class="stat-l">Satisfaction</div></div>
    <div class="stat"><div class="stat-n counter" data-target="24" data-suffix="h">24h</div><div class="stat-l">Response Time</div></div>
    <div class="stat"><div class="stat-n">Local</div><div class="stat-l">Based & Trusted</div></div>
  </div>
</section>

<!-- SERVICES -->
<section id="services">
  <div class="section-inner">
    <div class="reveal">
      <div class="eyebrow">What We Offer</div>
      <h2>Our <em>Services</em></h2>
      <div class="divider"><div class="divider-line"></div><div class="divider-dot"></div></div>
      <p class="section-desc">Everything you need, handled by one dedicated team with a commitment to excellence.</p>
    </div>
    <div class="grid">
      ${serviceCardsHtml}
    </div>
  </div>
</section>

<!-- ABOUT -->
<section id="about" style="background:rgba(${t.accentRgb},.025)">
  <div class="section-inner">
    <div class="about-layout">
      <div class="about-visual-wrap reveal-left">
        <div class="about-visual">
          <div class="about-orb"></div>
          <div class="about-visual-inner">
            <div style="font-size:3rem;margin-bottom:.5rem">${t.emoji}</div>
            <div style="font-size:clamp(1.2rem,3vw,1.8rem);letter-spacing:4px">${displayName.substring(0,8).toUpperCase()}</div>
          </div>
        </div>
        <div class="about-badge">Est. ${new Date().getFullYear()} · Trusted & Local</div>
      </div>
      <div class="reveal-right">
        <div class="eyebrow">Who We Are</div>
        <h2>About <em>${displayName}</em></h2>
        <div class="divider"><div class="divider-line"></div><div class="divider-dot"></div></div>
        <p class="section-desc">${heroSub}</p>
        <ul class="about-list">
          ${aboutBullets}
        </ul>
        <div style="margin-top:2rem">
          <a href="#contact" class="btn">${t.cta} →</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- WHY US -->
<section id="why">
  <div class="section-inner" style="text-align:center">
    <div class="reveal">
      <div class="eyebrow" style="justify-content:center">Why Choose Us</div>
      <h2>The <em>${displayName.split(' ')[0]}</em> Difference</h2>
      <div class="divider" style="justify-content:center"><div class="divider-line"></div><div class="divider-dot"></div></div>
    </div>
    <div class="why-strip reveal">
      <div class="why-item"><div class="why-icon">⚡</div><h4>Fast Turnaround</h4><p>Quick delivery without cutting corners on quality.</p></div>
      <div class="why-item"><div class="why-icon">🛡️</div><h4>Fully Guaranteed</h4><p>Every job is backed by our 100% satisfaction promise.</p></div>
      <div class="why-item"><div class="why-icon">📞</div><h4>Always Available</h4><p>Real people who pick up the phone and respond fast.</p></div>
      <div class="why-item"><div class="why-icon">💰</div><h4>Fair Pricing</h4><p>Transparent quotes with no hidden fees — ever.</p></div>
    </div>
  </div>
</section>

<!-- TESTIMONIALS -->
<section style="background:rgba(${t.accentRgb},.02)">
  <div class="section-inner" style="text-align:center">
    <div class="reveal">
      <div class="eyebrow" style="justify-content:center">What Clients Say</div>
      <h2>Real <em>Results</em></h2>
      <div class="divider" style="justify-content:center"><div class="divider-line"></div><div class="divider-dot"></div></div>
    </div>
    <div class="testi-grid">
      <div class="testi-card reveal" style="--delay:0ms">
        <div class="testi-stars">★ ★ ★ ★ ★</div>
        <p class="testi-text">"Absolutely outstanding service. Exceeded every expectation and delivered ahead of schedule. Couldn't recommend more highly."</p>
        <div class="testi-author">Sarah M.</div>
        <div class="testi-role">Verified Client</div>
      </div>
      <div class="testi-card reveal" style="--delay:100ms">
        <div class="testi-stars">★ ★ ★ ★ ★</div>
        <p class="testi-text">"Professional, reliable, and genuinely excellent at what they do. The results speak for themselves — we've never looked back."</p>
        <div class="testi-author">James K.</div>
        <div class="testi-role">Verified Client</div>
      </div>
      <div class="testi-card reveal" style="--delay:200ms">
        <div class="testi-stars">★ ★ ★ ★ ★</div>
        <p class="testi-text">"From the first call to final delivery — seamless. A team that genuinely cares about the outcome and goes above and beyond."</p>
        <div class="testi-author">Emma R.</div>
        <div class="testi-role">Verified Client</div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta-section">
  <div class="cta-glow"></div>
  <div class="section-inner" style="position:relative;z-index:1">
    <div class="reveal">
      <div class="eyebrow" style="justify-content:center">Ready to Start?</div>
      <h2>Let's build something <em>great.</em></h2>
      <p class="section-desc" style="margin:1rem auto 2.5rem;text-align:center">
        Get in touch today and we'll get back to you within 24 hours — no obligation, no pressure.
      </p>
      <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
        <a href="#contact" class="btn" style="font-size:.95rem;padding:1rem 2.5rem">${t.cta} →</a>
        <a href="mailto:${email}" class="btn btn-outline" style="font-size:.95rem;padding:1rem 2.5rem">${email}</a>
      </div>
    </div>
  </div>
</section>

<!-- CONTACT -->
<section id="contact">
  <div class="section-inner" style="text-align:center">
    <div class="reveal">
      <div class="eyebrow" style="justify-content:center">Get In Touch</div>
      <h2>Contact <em>${displayName.split(' ')[0]}</em></h2>
      <div class="divider" style="justify-content:center"><div class="divider-line"></div><div class="divider-dot"></div></div>
      <p class="section-desc" style="margin:0 auto 0">We'd love to hear from you. Reach out through any of the channels below.</p>
    </div>
    <div class="contact-wrap reveal" style="max-width:820px;margin:0 auto">
      <div class="ccard">
        <div class="cicon">📧</div>
        <div><h4>Email Us</h4><p>${email}</p></div>
      </div>
      <div class="ccard">
        <div class="cicon">📞</div>
        <div><h4>Call Us</h4><p>${phone || 'Contact us online'}</p></div>
      </div>
      ${websiteUrl ? `<div class="ccard">
        <div class="cicon">🌐</div>
        <div><h4>Visit</h4><p>${websiteUrl}</p></div>
      </div>` : `<div class="ccard">
        <div class="cicon">⏰</div>
        <div><h4>Response Time</h4><p>Within 24 hours</p></div>
      </div>`}
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="foot-logo">${displayName.substring(0,10).toUpperCase()}<span>.</span></div>
  <div class="foot-links">
    <a href="#services">Services</a>
    <a href="#about">About</a>
    <a href="#why">Why Us</a>
    <a href="#contact">Contact</a>
  </div>
  <span class="foot-copy">© ${new Date().getFullYear()} ${displayName}. All rights reserved.</span>
  <span class="foot-copy">Website by <strong style="color:var(--acc)">ZyntrixAI</strong> — <a href="https://zyntrixai.co" style="color:var(--acc)">zyntrixai.co</a></span>
</footer>

<script>
  // ── Nav scroll effect
  const nav = document.getElementById('mainNav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }, {passive:true});

  // ── Mobile menu
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });
  function closeMenu() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  }

  // ── Scroll reveal
  const revealEls = document.querySelectorAll('.reveal,.reveal-left,.reveal-right');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => observer.observe(el));

  // ── Trigger above-fold reveals immediately
  setTimeout(() => {
    document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) el.classList.add('visible');
    });
  }, 100);

  // ── Smooth active nav links
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 100) current = s.id; });
    navLinks.forEach(a => {
      a.style.color = a.getAttribute('href') === '#'+current ? 'var(--text)' : '';
    });
  }, {passive:true});
</script>
</body>
</html>`;
}

// ── Deploy generated HTML to Netlify as a live demo site ─────────────────────
async function deployToNetlify(html, businessName) {
  const token = process.env.NETLIFY_API_TOKEN;
  if (!token) throw new Error('NETLIFY_API_TOKEN not set');

  const slug = (businessName || 'demo')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28);
  const siteName = `zx-${slug}-${Date.now()}`;

  // 1. Create the site
  const createRes = await fetch('https://api.netlify.com/api/v1/sites', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: siteName })
  });
  if (!createRes.ok) throw new Error(`Netlify create failed: ${await createRes.text()}`);
  const site = await createRes.json();

  // 2. SHA1 digest of HTML (Netlify requires this for file-based deploys)
  const sha1 = crypto.createHash('sha1').update(html).digest('hex');

  // 3. Start the deploy — tell Netlify what files we have
  const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: { '/index.html': sha1 } })
  });
  if (!deployRes.ok) throw new Error(`Netlify deploy start failed: ${await deployRes.text()}`);
  const deploy = await deployRes.json();

  // 4. Upload the file
  const uploadRes = await fetch(`https://api.netlify.com/api/v1/deploys/${deploy.id}/files/index.html`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: html
  });
  if (!uploadRes.ok) throw new Error(`Netlify upload failed: ${await uploadRes.text()}`);

  return `https://${siteName}.netlify.app`;
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
      from: `"ZyntrixAI Website" <${process.env.EMAIL_USER}>`,
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

// ── Package recommendation engine ─────────────────────────────────────────────
function recommendPackage(services = '', niche = '', hasWebsite = true) {
  const s = services.toLowerCase();
  const hasEcommerce  = /e-commerce|ecommerce|shop/i.test(s);
  const hasSEO        = /seo|growth/i.test(s);
  const hasBranding   = /branding|identity|logo/i.test(s);
  const serviceCount  = services.split(',').filter(x => x.trim()).length;

  // Enterprise: 4+ services OR ecommerce + branding together
  if (serviceCount >= 4 || (hasEcommerce && hasBranding)) {
    return {
      tier: 'Enterprise', price: 'Custom Quote', deposit: null, depositFormatted: null,
      stripeLink: null, colour: '#c4a84f',
      reason: 'Your project spans multiple services — the Enterprise package covers everything with no limits, dedicated support, and a custom-quoted price.',
      includes: [
        'Unlimited pages', 'Full Web Design & Development', 'Logo & Branding package',
        'E-Commerce store (unlimited products)', 'Advanced SEO & schema markup',
        'Custom animations & interactions', '1 month free support', 'Dedicated account manager'
      ]
    };
  }

  // Growth: ecommerce OR SEO OR 3+ services
  if (hasEcommerce || hasSEO || serviceCount >= 3) {
    return {
      tier: 'Growth', price: '$1,499', deposit: 749, depositFormatted: '$749',
      stripeLink: process.env.STRIPE_GROWTH_LINK || null, colour: '#00c8ff',
      reason: 'Based on what you need, the Growth package is the perfect fit — more pages, e-commerce, SEO, and booking forms all included.',
      includes: [
        'Up to 12 pages', 'Web Design & Development', 'E-Commerce store (up to 50 products)',
        'Full SEO setup', 'Contact & booking forms', 'Google Analytics + Search Console',
        '30-day revision window', '1 month free support'
      ]
    };
  }

  // Starter: basic website
  return {
    tier: 'Starter', price: '$499', deposit: 249, depositFormatted: '$249',
    stripeLink: process.env.STRIPE_STARTER_LINK || null, colour: '#00c8ff',
    reason: 'For your requirements, the Starter package gives you everything you need to get a professional presence online fast.',
    includes: [
      'Up to 5 pages', 'Web Design & Development', 'Contact form',
      'Basic SEO setup', 'Google Analytics', '14-day revision window', '1 month free support'
    ]
  };
}

// ── Quote endpoint ─────────────────────────────────────────────────────────────
app.post('/api/quote', async (req, res) => {
  const { firstName, lastName, businessName, email, phone, niche, services, websiteUrl } = req.body;

  if (!firstName || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  // 1. Determine package recommendation
  const hasWebsite = !websiteUrl?.includes('starting fresh') && !!websiteUrl?.trim();
  const rec = recommendPackage(services || '', niche || '', hasWebsite);

  // 2. Scrape their existing site (if provided and real URL)
  const scraped = hasWebsite ? await scrapeWebsite(websiteUrl) : null;

  // 3. Generate the website HTML draft
  const generatedHtml = generateWebsite({ firstName, lastName, businessName, email, phone, niche, services: services || 'Web Design', websiteUrl, scraped });
  const fileName = `${(businessName || `${firstName}-${lastName}`).replace(/\s+/g, '-')}-website.html`;

  // 4. Deploy demo to Netlify and get live URL (best-effort — don't fail quote if deploy fails)
  let demoUrl = null;
  try {
    demoUrl = await deployToNetlify(generatedHtml, businessName || `${firstName} ${lastName}`);
  } catch (deployErr) {
    console.warn('Demo deploy failed:', deployErr.message);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  const includesHtml = rec.includes.map(i =>
    `<tr><td style="padding:.3rem 0;font-size:.88rem;color:#e0eaf5;">✓ &nbsp;${i}</td></tr>`
  ).join('');

  const payButton = rec.stripeLink
    ? `<a href="${rec.stripeLink}" style="display:inline-block;margin-top:1.5rem;padding:1rem 2.5rem;background:#00c8ff;color:#000;border-radius:8px;font-weight:700;font-size:.95rem;text-decoration:none;">Pay ${rec.depositFormatted} Deposit — Lock In My Project</a>`
    : `<a href="mailto:${process.env.BUSINESS_EMAIL}" style="display:inline-block;margin-top:1.5rem;padding:1rem 2.5rem;background:#00c8ff;color:#000;border-radius:8px;font-weight:700;font-size:.95rem;text-decoration:none;">Get My Custom Quote →</a>`;

  const scrapedSummary = scraped
    ? `<p><strong>Scraped from their site:</strong><br>${scraped.description || scraped.h1 || 'No description found.'}</p>`
    : `<p><em>${hasWebsite ? 'Could not scrape site.' : 'No existing website — starting fresh.'}</em></p>`;

  try {
    // ── 4a. Email to YOU (owner) ──────────────────────────────────────────────
    await transporter.sendMail({
      from: `"ZyntrixAI Quotes" <${process.env.EMAIL_USER}>`,
      to: process.env.BUSINESS_EMAIL,
      replyTo: email,
      subject: `🔔 New Quote — ${rec.tier} — ${businessName || `${firstName} ${lastName}`}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#050810;color:#e0eaf5;border:1px solid rgba(0,200,255,0.2);border-radius:12px">
          <h1 style="color:#00c8ff;font-size:1.4rem;margin-bottom:0.3rem">New Quote Request</h1>
          <p style="color:#8aa0b8;margin-bottom:1.5rem;font-size:.9rem">Recommended: <strong style="color:#fff">${rec.tier} — ${rec.price}</strong></p>
          <table style="width:100%;border-collapse:collapse;font-size:.95rem">
            <tr><td style="padding:.5rem 0;color:#8aa0b8;width:140px">Name</td><td><strong>${firstName} ${lastName}</strong></td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Business</td><td><strong>${businessName || '—'}</strong></td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Email</td><td><a href="mailto:${email}" style="color:#00c8ff">${email}</a></td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Phone</td><td>${phone || '—'}</td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Industry</td><td>${niche || '—'}</td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Services</td><td>${services}</td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Website</td><td>${websiteUrl || '—'}</td></tr>
          </table>
          <hr style="border-color:rgba(0,200,255,0.15);margin:1.5rem 0"/>
          ${scrapedSummary}
          ${demoUrl
            ? `<p style="margin-bottom:.5rem"><a href="${demoUrl}" style="color:#00c8ff;font-weight:700">${demoUrl}</a></p>
               <p style="color:#8aa0b8;font-size:.82rem">Live demo sent to client. Website draft also attached.</p>`
            : `<p style="color:#8aa0b8;font-size:.82rem">Website draft attached as <strong>${fileName}</strong>. Client has been sent their automated quote email.</p>`
          }
        </div>
      `,
      attachments: [{ filename: fileName, content: generatedHtml, contentType: 'text/html' }]
    });

    // ── 4b. Email to CLIENT (automated quote) ────────────────────────────────
    await transporter.sendMail({
      from: `"ZyntrixAI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your ZyntrixAI Quote — ${rec.tier} Package (${rec.price})`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050810;color:#e0eaf5;border-radius:16px;overflow:hidden;border:1px solid rgba(0,200,255,0.15)">

          <!-- Header -->
          <div style="padding:2.5rem 2rem;text-align:center;background:linear-gradient(135deg,rgba(0,200,255,0.08),rgba(0,200,255,0.02))">
            <div style="font-size:0.65rem;letter-spacing:3px;text-transform:uppercase;color:#00c8ff;margin-bottom:0.8rem">ZyntrixAI · Website Design</div>
            <h1 style="font-size:1.8rem;font-weight:900;margin-bottom:0.4rem;color:#fff">Your Quote is Ready</h1>
            <p style="color:#8aa0b8;font-size:.95rem">Hi ${firstName}, here's your personalised recommendation.</p>
          </div>

          <!-- Recommended package -->
          <div style="padding:2rem;border-bottom:1px solid rgba(0,200,255,0.1)">
            <div style="font-size:.62rem;letter-spacing:3px;text-transform:uppercase;color:#00c8ff;font-weight:700;margin-bottom:.6rem">Recommended for You</div>
            <div style="display:flex;align-items:flex-end;gap:1rem;flex-wrap:wrap;margin-bottom:1rem">
              <span style="font-size:2rem;font-weight:900;color:#fff">${rec.tier}</span>
              <span style="font-size:1.5rem;font-weight:700;color:#00c8ff;padding-bottom:.2rem">${rec.price}</span>
              ${rec.depositFormatted ? `<span style="font-size:.82rem;color:#8aa0b8;padding-bottom:.3rem">· ${rec.depositFormatted} deposit to start</span>` : ''}
            </div>
            <p style="color:#8aa0b8;line-height:1.75;font-size:.92rem;margin-bottom:1.5rem">${rec.reason}</p>

            <!-- What's included -->
            <div style="background:rgba(0,200,255,0.04);border:1px solid rgba(0,200,255,0.12);border-radius:10px;padding:1.2rem 1.5rem;margin-bottom:1.5rem">
              <div style="font-size:.62rem;letter-spacing:2px;text-transform:uppercase;color:#00c8ff;margin-bottom:.8rem">What's Included</div>
              <table style="border-collapse:collapse;width:100%">${includesHtml}</table>
            </div>

            <div style="text-align:center">${payButton}</div>
            ${rec.stripeLink ? `<p style="text-align:center;margin-top:.8rem;font-size:.78rem;color:#8aa0b8">Secure payment · 50% now, 50% on launch · No lock-in</p>` : ''}
          </div>

          <!-- Live demo -->
          ${demoUrl ? `
          <div style="padding:2rem;border-bottom:1px solid rgba(0,200,255,0.1);text-align:center;background:rgba(0,200,255,0.03)">
            <div style="font-size:.62rem;letter-spacing:3px;text-transform:uppercase;color:#00c8ff;margin-bottom:.8rem">Your Free Demo</div>
            <p style="color:#8aa0b8;font-size:.9rem;margin-bottom:1.2rem">We've already built a personalised website demo for you — check it out:</p>
            <a href="${demoUrl}" style="display:inline-block;padding:.9rem 2.2rem;background:#00c8ff;color:#000;border-radius:8px;font-weight:700;font-size:.95rem;text-decoration:none;">View Your Demo →</a>
            <p style="margin-top:.8rem;font-size:.75rem;color:#555">${demoUrl}</p>
          </div>` : ''}

          <!-- What happens next -->
          <div style="padding:2rem;border-bottom:1px solid rgba(0,200,255,0.1)">
            <div style="font-size:.62rem;letter-spacing:3px;text-transform:uppercase;color:#00c8ff;margin-bottom:1rem">What Happens Next</div>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:.5rem 0;font-size:.88rem;vertical-align:top;width:28px;color:#00c8ff;font-weight:700">01</td><td style="padding:.5rem 0;font-size:.88rem;color:#e0eaf5">${rec.stripeLink ? 'Pay your deposit above to lock in your project spot' : 'Reply to this email and we\'ll send your custom quote within 24 hours'}</td></tr>
              <tr><td style="padding:.5rem 0;font-size:.88rem;color:#00c8ff;font-weight:700">02</td><td style="padding:.5rem 0;font-size:.88rem;color:#e0eaf5">We reach out within 24 hours to book your free discovery call</td></tr>
              <tr><td style="padding:.5rem 0;font-size:.88rem;color:#00c8ff;font-weight:700">03</td><td style="padding:.5rem 0;font-size:.88rem;color:#e0eaf5">We design, build, and launch your website — you just approve</td></tr>
              <tr><td style="padding:.5rem 0;font-size:.88rem;color:#00c8ff;font-weight:700">04</td><td style="padding:.5rem 0;font-size:.88rem;color:#e0eaf5">Pay the remaining 50% on launch day — done</td></tr>
            </table>
          </div>

          <!-- Footer -->
          <div style="padding:1.5rem 2rem;text-align:center">
            <p style="font-size:.82rem;color:#8aa0b8;margin-bottom:.5rem">Questions? Reply to this email or reach us at</p>
            <a href="mailto:${process.env.BUSINESS_EMAIL}" style="color:#00c8ff;font-size:.85rem">${process.env.BUSINESS_EMAIL}</a>
            <p style="margin-top:1.2rem;font-size:.72rem;color:#555">© ${new Date().getFullYear()} ZyntrixAI · Melbourne, Victoria, Australia</p>
          </div>
        </div>
      `
    });

    // ── 5. Forward to LeadFinder ──────────────────────────────────────────────
    const LEADS_URL = 'http://localhost:3002';
    try {
      await axios.post(`${LEADS_URL}/api/enquiries`, {
        first_name: firstName, last_name: lastName, email, phone,
        business_name: businessName, services, website_url: websiteUrl,
        subject: `Quote — ${rec.tier} — ${businessName || `${firstName} ${lastName}`}`,
        message: `Recommended: ${rec.tier} (${rec.price})\nServices: ${services}\nSite: ${websiteUrl || 'None'}`,
        source: 'quote-form'
      });
    } catch (fwdErr) { console.warn('LeadFinder enquiry:', fwdErr.message); }

    try {
      await axios.post(`${LEADS_URL}/api/leads/import`, {
        leads: [{ business_name: businessName || `${firstName} ${lastName}`, category: services.split(',')[0].trim(), phone, email, website: websiteUrl || '', has_website: hasWebsite ? 1 : 0, city: '', state: 'AUS', status: 'interested', source: 'quote-form' }]
      });
    } catch (fwdErr) { console.warn('LeadFinder lead:', fwdErr.message); }

    res.json({ success: true, recommendation: rec });

  } catch (err) {
    console.error('Email error:', err.message, err.code);
    res.status(500).json({ error: err.message || 'Failed to send email.' });
  }
});

// ── Make.com webhook — process inbound email enquiries automatically ───────────
app.post('/api/process-email', async (req, res) => {
  // Acknowledge Make.com immediately so it doesn't time out
  res.json({ received: true });

  const { from, subject, bodyPlainText } = req.body;
  if (!from) return;

  // Parse sender name and email address
  const emailMatch = from.match(/<([^>]+)>/) || from.match(/([^\s@]+@[^\s]+)/);
  const clientEmail = emailMatch ? emailMatch[1].trim() : from.trim();
  const nameMatch   = from.match(/^([^<]+?)\s*</);
  const fullName    = nameMatch ? nameMatch[1].trim().replace(/"/g, '') : '';
  const nameParts   = fullName.split(/\s+/);
  const firstName   = nameParts[0] || 'there';
  const lastName    = nameParts.slice(1).join(' ') || '';

  const body     = bodyPlainText || '';
  const combined = `${subject} ${body}`.toLowerCase();

  // Extract any URL mentioned in the email body
  const urlMatch  = body.match(/https?:\/\/[^\s,)]+|www\.[^\s,)]+/i);
  const websiteUrl = urlMatch ? urlMatch[0].replace(/[.,;]+$/, '') : '';

  // Derive business name from email domain as a fallback
  const domainMatch  = clientEmail.match(/@([^.]+)\./);
  const businessName = domainMatch
    ? domainMatch[1].charAt(0).toUpperCase() + domainMatch[1].slice(1)
    : `${firstName}${lastName ? ' ' + lastName : ''}'s Business`;

  // Detect niche from keywords in subject + body
  const nicheMap = [
    ['food',         /restaurant|cafe|coffee|bakery|catering|food|bar|bistro|pizza|sushi/],
    ['law',          /law|legal|solicitor|attorney|barrister/],
    ['fitness',      /gym|fitness|yoga|pilates|crossfit|training|personal trainer/],
    ['beauty',       /salon|spa|beauty|hair|nails|barber|lash|brow/],
    ['realestate',   /real estate|property|agent|mortgage|real-estate/],
    ['health',       /dental|dentist|medical|clinic|doctor|physio|chiro|osteo/],
    ['construction', /build|construct|plumb|electrician|trade|roofing|renovation/],
    ['tech',         /tech|software|developer|it support|digital|app|saas|cyber/],
    ['cleaning',     /clean|domestic|carpet|window clean|janitorial/],
  ];
  let niche = '';
  for (const [key, pattern] of nicheMap) {
    if (pattern.test(combined)) { niche = key; break; }
  }
  const services = niche
    ? `Web Design, ${niche.charAt(0).toUpperCase() + niche.slice(1)} SEO`
    : 'Web Design';

  try {
    const scraped = websiteUrl ? await scrapeWebsite(websiteUrl) : null;
    const html    = generateWebsite({
      firstName, lastName, businessName,
      email: clientEmail, phone: '',
      niche, services, websiteUrl, scraped
    });

    // Deploy demo to Netlify
    let demoUrl = null;
    try {
      demoUrl = await deployToNetlify(html, businessName);
    } catch (deployErr) {
      console.warn('Demo deploy error:', deployErr.message);
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    // Auto-reply to client with their live demo
    await transporter.sendMail({
      from: `"ZyntrixAI" <${process.env.EMAIL_USER}>`,
      to: clientEmail,
      subject: `${firstName}, your free website demo is ready — ZyntrixAI`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050810;color:#e0eaf5;border-radius:16px;overflow:hidden;border:1px solid rgba(0,200,255,0.15)">
          <div style="padding:2.5rem 2rem;text-align:center;background:linear-gradient(135deg,rgba(0,200,255,0.08),rgba(0,200,255,0.02))">
            <div style="font-size:0.65rem;letter-spacing:3px;text-transform:uppercase;color:#00c8ff;margin-bottom:0.8rem">ZyntrixAI · Website Design</div>
            <h1 style="font-size:1.8rem;font-weight:900;margin-bottom:0.4rem;color:#fff">Your Demo is Live</h1>
            <p style="color:#8aa0b8;font-size:.95rem">Hi ${firstName}, we've built a personalised demo site for ${businessName}.</p>
          </div>
          <div style="padding:2rem;text-align:center;border-bottom:1px solid rgba(0,200,255,0.1)">
            ${demoUrl
              ? `<p style="color:#8aa0b8;margin-bottom:1.5rem;font-size:.95rem">Your free demo is ready to view right now:</p>
                 <a href="${demoUrl}" style="display:inline-block;padding:1rem 2.5rem;background:#00c8ff;color:#000;border-radius:8px;font-weight:700;font-size:1rem;text-decoration:none;">View Your Demo →</a>
                 <p style="margin-top:1rem;font-size:.78rem;color:#555">${demoUrl}</p>`
              : `<p style="color:#8aa0b8;font-size:.95rem">Thanks for reaching out! We're preparing your personalised demo and will follow up within a few hours.</p>`
            }
          </div>
          <div style="padding:2rem;border-bottom:1px solid rgba(0,200,255,0.1)">
            <div style="font-size:.62rem;letter-spacing:3px;text-transform:uppercase;color:#00c8ff;margin-bottom:1rem">What Happens Next</div>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:.5rem 0;font-size:.88rem;vertical-align:top;width:28px;color:#00c8ff;font-weight:700">01</td><td style="padding:.5rem 0;font-size:.88rem;color:#e0eaf5">Take a look at your demo — it's built around your industry</td></tr>
              <tr><td style="padding:.5rem 0;font-size:.88rem;color:#00c8ff;font-weight:700">02</td><td style="padding:.5rem 0;font-size:.88rem;color:#e0eaf5">Reply to this email with any feedback or questions</td></tr>
              <tr><td style="padding:.5rem 0;font-size:.88rem;color:#00c8ff;font-weight:700">03</td><td style="padding:.5rem 0;font-size:.88rem;color:#e0eaf5">We'll send a formal quote and book a free discovery call</td></tr>
              <tr><td style="padding:.5rem 0;font-size:.88rem;color:#00c8ff;font-weight:700">04</td><td style="padding:.5rem 0;font-size:.88rem;color:#e0eaf5">We build, you approve, we launch — simple</td></tr>
            </table>
          </div>
          <div style="padding:1.5rem 2rem;text-align:center">
            <p style="font-size:.82rem;color:#8aa0b8;margin-bottom:.5rem">Questions? Just reply — or reach us directly at</p>
            <a href="mailto:${process.env.BUSINESS_EMAIL}" style="color:#00c8ff;font-size:.85rem">${process.env.BUSINESS_EMAIL}</a>
            <p style="margin-top:1.2rem;font-size:.72rem;color:#555">© ${new Date().getFullYear()} ZyntrixAI · Melbourne, Victoria, Australia</p>
          </div>
        </div>
      `
    });

    // Notify owner
    await transporter.sendMail({
      from: `"ZyntrixAI" <${process.env.EMAIL_USER}>`,
      to: process.env.BUSINESS_EMAIL,
      replyTo: clientEmail,
      subject: `📧 Email Lead — ${businessName} — Demo ${demoUrl ? 'Deployed' : 'Failed'}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#050810;color:#e0eaf5;border:1px solid rgba(0,200,255,0.2);border-radius:12px">
          <h1 style="color:#00c8ff;font-size:1.3rem;margin-bottom:1.5rem">Email Lead Processed</h1>
          <table style="width:100%;border-collapse:collapse;font-size:.95rem">
            <tr><td style="padding:.5rem 0;color:#8aa0b8;width:120px">From</td><td>${from}</td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Subject</td><td>${subject}</td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Business</td><td><strong>${businessName}</strong></td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Niche</td><td>${niche || 'unknown'}</td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Website</td><td>${websiteUrl || '—'}</td></tr>
            <tr><td style="padding:.5rem 0;color:#8aa0b8">Demo</td><td>${demoUrl ? `<a href="${demoUrl}" style="color:#00c8ff">${demoUrl}</a>` : '<span style="color:#f55">Deploy failed</span>'}</td></tr>
          </table>
          <hr style="border-color:rgba(0,200,255,0.15);margin:1.5rem 0"/>
          <p style="color:#8aa0b8;font-size:.82rem;margin-bottom:.5rem">Email body:</p>
          <p style="background:rgba(0,200,255,0.05);border:1px solid rgba(0,200,255,0.12);border-radius:8px;padding:1rem;line-height:1.7;font-size:.85rem;white-space:pre-wrap">${body.slice(0, 600)}</p>
        </div>
      `
    });

  } catch (err) {
    console.error('process-email error:', err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ZyntrixAI server running → http://localhost:${PORT}`);
});
