'use client';
import { useEffect } from 'react';
import './home.css';
import Link from 'next/link';

export default function Home() {
  useEffect(() => {
    // Hero: cursor-follow colour reveal
      const hero = document.querySelector('.hero') as HTMLElement;
      const dot = document.getElementById('cursorDot');
    
      function setPos(x: number, y: number){
        if (hero) {
            hero.style.setProperty('--mx', x + 'px');
            hero.style.setProperty('--my', y + 'px');
        }
      }
    
      hero?.addEventListener('mousemove', (e: MouseEvent) => {
        const r = hero.getBoundingClientRect();
        setPos(e.clientX - r.left, e.clientY - r.top);
      });
      hero?.addEventListener('mouseleave', () => {
        const r = hero.getBoundingClientRect();
        setPos(r.width/2, r.height/2);
      });
      hero?.addEventListener('touchmove', (e: TouchEvent) => {
        const t = e.touches[0];
        const r = hero.getBoundingClientRect();
        setPos(t.clientX - r.left, t.clientY - r.top);
      }, {passive:true});
    
      // init centered
      window.addEventListener('load', () => {
        if(hero) {
            const r = hero.getBoundingClientRect();
            setPos(r.width/2, r.height/2);
        }
      });
    
      // The World: scroll-linked reveal + grey->colour figure
      const paras = document.querySelectorAll('.world-copy [data-reveal]');
      const figure = document.getElementById('worldFigure');
      const worldSection = document.querySelector('.world');
    
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if(entry.isIntersecting) entry.target.classList.add('is-in');
        });
      }, { threshold: 0.55 });
      paras.forEach(p => io.observe(p));
    
      function updateFigureColour(){
        if(!worldSection || !figure || !figure.parentElement) return;
        const rect = worldSection.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = rect.height + vh;
        const progressed = Math.min(Math.max((vh - rect.top) / total, 0), 1);
        figure.parentElement.style.setProperty('--world-grey', String(1 - progressed));
      }
      window.addEventListener('scroll', updateFigureColour, {passive:true});
      window.addEventListener('resize', updateFigureColour);
      updateFigureColour();
  }, []);

  return (
    <>
      

<nav className="dash-nav">
  {/* Logo */}
  <a href="/" className="dash-nav__logo">BLNK</a>

  {/* Right side */}
  <div className="dash-nav__right">
    {/* Leaderboard — disabled */}
    <div className="dash-nav__lb" title="Leaderboard coming soon">
      <span>🏆</span>
      <span className="dash-nav__lb-text">Leaderboard</span>
      <span className="dash-nav__soon">SOON</span>
    </div>

    {/* CTA */}
    <div className="dash-nav__cta" style={{ cursor: 'not-allowed', opacity: 0.5 }}>
      WL Coming soon
    </div>
  </div>
</nav>

<section className="hero" id="top">
  <div className="hero-grey"></div>
  <div className="hero-colour"></div>

  <div className="hero-content">

    <h1 className="hero-title">Blank to ink.</h1>
    <p className="hero-sub">A digital IP of colour and feelings. The world stays grey until you fill it.</p>
    <a className="hero-badge" href="https://x.com/RobinhoodCrypto" target="_blank" rel="noopener">
      <span className="dot"></span> Building on Robinhood
    </a>
    <div className="wl-badge" style={{ cursor: 'not-allowed', opacity: 0.5 }}>
      Ride to the Colour Machine (Soon)
    </div>
  </div>

  <div className="scroll-cue"><span>SCROLL</span><span className="bar"></span></div>
</section>

<section className="world" id="world">
  <div className="world-sticky">
    <div className="world-figure">
      <img id="worldFigure" src="/blnk.gif" alt="A grey, quiet figure from the BLNK world" />
    </div>
    <span className="world-tag">FIG. 01 — before colour</span>
  </div>

  <div className="world-copy">
    <p data-reveal>There's a boy who lives in a world made only of <span className="accent">grey</span>. No colour, no feeling, everything flat and quiet.</p>
    <p data-reveal>At the edge of his world sits a machine. Nobody built it. Nobody remembers when it arrived. It holds what the world forgot &mdash; colour, sealed in capsules, waiting for someone to reach in.</p>
    <p data-reveal>That someone was never going to be him. It was <span className="accent">always going to be you</span>.</p>
  </div>
</section>

<section className="iphub" id="iphub">
  <div className="iphub-head">
    <span className="iphub-eyebrow">IP HUB</span>
    <h2 className="iphub-title">Where <span className="accent">BLNK</span> travels</h2>
    <p className="iphub-desc">A world this quiet doesn't deserve to stay small. Colour was always meant to travel beyond the screen. Hover a card to see where it goes.</p>
  </div>

  <div className="card-grid">

    <div className="flip-card" tabIndex={0}>
      <div className="flip-inner">
        <div className="flip-face flip-front">
          <div className="swatch"></div>
          <div>
            <h3>Digital Animation Studio</h3>
            <p>The boy's story doesn't end at the reveal. Short-form BLNK content built for TikTok and Instagram Reels turns the world's colours into a universe people watch and follow, not just collect.</p>
          </div>
          <span className="hint">Hover to view &rarr;</span>
        </div>
        <div className="flip-face flip-back">
          <div className="mock">
            <div className="mock-card-img">
              <img src="/studio.png" alt="Digital Animation Studio" />
            </div>
            <span className="cap">Every colour, a new episode</span>
          </div>
        </div>
      </div>
    </div>

    <div className="flip-card" tabIndex={0}>
      <div className="flip-inner">
        <div className="flip-face flip-front">
          <div className="swatch"></div>
          <div>
            <h3>Keychains</h3>
            <p>The character collectibles market is massive, and keychains sit right at the center of it. A BLNK keychain is a piece of colour someone carries into their own grey-and-white world, every single day.</p>
          </div>
          <span className="hint">Hover to view &rarr;</span>
        </div>
        <div className="flip-face flip-back">
          <div className="mock">
            <div className="mock-card-img">
              <img src="/keychain.png" alt="Keychain" />
            </div>
            <span className="cap">Colour, clipped to your keys</span>
          </div>
        </div>
      </div>
    </div>

    <div className="flip-card" tabIndex={0}>
      <div className="flip-inner">
        <div className="flip-face flip-front">
          <div className="swatch"></div>
          <div>
            <h3>Fridge Magnets</h3>
            <p>The fridge door gets opened a dozen times a day without anyone thinking about it. A BLNK magnet turns that glance into a tiny, constant hit of colour &mdash; collectible sets, capsule-themed drops, tier variants.</p>
          </div>
          <span className="hint">Hover to view &rarr;</span>
        </div>
        <div className="flip-face flip-back">
          <div className="mock">
            <div className="mock-card-img">
              <img src="/magnet.png" alt="Fridge Magnet" />
            </div>
            <span className="cap">Stuck on every fridge door</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</section>

<section className="flywheel" id="flywheel">
  <div className="flywheel-head">
    <span className="flywheel-eyebrow">THE FLYWHEEL</span>
    <h2 className="flywheel-title">BLNK Floor <span className="accent">Protection</span></h2>
    <p className="flywheel-desc">Royalties collected from every trade are used to buy back BLNK at the floor. As the digital IP flourishes, more volume means more royalties, which means more buyback firepower &mdash; <b>10% of every buyback goes straight into defending the floor</b>. The stronger the community, the stronger the floor.</p>
  </div>

  <div className="flywheel-diagram">
    <svg className="flywheel-svg" viewBox="0 0 560 560" preserveAspectRatio="xMidYMid meet">
      <path d="M 340 90 A 250 250 0 0 1 470 340" />
      <path d="M 470 340 A 250 250 0 0 1 220 470" />
      <path d="M 220 470 A 250 250 0 0 1 90 220" />
      <path d="M 90 220 A 250 250 0 0 1 340 90" />
    </svg>

    <div className="fw-node fw-top">
      <span className="fw-num">01</span>
      <h4>Volume</h4>
      <p>BLNK trades as the digital IP flourishes and reach grows.</p>
    </div>
    <div className="fw-node fw-right">
      <span className="fw-num">02</span>
      <h4>Royalties</h4>
      <p>Every trade generates royalties back to the project.</p>
    </div>
    <div className="fw-node fw-bottom">
      <span className="fw-num">03</span>
      <h4>Buyback</h4>
      <p>Royalties fund buybacks at the current floor price.</p>
    </div>
    <div className="fw-node fw-left">
      <span className="fw-num">04</span>
      <h4>Floor Protection</h4>
      <p>10% of buyback volume reinforces the price floor.</p>
    </div>

    <div className="flywheel-center">
      <span className="pct">10%</span>
      <span className="lbl">Into Floor Buyback</span>
    </div>
  </div>

  <div className="fw-mobile-list">
    <div className="fw-row">
      <span className="fw-num">01</span>
      <div><h4>Volume</h4><p>BLNK trades as the digital IP flourishes and reach grows.</p></div>
    </div>
    <div className="fw-row">
      <span className="fw-num">02</span>
      <div><h4>Royalties</h4><p>Every trade generates royalties back to the project.</p></div>
    </div>
    <div className="fw-row">
      <span className="fw-num">03</span>
      <div><h4>Buyback</h4><p>Royalties fund buybacks at the current floor price.</p></div>
    </div>
    <div className="fw-row">
      <span className="fw-num">04</span>
      <div><h4>Floor Protection</h4><p>10% of buyback volume reinforces the price floor.</p></div>
    </div>
  </div>
</section>

<footer>
  <div className="footer-top">
    <span className="footer-word">BLNK</span>
    <div className="footer-links">
      <a href="#world">The World</a>
      <a href="#iphub">IP Hub</a>
      <a href="https://x.com/RobinhoodCrypto" target="_blank" rel="noopener">Robinhood</a>
    </div>
  </div>
  <div className="footer-bottom">
    <span>black to ink.</span>
    <span>colour is earned here.</span>
  </div>
</footer>




    </>
  );
}