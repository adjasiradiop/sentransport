
import './Recherche.css';

function Recherche({ valeur, onChange }) {
  return (
    <div className="recherche">
      <div className="recherche-row">
        <input
          type="text"
          className="recherche-input"
          placeholder="Rechercher une ligne (depart, arrivee)..."
          value={valeur}
          onChange={e => onChange(e.target.value)}
        />
        {valeur && (
          <button
            className="btn-effacer"
            onClick={() => onChange("")}
          >
            Effacer
          </button>
        )}
      </div>
    </div>
  );
}

export default Recherche;