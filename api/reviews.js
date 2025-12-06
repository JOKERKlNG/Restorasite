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
      const itemId = url.searchParams.get("itemId");
      
      let query = "SELECT * FROM reviews";
      const params = [];
      
      if (itemId) {
        query += " WHERE item_id = ?";
        params.push(itemId);
      }
      
      query += " ORDER BY created_at DESC";
      
      const reviews = db.prepare(query).all(...params);
      
      // Convert timestamps
      const formatted = reviews.map(r => ({
        ...r,
        itemId: r.item_id,
        itemName: r.item_name,
        reviewerName: r.reviewer_name,
        timestamp: r.created_at * 1000,
        createdAt: r.created_at * 1000,
        updatedAt: r.updated_at * 1000,
      }));
      
      return sendJson(res, 200, formatted);
    }

    if (method === "POST") {
      const payload = await parseBody(req);
      const { id, itemId, rating, reviewerName, text, userEmail } = payload;
      
      if (!itemId || !rating || !reviewerName || !text) {
        return sendJson(res, 400, {
          error: "itemId, rating, reviewerName and text are required",
        });
      }

      if (rating < 1 || rating > 5) {
        return sendJson(res, 400, {
          error: "rating must be between 1 and 5",
        });
      }

      // Get item name
      const item = db.prepare("SELECT name FROM menu WHERE id = ?").get(itemId);
      const itemName = item?.name || "Unknown";

      const reviewId = id || createId();
      const now = Math.floor(Date.now() / 1000);

      try {
        db.prepare(`
          INSERT INTO reviews (id, item_id, item_name, rating, reviewer_name, text, user_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
        `).run(
          reviewId,
          itemId,
          itemName,
          Number(rating),
          reviewerName,
          text,
          now,
          now
        );

        const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(reviewId);
        
        return sendJson(res, 201, {
          ...review,
          itemId: review.item_id,
          itemName: review.item_name,
          reviewerName: review.reviewer_name,
          timestamp: review.created_at * 1000,
          createdAt: review.created_at * 1000,
          updatedAt: review.updated_at * 1000,
        });
      } catch (dbError) {
        if (dbError.code === 'SQLITE_CONSTRAINT') {
          return sendJson(res, 409, { error: "Review already exists" });
        }
        throw dbError;
      }
    }

    if (method === "DELETE") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const id = url.searchParams.get("id");
      if (!id) return sendJson(res, 400, { error: "id query parameter is required" });

      const existing = db.prepare("SELECT * FROM reviews WHERE id = ?").get(id);
      if (!existing) {
        return sendJson(res, 404, { error: "Review not found" });
      }

      db.prepare("DELETE FROM reviews WHERE id = ?").run(id);
      res.statusCode = 204;
      return res.end();
    }

    res.statusCode = 405;
    res.setHeader("Allow", "GET,POST,DELETE");
    res.end();
  } catch (error) {
    console.error("Reviews API error:", error);
    return sendJson(res, 500, { error: error.message || "Internal server error" });
  }
};
