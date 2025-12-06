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
      const status = url.searchParams.get("status");
      const date = url.searchParams.get("date");
      
      let query = "SELECT * FROM reservations";
      const params = [];
      
      if (status) {
        query += " WHERE status = ?";
        params.push(status);
      }
      
      if (date) {
        query += status ? " AND date = ?" : " WHERE date = ?";
        params.push(date);
      }
      
      query += " ORDER BY created_at DESC";
      
      const reservations = db.prepare(query).all(...params);
      
      // Convert timestamps to numbers for compatibility
      const formatted = reservations.map(r => ({
        ...r,
        createdAt: r.created_at * 1000,
        updatedAt: r.updated_at * 1000,
        requests: r.notes || "",
        userEmail: r.email || null,
      }));
      
      return sendJson(res, 200, formatted);
    }

    if (method === "POST") {
      const payload = await parseBody(req);
      const {
        id,
        name,
        phone,
        guests,
        date,
        time,
        notes,
        userEmail,
      } = payload;

      if (!name || !phone || !guests || !date || !time) {
        return sendJson(res, 400, {
          error: "name, phone, guests, date and time are required for a reservation",
        });
      }

      const reservationId = id || createId();
      const now = Math.floor(Date.now() / 1000);

      try {
        db.prepare(`
          INSERT INTO reservations (id, name, phone, email, date, time, guests, notes, status, user_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?, ?)
        `).run(
          reservationId,
          name,
          phone,
          userEmail || null,
          date,
          time,
          Number(guests),
          notes || "",
          now,
          now
        );

        const reservation = db.prepare("SELECT * FROM reservations WHERE id = ?").get(reservationId);
        
        return sendJson(res, 201, {
          ...reservation,
          createdAt: reservation.created_at * 1000,
          updatedAt: reservation.updated_at * 1000,
          requests: reservation.notes || "",
          userEmail: reservation.email || null,
        });
      } catch (dbError) {
        if (dbError.code === 'SQLITE_CONSTRAINT') {
          return sendJson(res, 409, { error: "Reservation already exists" });
        }
        throw dbError;
      }
    }

    if (method === "PATCH") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const id = url.searchParams.get("id");
      if (!id) return sendJson(res, 400, { error: "id query parameter is required" });

      const payload = await parseBody(req);
      const { status } = payload;

      if (status && !["pending", "approved", "rejected"].includes(status)) {
        return sendJson(res, 400, {
          error: "status must be pending, approved or rejected",
        });
      }

      const existing = db.prepare("SELECT * FROM reservations WHERE id = ?").get(id);
      if (!existing) {
        return sendJson(res, 404, { error: "Reservation not found" });
      }

      const updates = [];
      const params = [];
      
      if (status) {
        updates.push("status = ?");
        params.push(status);
      }
      
      if (updates.length > 0) {
        updates.push("updated_at = ?");
        params.push(Math.floor(Date.now() / 1000));
        params.push(id);
        
        db.prepare(`UPDATE reservations SET ${updates.join(", ")} WHERE id = ?`).run(...params);
      }

      const updated = db.prepare("SELECT * FROM reservations WHERE id = ?").get(id);
      
      return sendJson(res, 200, {
        ...updated,
        createdAt: updated.created_at * 1000,
        updatedAt: updated.updated_at * 1000,
        requests: updated.notes || "",
        userEmail: updated.email || null,
      });
    }

    if (method === "DELETE") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const id = url.searchParams.get("id");

      if (id) {
        const existing = db.prepare("SELECT * FROM reservations WHERE id = ?").get(id);
        if (!existing) {
          return sendJson(res, 404, { error: "Reservation not found" });
        }
        db.prepare("DELETE FROM reservations WHERE id = ?").run(id);
      } else {
        // Clear all reservations (admin only - you might want to add auth check)
        db.prepare("DELETE FROM reservations").run();
      }

      res.statusCode = 204;
      return res.end();
    }

    res.statusCode = 405;
    res.setHeader("Allow", "GET,POST,PATCH,DELETE");
    res.end();
  } catch (error) {
    console.error("Reservations API error:", error);
    return sendJson(res, 500, { error: error.message || "Internal server error" });
  }
};
