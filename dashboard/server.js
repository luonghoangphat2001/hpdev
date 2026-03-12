const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");
const { getConfig, setConfig, getAllHistory, getStats } = require("../db");
const { askClaude } = require("../ai/claude");
const { askGemini } = require("../ai/gemini");

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

  app.post("/logout", (_req, res) => {
    res.redirect("/");
  });

  app.get("/dashboard", auth, (_req, res) => {
    res.sendFile(path.join(__dirname, "views/dashboard.html"));
  });

  app.get("/api/config", auth, (_req, res) => {
    res.json({
      active_model: getConfig("active_model"),
      system_prompt: getConfig("system_prompt"),
      claude_base_url: getConfig("claude_base_url"),
    });
  });

  app.post("/api/config", auth, async (req, res) => {
    const { active_model, system_prompt, claude_base_url } = req.body;
    if (active_model) await setConfig("active_model", active_model);
    if (system_prompt !== undefined) await setConfig("system_prompt", system_prompt);
    if (claude_base_url !== undefined) await setConfig("claude_base_url", claude_base_url);
    res.json({ ok: true });
  });

  app.get("/api/history", auth, async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;
    res.json(await getAllHistory(limit, offset));
  });

  app.get("/api/stats", auth, async (_req, res) => {
    res.json(await getStats());
  });

  app.post("/api/chat", auth, async (req, res) => {
    const { message, model } = req.body;
    if (!message) return res.status(400).json({ error: "No message" });

    const activeModel = model || getConfig("active_model") || "gemini";
    const systemPrompt = getConfig("system_prompt") || "You are a helpful assistant.";

    try {
      const response =
        activeModel === "claude"
          ? await askClaude([{ role: "user", content: message }], systemPrompt)
          : await askGemini([{ role: "user", content: message }], systemPrompt);
      res.json({ response, model: activeModel });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/password", auth, async (req, res) => {
    const { password } = req.body;
    if (!password || password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    await setConfig("dashboard_password", bcrypt.hashSync(password, 10));
    res.json({ ok: true });
  });

  const port = process.env.DASHBOARD_PORT || 3000;
  app.listen(port, () => console.log(`Dashboard: http://localhost:${port}`));
}

module.exports = { startDashboard };
