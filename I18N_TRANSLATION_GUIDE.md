# دليل الترجمات - Translation Guide
# Permissions & Plans i18n Integration

**تاريخ:** 25 يوليو 2026  
**الحالة:** ✅ مكتمل

---

## 📋 نظرة عامة

تم دمج نظام الصلاحيات والخطط مع ملفات الترجمة الموجودة (`en.json` و `ar.json`).

### الملفات المحدثة:
- ✅ [`src/assets/i18n/en.json`](src/assets/i18n/en.json)
- ✅ [`src/assets/i18n/ar.json`](src/assets/i18n/ar.json)
- ✅ [`src/app/core/constants/permissions.constants.ts`](src/app/core/constants/permissions.constants.ts)
- ✅ [`src/app/core/constants/error-messages.constants.ts`](src/app/core/constants/error-messages.constants.ts)

---

## 🗂️ هيكل الترجمات

### 1. صلاحيات الخطط (PLAN_FEATURES)

```json
{
  "PLAN_FEATURES": {
    "CATEGORY_CREATE": "Create categories",
    "CATEGORY_READ": "View categories",
    "EXPENSE_EXPORT": "Export to CSV/PDF",
    "ADMIN_DASHBOARD": "Admin Dashboard",
    ...
  }
}
```

**الاستخدام:**

```typescript
// في الـ Component
import { getPermissionTranslationKey } from './core/constants/permissions.constants';

const key = getPermissionTranslationKey(Permission.EXPENSE_EXPORT);
// Returns: 'PLAN_FEATURES.EXPENSE_EXPORT'

this.translate.get(key).subscribe(label => {
  console.log(label); // "Export to CSV/PDF" or "التصدير إلى CSV/PDF"
});
```

```html
<!-- في الـ Template -->
<ion-label>
  {{ getPermissionTranslationKey(permission) | translate }}
</ion-label>
```

---

### 2. مجموعات الصلاحيات (PERMISSION_GROUPS)

```json
{
  "PERMISSION_GROUPS": {
    "CATEGORIES": "Categories",
    "EXPENSES": "Expenses",
    "REPORTS": "Reports",
    "BACKUP": "Backup & Sync",
    "PROFILE": "Profile",
    "SUPPORT": "Support",
    "SECURITY": "Security",
    "ADMIN": "Administration"
  }
}
```

**الاستخدام:**

```typescript
// في الـ Component
import { PERMISSION_GROUPS } from './core/constants/permissions.constants';

const group = PERMISSION_GROUPS.categories;
this.translate.get(group.translationKey).subscribe(label => {
  console.log(label); // "Categories" or "الفئات"
});
```

```html
<!-- في الـ Template -->
<h3>{{ 'PERMISSION_GROUPS.CATEGORIES' | translate }}</h3>
```

---

### 3. رسائل الأخطاء (PERMISSION_ERRORS)

```json
{
  "PERMISSION_ERRORS": {
    "ACCESS_DENIED": "Access Denied",
    "PERMISSION_REQUIRED": "Permission Required",
    "PLAN_REQUIRED": "Upgrade Required",
    "PLAN_EXPIRED": "Subscription Expired",
    "UPGRADE_TO_UNLOCK": "Upgrade to unlock this feature",
    "CONTACT_SUPPORT": "Contact support for access",
    "FEATURE_LOCKED": "This feature is locked",
    "INSUFFICIENT_PERMISSIONS": "You don't have permission to perform this action"
  }
}
```

**الاستخدام:**

```typescript
// في الـ Component
import { getPermissionErrorKeys } from './core/constants/error-messages.constants';

const keys = getPermissionErrorKeys(Permission.EXPENSE_EXPORT);

this.translate.get(keys.titleKey).subscribe(title => {
  console.log(title); // "Access Denied" or "الوصول مرفوض"
});

this.translate.get(keys.messageKey).subscribe(message => {
  console.log(message); // Error message
});
```

---

### 4. الأدوار (ROLES)

```json
{
  "ROLES": {
    "USER": "User",
    "MODERATOR": "Moderator",
    "ADMIN": "Admin",
    "SUPERADMIN": "Super Admin"
  }
}
```

**الاستخدام:**

```typescript
// في الـ Component
const roleKey = `ROLES.${userRole.toUpperCase()}`;
this.translate.get(roleKey).subscribe(label => {
  console.log(label); // "Admin" or "مسؤول"
});
```

```html
<!-- في الـ Template -->
<ion-badge>{{ 'ROLES.' + role.toUpperCase() | translate }}</ion-badge>
```

---

## 💡 أمثلة عملية

### مثال 1: عرض قائمة الصلاحيات

```typescript
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PERMISSION_GROUPS, getPermissionTranslationKey } from './core/constants';
import { Permission } from './shared/models/plan.model';

@Component({
  selector: 'app-permissions-list',
  template: `
    <ion-list>
      <ion-item-group *ngFor="let group of permissionGroups | keyvalue">
        <ion-item-divider>
          <ion-icon [name]="group.value.icon" slot="start"></ion-icon>
          <ion-label>{{ group.value.translationKey | translate }}</ion-label>
        </ion-item-divider>
        
        <ion-item *ngFor="let permission of group.value.permissions">
          <ion-label>
            {{ getPermissionKey(permission) | translate }}
          </ion-label>
          <ion-checkbox [checked]="hasPermission(permission)"></ion-checkbox>
        </ion-item>
      </ion-item-group>
    </ion-list>
  `
})
export class PermissionsListComponent {
  permissionGroups = PERMISSION_GROUPS;
  
  getPermissionKey(permission: Permission): string {
    return getPermissionTranslationKey(permission);
  }
  
  hasPermission(permission: Permission): boolean {
    // Check permission logic
    return true;
  }
}
```

---

### مثال 2: عرض رسالة خطأ

```typescript
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastController } from '@ionic/angular';
import { getPermissionErrorKeys } from './core/constants';
import { Permission } from './shared/models/plan.model';

@Component({
  selector: 'app-export',
  template: `...`
})
export class ExportComponent {
  constructor(
    private translate: TranslateService,
    private toastCtrl: ToastController
  ) {}
  
  async showPermissionError(permission: Permission) {
    const keys = getPermissionErrorKeys(permission);
    
    const [title, message] = await Promise.all([
      this.translate.get(keys.titleKey).toPromise(),
      this.translate.get(keys.messageKey).toPromise()
    ]);
    
    const toast = await this.toastCtrl.create({
      header: title,
      message: message,
      duration: 3000,
      color: 'warning'
    });
    
    await toast.present();
  }
}
```

---

### مثال 3: عرض معلومات الخطة

```typescript
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PlanSlug } from './shared/models/plan.model';

@Component({
  selector: 'app-plan-badge',
  template: `
    <ion-chip [color]="getPlanColor(plan)">
      <ion-icon [name]="getPlanIcon(plan)"></ion-icon>
      <ion-label>{{ getPlanKey(plan) | translate }}</ion-label>
    </ion-chip>
  `
})
export class PlanBadgeComponent {
  @Input() plan!: PlanSlug;
  
  getPlanKey(plan: PlanSlug): string {
    return `SUBSCRIPTION.${plan.toUpperCase()}`;
  }
  
  getPlanColor(plan: PlanSlug): string {
    // Return color based on plan
    return 'primary';
  }
  
  getPlanIcon(plan: PlanSlug): string {
    // Return icon based on plan
    return 'star';
  }
}
```

---

## 🔄 تغيير اللغة

```typescript
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-selector',
  template: `
    <ion-select [(ngModel)]="currentLang" (ionChange)="changeLang($event)">
      <ion-select-option value="en">English</ion-select-option>
      <ion-select-option value="ar">العربية</ion-select-option>
    </ion-select>
  `
})
export class LanguageSelectorComponent {
  currentLang: string;
  
  constructor(private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || 'en';
  }
  
  changeLang(event: any) {
    const lang = event.detail.value;
    this.translate.use(lang);
    localStorage.setItem('language', lang);
  }
}
```

---

## 📝 إضافة ترجمات جديدة

### 1. أضف في en.json:

```json
{
  "PLAN_FEATURES": {
    "NEW_FEATURE": "New Feature Name"
  }
}
```

### 2. أضف في ar.json:

```json
{
  "PLAN_FEATURES": {
    "NEW_FEATURE": "اسم الميزة الجديدة"
  }
}
```

### 3. استخدم في الكود:

```typescript
const key = getPermissionTranslationKey(Permission.NEW_FEATURE);
this.translate.get(key).subscribe(label => {
  console.log(label);
});
```

---

## ✅ Best Practices

### 1. استخدم Helper Functions

```typescript
// ✅ Good
const key = getPermissionTranslationKey(permission);
this.translate.get(key).subscribe(...);

// ❌ Bad
const key = `PLAN_FEATURES.${permission.replace(':', '_').toUpperCase()}`;
```

### 2. استخدم Async Pipe في Templates

```html
<!-- ✅ Good -->
<ion-label>{{ 'PLAN_FEATURES.EXPENSE_EXPORT' | translate }}</ion-label>

<!-- ❌ Bad -->
<ion-label>{{ exportLabel }}</ion-label>
```

### 3. Handle Missing Translations

```typescript
// في app.config.ts أو main.ts
TranslateModule.forRoot({
  loader: {
    provide: TranslateLoader,
    useFactory: HttpLoaderFactory,
    deps: [HttpClient]
  },
  defaultLanguage: 'en',
  missingTranslationHandler: {
    provide: MissingTranslationHandler,
    useClass: CustomMissingTranslationHandler
  }
})
```

---

## 🧪 اختبار الترجمات

### 1. اختبار يدوي:

```typescript
// في console
import { TranslateService } from '@ngx-translate/core';

// Get service instance
const translate = inject(TranslateService);

// Test translation
translate.get('PLAN_FEATURES.EXPENSE_EXPORT').subscribe(console.log);

// Change language
translate.use('ar');
translate.get('PLAN_FEATURES.EXPENSE_EXPORT').subscribe(console.log);
```

### 2. Unit Test:

```typescript
import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

describe('Translations', () => {
  let translate: TranslateService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()]
    });
    translate = TestBed.inject(TranslateService);
  });
  
  it('should translate permission label', (done) => {
    translate.use('en');
    translate.get('PLAN_FEATURES.EXPENSE_EXPORT').subscribe(label => {
      expect(label).toBe('Export to CSV/PDF');
      done();
    });
  });
});
```

---

## 📊 ملخص المفاتيح

| النوع | المفتاح | مثال |
|------|---------|------|
| **صلاحية** | `PLAN_FEATURES.{PERMISSION}` | `PLAN_FEATURES.EXPENSE_EXPORT` |
| **مجموعة** | `PERMISSION_GROUPS.{GROUP}` | `PERMISSION_GROUPS.CATEGORIES` |
| **خطأ** | `PERMISSION_ERRORS.{ERROR}` | `PERMISSION_ERRORS.ACCESS_DENIED` |
| **دور** | `ROLES.{ROLE}` | `ROLES.ADMIN` |
| **خطة** | `SUBSCRIPTION.{PLAN}` | `SUBSCRIPTION.PRO` |

---

## 🔗 روابط مفيدة

- [ngx-translate Documentation](https://github.com/ngx-translate/core)
- [Angular i18n Guide](https://angular.io/guide/i18n)
- [Ionic i18n](https://ionicframework.com/docs/angular/your-first-app/6-deploying-mobile)

---

**تم التحديث:** 25 يوليو 2026  
**الحالة:** ✅ جاهز للاستخدام
