import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { User } from '../models';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  userChanged = new Subject<any>();

  constructor(private cookieService: CookieService) {}

  getAccessToken() {
    return this.cookieService.get('access-token');
  }

  getRefreshToken() {
    return this.cookieService.get('refresh-token');
  }

  getUserId() {
    return this.cookieService.get('user-id');
  }

  getUser() {
    return this.cookieService.get('user');
  }

  getUserLang() {
    return this.cookieService.get('user-lang');
  }

  setAccessToken(accessToken: string) {
    this.cookieService.set('access-token', accessToken);
  }

  setRefreshToken(refreshToken: string) {
    this.cookieService.set('refresh-token', refreshToken);
  }

  setUserId(userId: string) {
    this.cookieService.set('user-id', userId);
  }

  setUser(user: User) {
    this.cookieService.set('user', JSON.stringify(user));
    this.userChanged.next(user);
  }

  setUserLang(userLang: string) {
    this.cookieService.set('user-lang', userLang);
  }

  setSession(userId: string, accessToken: string, refreshToken: string) {
    this.cookieService.set('user-id', userId);
    this.cookieService.set('access-token', accessToken);
    this.cookieService.set('refresh-token', refreshToken);
  }

  removeTokens() {
    this.cookieService.delete('access-token');
    this.cookieService.delete('refresh-token');
    this.cookieService.delete('user-id');
    this.cookieService.delete('user');
    this.userChanged.next(null);
  }

  getPayload() {
    const token = this.getAccessToken();
    let payload;
    if (token) {
      payload = token.split('.')[1];
      payload = JSON.parse(atob(payload));
    }
    return payload.data;
  }
}
