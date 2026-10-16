const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// kết nối MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err){
    // throw err;
    console.log("MySQL connection error: ");
    return;  
  }
  console.log("MySQL connected");
});

// GET: lấy comment
app.get("/comments", (req, res) => {
  // console.log("API called");
  db.query(
    "SELECT * FROM comments ORDER BY id DESC",
    (err, result) => {
      if (err) throw err;
      res.json(result);
      // console.log(result);
    }
  );
});

// POST: gửi comment
app.post("/comments", (req, res) => {
  const { username, content } = req.body;

  if (!username || !content) {
    return res.json({ error: "Thiếu dữ liệu" });
  }

  db.query(
    "INSERT INTO comments (username, content) VALUES (?, ?)",
    [username, content],
    (err) => {
      if (err) throw err;
      // res.json({ ok: true });
      res.send("Đã Insert cmt vào DB");
    }
  );
});

app.delete("/comments", (req, res) => {
  const ID = req.body.id;
  console.log(ID);
  db.query(
    "DELETE FROM comments WHERE id = ?", [ID],
    (err) => {
      if (err) throw err;
      // res.json({ ok: true });
      console.log("Đã Delete cmt với ID: ", ID);
      res.send("Đã Delete cmt với ID: ", ID);
    }
  ); 
});

// Comment cho mỗi trận
//////////////////////////////////////////////
app.get("/game_comments", (req, res) => {
  const { gameId } = req.query;

  if (!gameId) {
    return res.json({ error: "Thiếu gameId???" });
  }

  db.query(
    "SELECT * FROM game_comments WHERE gameId = ? ORDER BY id ASC",
    [gameId], 
    (err, result) => {
      if (err) throw err;
      res.json(result);
    }
  );
});
app.post("/game_comments", (req, res) => {
  const { gameId, username, content } = req.body;

  if (!gameId || !username || !content) {
    return res.json({ error: "Thiếu dữ liệu" });
  }

  db.query(
    "INSERT INTO game_comments (gameId, username, content) VALUES (?, ?, ?)",
    [gameId, username, content],
    (err) => {
      if (err) throw err;
      res.json({ ok: true });
    }
  );
});



// Geuss the win percentsssdasd
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_KEY});

async function askAI(prompt) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "openai/gpt-oss-20b",
  });
}
// ===== Proxy NBA (balldontlie) =====
const NBA_API_KEY = process.env.NBA_API_KEY; 
const gamesCache = new Map(); 
const GAMES_CACHE_TTL = 15 * 1000; 
app.get("/games", async (req, res) => {
  try {
    // /games?dates=2026-10-15,2026-10-16,2026-10-17  (1 ngày hoặc nhiều ngày)
    const dates = String(req.query.dates || "")
      .split(",")
      .map(d => d.trim())
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .slice(0, 7); // giới hạn tối đa 7 ngày/lần

    if (dates.length === 0) {
      return res.status(400).json({ error: "Thiếu hoặc sai định dạng dates (YYYY-MM-DD)" });
    }

    const key = [...dates].sort().join(",");
    const cached = gamesCache.get(key);
    if (cached && Date.now() - cached.time < GAMES_CACHE_TTL) {
      return res.json(cached.data);
    }

    const params = new URLSearchParams();
    dates.forEach(d => params.append("dates[]", d));
    params.set("per_page", "100");

    const r = await fetch(`https://api.balldontlie.io/v1/games?${params}`, {
      headers: { Authorization: NBA_API_KEY }
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("NBA API lỗi:", r.status, text);
      // lỗi (vd 429) thì trả cache cũ nếu có
      if (cached) return res.json(cached.data);
      return res.status(r.status).json({ error: "NBA API lỗi", status: r.status });
    }

    const data = await r.json();
    gamesCache.set(key, { time: Date.now(), data });
    res.json(data);
  } catch (err) {
    console.error("Lỗi /games:", err);
    res.status(500).json({ error: "Server lỗi" });
  }
});


// chạy server
app.listen(3000, () => {
  console.log("Server chạy tại http://localhost:3000");
});


