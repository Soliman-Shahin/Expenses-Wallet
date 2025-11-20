import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';

export interface UserInfo {
  displayName: string;
  email: string;
  photoURL?: string;
  emailVerified?: boolean;
}

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss'],
})
export class UserInfoComponent {
  // Inputs
  @Input() set user(value: UserInfo | null) {
    this._userSignal.set(value);
  }
  @Input() showEmail = true;
  @Input() showAvatar = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  // Outputs
  @Output() avatarClicked = new EventEmitter<void>();
  @Output() userClicked = new EventEmitter<UserInfo>();

  // Signals
  private _userSignal = signal<UserInfo | null>(null);

  // Computed
  currentUser = computed(() => this._userSignal());
  userInitials = computed(() => {
    const user = this.currentUser();
    if (!user?.displayName) return '?';
    return user.displayName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  hasPhoto = computed(() => !!this.currentUser()?.photoURL);
  isVerified = computed(() => !!this.currentUser()?.emailVerified);

  // Size classes
  avatarSizeClass = computed(() => {
    switch (this.size) {
      case 'sm':
        return 'avatar-sm';
      case 'lg':
        return 'avatar-lg';
      default:
        return '';
    }
  });

  /**
   * Handle avatar click
   */
  onAvatarClick(event: Event): void {
    event.stopPropagation();
    this.avatarClicked.emit();
  }

  /**
   * Handle user info click
   */
  onUserClick(): void {
    const user = this.currentUser();
    if (user) {
      this.userClicked.emit(user);
    }
  }
}
