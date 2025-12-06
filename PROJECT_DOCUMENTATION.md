# Restora Restaurant Website - Complete Project Documentation

## 📋 Project Overview

**Restora** is a full-stack restaurant management website featuring a French fine dining theme. The application provides a complete restaurant experience including menu management, online ordering, table reservations, customer reviews, order history, and comprehensive analytics dashboard.

## 🛠️ Technologies & Languages Used

### Frontend Technologies
- **HTML5** - Structure and semantic markup
- **CSS3** - Styling with modern features (gradients, animations, responsive design)
- **JavaScript (ES6+)** - Client-side logic, DOM manipulation, API interactions
- **Bootstrap 5.3.3** - Responsive grid system and utility classes

### Backend Technologies
- **Node.js** - Server-side JavaScript runtime
- **Serverless Functions** - Vercel-compatible API endpoints
- **File-based JSON Storage** - NoSQL-like data persistence (Vercel-compatible)

### Deployment & Infrastructure
- **Vercel** - Serverless hosting platform
- **Git** - Version control

### Key Libraries & Frameworks
- **Native Node.js APIs**: `fs.promises`, `http`, `url`, `path`
- **No external dependencies** - Pure JavaScript implementation for maximum compatibility

## 📁 Project Structure

```
Project/
├── api/                          # Serverless API endpoints
│   ├── db.js                     # Database operations (JSON file-based)
│   ├── menu.js                   # Menu CRUD operations
│   ├── orders.js                 # Order management
│   ├── reservations.js           # Table reservation system
│   ├── reviews.js                # Customer reviews & ratings
│   ├── sales.js                  # Sales analytics & reporting
│   ├── users.js                  # User authentication & management
│   ├── notifications.js           # Email notifications (placeholder)
│   └── health.js                 # Health check endpoint
│
├── assests/main page/            # Frontend application
│   ├── index.html                # Main page structure
│   ├── app.js                    # Frontend JavaScript logic
│   ├── styles.css                # Complete styling
│   └── about.html                # About page
│
├── index.html                    # Root redirect page
├── server.js                     # Local development server
├── package.json                  # Project dependencies & scripts
├── vercel.json                   # Vercel deployment configuration
├── .vercelignore                 # Files to exclude from Vercel
├── README.md                     # Setup instructions
└── DEPLOYMENT.md                 # Deployment guide
```

## 🗄️ Database Architecture

### Storage System
- **Type**: File-based JSON storage (no native compilation required)
- **Location**: 
  - Local: `data/restora.json`
  - Vercel: `/tmp/restora.json` (ephemeral)
- **Format**: Single JSON file with nested collections

### Data Collections

#### 1. Users
```json
{
  "id": "unique-id",
  "email": "user@example.com",
  "password": "hashed-password",
  "name": "User Name",
  "role": "user" | "admin",
  "avatar_url": "url",
  "favorites": "JSON array of item IDs",
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

#### 2. Menu
```json
{
  "id": "unique-id",
  "name": "Dish Name",
  "price": 850,
  "image": "image-url",
  "category": "Main Course",
  "description": "Optional description",
  "available": true,
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

#### 3. Orders
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

#### 4. Sales (for Analytics)
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

#### 5. Reservations
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

#### 6. Reviews
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

## 🔌 API Endpoints

### Menu Management
- `GET /api/menu` - Get all menu items (with optional category/search filters)
- `POST /api/menu` - Create new menu item
- `PUT /api/menu?id={id}` - Update menu item
- `DELETE /api/menu?id={id}` - Delete menu item

### Orders
- `GET /api/orders?userEmail={email}` - Get user's order history
- `POST /api/orders` - Create new order
- `PATCH /api/orders?id={id}` - Update order status

### Reservations
- `GET /api/reservations` - Get all reservations (admin) or user's reservations
- `POST /api/reservations` - Create new reservation
- `PATCH /api/reservations?id={id}` - Update reservation status
- `DELETE /api/reservations?id={id}` - Delete reservation

### Reviews
- `GET /api/reviews?itemId={id}` - Get reviews for a menu item
- `POST /api/reviews` - Create new review
- `DELETE /api/reviews?id={id}` - Delete review

### Users
- `GET /api/users?email={email}` - Get user by email
- `POST /api/users` - Register new user
- `PATCH /api/users?id={id}` - Update user profile

### Analytics
- `GET /api/sales/analytics?period={days}` - Get comprehensive analytics
  - Returns: totalRevenue, totalOrders, totalItemsOrdered, averageOrderValue, topItems, topRatedItems, dailyRevenue

## 🎨 Frontend Features

### User Features
1. **Menu Browsing**
   - View all menu items with images
   - Filter by category
   - Search functionality
   - View item ratings

2. **Shopping Cart**
   - Add/remove items
   - Quantity management
   - Real-time price calculation
   - Tax calculation (5%)

3. **Order Management**
   - Place orders
   - View order history
   - Order status tracking

4. **Reservations**
   - Book table reservations
   - View reservation status
   - Special requests

5. **Reviews & Ratings**
   - Rate menu items
   - Write reviews
   - View average ratings

6. **User Profile**
   - Login/Logout
   - Favorites management
   - Profile customization

### Admin Features
1. **Menu Management**
   - Add/Edit/Delete menu items
   - Category management
   - Price updates

2. **Reservation Management**
   - View all reservations
   - Accept/Reject reservations
   - Delete reservations

3. **Analytics Dashboard**
   - Total revenue
   - Total orders
   - Items ordered count
   - Average order value
   - Top selling items
   - Top rated items
   - Daily revenue trends

## 🎯 Key Functionalities

### 1. Authentication System
- Email-based login
- Role-based access (user/admin)
- Session management via localStorage
- Password authentication

### 2. Order Processing
- Cart management
- Order creation with sales tracking
- Order history with detailed breakdown
- Status: "ordered" (default)

### 3. Reservation System
- Date/time selection
- Guest count
- Special requests
- Status management (pending/approved/rejected)

### 4. Review System
- 5-star rating system
- Text reviews
- Average rating calculation
- Item-specific reviews

### 5. Analytics System
- Real-time sales tracking
- Revenue calculations
- Top items by sales
- Top items by ratings
- Daily revenue trends
- Average order value

## 🚀 Deployment

### Vercel Deployment
1. **Configuration**: `vercel.json` defines serverless functions
2. **Build**: No build step required (static files + serverless functions)
3. **Database**: Uses `/tmp` directory (ephemeral, resets on deployment)
4. **API Routes**: All `/api/*` routes are serverless functions

### Local Development
```bash
npm install
npm run dev
# Server runs on http://localhost:3000
```

## 📊 Data Flow

### Order Flow
1. User adds items to cart
2. User clicks "Pay Now"
3. Frontend sends POST to `/api/orders`
4. Backend creates order record
5. Backend creates sales records for analytics
6. Order appears in order history
7. Analytics updates automatically

### Reservation Flow
1. User fills reservation form
2. Frontend saves to localStorage (immediate)
3. Frontend sends POST to `/api/reservations` (background sync)
4. Admin views reservations in admin panel
5. Admin accepts/rejects reservation
6. Status updates in real-time

### Analytics Flow
1. Admin clicks "Analytics" button
2. Frontend requests `/api/sales/analytics?period=30`
3. Backend calculates:
   - Aggregates sales data
   - Calculates revenue metrics
   - Fetches reviews for ratings
   - Groups by items and dates
4. Returns comprehensive analytics object
5. Frontend renders charts and statistics

## 🔧 Technical Details

### Performance Optimizations
- Lazy database initialization
- Change detection to prevent unnecessary re-renders
- Debounced API calls
- RequestAnimationFrame for smooth DOM updates
- Local-first data storage with background sync

### Error Handling
- Graceful fallbacks to localStorage
- Error boundaries in API calls
- User-friendly error messages
- Console logging for debugging

### Security Features
- Input sanitization (escapeHtml)
- Password validation
- Role-based access control
- CORS headers for API security

## 📱 Responsive Design

- **Desktop**: Full-featured layout with sidebars
- **Tablet**: Optimized grid layouts
- **Mobile**: Stacked layouts, touch-friendly buttons
- **Breakpoints**: 768px, 1024px

## 🎨 Design Theme

- **Color Scheme**: Dark brown/amber French restaurant theme
- **Typography**: Inter font family
- **Effects**: Gradients, shadows, backdrop blur
- **Animations**: Smooth transitions, hover effects
- **Icons**: Unicode symbols and emojis

## 📝 Default Credentials

- **Admin**: 
  - Email: `admin@gmail.com`
  - Password: `12345678`
- **User**: 
  - Email: `123@gmail.com`
  - Password: `asdfghjkl`

## 🔄 Data Persistence

### Local Development
- Data persists in `data/restora.json`
- Survives server restarts
- Manual backup recommended

### Vercel Deployment
- Data stored in `/tmp/restora.json`
- **Ephemeral**: Resets on each deployment
- For production: Consider migrating to Vercel Postgres or external database

## 🐛 Known Limitations

1. **Database Persistence**: On Vercel, data resets on deployment
2. **File Size**: Large datasets may slow down JSON operations
3. **Concurrency**: File-based storage has limited concurrent write support
4. **Scalability**: Best for demo/small-scale applications

## 🚀 Future Enhancements

1. **Database Migration**: Move to Vercel Postgres for persistent storage
2. **Real-time Updates**: WebSocket support for live order tracking
3. **Payment Integration**: Stripe/PayPal integration
4. **Email Notifications**: Send confirmation emails
5. **Image Upload**: Allow custom menu item images
6. **Advanced Analytics**: Charts and graphs visualization
7. **Multi-language Support**: Internationalization

## 📄 License

This is a demo project for educational purposes.

---

**Project Name**: Restora Restaurant Website  
**Version**: 1.0.0  
**Last Updated**: December 2024  
**Deployment Ready**: ✅ Vercel-compatible

