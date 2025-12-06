const { db } = require("./db");

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

module.exports = async (req, res) => {
  const { method } = req;

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Analytics endpoint
    if (method === "GET" && url.pathname.includes("/analytics")) {
      const period = url.searchParams.get("period") || "30"; // days
      
      const startDate = Math.floor((Date.now() - (parseInt(period) * 24 * 60 * 60 * 1000)) / 1000);
      
      // Total revenue
      const totalRevenue = db.prepare(`
        SELECT SUM(total) as total FROM sales WHERE created_at >= ?
      `).get(startDate);
      
      // Total orders
      const totalOrders = db.prepare(`
        SELECT COUNT(DISTINCT order_id) as count FROM sales WHERE created_at >= ?
      `).get(startDate);
      
      // Top items
      const topItems = db.prepare(`
        SELECT item_name, SUM(quantity) as quantity, SUM(total) as revenue
        FROM sales
        WHERE created_at >= ?
        GROUP BY item_id, item_name
        ORDER BY revenue DESC
        LIMIT 10
      `).all(startDate);
      
      // Daily revenue
      const dailyRevenue = db.prepare(`
        SELECT 
          DATE(datetime(created_at, 'unixepoch')) as date,
          SUM(total) as revenue,
          COUNT(*) as transactions
        FROM sales
        WHERE created_at >= ?
        GROUP BY date
        ORDER BY date DESC
      `).all(startDate);
      
      return sendJson(res, 200, {
        period: parseInt(period),
        totalRevenue: totalRevenue?.total || 0,
        totalOrders: totalOrders?.count || 0,
        topItems: topItems.map(item => ({
          name: item.item_name,
          quantity: item.quantity,
          revenue: item.revenue,
        })),
        dailyRevenue: dailyRevenue.map(day => ({
          date: day.date,
          revenue: day.revenue,
          transactions: day.transactions,
        })),
      });
    }
    
    if (method === "GET") {
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");
      const groupBy = url.searchParams.get("groupBy"); // 'day', 'item', 'category'
      
      let query = "SELECT * FROM sales";
      const params = [];
      
      if (startDate) {
        query += " WHERE created_at >= ?";
        params.push(Math.floor(new Date(startDate).getTime() / 1000));
      }
      
      if (endDate) {
        query += startDate ? " AND created_at <= ?" : " WHERE created_at <= ?";
        params.push(Math.floor(new Date(endDate).getTime() / 1000));
      }
      
      if (groupBy === "item") {
        query = `
          SELECT 
            item_id,
            item_name,
            SUM(quantity) as total_quantity,
            SUM(total) as total_revenue,
            COUNT(*) as order_count
          FROM sales
          ${params.length > 0 ? "WHERE " + (startDate ? "created_at >= ? AND created_at <= ?" : "created_at <= ?") : ""}
          GROUP BY item_id, item_name
          ORDER BY total_revenue DESC
        `;
      } else if (groupBy === "day") {
        query = `
          SELECT 
            DATE(datetime(created_at, 'unixepoch')) as date,
            SUM(total) as total_revenue,
            SUM(quantity) as total_quantity,
            COUNT(*) as order_count
          FROM sales
          ${params.length > 0 ? "WHERE " + (startDate ? "created_at >= ? AND created_at <= ?" : "created_at <= ?") : ""}
          GROUP BY date
          ORDER BY date DESC
        `;
      } else {
        query += " ORDER BY created_at DESC";
      }
      
      const sales = db.prepare(query).all(...params);
      
      // Convert timestamps
      const formatted = sales.map(sale => ({
        ...sale,
        createdAt: sale.created_at ? sale.created_at * 1000 : null,
        totalRevenue: sale.total_revenue || sale.total || 0,
        totalQuantity: sale.total_quantity || sale.quantity || 0,
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
