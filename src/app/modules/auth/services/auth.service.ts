import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { User } from '../models';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  http = inject(HttpClient);
  router = inject(Router);
  tokenService = inject(TokenService);

  private userSubject = new BehaviorSubject<User | null>(null);

  constructor() {
    this.initializeUser();
  }

  get isLoggedIn(): boolean {
    return !!this.userSubject.getValue();
  }

  get currentUser(): User | null {
    return this.userSubject.getValue();
  }

  get userChanges(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  login(email: string, password: string): Observable<any> {
    return this.authenticate(
      `${environment.apiUrl}/user/login`,
      email,
      password
    );
  }

  signup(email: string, password: string): Observable<any> {
    return this.authenticate(
      `${environment.apiUrl}/user/signup`,
      email,
      password
    );
  }

  logout() {
    this.router.navigate(['/home']);
  }

  getNewAccessToken(): Observable<any> {
    return this.http
      .get(`${environment.apiUrl}/user/access-token`, {
        headers: new HttpHeaders({
          'refresh-token': this.tokenService.getRefreshToken() || '',
          _id: this.tokenService.getUserId() || '',
        }),
        observe: 'response',
      })
      .pipe(
        tap((res: any) => {
          this.tokenService.setAccessToken(
            res.headers.get('access-token') || ''
          );
        })
      );
  }

  authenticate(url: string, email: string, password: string): Observable<any> {
    const body = { email, password };
    return from(
      this.http
        .post(url, body, { observe: 'response' })
        .toPromise()
        .then((res: any) => {
          this.setSession(res);
          return res;
        })
        .catch((error: any) => {
          console.error(error);
          return error;
        })
    );
  }

  private initializeUser(): void {
    const idToken = this.tokenService.getAccessToken();
    const user = idToken ? this.decodeToken(idToken) : null;
    this.userSubject.next(user);
  }

  private setSession(res: any): void {
    this.tokenService.setSession(
      res.body._id || '',
      res.headers.get('access-token') || '',
      res.headers.get('refresh-token') || ''
    );
  }

  private decodeToken(idToken: string): User | null {
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      if (payload) {
        return {
          userId: payload.sub,
          email: payload.email || null,
          emailVerified: payload.email_verified || false,
          username: payload.name || null,
          image: payload.picture || null,
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Failed to parse token:', error);
      return null;
    }
  }
}
