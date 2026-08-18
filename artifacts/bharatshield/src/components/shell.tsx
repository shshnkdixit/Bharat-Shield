import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Menu, ShieldCheck, X } from 'lucide-react';
import { copy, type Lang } from '@/lib/i18n';
import { useScrolled } from '@/lib/ui';

function Brand() {
  return (
    <Link href="/" className="brand" data-testid="link-brand">
      <span className="brand-mark">
        <ShieldCheck size={18} strokeWidth={2.2} />
      </span>
      <span className="brand-word">
        Bharat<em>Shield</em>
      </span>
    </Link>
  );
}

export function Navbar({ lang, setLang }: { lang: Lang; setLang: (v: Lang) => void }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const scrolled = useScrolled();
  const t = copy[lang];

  const links: Array<[string, string]> = [
    ['/', t.nav_home],
    ['/analyze', t.nav_analyze],
    ['/history', t.nav_history],
    ['/demo', t.nav_demo],
    ['/models', t.nav_models],
    ['/about', t.nav_about],
  ];

  const LangSwitch = () => (
    <span className="lang-switch" role="group" aria-label="Language">
      <button
        className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        data-testid="button-language-en"
      >
        EN
      </button>
      <button
        className={`lang-btn ${lang === 'hi' ? 'active' : ''}`}
        onClick={() => setLang('hi')}
        aria-pressed={lang === 'hi'}
        data-testid="button-language-hi"
      >
        हिं
      </button>
    </span>
  );

  return (
    <header className={`topbar ${scrolled || open ? 'scrolled' : ''}`}>
      <div className="container topbar-inner">
        <Brand />

        <nav className={`nav ${open ? 'open' : ''}`} aria-label="Main navigation">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`nav-link ${location === href ? 'active' : ''}`}
              aria-current={location === href ? 'page' : undefined}
              data-testid={`link-nav-${href === '/' ? 'home' : href.slice(1)}`}
            >
              {label}
            </Link>
          ))}
          <Link href="/analyze" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>
            {t.cta_analyze} <ArrowRight size={15} />
          </Link>
          <LangSwitch />
        </nav>

        <div className="nav-right">
          <LangSwitch />
          <Link href="/analyze" className="btn btn-primary btn-sm">
            {t.cta_analyze} <ArrowRight size={15} />
          </Link>
          <button
            className="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
            aria-expanded={open}
            data-testid="button-mobile-menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function Footer({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const cols: Array<{ title: string; links: Array<[string, string]> }> = [
    {
      title: 'Product',
      links: [
        ['/analyze', t.nav_analyze],
        ['/history', t.nav_history],
        ['/demo', t.nav_demo],
      ],
    },
    {
      title: 'Technology',
      links: [
        ['/models', t.nav_models],
        ['/about', 'Architecture'],
        ['/about', 'Responsible AI'],
      ],
    },
    {
      title: 'About',
      links: [
        ['/about', t.nav_about],
        ['/about', 'Privacy & Safety'],
        ['/analyze', 'Get started'],
      ],
    },
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Brand />
            <p>
              A first-pass digital-safety companion for India. BharatShield explains the signals behind
              suspicious content so you can pause with confidence — it never replaces your judgment.
            </p>
          </div>
          {cols.map((col) => (
            <div className="footer-col" key={col.title}>
              <h4>{col.title}</h4>
              {col.links.map(([href, label], i) => (
                <Link key={`${href}-${i}`} href={href}>
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} BharatShield — Digital safety / India</span>
          <span className="disclaimer">PROTOTYPE — FIRST-PASS ASSESSMENT, NOT A VERDICT</span>
        </div>
      </div>
    </footer>
  );
}

export function Shell({
  lang,
  setLang,
  children,
}: {
  lang: Lang;
  setLang: (v: Lang) => void;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <Navbar lang={lang} setLang={setLang} />
      <main>{children}</main>
      <Footer lang={lang} />
    </div>
  );
}
