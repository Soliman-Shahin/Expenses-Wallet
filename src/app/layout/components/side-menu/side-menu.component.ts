import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/modules/auth/models';
import { BaseComponent } from 'src/app/shared/base';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
})
export class SideMenuComponent extends BaseComponent implements OnInit {
  user: User | null = null;

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.initializeUser();
    this.subscribeToUserChanges();
  }

  private initializeUser(): void {
    this.user = this.tokenService.getUser();
  }

  subscribeToUserChanges(): void {
    this.tokenService.userSubject.subscribe((user: User | null) => {
      this.user = user;
    });
  }
}
