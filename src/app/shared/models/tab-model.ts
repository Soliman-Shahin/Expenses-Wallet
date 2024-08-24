import { EnvironmentInjector } from '@angular/core';
export interface Tab {
  id: string;
  roleType?: 'normal' | 'environment';
  environmentKey?: string;
  title?: string;
  routerLink?: any;
  routerLinkActiveOptions?: any;
  label?: string;
  show_label?: boolean;
  icon?: string;
  items?: Tab[];
  disabled?: boolean;
  visible?: boolean;
  url?: string;
  styleClass?: string;
  roles: [];
  excludeRoles?: [];
  order?: number;
  image?: string;
  command?: (event?: any, injector?: EnvironmentInjector) => void;
  queryParams?: {
    [k: string]: any;
  };
}
