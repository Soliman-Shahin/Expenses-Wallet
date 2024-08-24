export const APP_ROUTES = {
  BASE: '/',
  HOME: 'home',
  AUTH: {
    INDEX: 'auth',
    LOGIN: 'login',
    SIGNUP: 'signup',
  },
  CATEGORIES: {
    INDEX: 'categories',
    LIST: 'list',
    CREATE: 'create',
  },
  __get: (key: string) => `${key}`.replace(':', ''),
} as const;

export const MenuItemIds = {
  home: 'home',
  categories: 'categories',
} as const;