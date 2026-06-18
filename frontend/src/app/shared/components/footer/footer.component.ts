import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule],
  template: `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="footer-logo"><span class="ada">Volt</span><span class="shop">Store</span></div>
            <p>Georgia's leading electronics store. Quality tech at the best prices with fast delivery nationwide.</p>
            <div class="socials">
              <a href="#">📘</a><a href="#">📸</a><a href="#">▶️</a>
            </div>
          </div>
          <div class="footer-col">
            <h4>Categories</h4>
            <a routerLink="/products" [queryParams]="{cat:1}">Phones</a>
            <a routerLink="/products" [queryParams]="{cat:2}">Laptops</a>
            <a routerLink="/products" [queryParams]="{cat:3}">Tablets</a>
            <a routerLink="/products" [queryParams]="{cat:4}">Accessories</a>
            <a routerLink="/products" [queryParams]="{cat:5}">PC Components</a>
          </div>
          <div class="footer-col">
            <h4>Customer Service</h4>
            <a routerLink="/">Delivery Info</a>
            <a routerLink="/">Returns Policy</a>
            <a routerLink="/">Warranty</a>
            <a routerLink="/">Payment Methods</a>
          </div>
          <div class="footer-col">
            <h4>Contact</h4>
            <p>📍 Tbilisi, Georgia</p>
            <p>☎ (032) 2420264</p>
            <p>📧 info&#64;voltstore.ge</p>
            <p>🕐 Mon-Sun 9:00–18:00</p>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2025 VoltStore. All rights reserved.</span>
          <span>🇬🇪 Made in Georgia</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer { background: #1a1a2e; color: #aaa; margin-top: 60px; padding: 48px 0 0; }
    .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 40px; }
    .footer-logo { font-size: 24px; font-weight: 800; margin-bottom: 12px; }
    .ada { color: #e85d04; }
    .shop { color: white; }
    .footer-brand p { font-size: 13px; line-height: 1.7; max-width: 260px; }
    .socials { display: flex; gap: 12px; margin-top: 16px; font-size: 20px; }
    .socials a { transition: opacity 0.2s; }
    .socials a:hover { opacity: 0.7; }
    .footer-col h4 { color: white; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
    .footer-col a, .footer-col p { display: block; font-size: 13px; color: #aaa; margin-bottom: 8px; transition: color 0.2s; }
    .footer-col a:hover { color: #e85d04; }
    .footer-bottom { border-top: 1px solid #2a2a4a; padding: 20px 0; display: flex; justify-content: space-between; font-size: 12px; }
    @media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr; } }
  `]
})
export class FooterComponent {}
