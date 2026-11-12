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

**Fiche client** : 3 sections (Information client, Description de l'espace, Disponibilités). Les infos pratiques (adresse, contact en cas de problème, type d'habitat, pièces, sous-sol, animaux/enfants, méthode d'entrée, aspirateur, produits, poubelles) s'affichent aux employées sous « Infos du client » dans leur horaire. Le téléphone, le courriel, les disponibilités et les notes internes restent visibles par l'admin seulement.

**Clients** : chaque fiche reçoit un **code d'accès** à 8 caractères. Donnez ce code au client, ou mieux, cliquez « Copier le lien client » et envoyez-lui le lien par texto ou courriel. Dans « Espace client », il voit ses prochaines dates et heures, et le prénom de l'employée, mais jamais les notes ni les adresses.

**Quarts de travail** : le nom de client du quart doit être identique à celui de la fiche (la liste vous le propose) pour que le client le voie. L'horaire client se met à jour quand une administratrice a le site ouvert.

**Demandes de soumission** : le formulaire de la page d'accueil envoie les demandes dans **Admin → Demandes de soumission**. L'onglet affiche « Admin (2) » quand des demandes attendent. Cliquez « Traitée » une fois le client rappelé.

**Pièces jointes** : dans les fiches clients et les quarts, le champ « Pièces jointes » accepte des photos (prises avec le téléphone ou choisies), des PDF et des documents.
- Les photos sont réduites automatiquement ; les autres fichiers doivent faire **600 Ko maximum**.
- Pièces jointes d'un **quart** : visibles par les employées. Pièces jointes d'un **client** : visibles par l'admin seulement.
- Cliquez sur une pièce jointe pour l'ouvrir (photo) ou la télécharger (autre fichier).

**Espace client** : le code est mémorisé sur l'appareil du client ; il peut ajouter ses visites à son calendrier et vous écrire (les messages arrivent dans Admin → Demandes et messages).

## Espace client : confirmations, fiche, factures

- **Confirmations** : le client clique « Je confirme » sur une visite ; l'Admin affiche « ✓ Confirmée par le client » sur le quart.
- **Déplacements et mises à jour de fiche** : ils arrivent dans **Admin → Demandes des clients**. Pour une fiche, « Appliquer à la fiche » copie les changements dans la fiche client. La méthode d'entrée actuelle n'est jamais affichée au client (il peut seulement en donner une nouvelle).
- **Factures** : **Admin → Factures**. Choisissez le client, la description et le montant ; cochez TPS/TVQ si vous êtes inscrite. Le client voit le montant dû, imprime ses factures et paie par virement Interac (courriel dans `firebase-config.js` → `PAYMENT`) ou par un lien de paiement en ligne optionnel. Cliquez « Marquer payée » à la réception du paiement.
- Numéros de TPS/TVQ à afficher sur les factures : `firebase-config.js` → `TAX_NUMBERS`.

## Courriels aux clients (confirmations et rappels)

Un programme automatique (`scripts/emailer.mjs`, lancé toutes les 15 minutes par GitHub Actions : `.github/workflows/courriels.yml`) :
- envoie le courriel de **confirmation** quand vous cliquez « Confirmer la soumission » dans l'Admin ;
- envoie un **rappel 24 h avant** chaque visite aux clients qui ont un courriel dans leur fiche (case « Envoyer un rappel… » cochée).

Configuration (une seule fois) :
1. **Brevo** (gratuit, 300 courriels/jour) : créez un compte avec admin@jessiclean.ca, validez l'expéditeur admin@jessiclean.ca, authentifiez le domaine jessiclean.ca (enregistrements DNS chez GoDaddy), puis créez une **clé API**.
2. **Firebase** : ⚙ Paramètres du projet → Comptes de service → **Générer une nouvelle clé privée** (fichier JSON).
3. **GitHub** : dépôt → Settings → Secrets and variables → Actions → **New repository secret** :
   - `BREVO_API_KEY` = la clé API Brevo
   - `FIREBASE_SERVICE_ACCOUNT` = tout le contenu du fichier JSON
4. GitHub → onglet **Actions** → « Courriels clients » → **Run workflow** pour tester.

**Envoi immédiat (optionnel)** : dans Admin → Courriels aux clients, collez une clé GitHub *fine-grained* (dépôt Jessiclean seulement, permission « Actions : Read and write »). Le bouton « Confirmer la soumission » lance alors l'envoi tout de suite (30 à 60 secondes). Le programme tourne aussi à chaque mise à jour du site.

L'Admin affiche l'état du programme (« Dernière vérification il y a … »). GitHub peut suspendre les tâches planifiées d'un dépôt sans activité pendant 60 jours : si l'Admin indique que le programme semble arrêté, réactivez-le dans l'onglet Actions.

## Notifications par courriel

Chaque nouvelle demande de soumission, message client ou avis vous est envoyé par courriel via [Web3Forms](https://web3forms.com) (gratuit).
1. Sur web3forms.com, entrez votre courriel et cliquez « Create Access Key » ; la clé arrive par courriel.
2. Collez-la dans `firebase-config.js` : `export const NOTIFY_KEY = "votre-clé";`
3. Pour couper un type de courriel : `NOTIFY_ON = { soumission: true, message: true, avis: false }`.

## Nom de domaine (facultatif)

Pour `www.jessiclean.ca` : GitHub → Settings → Pages → **Custom domain**, puis suivez les instructions DNS de GitHub, et ajoutez ce domaine dans les **Domaines autorisés** de Firebase.

## Sécurité – ce qu'il faut savoir

- La clé `apiKey` de Firebase est **faite pour être publique** ; la protection vient des règles Firestore.
- Les fiches clients (notes, clés, codes) sont lisibles **seulement par l'admin**.
- Les notes des quarts sont visibles par **toutes les employées connectées** : n'y mettez que ce qu'elles doivent savoir.
- N'importe qui peut publier un avis ; vous pouvez supprimer les indésirables depuis l'accueil quand vous êtes connectée.

## Crédits photos

Les photos d'arrière-plan viennent d'[Unsplash](https://unsplash.com) (licence gratuite Unsplash) : Jason Briscoe, Minh Pham, Daiga Ellaby et Josue Michel. Pour les remplacer par vos propres photos, déposez-les dans `img/` et changez les lignes `.ph-…{--img:url(...)}` dans `index.html`.
