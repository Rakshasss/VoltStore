import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo"><span class="ada">Volt</span><span class="shop">Store</span></div>
        <p class="auth-subtitle">Georgia's Electronics & Tech Store</p>

        <!-- TABS -->
        <div class="auth-tabs">
          <button class="auth-tab" [class.active]="tab() === 'login'" (click)="tab.set('login')">Log In</button>
          <button class="auth-tab" [class.active]="tab() === 'register'" (click)="tab.set('register')">Register</button>
        </div>

        @if (alertMsg()) {
          <div class="alert" [class.alert-error]="alertType()==='error'" [class.alert-success]="alertType()==='success'">
            {{ alertMsg() }}
          </div>
        }

        <!-- LOGIN -->
        @if (tab() === 'login') {
          <div class="form-group">
            <label>Email Address</label>
            <input class="form-control" type="email" [(ngModel)]="email" placeholder="your@email.com">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input class="form-control" type="password" [(ngModel)]="password" placeholder="Your password" (keydown.enter)="login()">
          </div>
          <button class="btn btn-primary" style="width:100%;padding:13px" [disabled]="loading()" (click)="login()">
            @if (loading()) { <div class="spinner"></div> } @else { Log In }
          </button>
          <div class="auth-switch">Don't have an account? <a (click)="tab.set('register')">Register</a></div>
        }

        <!-- REGISTER -->
        @if (tab() === 'register') {
          <div class="form-group">
            <label>Email Address</label>
            <input class="form-control" type="email" [(ngModel)]="email" placeholder="your@email.com">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input class="form-control" type="password" [(ngModel)]="password"
                   placeholder="Min 8 chars, uppercase + number"
                   (input)="checkPw()">
          </div>
          <!-- Password requirements -->
          <div class="pw-reqs">
            <div class="pw-req" [class.met]="pwReqs.len">
              <span class="dot"></span>At least 8 characters
            </div>
            <div class="pw-req" [class.met]="pwReqs.upper">
              <span class="dot"></span>One uppercase letter
            </div>
            <div class="pw-req" [class.met]="pwReqs.num">
              <span class="dot"></span>One number
            </div>
          </div>
          <div class="form-group">
            <label>Confirm Password</label>
            <input class="form-control" type="password" [(ngModel)]="confirm" placeholder="Repeat password">
          </div>
          <button class="btn btn-primary" style="width:100%;padding:13px" [disabled]="loading()" (click)="register()">
            @if (loading()) { <div class="spinner"></div> } @else { Create Account }
          </button>
          <div class="auth-switch">Already have an account? <a (click)="tab.set('login')">Log in</a></div>
        }

        <!-- VERIFY EMAIL -->
        @if (tab() === 'verify') {
          <div style="text-align:center">
            <div style="font-size:48px;margin-bottom:12px">📧</div>
            <h3 style="margin-bottom:8px">Check your email</h3>
            <p style="color:#888;font-size:13px;margin-bottom:24px">
              We sent a 6-digit code to <strong>{{ email }}</strong>
            </p>
            <div class="code-inputs">
              @for (i of [0,1,2,3,4,5]; track i) {
                <input type="text" maxlength="1" class="code-input"
                       (input)="onCodeInput($event, i)"
                       (keydown.backspace)="onCodeBack($event, i)">
              }
            </div>
            <button class="btn btn-primary" style="width:100%;padding:13px;margin-top:20px"
                    [disabled]="loading()" (click)="verify()">
              @if (loading()) { <div class="spinner"></div> } @else { Verify Email }
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 106px);
      padding-top: 106px;
      display: flex; align-items: center; justify-content: center;
      background: #f5f5f5; padding: 120px 20px 40px;
    }
    .auth-card { background: white; border-radius: 16px; padding: 40px 36px; width: 100%; max-width: 440px; box-shadow: 0 8px 40px rgba(0,0,0,0.1); }
    .auth-logo { font-size: 28px; font-weight: 800; text-align: center; margin-bottom: 4px; }
    .ada { color: #e85d04; }
    .shop { color: #1a1a2e; }
    .auth-subtitle { text-align: center; color: #888; font-size: 13px; margin-bottom: 28px; }
    .auth-tabs { display: flex; border-bottom: 1px solid #e0e0e0; margin-bottom: 24px; }
    .auth-tab { flex: 1; padding: 10px; background: none; border: none; font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; border-bottom: 2px solid transparent; color: #888; transition: all 0.2s; }
    .auth-tab.active { color: #e85d04; border-bottom-color: #e85d04; }
    .auth-switch { text-align: center; font-size: 13px; color: #888; margin-top: 16px; }
    .auth-switch a { color: #e85d04; cursor: pointer; font-weight: 600; }

    /* Password requirements */
    .pw-reqs { margin: -4px 0 16px; background: #f9f9f9; border-radius: 8px; padding: 10px 14px; }
    .pw-req { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #888; padding: 3px 0; transition: color 0.2s; }
    .pw-req.met { color: #15803d; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #ddd; flex-shrink: 0; transition: background 0.2s; }
    .pw-req.met .dot { background: #15803d; }

    /* Code inputs */
    .code-inputs { display: flex; gap: 8px; justify-content: center; }
    .code-input { width: 44px; height: 52px; text-align: center; font-size: 22px; font-weight: 700; border: 1.5px solid #e0e0e0; border-radius: 8px; outline: none; transition: border-color 0.2s; }
    .code-input:focus { border-color: #e85d04; }
  `]
})
export class AuthComponent {
  tab = signal<'login' | 'register' | 'verify'>('login');
  email = '';
  password = '';
  confirm = '';
  loading = signal(false);
  alertMsg = signal('');
  alertType = signal<'error' | 'success'>('error');
  pwReqs = { len: false, upper: false, num: false };
  private codeDigits: string[] = ['', '', '', '', '', ''];

  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute) {
    if (authService.isLoggedIn()) router.navigate(['/']);
    route.queryParams.subscribe(p => {
      if (p['tab'] === 'register') this.tab.set('register');
    });
  }

  checkPw(): void {
    const v = this.password;
    this.pwReqs.len   = v.length >= 8;
    this.pwReqs.upper = /[A-Z]/.test(v);
    this.pwReqs.num   = /[0-9]/.test(v);
  }

  showAlert(msg: string, type: 'error' | 'success' = 'error'): void {
    this.alertMsg.set(msg); this.alertType.set(type);
  }

  login(): void {
    if (!this.email || !this.password) { this.showAlert('Please fill in all fields.'); return; }
    this.loading.set(true);
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        const redirect = this.route.snapshot.queryParams['redirect'] || '/';
        this.router.navigate([redirect]);
      },
      error: err => {
        const status = err?.status;
        if (status === 403) {
          this.tab.set('verify');
          this.showAlert('Email not verified. Enter the code sent to your email.', 'success');
        } else {
          this.showAlert(err?.error?.message || 'Invalid email or password.');
        }
        this.loading.set(false);
      }
    });
  }

  register(): void {
    if (!this.email || !this.password || !this.confirm) { this.showAlert('Please fill in all fields.'); return; }
    if (!this.pwReqs.len || !this.pwReqs.upper || !this.pwReqs.num) { this.showAlert('Password does not meet requirements.'); return; }
    if (this.password !== this.confirm) { this.showAlert('Passwords do not match.'); return; }

    this.loading.set(true);
    this.authService.register({ email: this.email, password: this.password, confirmPassword: this.confirm }).subscribe({
      next: () => {
        this.tab.set('verify');
        this.alertMsg.set('');
        this.loading.set(false);
      },
      error: err => {
        const msg = err?.error?.errors?.join(' ') || err?.error?.message || 'Registration failed.';
        this.showAlert(msg);
        this.loading.set(false);
      }
    });
  }

  onCodeInput(e: Event, idx: number): void {
    const input = e.target as HTMLInputElement;
    const val = input.value.replace(/\D/, '');
    input.value = val;
    this.codeDigits[idx] = val;
    if (val && idx < 5) {
      const inputs = document.querySelectorAll('.code-input');
      (inputs[idx + 1] as HTMLElement)?.focus();
    }
    if (idx === 5 && val) this.verify();
  }

  onCodeBack(e: Event, idx: number): void {
    const ke = e as KeyboardEvent;
    if (!this.codeDigits[idx] && idx > 0) {
      const inputs = document.querySelectorAll('.code-input');
      (inputs[idx - 1] as HTMLElement)?.focus();
    }
  }

  verify(): void {
    const code = this.codeDigits.join('');
    if (code.length < 6) { this.showAlert('Please enter the complete 6-digit code.'); return; }
    this.loading.set(true);
    this.authService.verifyEmail(this.email, code).subscribe({
      next: () => { this.router.navigate(['/']); },
      error: err => { this.showAlert(err?.error?.message || 'Invalid code.'); this.loading.set(false); }
    });
  }
}
