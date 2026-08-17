const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const config = require("./config");
const { getDriver, closeDriver } = require("./db/driver");
const healthRoutes = require("./routes/health");
const apiRoutes = require("./routes/apis");
const serviceRoutes = require("./routes/services");
const teamRoutes = require("./routes/teams");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api", apiRoutes);
app.use("/api", serviceRoutes);
app.use("/api", teamRoutes);
app.use("/api", dashboardRoutes);

const clientDist = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

getDriver();

async function start() {
  const driver = getDriver();
  const session = driver.session();
  try {
    await session.run("RETURN 1");
    console.log("CogODB connected");
  } finally {
    await session.close();
  }

  const server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });

  async function shutdown() {
    await new Promise((resolve) => server.close(resolve));
    await closeDriver();
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("Failed to connect to CogODB:", err.message);
  process.exit(1);
});
