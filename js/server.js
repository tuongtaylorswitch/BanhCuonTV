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

// // Guess the win percent
// app.post("/win_percent", async (req, res) => {
//   try {
//     const { home_team, visitor_team } = req.body;

//     console.log("Guess the win percent of ", home_team, " ", visitor_team);

//     const prompt = `
//     You are an NBA prediction API.

//     Predict the winning probability for this NBA game.

//     Home team: ${home_team}
//     Visitor team: ${visitor_team}

//     Rules:
//     - Return ONLY valid JSON
//     - No markdown
//     - No explanation
//     - Total must equal 100
//     - Use numbers only

//     Format:
//     {
//       "home_team": number,
//       "visitor_team": number
//     }
//     `;

//     const answer=await askAI(prompt);
//     const text = answer.choices[0].message.content;

//     console.log(text);
//     const result = JSON.parse(text);
//     res.json(result);

    
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       error: "Gemini API failed"
//     });
//   }
// });


// chạy server
app.listen(3000, () => {
  console.log("Server chạy tại http://localhost:3000");
});


