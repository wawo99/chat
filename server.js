/**
 * [https] 인증서 생성 방법
 * npm install -g mkcert
 * mkcert create-ca
 * mkcert create-cert
 */
const express = require("express");
const expressSanitizer = require("express-sanitizer");
const socketIo = require("./common/index");
const app = express();
const fs = require("fs");
const path = require("path");

const server = require("http").createServer(app);
const io = require("socket.io");
const httpio = io(server);

// const options = {
//   key: fs.readFileSync('./config/cert.key'),
//   cert: fs.readFileSync('./config/cert.crt'),
// }
// const httpsServer = require('https').createServer(options, app)
// const httpsio = io(httpsServer)
const db = {};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressSanitizer());
app.use(express.static(path.join(__dirname, "public")));

// ✅ IndexedDB 백업 API
app.post("/api/db-backup", (req, res) => {
  try {
    const { dbName, createdAt, data } = req.body;

    if (!dbName || !data) {
      return res.status(400).json({
        success: false,
        message: "잘못된 요청 데이터",
      });
    }

    // ✅ backup 폴더 자동 생성
    const backupDir = path.join(process.cwd(), "backup");

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // const fileName = `${dbName}_${Date.now()}.json`;
    const fileName = `${dbName}.json`;
    const filePath = path.join(backupDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log("✅ DB 백업 완료:", filePath);

    res.json({
      success: true,
      fileName,
      createdAt,
    });
  } catch (err) {
    console.error("❌ DB 백업 실패:", err);
    res.status(500).json({
      success: false,
      message: "서버 저장 실패",
    });
  }
});

// ✅ 단일 백업 파일 가져오기
app.get("/api/db-backup/:fileName", (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(process.cwd(), "backup", `${fileName}.json`);
    console.log("db-backup", filePath, fs.existsSync(filePath));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "파일 없음" });
    }

    const json = fs.readFileSync(filePath, "utf-8");
    res.json(JSON.parse(json));
  } catch (err) {
    res.status(500).json({ error: "파일 로드 실패" });
  }
});

server.listen(5000, () => {
  console.log("ok");
  socketIo.init(__dirname, httpio, db);
});

// httpsServer.listen(5500, () => {
//   console.log('https ok')
//   socketIo.init(__dirname, httpsio, db, 'https')
// })
