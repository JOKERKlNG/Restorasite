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
      const email = url.searchParams.get("email");
      
      if (email) {
        const user = db.prepare("SELECT id, email, name, role, avatar_url, favorites, created_at, updated_at FROM users WHERE email = ?").get(email);
        if (!user) {
          return sendJson(res, 404, { error: "User not found" });
        }
        
        return sendJson(res, 200, {
          ...user,
          favorites: user.favorites ? JSON.parse(user.favorites) : [],
          createdAt: user.created_at * 1000,
          updatedAt: user.updated_at * 1000,
        });
      }
      
      // Get all users (without passwords)
      const users = db.prepare("SELECT id, email, name, role, avatar_url, favorites, created_at, updated_at FROM users").all();
      
      const formatted = users.map(u => ({
        ...u,
        favorites: u.favorites ? JSON.parse(u.favorites) : [],
        createdAt: u.created_at * 1000,
        updatedAt: u.updated_at * 1000,
      }));
      
      return sendJson(res, 200, formatted);
    }

    if (method === "POST") {
      const payload = await parseBody(req);
      const { email, password, name, role } = payload;
      
      if (!email || !password || !name) {
        return sendJson(res, 400, {
          error: "email, password and name are required",
        });
      }

      // Check if user exists
      const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
      if (existing) {
        return sendJson(res, 409, { error: "User already exists" });
      }

      const userId = createId();
      const now = Math.floor(Date.now() / 1000);

      try {
        db.prepare(`
          INSERT INTO users (id, email, password, name, role, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          userId,
          email,
          password,
          name,
          role || "user",
          now,
          now
        );

        const user = db.prepare("SELECT id, email, name, role, avatar_url, favorites, created_at, updated_at FROM users WHERE id = ?").get(userId);
        
        return sendJson(res, 201, {
          ...user,
          favorites: user.favorites ? JSON.parse(user.favorites) : [],
          createdAt: user.created_at * 1000,
          updatedAt: user.updated_at * 1000,
        });
      } catch (dbError) {
        if (dbError.code === 'SQLITE_CONSTRAINT') {
          return sendJson(res, 409, { error: "User already exists" });
        }
        throw dbError;
      }
    }

    if (method === "PATCH") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const id = url.searchParams.get("id");
      if (!id) return sendJson(res, 400, { error: "id query parameter is required" });

      const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      if (!existing) {
        return sendJson(res, 404, { error: "User not found" });
      }

      const payload = await parseBody(req);
      const updates = [];
      const params = [];
      
      if (payload.name !== undefined) {
        updates.push("name = ?");
        params.push(payload.name);
      }
      if (payload.avatar_url !== undefined) {
        updates.push("avatar_url = ?");
        params.push(payload.avatar_url);
      }
      if (payload.favorites !== undefined) {
        updates.push("favorites = ?");
        params.push(JSON.stringify(payload.favorites));
      }
      if (payload.role !== undefined) {
        updates.push("role = ?");
        params.push(payload.role);
      }
      
      if (updates.length > 0) {
        updates.push("updated_at = ?");
        params.push(Math.floor(Date.now() / 1000));
        params.push(id);
        
        db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);
      }

      const updated = db.prepare("SELECT id, email, name, role, avatar_url, favorites, created_at, updated_at FROM users WHERE id = ?").get(id);
      
      return sendJson(res, 200, {
        ...updated,
        favorites: updated.favorites ? JSON.parse(updated.favorites) : [],
        createdAt: updated.created_at * 1000,
        updatedAt: updated.updated_at * 1000,
      });
    }

    res.statusCode = 405;
    res.setHeader("Allow", "GET,POST,PATCH");
    res.end();
  } catch (error) {
    console.error("Users API error:", error);
    return sendJson(res, 500, { error: error.message || "Internal server error" });
  }
};
