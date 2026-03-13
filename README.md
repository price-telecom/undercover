# 🔥 Undercover

Jeu de société multijoueur en temps réel — 4 joueurs, chacun sur son téléphone.

## Déploiement sur Railway (5 min, gratuit)

1. **Crée un compte** sur [railway.app](https://railway.app) (gratuit)
2. **Nouveau projet** → "Deploy from GitHub repo"
3. Upload ce dossier sur GitHub (ou glisse-dépose le dossier sur Railway directement)
4. Railway détecte Node.js automatiquement et lance `npm start`
5. Clique sur "Generate Domain" → tu obtiens une URL type `undercover-xxx.railway.app`
6. Partage cette URL avec tes amis 🎉

## Lancer en local

```bash
npm install
npm start
# → http://localhost:3000
```

## Comment jouer

1. L'hôte crée une salle → reçoit un code à 4 lettres
2. Chaque joueur entre le code + son prénom sur son tel
3. Une fois 4 joueurs connectés, l'hôte lance la partie
4. Chaque téléphone reçoit sa carte secrète (3 civils ont le même mot, 1 undercover a un mot différent)
5. Discussion → Vote → Résultat
6. Rejouer sans ressaisir les noms !
