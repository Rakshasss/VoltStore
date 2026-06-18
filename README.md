# ⚡ VoltStore — Complete Full-Stack Project

## How to Run

### Backend
```bash
cd backend
dotnet restore
dotnet run
```
API: http://localhost:5006 | Swagger: http://localhost:5006/swagger

**IMPORTANT: First run — delete old database in SSMS, let it recreate with new tables**

### Frontend
```bash
cd frontend
npm install
ng serve
```
App: http://localhost:4200

---

## Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@voltstore.ge | Admin123! |
| Manager | manager@voltstore.ge | Manager123! |

---

## Features

### User Roles
- **Customer** — shop, cart, orders, profile
- **Manager** — manage orders, update status, fetch product specs
- **Admin** — full access including products, categories, users

### Cart Behavior
- Not logged in → cart in localStorage (temporary)
- Login → localStorage cart merges into database cart
- Database cart persists across devices

### Checkout
- Choose delivery method (Pickup free, Standard ₾5, Express ₾15)
- Simulated payment (Card or Cash)
- Visual card preview
- Estimated delivery date shown after order

### Order Tracking
- Full timeline: Ordered → Paid → Processing → Shipped → Delivered
- Admin/Manager can update status + tracking number
- Tracking visible in user profile

### Product Specifications
- Auto-fetched using Icecat API or smart name parsing
- Compare page shows specs side-by-side
- RAM, CPU, Display, Camera, Battery, GPU, etc.

### Compare System
- Add up to 4 products
- Specs table with best price highlighted
- Available from product cards, product detail page, navbar

### Filters & Sorting
- Min/max price range
- Brand filter (extracted from product name)
- Search by name
- In-stock only
- Sort: price, name A-Z/Z-A
