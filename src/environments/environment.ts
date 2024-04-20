// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/v1',
  firebaseConfig: {
    apiKey: 'AIzaSyCDYxCgXtwfaQkbD1Rrl3VyzwW3E0FVdlQ',
    authDomain: 'expenses-wallet.firebaseapp.com',
    projectId: 'expenses-wallet',
    storageBucket: 'expenses-wallet.appspot.com',
    messagingSenderId: '358709669585',
    appId: '1:358709669585:web:209c64ef3e7c39f35f9ff0',
    measurementId: 'G-BPGH6MHY3W',
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
