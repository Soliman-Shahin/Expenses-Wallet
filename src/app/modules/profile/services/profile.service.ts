import { Injectable } from '@angular/core';
import { UserProfile } from '../models/profile.model';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ApiService } from 'src/app/core/services/api.service';
import { catchError, map, tap } from 'rxjs/operators';

const STORAGE_KEY = 'ew_user_profile_v1';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly profileSubject = new BehaviorSubject<UserProfile | null>(
    null
  );

  public readonly profile$ = this.profileSubject.asObservable();

  private readonly PROFILE_ME_ENDPOINT = '/user/me';
  private readonly PROFILE_AVATAR_ENDPOINT = '/user/me/avatar';

  constructor(private api: ApiService) {
    // Initialize stream with current value from storage
    const existing = this.getProfile();
    this.profileSubject.next(existing);
  }

  private normalizeProfile(raw: any | null): UserProfile | null {
    if (!raw) return null;
    // Some APIs return { data: user, message }, others return user directly
    const data = raw && raw.data ? raw.data : raw;
    if (!data) return null;
    // Normalize salary into array of {label, amount}
    const rawSalary = data.salary;
    let salaryArr: { label: string; amount: number }[] = [];
    if (Array.isArray(rawSalary)) {
      salaryArr = rawSalary
        .filter((s: any) => s && typeof s.amount === 'number' && s.amount >= 0)
        .map((s: any) => ({
          label: String(s.label ?? 'Salary'),
          amount: Number(s.amount),
        }));
    } else if (typeof rawSalary === 'number') {
      salaryArr = [{ label: 'Salary', amount: rawSalary }];
    }

    // Map backend fields to UserProfile
    const profile: UserProfile = {
      username: (data.username ?? data.fullName ?? '').toString(),
      email: data.email ?? '',
      phone: data.phone ?? '',
      salary: salaryArr,
      currency: data.currency ?? 'USD',
      avatarUrl: data.avatarUrl ?? data.image ?? undefined,
    } as UserProfile;
    return profile;
  }

  getProfile(): UserProfile | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch (e) {
      console.error('Failed to parse profile from storage', e);
      return null;
    }
  }

  saveProfile(profile: UserProfile): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      // Emit the latest value so any subscribers (e.g., Dashboard) get updates
      this.profileSubject.next(profile);
      return true;
    } catch (e) {
      console.error('Failed to save profile', e);
      return false;
    }
  }

  saveProfilePart(partial: Partial<UserProfile>): boolean {
    const current = this.getProfile() ?? {
      username: '',
      email: '',
      phone: '',
      salary: [],
      currency: 'USD',
    };
    const merged: UserProfile = { ...current, ...partial } as UserProfile;
    return this.saveProfile(merged);
  }

  async setAvatar(file: File): Promise<boolean> {
    if (!file) return false;
    try {
      const dataUrl = await this.readFileAsDataURL(file);
      return this.saveProfilePart({ avatarUrl: dataUrl });
    } catch (e) {
      console.error('Failed to set avatar', e);
      return false;
    }
  }

  private readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Fetch profile from backend and propagate to local cache and stream.
   */
  fetchProfile(): Observable<UserProfile | null> {
    return this.api.get<any>(this.PROFILE_ME_ENDPOINT).pipe(
      map((res) => this.normalizeProfile(res)),
      tap((profile) => {
        if (profile) this.saveProfile(profile);
      }),
      catchError((err) => {
        console.error('Failed to fetch profile', err);
        return of(null);
      })
    );
  }

  /**
   * Update profile on backend; accepts partial but backend may require full document.
   * We optimistically merge with current profile before sending.
   */
  updateProfile(partial: Partial<UserProfile>): Observable<UserProfile | null> {
    const current = this.getProfile();
    // Ensure salary is in array shape when sending
    let merged: any = { ...(current ?? {}), ...partial } as UserProfile & any;
    if (merged.salary !== undefined) {
      const ms = merged.salary;
      if (Array.isArray(ms)) {
        merged.salary = ms.map((s) => ({
          label: String(s.label ?? 'Salary'),
          amount: Number(s.amount ?? 0),
        }));
      } else if (typeof ms === 'number') {
        merged.salary = [{ label: 'Salary', amount: ms }];
      } else {
        merged.salary = [];
      }
    }
    const body = merged as UserProfile;

    // Optimistic update: immediately reflect changes in local cache/stream
    this.saveProfile(body);

    return this.api.put<any>(this.PROFILE_ME_ENDPOINT, body).pipe(
      map((res) => this.normalizeProfile(res)),
      tap((updated) => {
        if (updated) {
          // Preserve fields we sent (salary/currency) in case backend echoes stale values
          const finalProfile: UserProfile = {
            ...updated,
            salary: (body as any).salary ?? updated.salary,
            currency: (body as any).currency ?? updated.currency,
          } as UserProfile;
          this.saveProfile(finalProfile);
        }
      }),
      catchError((err) => {
        console.error('Failed to update profile', err);
        return of(null);
      })
    );
  }

  /**
   * Upload avatar image to backend.
   * Tries to extract avatarUrl from different common response shapes.
   */
  uploadAvatar(file: File): Observable<UserProfile | null> {
    const fd = new FormData();
    fd.append('avatar', file);

    return this.api.postFormData<any>(this.PROFILE_AVATAR_ENDPOINT, fd).pipe(
      map((res) => {
        // Prefer avatarUrl if provided at top-level or under data
        const avatarUrl =
          res?.avatarUrl || res?.data?.avatarUrl || res?.result?.avatarUrl;
        if (avatarUrl) {
          const merged = {
            ...(this.getProfile() ?? {}),
            avatarUrl,
          } as UserProfile;
          this.saveProfile(merged);
          return merged;
        }
        // Otherwise normalize user payload possibly under data or user
        const userPayload = res?.user ?? res?.data ?? res;
        const normalized = this.normalizeProfile(userPayload);
        if (normalized) {
          this.saveProfile(normalized);
          return normalized;
        }
        return this.getProfile();
      }),
      catchError((err) => {
        console.error('Failed to upload avatar', err);
        return of(null);
      })
    );
  }
}
