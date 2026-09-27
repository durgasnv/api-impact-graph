require("dotenv").config();

const config = {
  port: process.env.PORT || 3001,
  clientOrigins: (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  cognodb: {
    uri: process.env.COGNODB_URI || "bolt://localhost:7687",
    username: process.env.COGNODB_USERNAME || "neo4j",
    password: process.env.COGNODB_PASSWORD || "",
  },
};

module.exports = config;
