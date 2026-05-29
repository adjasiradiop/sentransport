import json
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
# Autorise l'application React à communiquer avec Flask sans blocage CORS
CORS(app)  

# 1. CHARGEMENT DES DONNÉES AU DÉMARRAGE

# Charger les lignes de bus
with open("lignes_ddd.json", "r", encoding="utf-8") as f:
    lignes = json.load(f)

# Charger le fichier des arrêts génériques
with open("arrets.json", "r", encoding="utf-8") as f:
    arrets = json.load(f)


# 2. LES ENDPOINTS / ROUTES DE L'API

@app.route("/")
def accueil():
    """Page d'accueil de l'API avec la liste des endpoints disponibles"""
    return jsonify({
        "message": "Bienvenue sur l'API SenTransport !",
        "endpoints": ["/lignes", "/lignes/<id>", "/arrets", "/stats", "/lignes/recherche", "/arrets-generiques"]
    })


@app.route("/lignes")
def get_lignes():
    """Récupère la liste de toutes les lignes de bus disponibles"""
    return jsonify(lignes)


@app.route("/lignes/<int:ligne_id>")
def get_ligne(ligne_id):
    """Récupère les détails spécifiques d'une ligne grâce à son ID"""
    ligne = next(
        (l for l in lignes if l["id"] == ligne_id),
        None
    )
    if ligne is None:
        return jsonify({"erreur": "Ligne non trouvée"}), 404
    return jsonify(ligne)


@app.route("/arrets")
def get_all_arrets():
    """Extrait et trie tous les arrêts uniques présents dans le catalogue des lignes"""
    tous_les_arrets = set()
    
    for ligne in lignes:
        # On vérifie que la liste existe pour éviter les erreurs KeyErrors
        if "listeArrets" in ligne:
            for arret in ligne["listeArrets"]:
                tous_les_arrets.add(arret)
            
    liste_arrets_unique = sorted(list(tous_les_arrets))
    return jsonify(liste_arrets_unique)


@app.route("/arrets-generiques")
def get_arrets_json():
    """Renvoie le contenu brut du fichier arrets.json"""
    return jsonify(arrets)


@app.route("/stats")
def get_stats():
    """Calcule des statistiques globales sur le réseau de transport"""
    nb_lignes = len(lignes)
    
    # Calcul de la somme en s'assurant que 'arrets' est bien traité comme un nombre
    total_arrets = sum(
        l["arrets"] if isinstance(l["arrets"], int) else len(l.get("listeArrets", [])) 
        for l in lignes
    )
    
    # Trouver la ligne la plus longue du réseau
    ligne_max = max(
        lignes, 
        key=lambda l: l["arrets"] if isinstance(l["arrets"], int) else len(l.get("listeArrets", []))
    )
    
    return jsonify({
        "nombre_total_lignes": nb_lignes,
        "somme_totale_arrets": total_arrets,
        "ligne_la_plus_longue": {
            "numero": ligne_max["numero"],
            "nb_arrets": ligne_max["arrets"] if isinstance(ligne_max["arrets"], int) else len(ligne_max.get("listeArrets", []))
        }
    })


@app.route("/lignes/recherche")
def recherche_lignes():
    """Recherche des lignes par terminus (départ ou arrivée) via le paramètre ?q="""
    query = request.args.get("q", "").lower()
    
    resultats = [
        l for l in lignes 
        if query in l["depart"].lower() or query in l["arrivee"].lower()
    ]
    return jsonify(resultats)


# 3. LANCEMENT DU SERVEUR
if __name__ == "__main__":
    app.run(debug=True, port=5000)