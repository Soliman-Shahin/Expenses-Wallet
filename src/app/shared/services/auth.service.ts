import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
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
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  private recaptchaVerifier!: RecaptchaVerifier;

  constructor(
    private auth: Auth,
    private http: HttpClient,
    private router: Router,
    private tokenService: TokenService,
    private translate: TranslationService
  ) {
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

  async signInWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user ? this.mapFirebaseUser(result.user) : null;
      if (user) {
        console.log(user);
        this.tokenService.setUser(user);
        this.tokenService.setUserLang(this.translate.getCurrentLanguage());
        this.tokenService.setAccessToken(
          (await this.auth.currentUser?.getIdToken()) || ''
        );
        this.userSubject.next(user);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  }

  async logout(): Promise<void> {
    await this.fireLogout();
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
      const user = result.user ? this.mapFirebaseUser(result.user) : null;
      if (user) {
        this.tokenService.setAccessToken(
          (await this.auth.currentUser?.getIdToken()) || ''
        );
        this.userSubject.next(user);
      }
    } catch (error) {
      console.error('Error verifying phone number:', error);
    }
  }

  // async signInWithGoogle(): Promise<any> {
  //   return this.http.get(`${environment.apiUrl}/user/auth/google`);
  // }

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

  private initializeUser(): void {
    const idToken = this.tokenService.getAccessToken();
    const user = idToken ? this.decodeToken(idToken) : null;
    this.userSubject.next(user);
  }

  private async fireLogout(): Promise<void> {
    try {
      await this.auth.signOut();
      this.tokenService.removeSession();
      this.userSubject.next(null);
    } catch (error) {
      console.error('Log out failed', error);
    }
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

  private mapFirebaseUser(firebaseUser: any): User {
    return {
      userId: firebaseUser.uid,
      email: firebaseUser.email,
      emailVerified: firebaseUser.emailVerified,
      username: firebaseUser.displayName,
      image: firebaseUser.photoURL,
    };
  }
}
