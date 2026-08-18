const express = require("express");
const { getDriver } = require("../db/driver");
const router = express.Router();

router.get("/health", async (req, res) => {
  try {
    const driver = getDriver();
    const session = driver.session();
    try {
      await session.run("RETURN 1");
      res.json({ status: "ok", database: "connected" });
    } finally {
      await session.close();
    }
  } catch (err) {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

module.exports = router;
