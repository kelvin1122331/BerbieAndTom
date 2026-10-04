:root {
  --bg: #fffaf7;
  --surface: rgba(255, 255, 255, 0.62);
  --surface-strong: #ffffff;
  --text: #221834;
  --muted: #665d7a;
  --pink: #ff7aab;
  --pink-deep: #ef5e90;
  --peach: #ffd8c7;
  --lavender: #e8dcff;
  --gold: #f9d978;
  --shadow: rgba(54, 34, 84, 0.14);
  --border: rgba(103, 84, 138, 0.1);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: "Plus Jakarta Sans", sans-serif;
  background:
    radial-gradient(circle at top left, rgba(255, 180, 200, 0.3), transparent 28%),
    linear-gradient(180deg, #fffaf8 0%, #fff 100%);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
}

img {
  max-width: 100%;
  display: block;
}

button,
a {
  font: inherit;
}

.container {
  width: min(1120px, calc(100% - 48px));
  margin: 0 auto;
}

.bg-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(70px);
  z-index: -1;
  opacity: 0.65;
}

.orb-one {
  width: 420px;
  height: 420px;
  left: -100px;
  top: 80px;
  background: rgba(255, 166, 194, 0.4);
}

.orb-two {
  width: 360px;
  height: 360px;
  right: -80px;
  top: 300px;
  background: rgba(177, 154, 255, 0.32);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 0 14px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.brand-mark {
  width: 38px;
  height: 38px;
  display: inline-grid;
  place-items: center;
  background: linear-gradient(135deg, var(--pink) 0%, #ffb78a 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 12px 25px rgba(255, 122, 171, 0.38);
}

.nav {
  display: inline-flex;
  align-items: center;
  gap: 28px;
}

.nav a {
  color: var(--muted);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.nav a:hover {
  color: var(--text);
}

.cta-btn,
.primary-btn,
.secondary-btn {
  border: 0;
  border-radius: 999px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.cta-btn {
  background: var(--text);
  color: white;
  padding: 0.9rem 1.4rem;
  font-weight: 700;
  box-shadow: 0 18px 30px rgba(34, 24, 52, 0.14);
}

.cta-btn.small {
  padding: 0.7rem 1.2rem;
}

.primary-btn {
  background: linear-gradient(135deg, var(--pink) 0%, var(--pink-deep) 100%);
  color: white;
  padding: 1rem 1.5rem;
  font-weight: 700;
  box-shadow: 0 18px 35px rgba(239, 94, 144, 0.32);
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 1rem 1.5rem;
  font-weight: 700;
}

.cta-btn:hover,
.primary-btn:hover,
.secondary-btn:hover {
  transform: translateY(-2px);
}

.hero {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  align-items: center;
  gap: 54px;
  padding: 42px 0 30px;
}

.eyebrow {
  margin: 0 0 14px;
  color: var(--pink-deep);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 0;
  font-size: clamp(3rem, 6vw, 5.4rem);
  line-height: 0.95;
  letter-spacing: -0.06em;
}

.hero-copy h1 span {
  background: linear-gradient(135deg, var(--pink-deep) 0%, #ff9d65 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.subtext {
  margin-top: 18px;
  font-size: 1.08rem;
  line-height: 1.8;
  max-width: 600px;
  color: var(--muted);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 30px;
}

.mini-stats {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 0;
  margin: 30px 0 0;
  flex-wrap: wrap;
}

.mini-stats li {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mini-stats strong {
  font-size: clamp(1.2rem, 2vw, 1.9rem);
  letter-spacing: -0.05em;
}

.mini-stats span {
  color: var(--muted);
  font-size: 0.84rem;
}

.hero-visual {
  display: flex;
  justify-content: center;
}

.card-main {
  position: relative;
  width: min(100%, 520px);
  min-height: 580px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.45));
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 32px;
  box-shadow: 0 30px 80px rgba(64, 36, 80, 0.16);
  backdrop-filter: blur(8px);
  padding: 28px;
}

.photo-frame {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  height: 100%;
}

.photo {
  border-radius: 28px;
  min-height: 410px;
  background-size: cover;
  background-position: center;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.42);
}

.photo-one {
  background:
    linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.18)),
    url("https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80") center/cover;
}

.photo-two {
  margin-top: 52px;
  background:
    linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.18)),
    url("https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80") center/cover;
}

.floating-tag {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-weight: 700;
  box-shadow: 0 20px 36px rgba(42, 34, 58, 0.12);
  backdrop-filter: blur(8px);
}

.tag-top {
  top: 18px;
  left: 20px;
}

.tag-bottom {
  right: 24px;
  bottom: 20px;
}

.stats-section,
.story,
.moments,
.footer {
  padding-top: 78px;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}

.stat-card,
.story-card,
.moment-card {
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid var(--border);
  border-radius: 24px;
  box-shadow: 0 18px 40px rgba(62, 40, 70, 0.08);
  backdrop-filter: blur(12px);
}

.stat-card {
  padding: 28px 24px;
}

.stat-number {
  display: block;
  margin-bottom: 18px;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: var(--pink-deep);
}

.stat-card h3 {
  margin: 0 0 10px;
  font-size: 1.35rem;
  letter-spacing: -0.04em;
}

.stat-card p,
.story-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.75;
}

.section-heading {
  margin-bottom: 26px;
}

.section-heading h2 {
  margin: 0;
  max-width: 700px;
  font-size: clamp(2rem, 3vw, 3rem);
  line-height: 1.08;
  letter-spacing: -0.06em;
}

.split {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 20px;
}

.text-link {
  text-decoration: none;
  color: var(--text);
  font-weight: 700;
}

.story-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 22px;
}

.story-card {
  padding: 28px 24px;
}

.story-card.large {
  min-height: 240px;
}

.story-card.accent {
  background: linear-gradient(135deg, rgba(255, 189, 201, 0.28), rgba(229, 220, 255, 0.7));
}

.card-badge {
  display: inline-flex;
  padding: 0.5rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(32, 24, 47, 0.06);
  color: var(--pink-deep);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.story-card h3 {
  margin: 0 0 12px;
  font-size: clamp(1.4rem, 2vw, 2rem);
  letter-spacing: -0.05em;
}

.moment-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}

.moment-card {
  min-height: 200px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: end;
  padding: 22px;
  color: white;
  font-weight: 800;
  letter-spacing: -0.04em;
  background-size: cover;
  background-position: center;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.18);
}

.moment-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.54));
}

.moment-card span {
  position: relative;
  z-index: 1;
  font-size: 1.2rem;
}

.moment-card.tall {
  grid-row: span 2;
  min-height: 420px;
  background-image: url("https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80");
}

.moment-card.medium:nth-child(2) {
  background-image: url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80");
}

.moment-card.medium:nth-child(3) {
  background-image: url("https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80");
}

.moment-card.wide {
  grid-column: 2 / span 2;
  min-height: 180px;
  background-image: url("https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80");
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 70px;
  color: var(--muted);
  font-weight: 600;
}

.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 860px) {
  .topbar {
    flex-wrap: wrap;
    gap: 18px;
  }

  .nav {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .hero,
  .story-grid,
  .stats-section,
  .moment-grid {
    grid-template-columns: 1fr;
  }

  .hero {
    padding-top: 24px;
  }

  .card-main {
    min-height: 500px;
  }

  .moment-card.wide {
    grid-column: auto;
  }

  .footer {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 560px) {
  .container {
    width: min(100% - 28px, 1120px);
  }

  .nav {
    gap: 14px;
    font-size: 0.92rem;
  }

  .hero-copy h1 {
    font-size: 3rem;
  }

  .hero-copy {
    text-align: center;
  }

  .hero-actions,
  .mini-stats,
  .split,
  .footer {
    justify-content: center;
    text-align: center;
  }

  .hero-actions {
    flex-direction: column;
  }

  .primary-btn,
  .secondary-btn,
  .cta-btn {
    width: 100%;
  }

  .mini-stats {
    gap: 18px;
  }
}
