import { Tab } from 'src/app/shared/models';
import { APP_ROUTES } from './routes';

export const TABS_MENU_ITEMS: Tab[] = [
  {
    id: APP_ROUTES.HOME,
    order: 0,
    label: 'SIDEBAR.HOME',
    show_label: true,
    routerLink: APP_ROUTES.BASE + APP_ROUTES.HOME,
    routerLinkActiveOptions: { exact: true },
    icon: 'home',
    visible: true,
    disabled: false,
    roles: [],
    excludeRoles: [],
  },
  {
    id: APP_ROUTES.CATEGORIES.INDEX,
    order: 1,
    label: 'SIDEBAR.CATEGORIES',
    show_label: true,
    routerLink:
      APP_ROUTES.BASE +
      APP_ROUTES.CATEGORIES.INDEX +
      APP_ROUTES.BASE +
      APP_ROUTES.CATEGORIES.LIST,
    routerLinkActiveOptions: { exact: true },
    icon: 'list',
    visible: true,
    disabled: false,
    roles: [],
    excludeRoles: [],
  },
  {
    id: '',
    order: 2,
    label: 'SIDEBAR.EXPENSES',
    show_label: true,
    routerLink: '/expenses',
    routerLinkActiveOptions: { exact: true },
    icon: 'receipt',
    visible: true,
    disabled: true,
    roles: [],
  },
  {
    id: '',
    order: 3,
    label: 'SIDEBAR.SETTINGS',
    show_label: true,
    routerLink: '/settings',
    routerLinkActiveOptions: { exact: true },
    icon: 'settings',
    visible: true,
    disabled: true,
    roles: [],
  },
];
