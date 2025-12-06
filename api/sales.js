const { db } = require("./db");

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

module.exports = async (req, res) => {
  const { method } = req;

  try {
    // Check if this is the analytics endpoint
    const isAnalytics = req.url && (req.url.includes("/analytics") || req.url.includes("analytics"));
    
    if (method === "GET" && isAnalytics) {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const period = parseInt(url.searchParams.get("period") || "30"); // days
      
      const startDate = Math.floor((Date.now() - (period * 24 * 60 * 60 * 1000)) / 1000);
      
      let sales = await db.getSales();
      
      // Filter by date
      sales = sales.filter(s => s.created_at >= startDate);
      
      // Calculate totals
      const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
      const uniqueOrders = new Set(sales.map(s => s.order_id).filter(Boolean));
      const totalOrders = uniqueOrders.size;
      
      // Top items
      const itemMap = new Map();
      sales.forEach(sale => {
        const key = sale.item_id || sale.item_name;
        if (!itemMap.has(key)) {
          itemMap.set(key, { name: sale.item_name, quantity: 0, revenue: 0 });
        }
        const item = itemMap.get(key);
        item.quantity += sale.quantity || 0;
        item.revenue += sale.total || 0;
      });
      
      const topItems = Array.from(itemMap.values())
        .sort((a, b) => b.revenue - a.revenue)
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
      
      return sendJson(res, 200, {
        period,
        totalRevenue,
        totalOrders,
        topItems,
        dailyRevenue,
      });
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
