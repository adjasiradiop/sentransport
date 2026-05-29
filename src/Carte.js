import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Carte.css';

// 1. RECTIFICATION DES ICÔNES LEAFLET
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Exercice 1 : Icône Rouge pour l'arrêt le plus proche
const iconeProche = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Formule de Haversine
function calculerDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// EXERCICE 2 : Composant de recentrage de la carte
function BoutonCentrer({ position }) {
  const map = useMap();
  const gererCentrage = () => {
    if (position) {
      map.setView(position, 15);
    }
  };
  return (
    <button type="button" className="btn-centrer" onClick={gererCentrage}>
      🎯 Centrer sur ma position
    </button>
  );
}

// COMPOSANT PRINCIPAL
function Carte() {
  const [arrets, setArrets] = useState([]);
  const [positionUtilisateur, setPositionUtilisateur] = useState(null);
  
  // EXERCICE 3 : État pour stocker la liste des 3 arrêts les plus proches
  const [lesTroisProches, setLesTroisProches] = useState([]);
  
  const DAKAR = [14.6928, -17.4467];

  // Charger les arrêts (Route tolérante arrets-generiques)
  useEffect(() => {
    fetch("http://localhost:5000/arrets-generiques")
      .then((r) => r.json())
      .then((data) => setArrets(data))
      .catch((err) => console.error("Erreur arrêts :", err));
  }, []);

  // Géolocalisation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPositionUtilisateur([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          console.log("Géolocalisation refusée, simulation à Dakar");
          setPositionUtilisateur([14.7400, -17.4250]); // Simulation proche Patte d'Oie
        }
      );
    }
  }, []);

  // EXERCICE 3 : Calcul, tri et filtrage pour obtenir le Top 3 des arrêts proches
  useEffect(() => {
    if (positionUtilisateur && arrets.length > 0) {
      const listeAvecDistances = [];

      arrets.forEach((a) => {
        const lat = a.lat !== undefined ? a.lat : a[" lat "];
        const lon = a.lon !== undefined ? a.lon : a[" lon "];
        const id = a.id !== undefined ? a.id : a[" id "];
        const nom = a.nom !== undefined ? a.nom : a[" nom "];
        const lignes = a.lignes !== undefined ? a.lignes : a[" lignes "];

        if (lat !== undefined && lon !== undefined) {
          const d = calculerDistance(positionUtilisateur[0], positionUtilisateur[1], lat, lon);
          listeAvecDistances.push({ ...a, id, nom, lat, lon, lignes, distance: d });
        }
      });

      // Tri par ordre de distance croissante
      const listeTriee = listeAvecDistances.sort((a, b) => a.distance - b.distance);
      
      // On ne garde que les 3 premiers
      setLesTroisProches(listeTriee.slice(0, 3));
    }
  }, [positionUtilisateur, arrets]);

  return (
    <div className="carte-container">
      <h2 className="carte-titre">Carte des arrêts</h2>
      
      {/* EXERCICE 3 : Affichage du bloc des 3 arrêts les plus proches */}
      {positionUtilisateur && lesTroisProches.length > 0 && (
        <div className="top-arrets-box">
          <h3>📍 Vos 3 arrêts les plus proches :</h3>
          <ol className="liste-trois-arrets">
            {lesTroisProches.map((arret, index) => (
              <li key={arret.id} className={index === 0 ? "premier-arret" : ""}>
                <strong>{arret.nom}</strong> — {arret.distance.toFixed(2)} km 
                <span className="badge-lignes"> (Lignes: {arret.lignes ? arret.lignes.join(", ") : "Aucune"})</span>
                {index === 0 && " ⭐ (Le plus proche)"}
              </li>
            ))}
          </ol>
        </div>
      )}

      <MapContainer center={DAKAR} zoom={13} className="carte">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Exercice 2 : Bouton flottant de recentrage */}
        {positionUtilisateur && <BoutonCentrer position={positionUtilisateur} />}

        {/* Rendu dynamique des marqueurs */}
        {arrets.map((a) => {
          const lat = a.lat !== undefined ? a.lat : a[" lat "];
          const lon = a.lon !== undefined ? a.lon : a[" lon "];
          const id = a.id !== undefined ? a.id : a[" id "];
          const nom = a.nom !== undefined ? a.nom : a[" nom "];
          const lignes = a.lignes !== undefined ? a.lignes : a[" lignes "];

          if (lat === undefined || lon === undefined) return null;

          // Exercice 1 : Le plus proche est le premier élément du tableau (index 0)
          const estLePlusProche = lesTroisProches[0] && lesTroisProches[0].id === id;

          return (
            <Marker 
              key={id} 
              position={[lat, lon]}
              icon={estLePlusProche ? iconeProche : new L.Icon.Default()}
            >
              <Popup>
                <strong>{nom}</strong> {estLePlusProche && "⭐ (Le plus proche)"}
                <br />
                Lignes : {lignes ? lignes.join(", ") : "Aucune"}
              </Popup>
            </Marker>
          );
        })}

        {positionUtilisateur && (
          <Marker position={positionUtilisateur}>
            <Popup>🎯 Vous êtes ici</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default Carte;