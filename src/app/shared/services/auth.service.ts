import { Injectable } from '@angular/core';
import {
  Auth,
  UserCredential,
  User as FirebaseUser,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from '@angular/fire/auth';
import { User } from '../models';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TokenService } from './token.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user: User | null = null;
  private userSubject: BehaviorSubject<User | null> =
    new BehaviorSubject<User | null>(null);
  private recaptchaVerifier!: RecaptchaVerifier;

  constructor(
    private auth: Auth,
    private http: HttpClient,
    private router: Router,
    private tokenService: TokenService
  ) {
    this.initializeUser();
  }

  get isLoggedIn(): boolean {
    return !!this.user;
  }

  get currentUser(): User | null {
    return this.user;
  }

  get userChanges(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  async login(email: string, password: string): Promise<any> {
    return this.authenticate(
      `${environment.apiUrl}/user/login`,
      email,
      password
    );
  }

  async signup(email: string, password: string): Promise<any> {
    return this.authenticate(
      `${environment.apiUrl}/user/signup`,
      email,
      password
    );
  }

  private async authenticate(
    url: string,
    email: string,
    password: string
  ): Promise<any> {
    const body = { email, password };
    try {
      const res = await this.http
        .post(url, body, { observe: 'response' })
        .toPromise();
      this.setSession(res);
      return res;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  logout(): void {
    this.tokenService.removeTokens();
    this.router.navigate(['/auth/login']);
  }

  getNewAccessToken(): Observable<any> {
    return this.http
      .get(`${environment.apiUrl}/user/access-token`, {
        headers: new HttpHeaders({
          'refresh-token': this.tokenService.getRefreshToken(),
          _id: this.tokenService.getUserId(),
        }),
        observe: 'response',
      })
      .pipe(
        tap((res: any) => {
          this.tokenService.setAccessToken(res.headers.get('access-token'));
        })
      );
  }

  private setSession(res: any): void {
    this.tokenService.setSession(
      res.body._id,
      res.headers.get('access-token'),
      res.headers.get('refresh-token')
    );
  }

  private initializeUser(): void {
    const idToken = localStorage.getItem('id_token');
    this.user = idToken ? this.decodeToken(idToken) : null;
    this.userSubject.next(this.user);
  }

  initializeRecaptcha(container: HTMLElement): void {
    this.recaptchaVerifier = new RecaptchaVerifier(this.auth, container, {});
    this.recaptchaVerifier.render();
  }

  async signInWithPhoneNumber(phoneNumber: string): Promise<void> {
    try {
      const confirmationResult = await signInWithPhoneNumber(
        this.auth,
        phoneNumber,
        this.recaptchaVerifier
      );
      localStorage.setItem(
        'confirmationResult',
        JSON.stringify(confirmationResult)
      );
    } catch (error) {
      console.error('Error during sign in with phone number:', error);
    }
  }

  async verifyPhoneNumber(code: string): Promise<void> {
    try {
      const confirmationResult = JSON.parse(
        localStorage.getItem('confirmationResult') || '{}'
      );
      const result = await confirmationResult.confirm(code);
      this.user = result.user ? this.mapFirebaseUser(result.user) : null;
      if (this.user) {
        const idToken = await this.auth.currentUser?.getIdToken();
        if (idToken) {
          localStorage.setItem('id_token', idToken);
        }
        this.userSubject.next(this.user);
      }
    } catch (error) {
      console.error('Error verifying phone number:', error);
    }
  }

  private decodeToken(idToken: string): User | null {
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      if (payload) {
        return {
          uid: payload.sub,
          email: payload.email || null,
          emailVerified: payload.email_verified || false,
          displayName: payload.name || null,
          photoURL: payload.picture || null,
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Failed to parse token:', error);
      return null;
    }
  }

  signInWithGoogle(): Observable<any> {
    return this.http.get('http://localhost:3000/v1/user/auth/google');
  }

  async fireLogout(): Promise<void> {
    try {
      await this.auth.signOut();
      localStorage.removeItem('id_token');
      this.user = null;
      this.userSubject.next(null);
    } catch (error) {
      console.error('Log out failed', error);
    }
  }

  private mapFirebaseUser(firebaseUser: FirebaseUser): User {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || null,
      emailVerified: firebaseUser.emailVerified || false,
      displayName: firebaseUser.displayName || null,
      photoURL: firebaseUser.photoURL || null,
    };
  }
}
