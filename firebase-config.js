// ═══════════════════════════════════════════════════════════════
// PawnPilots — Firebase Configuration & Auth Helpers
// ═══════════════════════════════════════════════════════════════
// Include BEFORE this file in every page:
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
//   <script src="/firebase-config.js"></script>
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Firebase Project Config ──
  // TODO: Fill these in after creating your Firebase project
  var firebaseConfig = {
    apiKey: "AIzaSyByCqvKvly9KDcAiMwXMn6OFM4-UIpQk_w",
    authDomain: "pawn-pilots.firebaseapp.com",
    projectId: "pawn-pilots",
    storageBucket: "pawn-pilots.firebasestorage.app",
    messagingSenderId: "1088804670138",
    appId: "1:1088804670138:web:6e70db2065ba99ce5ad7ab"
  };

  // Initialize Firebase (only once)
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  var auth = firebase.auth();
  var db = firebase.firestore();

  // Email domain for fake-email username pattern
  var EMAIL_DOMAIN = '@pawnpilots.com';

  // ── Helper: Convert username to email ──
  function usernameToEmail(username) {
    username = (username || '').trim().toLowerCase();
    // If they entered a full email, use it as-is
    if (username.indexOf('@') > -1) return username;
    return username + EMAIL_DOMAIN;
  }

  // ── Helper: Get current user (returns Promise) ──
  function getCurrentUser() {
    return new Promise(function (resolve) {
      var unsubscribe = auth.onAuthStateChanged(function (user) {
        unsubscribe();
        resolve(user || null);
      });
    });
  }

  // ── Helper: Get user document from /users/{uid} ──
  function getUserDoc(uid) {
    return db.collection('users').doc(uid).get().then(function (doc) {
      if (!doc.exists) return null;
      return doc.data();
    });
  }

  // ── Helper: Check if user is coach ──
  function isCoach(uid) {
    return getUserDoc(uid).then(function (data) {
      return data && data.role === 'coach';
    });
  }

  // ── Helper: Get linked student tokens for a user ──
  function getLinkedTokens(uid) {
    return getUserDoc(uid).then(function (data) {
      if (!data) return [];
      // Coach has access to everything
      if (data.role === 'coach') return '__all__';
      return data.studentTokens || [];
    });
  }

  // ── Helper: Check if user can access a specific student token ──
  function canAccessToken(uid, token) {
    return getLinkedTokens(uid).then(function (tokens) {
      if (tokens === '__all__') return true; // coach
      return tokens.indexOf(token) > -1;
    });
  }

  // ── Auth Guard ──
  // Usage: ppAuth.requireAuth({ roles: ['coach'], redirect: '/login/' })
  // roles: array of allowed roles ('coach', 'parent'), or omit for any authenticated user
  // token: if provided, verifies user can access this student token
  // redirect: URL to redirect to if not authorized (default: '/login/')
  // Returns Promise<{user, userDoc}> on success, redirects on failure
  function requireAuth(options) {
    options = options || {};
    var redirect = options.redirect || '/login/';
    var roles = options.roles || null;
    var token = options.token || null;

    return getCurrentUser().then(function (user) {
      if (!user) {
        window.location.href = redirect;
        return Promise.reject('not_authenticated');
      }

      return getUserDoc(user.uid).then(function (userDoc) {
        if (!userDoc) {
          // User exists in Auth but no /users/ doc — treat as unauthorized
          window.location.href = redirect;
          return Promise.reject('no_user_doc');
        }

        // Check role
        if (roles && roles.indexOf(userDoc.role) < 0) {
          window.location.href = redirect;
          return Promise.reject('wrong_role');
        }

        // Check token access
        if (token) {
          if (userDoc.role === 'coach') {
            // Coach can access all tokens
            return { user: user, userDoc: userDoc };
          }
          var tokens = userDoc.studentTokens || [];
          if (tokens.indexOf(token) < 0) {
            window.location.href = redirect;
            return Promise.reject('no_token_access');
          }
        }

        return { user: user, userDoc: userDoc };
      });
    });
  }

  // ── Sign In ──
  function signIn(username, password) {
    var email = usernameToEmail(username);
    return auth.signInWithEmailAndPassword(email, password);
  }

  // ── Sign Out ──
  function signOut() {
    return auth.signOut().then(function () {
      window.location.href = '/login/';
    });
  }

  // ── Expose globally ──
  window.ppAuth = {
    auth: auth,
    db: db,
    EMAIL_DOMAIN: EMAIL_DOMAIN,
    usernameToEmail: usernameToEmail,
    getCurrentUser: getCurrentUser,
    getUserDoc: getUserDoc,
    isCoach: isCoach,
    getLinkedTokens: getLinkedTokens,
    canAccessToken: canAccessToken,
    requireAuth: requireAuth,
    signIn: signIn,
    signOut: signOut
  };

  // Also expose db as ppDB for convenience
  window.ppDB = db;

})();
