// ─────────────────────────────────────────────────────────────
//  Configuration Jessiclean
//  1. Collez ici la configuration de VOTRE projet Firebase
//     (Console Firebase → ⚙ Paramètres du projet → Vos applications → Config)
//  2. Mettez votre courriel d'administratrice dans ADMIN_EMAILS
//     (le même courriel doit aussi être inscrit dans firestore.rules)
// ─────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJET.firebaseapp.com",
  projectId: "VOTRE_PROJET",
  storageBucket: "VOTRE_PROJET.appspot.com",
  messagingSenderId: "000000000000",
  appId: "VOTRE_APP_ID"
};

// Courriels qui ont accès à l'onglet Admin (en minuscules)
export const ADMIN_EMAILS = [
  "admin@exemple.com"
];
