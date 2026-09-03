/**
 * @file Footer section: credits line with the developer logo.
 */
import './Footer.css';

/** Logo path resolved against the Vite base URL so it works on GitHub Pages. */
const LOGO_URL = `${import.meta.env.BASE_URL}logo-alianza-cgiar.png`;

/**
 * Footer component. Shows "Desarrollado por" followed by the
 * Alianza Bioversity & CIAT - CGIAR logo at 40px height.
 *
 * @returns {JSX.Element}
 */
export default function Footer() {
  return (
    <footer className="footer">
      <span className="footer__text">Desarrollado por </span>
      <img className="footer__logo" src={LOGO_URL} alt="Alianza Bioversity & CIAT - CGIAR" height="40" />
    </footer>
  );
}
