export const environment = {
  production: true,
  apiUrl: 'https://expenses-wallet.up.railway.app/v1',
  
  // Google OAuth
  google: {
    // TODO: replace with your real Web Client ID from Google Cloud Console (OAuth 2.0 Client IDs - type Web)
    webClientId:
      '358709669585-0td9nf2p58ncgtoreopgqkq7vosco473.apps.googleusercontent.com',
  },
  
  // Encryption is handled by backend
  enableEncryption: true,
  
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
      active: true,
    },
    offlineMode: {
      active: true,
    },
  },
};
