require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const { initDb } = require("./db");
const { startBot } = require("./bot");
const { startDashboard } = require("./dashboard/server");

initDb()
  .then(() => {
    startBot();
    startDashboard();
  })
  .catch((err) => {
    console.error("Failed to init DB:", err);
    process.exit(1);
  });
