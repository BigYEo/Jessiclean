# Jessiclean – site web

Site vitrine + espace employées + espace administratrice.

| Qui | Ce qu'elle voit |
|---|---|
| **Public** | Accueil, services, avis (lire et publier), « Mes visites » avec un code client |
| **Employée** (connectée) | Son horaire : dates, heures, clients, adresses, notes |
| **Administratrice** (connectée) | Tout : employées, fiches clients, quarts de travail, suppression d'avis |

Hébergement : **GitHub Pages** (gratuit). Données et connexions : **Firebase** (gratuit pour un petit volume).

---

## Étape 1 – Créer le projet Firebase (≈ 10 min)

1. Allez sur <https://console.firebase.google.com> → **Ajouter un projet** → nom : `jessiclean` (Google Analytics : pas nécessaire).
2. **Build → Firestore Database → Créer une base de données** → mode **production** → région `northamerica-northeast1 (Montréal)`.
3. **Build → Authentication → Commencer** → activez **Adresse e-mail/Mot de passe**.
4. Toujours dans Authentication → **Paramètres → Actions de l'utilisateur** : **décochez « Activer la création de comptes »** (seule vous créez les comptes).
5. Authentication → **Utilisateurs → Ajouter un utilisateur** : créez **votre** compte admin (votre courriel + un mot de passe solide).
6. ⚙ **Paramètres du projet → Vos applications → icône `</>` (Web)** → nom `site` → copiez le bloc `firebaseConfig`.

## Étape 2 – Remplir la configuration

**`firebase-config.js`** : collez votre `firebaseConfig` et remplacez `admin@exemple.com` par votre courriel (en minuscules).

**`firestore.rules`** : remplacez aussi `admin@exemple.com` par votre courriel, puis copiez tout le fichier dans
Firebase → Firestore → **Règles** → **Publier**.

> Le courriel admin doit être identique aux deux endroits. Le fichier de config rend l'onglet visible, mais ce sont les **règles** qui protègent réellement les données.

## Étape 3 – Mettre en ligne sur GitHub Pages

1. Sur <https://github.com/new> créez un dépôt, par ex. `jessiclean` (Public).
2. **Add file → Upload files** → glissez **tous** les fichiers de ce dossier (`index.html`, `firebase-config.js`, `firestore.rules`, `README.md`, `.nojekyll`) → **Commit changes**.
3. **Settings → Pages** → Source : **Deploy from a branch** → Branche `main`, dossier `/ (root)` → **Save**.
4. Après 1-2 minutes, votre site est à `https://VOTRE-NOM.github.io/jessiclean/`.
5. Dans Firebase → Authentication → **Paramètres → Domaines autorisés** → ajoutez `VOTRE-NOM.github.io`.

Pour modifier le site plus tard : ouvrez le fichier sur GitHub → ✏️ → **Commit**. Le site se met à jour tout seul.

## Utilisation au quotidien

**Ajouter une employée**
1. Onglet **Admin → Employées** : nom + courriel → Ajouter.
2. Firebase → Authentication → **Ajouter un utilisateur** avec le **même courriel** et un mot de passe temporaire.
3. Donnez-lui l'adresse du site ; elle se connecte via **Connexion** (elle peut utiliser « Mot de passe oublié ? » pour choisir le sien).
Retirer l'employée dans Admin lui enlève immédiatement l'accès à l'horaire.

**Clients** : chaque fiche reçoit un **code d'accès** à 8 caractères. Donnez ce code au client : dans « Mes visites », il voit ses prochaines dates et heures, et le prénom de l'employée, mais jamais les notes ni les adresses.

**Quarts de travail** : le nom de client du quart doit être identique à celui de la fiche (la liste vous le propose) pour que le client le voie. L'horaire client se met à jour quand une administratrice a le site ouvert.

**Demandes de soumission** : le formulaire de la page d'accueil envoie les demandes dans **Admin → Demandes de soumission**. L'onglet affiche « Admin (2) » quand des demandes attendent. Cliquez « Traitée » une fois le client rappelé.

**Pièces jointes** : dans les fiches clients et les quarts, le champ « Pièces jointes » accepte des photos (prises avec le téléphone ou choisies), des PDF et des documents.
- Les photos sont réduites automatiquement ; les autres fichiers doivent faire **600 Ko maximum**.
- Pièces jointes d'un **quart** : visibles par les employées. Pièces jointes d'un **client** : visibles par l'admin seulement.
- Cliquez sur une pièce jointe pour l'ouvrir (photo) ou la télécharger (autre fichier).

## Nom de domaine (facultatif)

Pour `www.jessiclean.ca` : GitHub → Settings → Pages → **Custom domain**, puis suivez les instructions DNS de GitHub, et ajoutez ce domaine dans les **Domaines autorisés** de Firebase.

## Sécurité – ce qu'il faut savoir

- La clé `apiKey` de Firebase est **faite pour être publique** ; la protection vient des règles Firestore.
- Les fiches clients (notes, clés, codes) sont lisibles **seulement par l'admin**.
- Les notes des quarts sont visibles par **toutes les employées connectées** : n'y mettez que ce qu'elles doivent savoir.
- N'importe qui peut publier un avis ; vous pouvez supprimer les indésirables depuis l'accueil quand vous êtes connectée.

## Crédits photos

Les photos d'arrière-plan viennent d'[Unsplash](https://unsplash.com) (licence gratuite Unsplash) : Jason Briscoe, Minh Pham, Daiga Ellaby et Josue Michel. Pour les remplacer par vos propres photos, déposez-les dans `img/` et changez les lignes `.ph-…{--img:url(...)}` dans `index.html`.
