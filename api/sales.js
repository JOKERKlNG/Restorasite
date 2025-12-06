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
    // Check if this is the analytics endpoint
    const urlPath = req.url.split('?')[0];
    const isAnalytics = urlPath.includes("/analytics") || req.url.includes("analytics");
    
    if (method === "GET" && isAnalytics) {
      let url;
      try {
        url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      } catch (e) {
        url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
      }
      
      const period = parseInt(url.searchParams.get("period") || "30");
      const startDate = Math.floor((Date.now() - (period * 24 * 60 * 60 * 1000)) / 1000);
      
      let sales = [];
      try {
        sales = await db.getSales();
        if (!Array.isArray(sales)) sales = [];
      } catch (err) {
        console.error("Error fetching sales:", err);
        sales = [];
      }
      
      sales = sales.filter(s => s.created_at >= startDate);
      
      const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
      const uniqueOrders = new Set(sales.map(s => s.order_id).filter(Boolean));
      const totalOrders = uniqueOrders.size;
      const totalItemsOrdered = sales.reduce((sum, s) => sum + (s.quantity || 0), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
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
      
      return sendJson(res, 200, {
        period,
        totalRevenue: totalRevenue || 0,
        totalOrders: totalOrders || 0,
        totalItemsOrdered: totalItemsOrdered || 0,
        averageOrderValue: averageOrderValue || 0,
        topItems: topItems || [],
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
