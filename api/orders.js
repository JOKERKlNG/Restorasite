const { db, createId } = require("./db");

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (e) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  const { method } = req;

  try {
    if (method === "GET") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const userId = url.searchParams.get("userId");
      const userEmail = url.searchParams.get("userEmail");
      const status = url.searchParams.get("status");
      
      let query = "SELECT o.* FROM orders o";
      const params = [];
      const conditions = [];
      
      if (userId || userEmail) {
        if (userEmail) {
          // Look up user by email first
          const user = db.prepare("SELECT id FROM users WHERE email = ?").get(userEmail);
          if (user) {
            conditions.push("o.user_id = ?");
            params.push(user.id);
          } else {
            // User not found, return empty array
            return sendJson(res, 200, []);
          }
        } else {
          conditions.push("o.user_id = ?");
          params.push(userId);
        }
      }
      
      if (status) {
        conditions.push("o.status = ?");
        params.push(status);
      }
      
      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
      
      query += " ORDER BY o.created_at DESC";
      
      const orders = db.prepare(query).all(...params);
      
      // Parse items JSON and convert timestamps
      const formatted = orders.map(order => ({
        ...order,
        userId: order.user_id,
        items: JSON.parse(order.items || "[]"),
        createdAt: order.created_at * 1000,
        updatedAt: order.updated_at * 1000,
      }));
      
      return sendJson(res, 200, formatted);
    }

    if (method === "POST") {
      const payload = await parseBody(req);
      const { userId, items, subtotal, tax, total, paymentMethod } = payload;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return sendJson(res, 400, {
          error: "items array is required",
        });
      }

      if (typeof subtotal !== "number" || typeof total !== "number") {
        return sendJson(res, 400, {
          error: "subtotal and total must be numbers",
        });
      }

      const orderId = createId();
      const now = Math.floor(Date.now() / 1000);

      try {
        // If userId is an email, look up the actual user ID
        let actualUserId = userId;
        if (userId && userId.includes("@")) {
          const user = db.prepare("SELECT id FROM users WHERE email = ?").get(userId);
          actualUserId = user ? user.id : null;
        }
        
        // Create order
        db.prepare(`
          INSERT INTO orders (id, user_id, items, subtotal, tax, total, status, payment_method, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
        `).run(
          orderId,
          actualUserId || null,
          JSON.stringify(items),
          subtotal,
          tax || 0,
          total,
          paymentMethod || null,
          now,
          now
        );

        // Create sales records for analytics
        const insertSale = db.prepare(`
          INSERT INTO sales (id, order_id, item_id, item_name, quantity, price, total, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertSales = db.transaction((orderItems) => {
          for (const item of orderItems) {
            insertSale.run(
              createId(),
              orderId,
              item.id || null,
              item.name || "Unknown",
              item.qty || 1,
              item.price || 0,
              (item.price || 0) * (item.qty || 1),
              now
            );
          }
        });

        insertSales(items);

        const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
        
        return sendJson(res, 201, {
          ...order,
          userId: order.user_id,
          items: JSON.parse(order.items || "[]"),
          createdAt: order.created_at * 1000,
          updatedAt: order.updated_at * 1000,
        });
      } catch (dbError) {
        console.error("Database error creating order:", dbError);
        throw dbError;
      }
    }

    if (method === "PATCH") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const id = url.searchParams.get("id");
      if (!id) return sendJson(res, 400, { error: "id query parameter is required" });

      const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
      if (!existing) {
        return sendJson(res, 404, { error: "Order not found" });
      }

      const payload = await parseBody(req);
      const updates = [];
      const params = [];
      
      if (payload.status !== undefined) {
        updates.push("status = ?");
        params.push(payload.status);
      }
      
      if (updates.length > 0) {
        updates.push("updated_at = ?");
        params.push(Math.floor(Date.now() / 1000));
        params.push(id);
        
        db.prepare(`UPDATE orders SET ${updates.join(", ")} WHERE id = ?`).run(...params);
      }

      const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
      
      return sendJson(res, 200, {
        ...updated,
        userId: updated.user_id,
        items: JSON.parse(updated.items || "[]"),
        createdAt: updated.created_at * 1000,
        updatedAt: updated.updated_at * 1000,
      });
    }

    res.statusCode = 405;
    res.setHeader("Allow", "GET,POST,PATCH");
    res.end();
  } catch (error) {
    console.error("Orders API error:", error);
    return sendJson(res, 500, { error: error.message || "Internal server error" });
  }
};

