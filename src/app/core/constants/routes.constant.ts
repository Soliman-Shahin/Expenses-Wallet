export const APP_ROUTES = {
  INDEX: '',
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
    EDIT: 'edit/:id',
  },
  EXPENSES: {
    INDEX: 'expenses',
    LIST: 'list',
    CREATE: 'create',
  },
  SETTINGS: {
    INDEX: 'settings',
    LIST: 'list',
    CREATE: 'create',
  },
  __get: (key: string) => `${key}`.replace(':', ''),
} as const;

export const MenuItemIds = {
  home: 'home',
  categories: 'categories',
  expenses: 'expenses',
  settings: 'settings',
} as const;