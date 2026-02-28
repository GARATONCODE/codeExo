
# Projet: Plateforme d'Exercices de Code Multi-Langages

## Vue d'ensemble
Plateforme web + extension VS Code pour pratiquer des exercices quotidiens en C, Python et TypeScript avec système de login et vérification automatique.

## Architecture Générale

### Frontend (Vercel)
- Site web de connexion/accueil
- Dashboard utilisateur
- Visualisation des exercices

### Backend (Neon DB)
- Authentification utilisateur
- Stockage des progrès
- Base de données exercices

### Extension VS Code
- Éditeur intégré aux exercices
- Compilation/exécution du code
- Vérification résultats

---

## Specs Détaillées

### 1. System de Login
- Authentification via Neon DB (PostgreSQL)
- JWT tokens
- Session persistante

### 2. Exercices (356+)
- **Structure** : Identique en C, Python, TypeScript
- **Par exercice** :
    - README.md (description + astuces légères)
    - Template code
    - Tests unitaires cachés
    - Difficulté progressive

### 3. Vérification
- Compilation/exécution en sandbox
- Comparaison résultats vs. attendus
- Feedback succès/échec immédiat
- Historique progrès

### 4. Extension VS Code
- Fetch exercice du jour
- Sidebar navigation
- Compile & run bouton
- Sync automatique Neon

---

## Stack Proposé
- **Backend** : Node.js + Express
- **DB** : Neon (PostgreSQL)
- **Frontend** : React/Next.js
- **Extension** : VS Code API
- **Sandboxing** : Docker ou solution légère
