# Restora Restaurant Website - Project Summary

## 🎯 Project Description

**Restora** is a complete full-stack restaurant management website designed for French fine dining establishments. It provides a comprehensive solution for online ordering, table reservations, menu management, customer reviews, and business analytics.

## 💻 Programming Languages & Technologies Used

### Frontend
1. **HTML5** - Structure and semantic markup
2. **CSS3** - Styling, animations, responsive design
3. **JavaScript (ES6+)** - Client-side logic and interactivity
4. **Bootstrap 5.3.3** - Responsive grid and utilities

### Backend
1. **Node.js** - JavaScript runtime environment
2. **Serverless Functions** - Vercel-compatible API architecture
3. **File System API** - JSON-based data persistence

### Data Storage
1. **JSON File Storage** - File-based database (no SQL required)
2. **localStorage API** - Client-side caching

### Deployment
1. **Vercel** - Serverless hosting platform
2. **Git** - Version control

## 📊 Technology Stack Breakdown

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Markup** | HTML5 | Page structure |
| **Styling** | CSS3 | Visual design, responsive layout |
| **Client Logic** | JavaScript (Vanilla) | Frontend functionality |
| **Server** | Node.js | Backend runtime |
| **API** | Serverless Functions | RESTful endpoints |
| **Database** | JSON Files | Data persistence |
| **Hosting** | Vercel | Cloud deployment |

## 🏗️ Architecture

### Frontend Architecture
- **Single Page Application (SPA)** approach
- **Component-based** UI structure
- **Event-driven** interactions
- **Local-first** data strategy with backend sync

### Backend Architecture
- **Serverless Functions** (Vercel-compatible)
- **RESTful API** design
- **File-based** database (no external dependencies)
- **Stateless** request handling

### Data Flow
```
User Action → Frontend (app.js) → API Call → Serverless Function → Database (db.js) → JSON File → Response → Frontend Update
```

## 🔑 Key Features

### 1. User Management
- User registration and login
- Role-based access (user/admin)
- Profile management
- Favorites system

### 2. Menu System
- Dynamic menu display
- Category filtering
- Search functionality
- Admin menu management (CRUD)

### 3. Ordering System
- Shopping cart
- Order placement
- Order history
- Sales tracking

### 4. Reservation System
- Table booking
- Status management
- Admin approval workflow

### 5. Review System
- Star ratings (1-5)
- Text reviews
- Average rating calculation

### 6. Analytics Dashboard
- Revenue tracking
- Order statistics
- Top selling items
- Top rated items
- Daily trends

## 📁 File Structure & Languages

```
Project/
├── Frontend (HTML/CSS/JS)
│   ├── index.html (HTML)
│   ├── assests/main page/
│   │   ├── index.html (HTML)
│   │   ├── app.js (JavaScript - 2400+ lines)
│   │   ├── styles.css (CSS - 1700+ lines)
│   │   └── about.html (HTML)
│
├── Backend (Node.js/JavaScript)
│   └── api/
│       ├── db.js (JavaScript - Database layer)
│       ├── menu.js (JavaScript - Menu API)
│       ├── orders.js (JavaScript - Orders API)
│       ├── reservations.js (JavaScript - Reservations API)
│       ├── reviews.js (JavaScript - Reviews API)
│       ├── sales.js (JavaScript - Analytics API)
│       ├── users.js (JavaScript - Users API)
│       ├── notifications.js (JavaScript - Notifications)
│       └── health.js (JavaScript - Health check)
│
├── Configuration (JSON)
│   ├── package.json (JSON)
│   ├── vercel.json (JSON)
│   └── .vercelignore (Text)
│
└── Documentation (Markdown)
    ├── README.md
    ├── DEPLOYMENT.md
    └── PROJECT_DOCUMENTATION.md
```

## 🎨 Design & UI

- **Theme**: French fine dining (dark brown/amber)
- **Layout**: Responsive grid system
- **Typography**: Inter font family
- **Effects**: Gradients, shadows, backdrop blur
- **Animations**: Smooth transitions

## 🔐 Security Features

- Input sanitization
- Password validation
- Role-based access control
- CORS headers
- XSS protection

## 📈 Performance Features

- Lazy loading
- Change detection
- Debounced API calls
- RequestAnimationFrame optimization
- Local-first caching

## 🚀 Deployment

- **Platform**: Vercel
- **Type**: Serverless
- **Database**: Ephemeral (`/tmp` directory)
- **Build**: No build step required
- **Status**: ✅ Ready for deployment

## 📝 Code Statistics

- **Total Lines**: ~5000+ lines of code
- **Frontend JS**: ~2400 lines
- **Backend JS**: ~1500 lines
- **CSS**: ~1700 lines
- **HTML**: ~400 lines
- **API Endpoints**: 8 endpoints
- **Database Collections**: 6 collections

## 🎓 Learning Outcomes

This project demonstrates:
- Full-stack JavaScript development
- RESTful API design
- File-based database implementation
- Serverless architecture
- Responsive web design
- State management
- Error handling
- Performance optimization

---

**Total Languages**: 4 (HTML, CSS, JavaScript, JSON)  
**Primary Language**: JavaScript (90% of codebase)  
**Framework**: None (Vanilla JavaScript)  
**Database**: JSON file-based (no SQL)

## 🔧 How Analytics Works

### Data Flow
1. **Order Creation**: When a user places an order:
   - Order is saved to `orders` collection
   - Sales records are created for each item in `sales` collection
   - Each sale record includes: item_id, item_name, quantity, price, total

2. **Analytics Calculation**:
   - Fetches all sales records from database
   - Filters by date period (default: last 30 days)
   - Calculates:
     - Total revenue (sum of all sale totals)
     - Total orders (unique order IDs)
     - Total items ordered (sum of quantities)
     - Average order value (revenue / orders)
   - Groups items by name/ID to find top sellers
   - Fetches reviews to calculate top rated items

3. **Display**:
   - Frontend receives analytics data
   - Renders statistics in cards
   - Shows top selling items list
   - Shows top rated items with star ratings

### Why Analytics Might Not Show Data
- **No orders placed yet**: Analytics only shows data after orders are created
- **Database not initialized**: First order creates the sales records
- **Date filtering**: Only shows orders from the last 30 days (by default)
- **API endpoint issue**: Check browser console for errors

### Testing Analytics
1. Place an order (add items to cart and pay)
2. Wait a moment for data to save
3. Open Analytics dashboard (admin only)
4. Should see:
   - Total revenue from your order
   - Total orders: 1
   - Items ordered: count of items
   - Top selling items: items you ordered

