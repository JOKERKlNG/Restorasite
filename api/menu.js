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
      const category = url.searchParams.get("category");
      const search = url.searchParams.get("search");
      const available = url.searchParams.get("available");
      
      let query = "SELECT * FROM menu";
      const params = [];
      const conditions = [];
      
      if (category) {
        conditions.push("category = ?");
        params.push(category);
      }
      
      if (search) {
        conditions.push("(name LIKE ? OR description LIKE ?)");
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }
      
      if (available !== null && available !== undefined) {
        conditions.push("available = ?");
        params.push(available === "true" || available === "1" ? 1 : 0);
      }
      
      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
      
      query += " ORDER BY created_at DESC";
      
      const menu = db.prepare(query).all(...params);
      
      // Convert timestamps
      const formatted = menu.map(item => ({
        ...item,
        createdAt: item.created_at * 1000,
        updatedAt: item.updated_at * 1000,
        available: item.available === 1,
      }));
      
      return sendJson(res, 200, formatted);
    }

    if (method === "POST") {
      const payload = await parseBody(req);
      const { id, name, price, image, category, description, available } = payload;
      
      if (!name || !price) {
        return sendJson(res, 400, { error: "name and price are required" });
      }

      const itemId = id || createId();
      const now = Math.floor(Date.now() / 1000);

      try {
        db.prepare(`
          INSERT INTO menu (id, name, price, image, category, description, available, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          itemId,
          name,
          Number(price),
          image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=60",
          category || "Specials",
          description || null,
          available !== undefined ? (available ? 1 : 0) : 1,
          now,
          now
        );

        const item = db.prepare("SELECT * FROM menu WHERE id = ?").get(itemId);
        
        return sendJson(res, 201, {
          ...item,
          createdAt: item.created_at * 1000,
          updatedAt: item.updated_at * 1000,
          available: item.available === 1,
        });
      } catch (dbError) {
        if (dbError.code === 'SQLITE_CONSTRAINT') {
          return sendJson(res, 409, { error: "Menu item already exists" });
        }
        throw dbError;
      }
    }

    if (method === "PUT" || method === "PATCH") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const id = url.searchParams.get("id");
      if (!id) return sendJson(res, 400, { error: "id query parameter is required" });

      const existing = db.prepare("SELECT * FROM menu WHERE id = ?").get(id);
      if (!existing) {
        return sendJson(res, 404, { error: "Menu item not found" });
      }

      const payload = await parseBody(req);
      const updates = [];
      const params = [];
      
      if (payload.name !== undefined) {
        updates.push("name = ?");
        params.push(payload.name);
      }
      if (payload.price !== undefined) {
        updates.push("price = ?");
        params.push(Number(payload.price));
      }
      if (payload.image !== undefined) {
        updates.push("image = ?");
        params.push(payload.image);
      }
      if (payload.category !== undefined) {
        updates.push("category = ?");
        params.push(payload.category);
      }
      if (payload.description !== undefined) {
        updates.push("description = ?");
        params.push(payload.description);
      }
      if (payload.available !== undefined) {
        updates.push("available = ?");
        params.push(payload.available ? 1 : 0);
      }
      
      if (updates.length > 0) {
        updates.push("updated_at = ?");
        params.push(Math.floor(Date.now() / 1000));
        params.push(id);
        
        db.prepare(`UPDATE menu SET ${updates.join(", ")} WHERE id = ?`).run(...params);
      }

      const updated = db.prepare("SELECT * FROM menu WHERE id = ?").get(id);
      
      return sendJson(res, 200, {
        ...updated,
        createdAt: updated.created_at * 1000,
        updatedAt: updated.updated_at * 1000,
        available: updated.available === 1,
      });
    }

    if (method === "DELETE") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const id = url.searchParams.get("id");
      if (!id) return sendJson(res, 400, { error: "id query parameter is required" });

      const existing = db.prepare("SELECT * FROM menu WHERE id = ?").get(id);
      if (!existing) {
        return sendJson(res, 404, { error: "Menu item not found" });
      }

      db.prepare("DELETE FROM menu WHERE id = ?").run(id);
      res.statusCode = 204;
      return res.end();
    }

    res.statusCode = 405;
    res.setHeader("Allow", "GET,POST,PUT,PATCH,DELETE");
    res.end();
  } catch (error) {
    console.error("Menu API error:", error);
    return sendJson(res, 500, { error: error.message || "Internal server error" });
  }
};
