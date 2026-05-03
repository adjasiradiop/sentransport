import './Header.css';

function Header() {
  const date = new Date().toLocaleDateString('fr-FR');

  return (
    <header className="header">
      <h1 className="header-titre">SenTransport</h1>
      <p className="header-soustitre">
        Votre guide du transport en commun a Dakar
      </p>
      <p className="header-date">{date}</p>
    </header>
  );
}

export default Header;