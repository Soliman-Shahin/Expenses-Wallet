import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/modules/auth/models';
import { BaseComponent } from '../../base/base.component';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent extends BaseComponent implements OnInit {
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
