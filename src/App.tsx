import { useEffect, useState } from 'react'
import './App.css'

const LINKEDIN_URL = 'https://www.linkedin.com/company/bihtergames/'
const EMAIL = 'info@bihtergames.com'

function App() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="site">
      <div className="noise" aria-hidden="true" />

      <header className={`nav ${scrolled ? 'nav--solid' : ''}`}>
        <a className="nav__brand" href="#top" onClick={closeMenu}>
          <img src="/logos/logo-lime.png" alt="bihter GAMES" width={64} height={68} />
        </a>

        <nav className={`nav__links ${menuOpen ? 'is-open' : ''}`}>
          <a href="#games" onClick={closeMenu}>
            Games
          </a>
          <a href="#studio" onClick={closeMenu}>
            Studio
          </a>
          <a href="#contact" onClick={closeMenu}>
            Contact
          </a>
          <a
            className="nav__social"
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMenu}
          >
            LinkedIn
          </a>
        </nav>

        <button
          className={`nav__burger ${menuOpen ? 'is-open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero__glow" aria-hidden="true" />
          <div className="hero__grid" aria-hidden="true" />

          <div className="hero__brand">
            <img
              className="hero__logo"
              src="/logos/logo-lime.png"
              alt="bihter GAMES"
              width={420}
              height={450}
            />
          </div>

          <div className="hero__copy">
            <h1>We build worlds.</h1>
            <p>
              An independent studio crafting games around feeling, tempo, and
              moments you remember.
            </p>
            <div className="hero__actions">
              <a className="btn btn--lime" href="#games">
                See games
              </a>
              <a className="btn btn--ghost" href="#contact">
                Talk to us
              </a>
            </div>
          </div>
        </section>

        <section className="games" id="games">
          <div className="section-head">
            <p className="eyebrow">Games</p>
            <h2>Coming soon</h2>
            <p className="lede">
              Our first titles will be announced shortly. Stay tuned — something
              new is on the way.
            </p>
          </div>

          <div className="games__soon" aria-live="polite">
            <span className="games__pulse" aria-hidden="true" />
            <p>To be announced</p>
          </div>
        </section>

        <section className="studio" id="studio">
          <div className="studio__intro">
            <p className="eyebrow">Studio</p>
            <h2>Small team. Shipped experience.</h2>
            <p className="lede">
              Bihter Games is lean on purpose. Behind it is professional Unity
              work on Steam titles and shipped mobile games — so every system we
              build comes from something already proven in production.
            </p>
          </div>

          <div className="stats">
            <article className="stat">
              <p className="stat__num">5+</p>
              <p className="stat__label">years building Unity games professionally</p>
            </article>
            <article className="stat">
              <p className="stat__num">800K+</p>
              <p className="stat__label">
                Steam wishlists on a live title in active development
              </p>
            </article>
            <article className="stat">
              <p className="stat__num">5M+</p>
              <p className="stat__label">
                demo players reached during Steam Next Fest
              </p>
            </article>
            <article className="stat">
              <p className="stat__num">3+</p>
              <p className="stat__label">
                years shipping hyper-casual mobile titles at studio scale
              </p>
            </article>
          </div>

          <div className="roles">
            <article className="role">
              <p className="role__tag">Founder</p>
              <h3>Furkan Çağlar</h3>
              <p className="role__title">Game developer</p>
              <p>
                Designs, programs, and ships Bihter Games titles — gameplay
                systems, multiplayer foundations, Steam-ready builds, and the
                full path from prototype to release.
              </p>
            </article>
            <article className="role">
              <p className="role__tag">Carried over</p>
              <h3>What we bring</h3>
              <ul className="role__list">
                <li>Unity multiplayer with Netcode for GameObjects</li>
                <li>Steam shipping, wishlists, and festival-ready demos</li>
                <li>Mobile production pace from hyper-casual studios</li>
                <li>Fast prototyping with player-first systems</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="contact" id="contact">
          <div className="contact__panel">
            <img
              className="contact__logo"
              src="/logos/logo-white.png"
              alt=""
              aria-hidden="true"
              width={140}
              height={150}
            />
            <h2>Let&apos;s make a game together</h2>
            <p>
              For partnerships, press, or a simple hello — our inbox is open.
            </p>
            <div className="contact__actions">
              <a className="btn btn--lime btn--email" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
              <a
                className="btn btn--ghost"
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="footer__brand" href="#top">
          <img
            src="/logos/logo-white.png"
            alt="bihter GAMES"
            width={72}
            height={76}
          />
        </a>
        <div className="footer__links">
          <a className="footer__email" href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        </div>
        <p className="footer__copy">
          © {new Date().getFullYear()} Bihter Games. All rights reserved.
        </p>
      </footer>
    </div>
  )
}

export default App
