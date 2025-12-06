# Restora Restaurant Website

A modern restaurant website with full database integration, featuring menu management, reservations, reviews, order history, and analytics.

## Features

- ✅ **Database Integration**: SQLite database for persistent data storage
- ✅ **User Authentication**: Login/signup system with admin support
- ✅ **Menu Management**: Add, edit, delete menu items (admin only)
- ✅ **Reservations**: Table reservation system with status management
- ✅ **Reviews & Ratings**: Customer reviews with star ratings
- ✅ **Shopping Cart**: Add items to cart and checkout
- ✅ **Order History**: View past orders for logged-in users
- ✅ **Search & Filter**: Search menu items and filter by category
- ✅ **Analytics Dashboard**: Sales analytics for admin users
- ✅ **Favorites**: Save favorite menu items
- ✅ **Responsive Design**: Works on mobile, tablet, and desktop

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js with HTTP server
- **Database**: SQLite (better-sqlite3)
- **Storage**: SQLite database file (persists data)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```
   Or:
   ```bash
   node server.js
   ```

3. **Access the website:**
   - Open your browser and go to `http://localhost:3000`
   - Login page will be displayed

## Default Credentials

### Admin Account
- **Email**: `admin@gmail.com`
- **Password**: `12345678`

### Regular User Account
- **Email**: `123@gmail.com`
- **Password**: `asdfghjkl`

## Database

The database is automatically initialized on first run. The database file is stored in:
- **Local development**: `data/restora.db`
- **Serverless (Vercel)**: `/tmp/restora.db`

### Database Schema

- **users**: User accounts and authentication
- **menu**: Menu items with categories
- **reservations**: Table reservations
- **reviews**: Customer reviews and ratings
- **orders**: Order history
- **sales**: Sales transactions for analytics

## API Endpoints

### Menu
- `GET /api/menu` - Get all menu items (supports `?category=` and `?search=` query params)
- `POST /api/menu` - Create new menu item
- `PUT /api/menu?id=...` - Update menu item
- `DELETE /api/menu?id=...` - Delete menu item

### Reservations
- `GET /api/reservations` - Get all reservations (supports `?status=` and `?date=` query params)
- `POST /api/reservations` - Create new reservation
- `PATCH /api/reservations?id=...` - Update reservation status
- `DELETE /api/reservations?id=...` - Delete reservation

### Reviews
- `GET /api/reviews` - Get all reviews (supports `?itemId=` query param)
- `POST /api/reviews` - Create new review
- `DELETE /api/reviews?id=...` - Delete review

### Users
- `GET /api/users` - Get all users (supports `?email=` query param)
- `POST /api/users` - Create new user
- `PATCH /api/users?id=...` - Update user

### Orders
- `GET /api/orders` - Get orders (supports `?userId=` and `?status=` query params)
- `POST /api/orders` - Create new order
- `PATCH /api/orders?id=...` - Update order status

### Sales/Analytics
- `GET /api/sales` - Get sales data (supports `?startDate=`, `?endDate=`, `?groupBy=` query params)
- `GET /api/sales/analytics` - Get analytics dashboard data (supports `?period=` query param, default 30 days)

## Project Structure

```
Project/
├── api/
│   ├── db.js              # Database connection and initialization
│   ├── menu.js            # Menu API endpoints
│   ├── reservations.js    # Reservations API endpoints
│   ├── reviews.js         # Reviews API endpoints
│   ├── users.js           # Users API endpoints
│   ├── orders.js          # Orders API endpoints
│   ├── sales.js           # Sales/Analytics API endpoints
│   └── health.js          # Health check endpoint
├── assests/main page/
│   ├── index.html         # Main page
│   ├── app.js             # Frontend JavaScript
│   └── styles.css         # Styles
├── index.html             # Login page
├── server.js              # HTTP server
├── package.json           # Dependencies
└── README.md             # This file
```

## Features in Detail

### 1. Menu Management
- View all menu items with images, prices, and categories
- Search menu items by name
- Filter by category
- Admin can add, edit, and delete menu items
- See average ratings for each item

### 2. Reservations
- Make table reservations with date, time, and number of guests
- Admin can view all reservations
- Admin can approve, reject, or delete reservations
- Reservations are saved to database

### 3. Reviews & Ratings
- Customers can leave reviews with 1-5 star ratings
- Reviews are displayed on menu items
- Admin can manage (delete) reviews

### 4. Shopping Cart
- Add items to cart
- Adjust quantities
- View cart total with tax
- Checkout and save order to database

### 5. Order History
- View past orders (for logged-in users)
- See order details, items, and total
- Track order status

### 6. Analytics Dashboard (Admin Only)
- View total revenue
- View total orders
- See top selling items
- Daily revenue charts

### 7. User Features
- User profiles with avatars
- Favorite menu items
- Order history
- Reviews

## Development

### Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open browser:
   ```
   http://localhost:3000
   ```

### Database Location

The database file is created automatically:
- **Local**: `data/restora.db`
- The `data/` directory is created automatically if it doesn't exist

### Resetting Database

To reset the database, simply delete the `data/restora.db` file and restart the server. The database will be recreated with default data.

## Deployment

### Vercel Deployment (Ready to Deploy!)

The project is **ready for direct deployment to Vercel**. Simply:

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Or use Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Deploy!

The project includes:
- ✅ `vercel.json` configuration
- ✅ Serverless function setup
- ✅ Database configured for Vercel (`/tmp` directory)
- ✅ All API endpoints ready

**Important**: The database in `/tmp` is **ephemeral** (resets on deployment). For production, consider:
- **Vercel Postgres** (recommended)
- **PlanetScale** (MySQL)
- **Supabase** (PostgreSQL)

See `DEPLOYMENT.md` for detailed deployment instructions.

### Environment Variables

No environment variables are required for basic setup.

## Troubleshooting

### Database Errors

If you encounter database errors:
1. Make sure `better-sqlite3` is installed: `npm install`
2. Check that the `data/` directory exists and is writable
3. Delete `data/restora.db` and restart to recreate the database

### API Not Working

1. Make sure the server is running: `npm start`
2. Check that you're accessing the correct URL: `http://localhost:3000`
3. Check browser console for errors
4. Verify API endpoints are accessible: `http://localhost:3000/api/health`

### Reservations Not Saving

1. Check browser console for errors
2. Verify the database file exists: `data/restora.db`
3. Check server logs for database errors
4. Make sure the API endpoint is accessible

## License

This project is for demonstration purposes.

## Support

For issues or questions, please check the code comments or create an issue in the repository.
