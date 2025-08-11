const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const db = new Database("db.sqlite");

// Configurações
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    secret: "orkut-clone-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Config upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Middleware de autenticação
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/public/login.html");
  next();
}

// Rotas
app.get("/", (req, res) => {
  if (!req.session.user) return res.redirect("/public/login.html");
  res.redirect("/public/profile.html");
});

app.post("/register", upload.single("avatar"), (req, res) => {
  const { name, email, password } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  const avatar = req.file ? `/uploads/${req.file.filename}` : null;
  db.prepare(
    "INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)"
  ).run(name, email, hash, avatar);
  res.redirect("/public/login.html");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.send("Credenciais inválidas");
  }
  req.session.user = { id: user.id, name: user.name, avatar: user.avatar };
  res.redirect("/public/profile.html");
});

app.post("/scrap", requireLogin, (req, res) => {
  const { content } = req.body;
  db.prepare("INSERT INTO scraps (user_id, content) VALUES (?, ?)").run(
    req.session.user.id,
    content
  );
  res.redirect("/public/profile.html");
});

app.get("/scraps", requireLogin, (req, res) => {
  const scraps = db.prepare(
    "SELECT s.content, u.name FROM scraps s JOIN users u ON s.user_id = u.id ORDER BY s.id DESC"
  ).all();
  res.json(scraps);
});

// Inicialização
app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
