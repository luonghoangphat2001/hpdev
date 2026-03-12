require("dotenv").config();
const { startBot } = require("./bot");
const { startDashboard } = require("./dashboard/server");

startBot();
startDashboard();
