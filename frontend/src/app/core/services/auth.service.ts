import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CartService } from './cart.service';

export interface User { id: string; email: string; role: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl;
  currentUser = signal<User | null>(this.getUserFromStorage());
  isLoggedIn  = signal<boolean>(!!localStorage.getItem('token'));

  constructor(private http: HttpClient, private router: Router, private cartService: CartService) {}

  login(body: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.api}/auth/login`, body).pipe(
      tap(async res => {
        const token = res?.value?.accessToken || res?.data?.accessToken;
        if (token) {
          localStorage.setItem('token', token);
          this.isLoggedIn.set(true);
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const user: User = {
              id: payload.sub,
              email: payload.email,
              role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'Customer'
            };
            localStorage.setItem('user', JSON.stringify(user));
            this.currentUser.set(user);
          } catch {}
          // Merge local cart with backend cart
          await this.cartService.syncAfterLogin();
        }
      })
    );
  }

  register(body: { email: string; password: string; confirmPassword: string }): Observable<any> {
    return this.http.post<any>(`${this.api}/auth/register`, body);
  }

  verifyEmail(email: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.api}/auth/email-verification`, { email, code }).pipe(
      tap(async res => {
        const token = res?.value?.accessToken;
        if (token) {
          localStorage.setItem('token', token);
          this.isLoggedIn.set(true);
          await this.cartService.syncAfterLogin();
        }
      })
    );
  }

  logout(): void {
    this.http.post(`${this.api}/auth/logout`, {}).subscribe();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.cartService.clear();
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null { return localStorage.getItem('token'); }
  isAdmin(): boolean { return this.currentUser()?.role === 'Admin'; }
  isManager(): boolean { return ['Admin', 'Manager'].includes(this.currentUser()?.role || ''); }

  private getUserFromStorage(): User | null {
    try { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; } catch { return null; }
  }
}
