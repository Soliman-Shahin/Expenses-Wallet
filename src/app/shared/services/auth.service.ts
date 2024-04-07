import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
  User as FirebaseUser,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from '@angular/fire/auth';
import { User } from '../models';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user: User | null = null;
  private userSubject: BehaviorSubject<User | null>;

  private recaptchaVerifier!: RecaptchaVerifier;

  constructor(private auth: Auth) {
    this.userSubject = new BehaviorSubject<User | null>(null);
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

  private initializeUser(): void {
    const idToken = localStorage.getItem('id_token');
    this.user = idToken ? this.decodeToken(idToken) : null;
    this.userSubject.next(this.user);
  }

  // Call this method to initialize the recaptcha before sign-in
  initializeRecaptcha(container: HTMLElement): void {
    this.recaptchaVerifier = new RecaptchaVerifier(this.auth, container, {});
    this.recaptchaVerifier.render();
  }

  // Method to sign in with phone number
  async signInWithPhoneNumber(phoneNumber: string): Promise<void> {
    try {
      const confirmationResult = await signInWithPhoneNumber(
        this.auth,
        phoneNumber,
        this.recaptchaVerifier
      );
      // Store the confirmation result so that you can use it to verify the code
      localStorage.setItem(
        'confirmationResult',
        JSON.stringify(confirmationResult)
      );
    } catch (error) {
      console.error('Error during sign in with phone number:', error);
    }
  }

  // Method to verify the code sent to the phone
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
        const user: User = {
          uid: payload.sub,
          email: payload.email || null,
          emailVerified: payload.email_verified || false,
          displayName: payload.name || null,
          photoURL: payload.picture || null,
        };
        return user;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Failed to parse token:', error);
      return null;
    }
  }

  async signInWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      const result: UserCredential = await signInWithPopup(this.auth, provider);
      this.user = result.user ? this.mapFirebaseUser(result.user) : null;
      if (this.user) {
        const idToken = await this.auth.currentUser?.getIdToken();
        if (idToken) {
          localStorage.setItem('id_token', idToken);
        }
        this.userSubject.next(this.user);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  }

  async logout(): Promise<void> {
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
