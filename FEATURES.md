# Restora Restaurant - Features & Database Guide

## ✅ All Features Linked and Working

### 🔐 Authentication System
- **Login/Logout**: Fully functional with localStorage session management
- **User Registration**: Create new accounts
- **Role-based Access**: Admin and User roles
- **Default Accounts**:
  - Admin: `admin@gmail.com` / `12345678`
  - User: `123@gmail.com` / `asdfghjkl`

### 📋 Menu Management
- **View Menu**: Display all menu items with images, prices, categories
- **Search Menu**: Real-time search by item name
- **Filter by Category**: Filter menu items by category (All, Main Course, Appetizer, Dessert, Vegetarian)
- **Admin Menu Management**: 
  - Add new menu items
  - Edit existing items
  - Delete items
- **Menu Sync**: Automatic sync between frontend and backend

### 🛒 Shopping Cart & Orders
- **Add to Cart**: Add items with quantity selection
- **Cart Management**: View, update quantities, remove items
- **Checkout**: Place orders with payment simulation
- **Order History**: View all past orders with details
- **Order Status**: Orders show as "ORDERED" status
- **Sales Tracking**: Orders automatically create sales records in database

### 📅 Reservations
- **Book Table**: Create table reservations with date, time, guests
- **View Reservations**: Users can view their own reservations
- **Admin Management**: 
  - View all reservations
  - Accept/Reject reservations
  - Delete reservations
- **Status Management**: Pending → Approved/Rejected workflow

### ⭐ Reviews & Ratings
- **Rate Items**: 1-5 star rating system
- **Write Reviews**: Add text reviews for menu items
- **View Ratings**: See average ratings on menu items
- **Review Display**: Reviews shown on menu item cards

### 📱 Responsive Design
- **Mobile**: Fully responsive, touch-friendly
- **Tablet**: Optimized layouts
- **Desktop**: Full-featured experience

## 🗄️ Database System

### Database Type
- **File-based JSON storage** (Vercel-compatible)
- **No external dependencies** (no SQLite, no native compilation)
- **Automatic initialization** on first run

### Database Location
- **Local Development**: `data/restora.json`
- **Vercel Deployment**: `/tmp/restora.json` (ephemeral)

### Database Collections

#### 1. Users (`users`)
```json
{
  "id": "unique-id",
  "email": "user@example.com",
  "password": "hashed-password",
  "name": "User Name",
  "role": "user" | "admin",
  "avatar_url": "url",
  "favorites": "JSON array",
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

#### 2. Menu (`menu`)
```json
{
  "id": "unique-id",
  "name": "Dish Name",
  "price": 850,
  "image": "image-url",
  "category": "Main Course",
  "description": "Optional",
  "available": true,
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

#### 3. Orders (`orders`)
```json
{
  "id": "unique-id",
  "user_id": "user-id",
  "items": "JSON string of items array",
  "subtotal": 1000,
  "tax": 50,
  "total": 1050,
  "status": "ordered",
  "payment_method": "online",
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

#### 4. Reservations (`reservations`)
```json
{
  "id": "unique-id",
  "name": "Customer Name",
  "phone": "1234567890",
  "email": "customer@example.com",
  "date": "2024-12-06",
  "time": "19:00",
  "guests": 4,
  "notes": "Special requests",
  "status": "pending" | "approved" | "rejected",
  "user_id": "user-id",
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

#### 5. Reviews (`reviews`)
```json
{
  "id": "unique-id",
  "item_id": "item-id",
  "item_name": "Item Name",
  "rating": 5,
  "reviewer_name": "Reviewer Name",
  "text": "Review text",
  "user_id": "user-id",
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

#### 6. Sales (`sales`)
```json
{
  "id": "unique-id",
  "order_id": "order-id",
  "item_id": "item-id",
  "item_name": "Item Name",
  "quantity": 2,
  "price": 500,
  "total": 1000,
  "created_at": 1234567890
}
```

## 🔌 API Endpoints

All endpoints are accessible at `/api/{endpoint}`:

### Menu
- `GET /api/menu` - Get all menu items (supports `?category=` and `?search=`)
- `POST /api/menu` - Create menu item (admin)
- `PUT /api/menu?id={id}` - Update menu item (admin)
- `DELETE /api/menu?id={id}` - Delete menu item (admin)

### Orders
- `GET /api/orders?userEmail={email}` - Get user's orders
- `POST /api/orders` - Create new order
- `PATCH /api/orders?id={id}` - Update order status

### Reservations
- `GET /api/reservations` - Get reservations (user's own or all for admin)
- `POST /api/reservations` - Create reservation
- `PATCH /api/reservations?id={id}` - Update reservation status
- `DELETE /api/reservations?id={id}` - Delete reservation

### Reviews
- `GET /api/reviews?itemId={id}` - Get reviews for item
- `POST /api/reviews` - Create review
- `DELETE /api/reviews?id={id}` - Delete review (admin)

### Users
- `GET /api/users?email={email}` - Get user by email
- `POST /api/users` - Register user
- `PATCH /api/users?id={id}` - Update user

### Sales
- `GET /api/sales` - Get sales data (basic endpoint, analytics removed)

## 🚀 Vercel Deployment

### Database Configuration
- **Automatic Detection**: Checks for `VERCEL`, `VERCEL_ENV`, or `NOW_REGION` environment variables
- **Path Selection**: Uses `/tmp` on Vercel, `data/` locally
- **Initialization**: Database auto-initializes with default data on first run

### Deployment Steps
1. Push code to Git repository
2. Connect to Vercel
3. Deploy automatically
4. Database initializes on first API call

### Important Notes
- **Ephemeral Storage**: On Vercel, `/tmp` directory resets on each deployment
- **For Production**: Consider migrating to Vercel Postgres for persistent storage
- **Current Setup**: Perfect for demos and development

## ✅ Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ✅ Working | Login/Logout/Signup |
| Menu Display | ✅ Working | Search, Filter, Categories |
| Menu Management | ✅ Working | Admin CRUD operations |
| Shopping Cart | ✅ Working | Add/Remove/Update quantities |
| Order Placement | ✅ Working | Creates orders and sales records |
| Order History | ✅ Working | View past orders |
| Reservations | ✅ Working | Book, view, manage |
| Reviews | ✅ Working | Rate and review items |
| Database | ✅ Working | File-based JSON, Vercel-compatible |
| Responsive Design | ✅ Working | Mobile, Tablet, Desktop |

## 🔗 All Features Linked

All features are properly connected:
- ✅ Frontend → API → Database
- ✅ API endpoints properly routed
- ✅ Database operations working
- ✅ Error handling in place
- ✅ Local-first with backend sync
- ✅ Vercel-compatible architecture

---

**Project Status**: ✅ All features working and linked  
**Database**: ✅ Vercel-compatible  
**Deployment**: ✅ Ready for Vercel

