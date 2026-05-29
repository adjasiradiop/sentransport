import json
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Autorise ton application React à communiquer avec Flask

# Charger les données depuis le fichier JSON au démarrage
with open("lignes_ddd.json", "r", encoding="utf-8") as f:
    lignes = json.load(f)


@app.route("/")
def accueil():
    return jsonify({
        "message": "Bienvenue sur l'API SenTransport !",
        "endpoints": ["/lignes", "/lignes/<id>", "/arrets", "/stats", "/lignes/recherche"]
    })


@app.route("/lignes")
def get_lignes():
    return jsonify(lignes)


@app.route("/lignes/<int:ligne_id>")
def get_ligne(ligne_id):
    ligne = next(
        (l for l in lignes if l["id"] == ligne_id),
        None
    )
    if ligne is None:
        return jsonify({"erreur": "Ligne non trouvée"}), 404
    return jsonify(ligne)


@app.route("/arrets")
def get_all_arrets():
    # Utilisation d'un set pour collecter tous les arrêts sans doublons
    tous_les_arrets = set()
    
    for ligne in lignes:
        for arret in ligne["listeArrets"]:
            tous_les_arrets.add(arret)
            
    # Conversion du set en liste triée par ordre alphabétique
    liste_arrets_unique = sorted(list(tous_les_arrets))
    return jsonify(liste_arrets_unique)


@app.route("/stats")
def get_stats():
    # 1. Nombre total de lignes
    nb_lignes = len(lignes)
    
    # 2. Somme totale des arrêts
    total_arrets = sum(l["arrets"] for l in lignes)
    
    # 3. Trouver la ligne avec le plus d'arrêts
    ligne_max = max(lignes, key=lambda x: x["arrets"])
    
    return jsonify({
        "nombre_total_lignes": nb_lignes,
        "somme_totale_arrets": total_arrets,
        "ligne_la_plus_longue": {
            "numero": ligne_max["numero"],
            "nb_arrets": ligne_max["arrets"]
        }
    })


@app.route("/lignes/recherche")
def recherche_lignes():
    # Récupération du paramètre 'q' depuis l'URL (?q=...)
    query = request.args.get("q", "").lower()
    
    # Filtrage des lignes par départ ou arrivée
    resultats = [
        l for l in lignes 
        if query in l["depart"].lower() or query in l["arrivee"].lower()
    ]
    return jsonify(resultats)


if __name__ == "__main__":
    app.run(debug=True, port=5000)