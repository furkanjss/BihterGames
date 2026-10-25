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
          <div className="studio__visual">
            <img
              src="/logos/logo-black.png"
              alt="bihter GAMES logo"
              width={360}
              height={380}
            />
          </div>
          <div className="studio__copy">
            <p className="eyebrow eyebrow--dark">Studio</p>
            <h2>Small team. Big curiosity.</h2>
            <p>
              Bihter Games is an independent game company focused on bold visual
              identity and player-first moments. From prototype to release, we
              protect the feeling in every step.
            </p>
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
