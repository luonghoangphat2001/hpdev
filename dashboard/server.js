const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");
const { getConfig, setConfig, getAllHistory, getStats } = require("../db");

function startDashboard() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, "views")));
  app.use(
    session({
      secret: process.env.DASHBOARD_SECRET || "change-me-in-env",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 24 * 60 * 60 * 1000 },
    })
  );

  const auth = (req, res, next) => {
    if (req.session.loggedIn) return next();
    res.redirect("/");
  };

  app.get("/", (req, res) => {
    if (req.session.loggedIn) return res.redirect("/dashboard");
    res.sendFile(path.join(__dirname, "views/login.html"));
  });

  app.post("/login", (req, res) => {
    const { password } = req.body;
    const stored = getConfig("dashboard_password");
    if (stored && bcrypt.compareSync(password, stored)) {
      req.session.loggedIn = true;
      return res.redirect("/dashboard");
    }
    res.redirect("/?error=1");
  });

  app.post("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
  });

  app.get("/dashboard", auth, (req, res) => {
    res.sendFile(path.join(__dirname, "views/dashboard.html"));
  });

  app.get("/api/config", auth, (req, res) => {
    res.json({
      active_model: getConfig("active_model"),
      system_prompt: getConfig("system_prompt"),
    });
  });

  app.post("/api/config", auth, (req, res) => {
    const { active_model, system_prompt } = req.body;
    if (active_model) setConfig("active_model", active_model);
    if (system_prompt !== undefined) setConfig("system_prompt", system_prompt);
    res.json({ ok: true });
  });

  app.get("/api/history", auth, (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;
    res.json(getAllHistory(limit, offset));
  });

  app.get("/api/stats", auth, (req, res) => {
    res.json(getStats());
  });

  app.post("/api/password", auth, (req, res) => {
    const { password } = req.body;
    if (!password || password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    setConfig("dashboard_password", bcrypt.hashSync(password, 10));
    res.json({ ok: true });
  });

  const port = process.env.DASHBOARD_PORT || 3000;
  app.listen(port, () => console.log(`Dashboard: http://localhost:${port}`));
}

module.exports = { startDashboard };
