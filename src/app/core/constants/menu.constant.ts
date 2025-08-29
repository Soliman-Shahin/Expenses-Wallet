import { MenuItem } from 'src/app/shared/models';
import { APP_ROUTES } from './routes.constant';

export const MENU_ITEMS: MenuItem[] = [
  {
    title: 'SIDEBAR.HOME',
    icon: 'home-outline',
    link: `/${APP_ROUTES.HOME}`,
    requiresAuth: false,
  },
  {
    title: 'SIDEBAR.CATEGORIES',
    icon: 'pricetags-outline',
    link: `/${APP_ROUTES.CATEGORIES.INDEX}/${APP_ROUTES.CATEGORIES.LIST}`,
    requiresAuth: true,
  },
  {
    title: 'SIDEBAR.TRANSACTIONS',
    icon: 'swap-horizontal-outline',
    link: `/${APP_ROUTES.TRANSACTIONS.INDEX}`,
    requiresAuth: true,
  },
];
