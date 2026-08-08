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
  <a href="#top" className="dash-nav__logo">BLNK</a>

  {/* Right side */}
  <div className="dash-nav__right">
    {/* Leaderboard — disabled */}
    <div className="dash-nav__lb" title="Leaderboard coming soon">
      <span>🏆</span>
      <span className="dash-nav__lb-text">Leaderboard</span>
      <span className="dash-nav__soon">SOON</span>
    </div>

    {/* CTA */}
    <Link className="dash-nav__cta" href="/dashboard">
      Play the Game →
    </Link>
  </div>
</nav>

<section className="hero" id="top">
  <div className="hero-grey"></div>
  <div className="hero-colour"></div>
  <div className="cursor-dot" id="cursorDot"></div>

  <div className="hero-content">
    <span className="hero-eyebrow">black to ink.</span>
    <h1 className="hero-title">Blank to ink.</h1>
    <p className="hero-sub">A digital IP of colour and feelings. The world stays grey until you fill it.</p>
    <a className="hero-badge" href="https://x.com/RobinhoodCrypto" target="_blank" rel="noopener">
      <span className="dot"></span> Building on Robinhood
    </a>
    <Link className="wl-badge" href="/dashboard">
      Ride to the Colour Machine &rarr;
    </Link>
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
            <div className="mock-phone">
              <div className="screen">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAArwAAAK8CAYAAAANumxDAAAa5ElEQVR42u3aa5Bc9Xng4fd090zP9OgyI2kkhBDISAJbMgEFQXCwFZfwAlspSFzeeHNhN07h9UVeqGz2hlNO4t1yUYkL4lQcylDEi4sNTrJOChuyKexYGHGJMBokK7EQICGBhUBC15GmZ6avJx9TxEmF0n9G0+p5nu9665z3nOn+ndbJRvJSHgAA0KUKVgAAgOAFAADBCwAAghcAAAQvAAAIXgAAELwAAAheAAAQvAAAIHgBAEDwAgCA4AUAAMELAACCFwAAwQsAAIIXAAAELwAACF4AABC8AAAgeAEAQPACACB4AQBA8AIAgOAFAADBCwAAghcAAAQvAAAIXgAABC8AAAheAAAQvAAAIHgBAEDwAgCA4AUAAMELAIDgBQAAwQsAAIIXAAAELwAACF4AABC8AAAgeAEAELwAACB4AQBA8AIAgOAFAADBCwAAghcAAAQvAACCFwAABC8AAAheAAAQvAAAIHgBAEDwAgCA4AUAQPACAIDgBQAAwQsAAIIXAAAELwAACF4AABC8AAAIXgAAELwAACB4AQBA8AIAgOAFAADBCwAAghcAAMELAACCFwAABC8AAAheAAAQvAAAIHgBAEDwAgAgeAEAQPACAIDgBQAAwQsAAIIXAAAELwAACF4AAAQvAAAIXgAAELwAACB4AQBA8AIAgOAFAADBCwCA4AUAAMELAACCFwAABC8AAAheAAAQvAAAIHgBABC8AAAgeAEAQPACAIDgBQAAwQsAAIIXAAAELwAAghcAAAQvAAAIXgAAELwAACB4AQBA8AIAgOAFAEDwAgCA4AUAAMELAACCFwAABC8AAAheAAAQvAAACF4AABC8AABwbihZATAdmo2IXdvyaLfsotuteHfE0HBmEYDgBWaX0eMR//n6VkxU7aLbfeHrxbjxl+wB6FxeaQAAQPACAIDgBQAAwQsAAIIXAAAELwAACF4AAASvFQAAIHgBAEDwAgCA4AUAAMELAACCFwAABC8AAIIXAAC6WMkKoLu88WoerebMH8cDv7cxsuKO6BtouShd7v/dc3ksX7U95g1VZ/xYessRS5ZnLgrwNtlIXsqtAbrHDUubcezQzB9HT3kgrrzuU1Es9rgoXe6l7Y/E0YMvdMSxXLoui4e2F10U4G280gAAgOAFAADBCwAAghcAAAQvAAAIXgAAELwAAAheKwAAQPACAIDgBQAAwQsAAIIXAAAELwAACF4AAAQvAAAIXuBccPytedFu+bNm9mrUi9FuZxYBvE3JCqAzPPPX7dj/YtqMrd9eHpV5q6N/bj7j51Ms9UYhE9+zwdDildFbntMRx1KrFeJrv7sjevsaZzyjvxLxc7cWotTj2kK3yEbyUm4NMPM+9yuteOzr6X+OV11/W/SWByyUWWls9HDsfPKBpBkLl0R885VS9Pszgq7h5xcAAAQvAAAIXgAAELwAACB4AQBA8AIAgOAFAEDwWgEAAIIXAAAELwAACF4AABC8AAAgeAEAQPACACB4AQBA8ALT6bWXz4uD+xdZBHSA2mRvfP9v3msR0EWykbyUWwOk+fDqVhzYm/andMm6m2P4gjVds5NGrRojm++NdqvhBuly7t1/3roNWdy/pegGgQ7gF14AAAQvAAAIXgAAELwAACB4AQBA8AIAgOAFAEDwWgEAAIIXAAAELwAACF4AABC8AAAgeAEAQPACACB4AQBA8AL/kqNvzo9GvWgRwNtMVnvi1ImKRUAHyEbyUm4NzFZPPdqO57ekzXhx+0Vx5NBFkWVpz49Di1dGZe7CjtjLwVeei/rkWNqHS5bFgqHBuPzdw260LvbmkWq8tO9wtFvN5FkXXvr+KJZ6Z/ycWq1GHH5tZ+R5O2lOu92Kle95MZZdfOSMZwwuivjYHX6bglQlK2A2e35LxJ/c3U6csj9+cuP10T8w1DV7OXJwV1RHDyfN6Oktx7cf3RVr37PSjdbFTp0ej/Xr18eefbuTZy1b9VMdEbzFYk+cf/H65Dmjxw7E9x5Oe6JeviqLj93hPoNUHhuB6ZG347zFg/bQ5ebNrUTJGz2A4AUAAMELAACCFwAABC8AAAheAAAELwAACF4AABC8AAAgeAEAQPACAIDgBQAAwQsAgOAFAADBCwAAghcAAGZKyQqgu+x8+sFo1ieSZly94cPx2dt/Mfr6es54Rm9vbwwODrogs8A3vvGNOHLkSNqMv9oWD37196PZqCXN6Z+zKNZc/REXBRC80M1q46PRqFWTZnzmYzfEjTf+G8vkHVm7dm3yjA9+8IPxx1/+XNTr9aQ5xVKvCwL8GK80AAAgeAEAQPACAIDgBQAAwQsAAIIXAAAELwAAgtcKAAAQvAAAIHgBAEDwAgCA4AUAAMELAACCFwAAwQuz1KkTlTi4b9gigI41Ue2NPX+33CIgUTaSl3Jr4Fz0uV9pJf37sdH++NHe9dFXGUw+lgXnrYpiqTdpxhv7n4/TJw4mH8vyiy6ND127KmnGpk2bYsWKFW4yzqrPf/7zMT4+fsb/vt5oxWNbdsext15LOo5iqRwXv/dDUSgUk+Y0atU4eSTtWFqtRvSUdsaKd7+ZNOf9P5vFjb/sNy4EL5xz1mfN5Bkr1myMZSuv7ojzeWn7I3H04AvJc/5267Z43zXr3SDMOu12Hv/na/83/tOtv5o0p6c8EFde96koFntm/Jwmqidi++P3Jc+55b8W4tfvErzMXu5+6DKD8wcsgdn5hVbIYt6cPosABC8AAIIXAAAELwAACF4AABC8AAAgeAEAQPACAIDgBQBA8AIAgOAFAADBCwAAghcAAAQvAAAIXgAAELwAAAheAAAQvAAAIHgBAEDwAgCA4AUAAMELAACCFwAAwQsAAIIXAAAELwAACF4AABC8AAAgeAEAQPACACB4AQBA8AIAgOAFAADBC0yVefPmWQKz1oUXXmgJgOCFblcqlSyBWauvr88SAMELAIDgBQAAwQsAAIIXAAAELwAACF4AABC8AAAgeAEAELwAACB4AQBA8AIAgOAFAADBCwAAghcAAAQvAACzSckKONsmxyOqp9NmPPs3742e8p70J75iz5ScU6M+HpHnacdSKMbw8OIoFLLEOZ5jmcVfaqVSLFmyJGlGdTKPRm082sW0r8gsK0Sptz9xRhY95YHkvXx/88rY9vjJuHjtG0lzFi5xj3FuykbyUm4NnE1/9uV23PPZdtKMZrMYV1736+nBmxUjm4JA3LHlqzFZPZk0Y/37fy7+4qE/igWDc5LmVCqVyLLMjcas1G63Y2JiImnGHf/7/rjvD34zWq1m0py5Cy6I917z7xPPKE8+joiIQ6/uiDf3PRGFYtpn71NjfifjHH0YtgLOtmYjYqKaOqUVxSn6dXZKvmRbzWi3Gkkzfubqd8XyZX4+gaSH2EIhBgbSfhHd9LEb4it3/7dot1ppqToFoRqRTdlnXW2y7QZh9n42WAEAAIIXAAAELwAACF4AABC8AAAgeAEAQPACACB4AQBA8AIAgOAFAADBCwAAghcAAAQvAAAIXgAABC8AAHSvkhUA/9SOHTtibGysa86nv78/1q9f31XXaP/+/fH666931Tldc8010dPT4w8QELzA9Lv11ltjx44dXXM+q1atij179nTVNbrnnnvi7rvv7qpzOnToUCxZssQfIDDlvNIAAIDgBQAAwQsAAIIXAAAELwAACF4AABC8AAAIXisAAEDwAgCA4AUAAMELAACCFwAABC8AAAheAAAELwAAdLGSFQDT8jRdKMTgwuHIsixpTqNej1Mnj1voNBlcMBzFUjFpxunRk1GvTVomIHiB2aUyZ178xm99KXrL5aQ5+17eFffe/dsWOk0+8V9+JxYtXpo04+t//KX4wbanLRPoWF5pAABA8AIAgOAFAADBCwAAghcAAAQvAAAIXgAABK8VAAAgeAEAQPACAIDgBQAAwQsAAIIXAAAELwAAghcAAAQvAACcm0pWAEyHRq0WTz/+/6NYSvuYOX70sGVOo23PbI7KnHlJM946dNAiAcELzD612kQ89s2HLKLDfe+xhy0B6HpeaQAAQPACAIDgBQAAwQsAAIIXAAAELwAACF4AAASvFQAAIHgBAEDwAgCA4AUAAMELAACCFwAABC8AAIIXAAAELwAAnJtKVgCdYd26dR1zLNu3b3dBOtxdd90Vd911l0VMgwULFkRfX19Uq1XLgC7hF14AAAQvAAAIXgAAELwAACB4AQBA8AIAgOAFAEDwWgEAAIIXAAAELwAACF4AABC8AAAgeAEAQPACACB4AQBA8AIAgOAFAADBCwAAghcAAAQvAAAIXgAABC8AAAheAAAQvAAAIHgBAEDwAgCA4AUAAMELAIDgBQAAwQsAAIIXAAAELwAACF4AABC80E2+9dj3Y/TUuEXADHvoL7dEo9G0COgiJSuAdGuv+cXI83bSjCeeeCLWXXFZFItpz6Fbt26NRYsWuSjMSrt3746bb745acaxk5Ox9n23RFZM+4osFHzFguCFLtJXmZ88o9VqxP4f7ZuCOS0XhFmrVqvF3r17k2b0lAeiPDAYxWKPhUKX8EoDAACCFwAABC8AAAheAAAQvAAAIHgBAEDwAgAgeK0AAADBCwAAghcAAAQvAAAIXgAAELwAACB4AQAQvEBXefLZXZbArFSvN+PJre5/4MdlI3kptwbOpldfyuPF7WkzfvD0JfHEt7LkYxletiYWLFnVEXs5dfz1qI2fSp7TqL4Z71u/OmnGnXfeGRdddJGblbNq06ZNMTo6eubB22jGs8/vi8r885OOo1AsxYLzVkWWzfxvQvVaNfbv2pw8p68yGD97y6uxfPXhpDk3/lLmRkXwwtkyUS3HB+ZUk+esWLMxlq28uqt289x3vhyNWtpuduzYEVdccYUbjbNq6dKlcejQoaQZA/OXxBUbfq2LPutOxPbH70ue8+8+3Re/8aWI3nLTjcasVLICzkX9AzVLAHiH+ir16C17i5HZy90PAIDgBQAAwQsAAIIXAAAELwAACF4AABC8AAAIXisAAEDwAgCA4AUAAMELAACCFwAABC8AAAheAAAEL8A/cc8Dfx3j4zWL4Ky5/0++E6fHxi0CmBbZSF7KrYFz0bHDaf/+0I8Wxhc+sSRe3f1KR5zPystuiIVLL0me06iNRx5pf9Yvb38kyoXJKBSyM54xPDwczz77bFQqFTdrl9u0aVM8/PDDSTNOj43HJes/GqXe/rQvtawQPYkzGrXx2Pn0g9FuNWZ8t5W5A/HJ/3VxXPeRkaQ5/ZWIylz3KrNXyQo4Vy1ckvrvj8VPXXck9vyg3RHn0241p2ROTzk9MJuNyRgdTXuiyPM88tzz9GwwOjoahw4dSv9C6u2P3vJAB5xRHo1atSOCd97y8fjopuNuMkjklQYAAAQvAAAIXgAAELwAACB4AQBA8AIAgOAFAEDwWgEAAIIXAAAELwAACF4AABC8AAAgeAEAQPACACB4AaZBnudRHa9ZRJer15tRbzQtAuhoJStgNlu8LOLSddmMH0d1tC+azVqMjR5OnjUwbziyLO1Ztn9gQfJx1Np9cfsdd8cdt/1C2vkMDMTq1avdrNNk9+7dUaud+YPJk1t3xbPP74uB+UuSjyX1vo2IaLcaMT52PGlGq1GLoeHBWLT06Ixfn/MudI/CVMhG8lJuDTCzGvVi/NYtrfjuN9J/Kbvq+tuitzww8+dUq8bI5nuj3WokzdmwYUNs2bLFTTJNVq9eHXv37k2accm6m2P4gjUdcT5jo4dj55MPJM1YsDiLP/9hfwwN190g0CW80gAdoKe3FaWelkVAB8iyPPoqYhcELwAACF4AABC8AAAgeAEAQPACAIDgBQBA8AIAgOAFAADBCwAAghcAAAQvAAAIXgAAELwAAAheAADoHiUrgM4wZ37EwiVpM8bH+qJZn4gs9YOhtz+yLPV5OIue8kC0W42kKXv2vxV/8a3H4wPXrJ3xa1SpVGLu3LnJcw4fPtwR99xDf7kljp2cjJ7yQNKcQnFqvkoatfGIyJNmtBq1WLA4iyw78zlDi7PIsgC6SDaSl3JrgJlXr0W0mmkzHv3aB+KPPjsSk+OTSXN+4tr/EAPzFyefU7vViNQPmNPHD8beH3wzSsXijF+j22+/Pe688870h5s5czrinms0mrH2fbdEeWAwLXgLxSl4QIoY2XxvNGrVpBlDw4PxZ39Xjb5K/cy/GLOIvorPJOgmfuGFDtFbjohy2oyPfuap+OoXmjF+Om1OHlPzHFwo9qQ/lReKUZucjFonPJTU61Myp1qtdsx9lxVLUZyC6zQV2q1G8v8ILFp6NIaGiwHwtu8jKwAAQPACAIDgBQAAwQsAAIIXAAAELwAACF4AAAQvAAAIXgAAELwAACB4AQBA8AIAgOAFAADBCwCA4AXgnaiOT8ZkrZE043R1wiIBzrKSFQA/Fnajh6LVrKc9TWeFmDN0fmRZljSnWCrHvAXLO2Ivf/Xd7bH2gT+Ny9e+68xnfGdbx5xPREShkP41MH76WDTq48lz8nbLHx8wLbKRvJRbA3SPG5Y249ihmT+OnvJAXHndp6JY7Oma3R585bl49YXHk+dce9MdXXXPvbT9kTh68IWOOJZL12Xx0PaiDwLg7Q/3VgAAgOAFAADBCwAAghcAAAQvAAAIXgAAELwAAAheAAAQvAAAIHgBAEDwAgCA4AUAAMELAACCFwAAwQsAAN2rZAWQ7s3X8mg20macOhExOZ4248lHN0S9tjv6Bmoz/+HS0xe16snIijP/MZNlheirzJ+CcypH38BQR9xzjfp4NBu1jjiWYrGnY/Zy9NC82Prtt6K3r37m51OIWHBeRJalHUu5P2LxsiyAmZeN5KXcGiDNh1e34sDezvhTuur626K3PDDzQVarxsjme6Pdasz4sfQNDMWVGz/ZVffc/l2Pxxv7nuuIY7lk3c0xfMGajjiWsdHDsfPJBzriWNZtyOL+LUUfkNABvNIAAIDgBQAAwQsAAIIXAAAELwAACF4AABC8AAAIXisAAEDwAgCA4AUAAMELAACCFwAABC8AAAheAAAELwAACF7gX3Ly2JxoNv0pAW9XnyxF9XSfRUAHyEbyUm4NzFYP39+OHU+l/Qm88eqlceSNwcjzdkec04WXvj+Kpd4ZP45Wsx4H9myNvN2a+Q+6rBA95UrynDnzz4v5iy5MnnPwleemYL+1aDUbHXHPDV+wJubMP68jjqU2eTreeGVbRxxLoVCMC1YeiAWLD57xjLmDEf/9D4s+rEHwwpn79IdasW1z+p/AT278ZPQPDFloh5qonojtj9+XPOf8i6+Od63dmDznmUd/N3nGijUbY9nKq13cDjZ67ED88G8fSppR7o94ZrxkmZD6AGoFAAAIXgAAELwAACB4AQBA8AIAgOAFAADBCwCA4AUAAMELAACCFwAABC8AAAheAAAQvAAAIHgBABC8AAAgeKHrnD6yKsZOXGoRQMfKskq8vPXnLQISlayAc9X6rJk44cVYsWZjXHuTLxNg6s1fuDyuvemOpBkT1RPxyz99X/KxXHVdFl/5btFFYdbyCy8AAIIXAAAELwAACF4AABC8AAAgeAEAQPACACB4rQAAAMELAACCFwAABC8AAAheAAAQvAAAIHgBABC8AAAgeKGznD6yyhIA3qHm5OKYPL3YIpi1SlbA2fbw/e34zp/nSTPGTkSsWLMx+VjmLVzuggAdq6e3f0o+644eacRnrn81egdaSXO+8t2ii4LghXdix1N5bNucJ055Ma696ectE+juL+mevli28urkOQdfeS52PnvAQpm1vNIAAIDgBQAAwQsAAIIXAAAELwAACF4AABC8AAAIXisAAEDwAgCA4AUAAMELAACCFwAABC8AAAheAAAELwAACF4AABC8AAAgeAEAQPACAIDgBQAAwQsAgOAFAADBCwAAghcAAAQvAAAIXgAAELwAACB4AQAQvAAAIHgBAEDwAgCA4AUAAMFLl5o8vSROvbXWIgDOQW++/NOWwDmpZAW8U/teyON//kIraUa7NRqt9kVxybqbLRTgLBlavDJ6y3OS53z63+6Inr5m0oybfjWL//g/ii4KgpfOdOJIxP4XUqeMxfkXN2P4gjUWCnCWVOYujMrchclzntnxSPKMvT90PTj7vNIAAIDgBQAAwQsAAIIXAAAELwAACF4AABC8AAAIXisAAEDwAgCA4AUAAMELAACCFwAABC8AAAheAAAELwAACF4AADg3lawA0u18+sGojY8mzVh52Q2xcOklljkN+irz46rrb0ueUyz2TMnxTMmxlHpd2GnSqI3HzqcfjHarkTRn7tD58Z6rPmKhIHihOzTrE9GoVZNmtFtNi5wmWVaI3vJAxxxPJx0L/5w8GrVqcvA265NWCR3CKw0AAAheAAAQvAAAIHgBAEDwAgCA4AUAAMELAIDgtQIAAAQvAAAIXgAAELwAACB4AQBA8AIAgOAFAEDwwjvUnBy0BACStJuVyNsli+CscsfNEt/+03Z84RPtpBnl/rlx+Yabk4+lp1xxQQDOQZdv+LXkGX+/bXf8zPznI49m0pz7vleMNeszFwXByz8aPR4xMZY2I89HY878JZYJMEtNxXfAkdd3xfhYI3nORNX14J3zSgMAAIIXAAAELwAACF4AABC8AAAgeAEAQPACACB4rQAAAMELAACCFwAABC8AAAheAAAQvAAAIHgBABC8AAAgeAEAQPACAIDgBQAAwQsAAIIXAAAELwAAghcAAAQvAAAIXgAAELwAACB4AQBA8AIAgOAFAEDwAgCA4AUAAMELAACCFwAABC8AAEyJkhVAZ5ioHovRYwcsAmZYsz4RkecWAYIXmGoHXn4mDrz8jEUAwBTzSgMAAIIXAAAELwAACF4AABC8AAAgeAEAQPACACB4rQAAAMELAACCFwAABC8AAAheAAAQvAAAIHgBABC8AADQxUpWAJ1haGgoFi5caBEwwxqNRrz22msWAYIXmGof//jH44tf/KJFwAzbvXt3XHbZZdFqtSwDuoRXGgAAELwAACB4AQBA8AIAgOAFAADBCwAAghcAAMFrBQAACF4AABC8AAAgeAEAQPACAIDgBQAAwQsAgOAFAADBCwAAghcAAAQvAAAIXgAAELwAACB4AQAQvAAAIHgBAEDwAgCA4AUAAMELAACCFwAABC8AAIIXAAAELwAACF4AABC8AAAgeAEAQPACAMC/5h8AEgTDHrZi5IEAAAAASUVORK5CYII=" alt="" />
                <div className="play"><span></span></div>
              </div>
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
            <div className="ring"></div>
            <div className="tag">
              <img src="data:image/png;base64,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" alt="" />
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
            <div className="mock-magnet">
              <img src="data:image/png;base64,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" alt="" />
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