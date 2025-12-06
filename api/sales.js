const { db } = require("./db");

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(data));
}

module.exports = async (req, res) => {
  const { method } = req;

  // Handle CORS preflight
  if (method === "OPTIONS") {
    res.statusCode = 200;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.end();
    return;
  }

  try {
    // Check if this is the analytics endpoint - handle both /sales/analytics and /api/sales/analytics
    const urlPath = req.url.split('?')[0]; // Get path without query params
    const isAnalytics = urlPath.includes("/analytics") || req.url.includes("analytics");
    
    if (method === "GET" && isAnalytics) {
      let url;
      try {
        url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      } catch (e) {
        // Fallback for Vercel serverless environment
        url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
      }
      
      const period = parseInt(url.searchParams.get("period") || "30"); // days
      
      const startDate = Math.floor((Date.now() - (period * 24 * 60 * 60 * 1000)) / 1000);
      
      // Get sales data with error handling
      let sales = [];
      try {
        sales = await db.getSales();
        if (!Array.isArray(sales)) {
          console.warn("Sales data is not an array, defaulting to empty array");
          sales = [];
        }
      } catch (err) {
        console.error("Error fetching sales:", err);
        sales = [];
      }
      
      // Filter by date
      sales = sales.filter(s => s.created_at >= startDate);
      
      // Calculate totals
      const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
      const uniqueOrders = new Set(sales.map(s => s.order_id).filter(Boolean));
      const totalOrders = uniqueOrders.size;
      
      // Calculate total items ordered
      const totalItemsOrdered = sales.reduce((sum, s) => sum + (s.quantity || 0), 0);
      
      // Calculate average order value
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Get all orders to calculate additional stats (for future use)
      let orders = [];
      try {
        orders = await db.getOrders();
        if (!Array.isArray(orders)) {
          orders = [];
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        orders = [];
      }
      const ordersInPeriod = orders.filter(o => o.created_at >= startDate);
      
      // Top items by sales
      const itemMap = new Map();
      sales.forEach(sale => {
        const key = sale.item_id || sale.item_name;
        if (!itemMap.has(key)) {
          itemMap.set(key, { 
            name: sale.item_name, 
            quantity: 0, 
            revenue: 0,
            item_id: sale.item_id 
          });
        }
        const item = itemMap.get(key);
        item.quantity += sale.quantity || 0;
        item.revenue += sale.total || 0;
      });
      
      const topItems = Array.from(itemMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      // Get top rated items from reviews
      let reviews = [];
      try {
        reviews = await db.getReviews();
        if (!Array.isArray(reviews)) {
          reviews = [];
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        reviews = [];
      }
      
      const itemRatingMap = new Map();
      
      reviews.forEach(review => {
        const itemId = review.item_id;
        const itemName = review.item_name || 'Unknown';
        if (!itemRatingMap.has(itemId)) {
          itemRatingMap.set(itemId, {
            item_id: itemId,
            name: itemName,
            totalRating: 0,
            reviewCount: 0,
            averageRating: 0
          });
        }
        const item = itemRatingMap.get(itemId);
        item.totalRating += review.rating || 0;
        item.reviewCount += 1;
        item.averageRating = item.totalRating / item.reviewCount;
      });
      
      const topRatedItems = Array.from(itemRatingMap.values())
        .filter(item => item.reviewCount > 0)
        .sort((a, b) => {
          // Sort by average rating first, then by number of reviews
          if (Math.abs(b.averageRating - a.averageRating) > 0.1) {
            return b.averageRating - a.averageRating;
          }
          return b.reviewCount - a.reviewCount;
        })
        .slice(0, 10);
      
      // Daily revenue
      const dailyMap = new Map();
      sales.forEach(sale => {
        const date = new Date(sale.created_at * 1000).toISOString().split('T')[0];
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { date, revenue: 0, transactions: 0 });
        }
        const day = dailyMap.get(date);
        day.revenue += sale.total || 0;
        day.transactions += 1;
      });
      
      const dailyRevenue = Array.from(dailyMap.values())
        .sort((a, b) => b.date.localeCompare(a.date));
      
      const analyticsData = {
        period,
        totalRevenue: totalRevenue || 0,
        totalOrders: totalOrders || 0,
        totalItemsOrdered: totalItemsOrdered || 0,
        averageOrderValue: averageOrderValue || 0,
        topItems: topItems || [],
        topRatedItems: topRatedItems || [],
        dailyRevenue: dailyRevenue || [],
      };
      
      // Log analytics for debugging
      console.log("Analytics calculated:", {
        period,
        salesCount: sales.length,
        totalRevenue: analyticsData.totalRevenue,
        totalOrders: analyticsData.totalOrders,
        totalItemsOrdered: analyticsData.totalItemsOrdered,
        topItemsCount: analyticsData.topItems.length,
        topRatedItemsCount: analyticsData.topRatedItems.length,
      });
      
      return sendJson(res, 200, analyticsData);
    }
    
    if (method === "GET") {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");
      const groupBy = url.searchParams.get("groupBy"); // 'day', 'item'
      
      let sales = await db.getSales();
      
      // Filter by date range
      if (startDate) {
        const start = Math.floor(new Date(startDate).getTime() / 1000);
        sales = sales.filter(s => s.created_at >= start);
      }
      
      if (endDate) {
        const end = Math.floor(new Date(endDate).getTime() / 1000);
        sales = sales.filter(s => s.created_at <= end);
      }
      
      // Group by
      if (groupBy === "item") {
        const itemMap = new Map();
        sales.forEach(sale => {
          const key = sale.item_id || sale.item_name;
          if (!itemMap.has(key)) {
            itemMap.set(key, {
              item_id: sale.item_id,
              item_name: sale.item_name,
              total_quantity: 0,
              total_revenue: 0,
              order_count: 0,
            });
          }
          const item = itemMap.get(key);
          item.total_quantity += sale.quantity || 0;
          item.total_revenue += sale.total || 0;
          item.order_count += 1;
        });
        
        const formatted = Array.from(itemMap.values())
          .sort((a, b) => b.total_revenue - a.total_revenue);
        
        return sendJson(res, 200, formatted.map(item => ({
          ...item,
          createdAt: null,
          totalRevenue: item.total_revenue,
          totalQuantity: item.total_quantity,
        })));
      } else if (groupBy === "day") {
        const dayMap = new Map();
        sales.forEach(sale => {
          const date = new Date(sale.created_at * 1000).toISOString().split('T')[0];
          if (!dayMap.has(date)) {
            dayMap.set(date, {
              date,
              total_revenue: 0,
              total_quantity: 0,
              order_count: 0,
            });
          }
          const day = dayMap.get(date);
          day.total_revenue += sale.total || 0;
          day.total_quantity += sale.quantity || 0;
          day.order_count += 1;
        });
        
        const formatted = Array.from(dayMap.values())
          .sort((a, b) => b.date.localeCompare(a.date));
        
        return sendJson(res, 200, formatted.map(day => ({
          ...day,
          createdAt: null,
          totalRevenue: day.total_revenue,
          totalQuantity: day.total_quantity,
        })));
      }
      
      // Default: return all sales
      sales.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      
      const formatted = sales.map(sale => ({
        ...sale,
        createdAt: sale.created_at ? sale.created_at * 1000 : null,
        totalRevenue: sale.total || 0,
        totalQuantity: sale.quantity || 0,
      }));
      
      return sendJson(res, 200, formatted);
    }

    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.end();
  } catch (error) {
    console.error("Sales API error:", error);
    return sendJson(res, 500, { error: error.message || "Internal server error" });
  }
};
