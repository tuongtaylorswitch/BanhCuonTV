const gameMap = new Map(); // id → element

// Cập nhật ảnh, tỉ số
async function updateGameElement(el, game) {
  const date = new Date(game.datetime);
  // // ⏰ giờ phút (dòng trên)
  const time = date.toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit"
  });
  // 📅 ngày tháng (dòng dưới)
  const day = date.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit"
  });
  // // gán vào HTML
  el.querySelector(".time").textContent = time;
  el.querySelector(".date").textContent = day;
  // // debug
  // console.log(time, day);
   
  // console.log(day);

  el.querySelector(".name-home").textContent = game.home_team.full_name;
  el.querySelector(".name-away").textContent = game.visitor_team.full_name;

  el.querySelector(".logo-home").src =
    `https://a.espncdn.com/i/teamlogos/nba/500/${game.home_team.abbreviation.toLowerCase()}.png`;

  el.querySelector(".logo-away").src =
    `https://a.espncdn.com/i/teamlogos/nba/500/${game.visitor_team.abbreviation.toLowerCase()}.png`;

  const score = game.period == 0
    ? "Sắp diễn ra"
    : `${game.home_team_score} - ${game.visitor_team_score}`;

  el.querySelector(".score").textContent = score;

}

function Card_loadComments(gameId, card) {
  const box = card.querySelector(".Game-comments");

  if (!card.last_cmt) card.last_cmt = 0;

  fetch(`http://localhost:3000/game_comments?gameId=${gameId}`)
    .then(res => res.json())
    .then(data => {
      data.forEach(cmt => {
        if (cmt.id > card.last_cmt) {
          box.innerHTML += `
            <div class="Game-cmt">
              <b>${cmt.username}</b>: ${cmt.content}
            </div>
          `;
          card.last_cmt = cmt.id;
          box.scrollTop = box.scrollHeight;
        }
      });
    });
}
function startAutoLoadComments(gameId, card) {
  // load ngay lần đầu
  Card_loadComments(gameId, card);

  // mỗi 3 giây load lại
  setInterval(() => {
    Card_loadComments(gameId, card);
  }, 3000); // 3000ms = 3s
}
function Card_sendComment(gameId, card) {
  const username = card.querySelector(".username").value;
  const content = card.querySelector(".content").value;

  if (!username || !content) {
    alert("Nhập thiếu!");
    return;
  }

  fetch("http://localhost:3000/game_comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      gameId,
      username,
      content
    })
  })
  .then(() => {
    // clear input
    card.querySelector(".content").value = "";

    // reload comment
    Card_loadComments(gameId, card);
  });
}
async function Guess_the_win_percent(game, card){
  // Send teams name to server
  try {
    const win_percent=await fetch("http://localhost:3000/win_percent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        home_team: game.home_team.full_name,
        visitor_team: game.visitor_team.full_name
      })
    });
    const data = await win_percent.json();

    console.log(data);
    console.log(data.home_team);
    console.log(data.visitor_team);

    // Front end
    const homeBar = await card.querySelector(".win_bar_home");
    const visitorBar = await card.querySelector(".win_bar_visitor");

    homeBar.style.width = `${data.home_team}%`;
    visitorBar.style.width = `${data.visitor_team}%`;

    // đội nhiều % hơn => xanh
    if (data.home_team > data.visitor_team) {

        homeBar.style.background = "#22c55e";
        visitorBar.style.background = "#ef4444";

    } else if (data.visitor_team > data.home_team) {

        visitorBar.style.background = "#22c55e";
        homeBar.style.background = "#ef4444";

    } else {

        homeBar.style.background = "#888";
        visitorBar.style.background = "#888";
    }

    // console.log(document.getElementById("homeText"));
    card.querySelector(".homeText").textContent =
        `${game.home_team.full_name}: ${data.home_team}%`;

    card.querySelector(".visitorText").textContent =
        `${game.visitor_team.full_name}: ${data.visitor_team}%`;

    // const get_from_server = await fetch("http://localhost:3000/win_percent");
    // const data = await get_from_server.json();
    // console.log(data);

  } catch (err) {
    console.error("Error: ", err);
  }
}

/////////// -------------------- Update each game
function updateGames(data) {
  data.data.forEach(game => {
    const el = gameMap.get(game.id);

    if (el) {
      updateGameElement(el, game); 
    }
  });
}
function loadGames(first = false, t) {
  return fetch(`http://localhost:3000/games?dates=${t}`)
  .then(res => res.json())
  .then(data => {
    console.log("loading");
    if (first) initialRender(data);
    else updateGames(data);
  });
}


/////////// -------------------- Update first game
function initialRender(data) {
  // console.log(123);
  const container = document.getElementById("Result");
  const template = document.getElementById("game-template");


  data.data.sort((a, b) => {
    return new Date(b.datetime) - new Date(a.datetime);
  });

  data.data.forEach(game => {
    const clone = template.content.cloneNode(true);
    const el = clone.querySelector(".card");

    //debug
    console.log(game.id, game.home_team.full_name, "vs", game.visitor_team.full_name);

    el.dataset.id = game.id;
    // 
    // 
    // set dữ liệu ban đầu
    updateGameElement(el, game);

    ///// Comment
      // 🔥 load comment cho trận này
      startAutoLoadComments(game.id, el);

      // // 🔥 gắn nút gửi
      const btn = el.querySelector(".send-btn");
      btn.addEventListener("click", () => {
        console.log("Send cmt at ", game.id);
        Card_sendComment(game.id, el);
        Card_loadComments(game.id, el);
      });
      // console.log("Finish ", game.id);
    //////////
    
    Guess_the_win_percent(game, el);

    container.prepend(clone);
    gameMap.set(game.id, el); // 🔥 lưu lại
  });
} 
async function FirstloadGames(first = false) {
  console.log("FirstloadGames được gọi");
  console.log("Ngày:", { tm, t, y });

  const dates = [tm, t, y].filter(d => d && d !== "undefined").join(",");

  try {
    const res = await fetch(`http://localhost:3000/games?dates=${dates}`);
    console.log("HTTP status:", res.status);

    const data = await res.json();

    if (!res.ok) {
      console.error("API lỗi:", res.status, data);
      return;
    }

    console.log("Số trận:", data.data?.length);

    if (!Array.isArray(data.data)) {
      console.error("API không trả về mảng data:", data);
      return;
    }

    initialRender(data);
  } catch (error) {
    console.error("Lỗi tải trận đấu:", error);
  }
}

// Chuẩn hóa ngày
function formatDate(date) {
    return date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2, "0") + "-" +
        String(date.getDate()).padStart(2, "0");
} 
async function loadOlder() {
  // console.days_ago
  days_ago++;
  let old_date = new Date(today);
  old_date.setDate(today.getDate()-days_ago);
  // loadGames(true, formatDate(d));

  const d = formatDate(old_date);

  console.log("Load ngày:", d);

  await loadGames(true, d); // 👈 gọi API
}
////////////////////////////////////////////////////////
const today = new Date();
let days_ago = 1;

const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);

const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 1);
//fsdf
const y = formatDate(yesterday);
const t = formatDate(today);
const tm = formatDate(tomorrow);
FirstloadGames(true);

console.log("Yesterday:", y);
console.log("Today:", t);
console.log("Tomorrow:", tm);