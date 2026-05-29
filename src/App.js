import { useState, useEffect } from 'react';
import './App.css';
import Header from './Header';
import Recherche from './Recherche';
import LigneBus from './LigneBus';
import DetailLigne from './DetailLigne';
import Carte from './Carte'; // Corrigé : suppression des espaces internes
import Footer from './Footer';

function App() {
  // 1. États de l'application
  const [lignes, setLignes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [ligneSelectionnee, setLigneSelectionnee] = useState(null);

  // EXERCICE 1 : Extraction de la logique fetch dans une fonction réutilisable
  const chargerDonnees = () => {
    setChargement(true);
    setErreur(null); // Réinitialise l'erreur avant de tenter un nouveau chargement

    fetch("http://localhost:5000/lignes")
      .then(response => {
        if (!response.ok) {
          throw new Error("Erreur serveur : " + response.status);
        }
        return response.json();
      })
      .then(data => {
        setLignes(data);
        setChargement(false);
      })
      .catch(error => {
        setErreur(error.message);
        setChargement(false);
      });
  };

  // 2. Charger les données une seule fois au démarrage (Composant monté)
  useEffect(() => {
    chargerDonnees();
  }, []);

  // EXERCICE 3 : Charger les détails d'une ligne depuis l'endpoint dynamique GET /lignes/<id>
  const handleClickLigne = (ligne) => {
    // Si la ligne cliquée est déjà sélectionnée, on la ferme au second clic
    if (ligneSelectionnee && ligneSelectionnee.id === ligne.id) {
      setLigneSelectionnee(null);
    } else {
      // Appel à l'API pour récupérer les données spécifiques de cette ligne
      fetch(`http://localhost:5000/lignes/${ligne.id}`)
        .then(response => {
          if (!response.ok) {
            throw new Error("Impossible de charger les détails de cette ligne.");
          }
          return response.json();
        })
        .then(data => {
          setLigneSelectionnee(data); // Stocke l'objet détaillé reçu de Flask
        })
        .catch(err => {
          console.error("Erreur Exercice 3 :", err.message);
          // Optionnel fallback : utiliser les données déjà en mémoire si l'API échoue
          setLigneSelectionnee(ligne);
        });
    }
  };

  // 3. Logique de filtrage de la barre de recherche
  const lignesFiltrees = lignes.filter(l =>
    l.depart.toLowerCase().includes(recherche.toLowerCase()) ||
    l.arrivee.toLowerCase().includes(recherche.toLowerCase()) ||
    l.numero.toString().includes(recherche)
  );

  // --- ÉCRAN 1 : ÉTAT DE CHARGEMENT ---
  if (chargement) {
    return (
      <div className="App">
        <Header />
        <main className="contenu">
          <p className="message-chargement">Chargement des lignes...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // --- ÉCRAN 2 : ÉTAT D'ERREUR ---
  if (erreur) {
    return (
      <div className="App">
        <Header />
        <main className="contenu">
          <div className="message-erreur">
            <p>Impossible de charger les lignes.</p>
            <p className="erreur-detail">{erreur}</p>
            <p>Vérifiez que le serveur Flask est bien lancé (python api/app.py).</p>
            
            {/* EXERCICE 1 : Bouton Recharger disponible en cas de panne réseau */}
            <button className="btn-recharger" onClick={chargerDonnees}>
              🔄 Recharger
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // --- ÉCRAN 3 : ÉTAT DE SUCCÈS (Interface Normale) ---
  return (
    <div className="App">
      <Header />
      <main className="contenu">
        
        {/* Conteneur d'actions incluant la recherche et le bouton Recharger de l'Exercice 1 */}
        <div className="actions-barre">
          <Recherche valeur={recherche} onChange={setRecherche} />
          <button className="btn-recharger" onClick={chargerDonnees}>
            🔄 Recharger
          </button>
        </div>

        {/* Compteur de lignes dynamiques */}
        <p className="resultat-recherche">
          {lignesFiltrees.length} ligne{lignesFiltrees.length > 1 ? 's' : ''} trouvée{lignesFiltrees.length > 1 ? 's' : ''}
        </p>

        {/* Liste des lignes de bus */}
        {lignesFiltrees.map(ligne => (
          <LigneBus
            key={ligne.id}
            numero={ligne.numero}
            depart={ligne.depart}
            arrivee={ligne.arrivee}
            arrets={typeof ligne.arrets === 'number' ? ligne.arrets : ligne.arrets?.length}
            estSelectionnee={ligneSelectionnee && ligneSelectionnee.id === ligne.id}
            onClick={() => handleClickLigne(ligne)}
          />
        ))}

        {/* Section détails d'une ligne sélectionnée */}
        {ligneSelectionnee && <DetailLigne ligne={ligneSelectionnee} />}

        {/* Affichage de la carte interactive */}
        <Carte />

      </main>
      <Footer />
    </div>
  );
}

export default App;