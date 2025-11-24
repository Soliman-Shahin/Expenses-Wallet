// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/v1',
  // apiUrl: 'https://expenses-wallet.up.railway.app/v1',

  // Encryption settings
  enableEncryption: true, // Set to false to disable encryption
  encryptionKey: '12sd67dj89kju98475mmfnfh000shahin000ysds12', // Must match backend ENCRYPTION_KEY

  // Google OAuth
  google: {
    // TODO: replace with your real Web Client ID from Google Cloud Console (OAuth 2.0 Client IDs - type Web)
    webClientId:
      '358709669585-0td9nf2p58ncgtoreopgqkq7vosco473.apps.googleusercontent.com',
  },

  // Feature flags
  features: {
    expenses: {
      active: true,
      roles: [],
    },
    categories: {
      active: true,
      roles: [],
    },
    encryption: {
      active: true, // Enable/disable encryption feature
    },
    offlineMode: {
      active: true, // Enable/disable offline support
    },
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
