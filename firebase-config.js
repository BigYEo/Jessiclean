// ─────────────────────────────────────────────────────────────
//  Configuration Jessiclean
//  1. Collez ici la configuration de VOTRE projet Firebase
//     (Console Firebase → ⚙ Paramètres du projet → Vos applications → Config)
//  2. Mettez votre courriel d'administratrice dans ADMIN_EMAILS
//     (le même courriel doit aussi être inscrit dans firestore.rules)
// ─────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "AIzaSyD6Od8-ilwnJMdS893ePTMAc_BqisLalQg",
  authDomain: "jessiclean-fdcd1.firebaseapp.com",
  projectId: "jessiclean-fdcd1",
  storageBucket: "jessiclean-fdcd1.firebasestorage.app",
  messagingSenderId: "100636547848",
  appId: "1:100636547848:web:87c110b8de6da06a59aabd"
};

// Courriels qui ont accès à l'onglet Admin (en minuscules)
export const ADMIN_EMAILS = [
  "jaykaa92@icloud.com"
];

// Notifications par courriel (Web3Forms, gratuit) : collez votre clé d'accès ici.
// Obtenez-la sur https://web3forms.com (elle arrive par courriel). Laissez "" pour désactiver.
export const NOTIFY_KEY = "68e12fce-f7fa-4448-a2f4-9075074b43ed";

// Quoi vous envoyer par courriel
export const NOTIFY_ON = { soumission: true, message: true, avis: true };
