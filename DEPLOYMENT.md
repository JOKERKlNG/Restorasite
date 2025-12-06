# Vercel Deployment Guide

This project is ready for direct deployment to Vercel.

## Quick Deploy

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   
   Or deploy to production:
   ```bash
   vercel --prod
   ```

3. **Or use Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Vercel will automatically detect the configuration

## Project Structure for Vercel

- **API Routes**: All files in `/api` directory are automatically converted to serverless functions
- **Static Files**: All HTML, CSS, JS files in root and subdirectories are served as static files
- **Database**: SQLite database is stored in `/tmp` directory (ephemeral - resets on each deployment)

## Important Notes

### Database Persistence

⚠️ **Important**: On Vercel, the `/tmp` directory is **ephemeral**. This means:
- Database data will be **reset** on each deployment
- Database data persists during the same deployment but resets on redeploy
- The database uses JSON file storage (no native compilation needed - works perfectly on Vercel)
- For production use with persistent data, consider migrating to:
  - **Vercel Postgres** (recommended)
  - **PlanetScale** (MySQL)
  - **Supabase** (PostgreSQL)
  - **MongoDB Atlas**

### Environment Variables

No environment variables are required for basic deployment. The project automatically detects Vercel environment using `process.env.VERCEL`.

### Build Configuration

The project uses `vercel.json` for configuration:
- API routes are automatically detected in `/api` directory
- Maximum function duration: 10 seconds
- Node.js version: 18.x or higher

## Deployment Checklist

- ✅ `vercel.json` configured
- ✅ API endpoints in `/api` directory
- ✅ Database uses `/tmp` for Vercel
- ✅ All dependencies in `package.json`
- ✅ No local-only files (server.js excluded via .vercelignore)

## After Deployment

1. Visit your Vercel deployment URL
2. Test the login page
3. Login with admin credentials: `admin@gmail.com` / `12345678`
4. Test all features:
   - Menu browsing
   - Reservations
   - Reviews
   - Orders
   - Analytics (admin only)

## Troubleshooting

### Database Errors

If you see database errors:
- Check Vercel function logs
- Verify database path is `/tmp/restora.json` on Vercel
- Ensure file system is writable (should work automatically on Vercel)

### API Not Working

- Check that API files are in `/api` directory
- Verify `vercel.json` configuration
- Check function logs in Vercel dashboard

### Build Errors

- Ensure Node.js version is 18.x or higher
- Check that all dependencies are in `package.json`
- Review build logs in Vercel dashboard

## Production Recommendations

For production use:

1. **Use a persistent database**:
   - Set up Vercel Postgres
   - Update `api/db.js` to use PostgreSQL instead of SQLite

2. **Add environment variables**:
   - Database connection strings
   - API keys for email notifications
   - Secret keys for authentication

3. **Enable monitoring**:
   - Set up Vercel Analytics
   - Configure error tracking
   - Monitor function performance

4. **Security**:
   - Add rate limiting
   - Implement proper authentication
   - Use HTTPS (automatic on Vercel)

