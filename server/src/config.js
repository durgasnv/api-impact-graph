require("dotenv").config();

const config = {
  port: process.env.PORT || 3001,
  cognodb: {
    uri: process.env.COGNODB_URI || "bolt://localhost:7687",
    username: process.env.COGNODB_USERNAME || "neo4j",
    password: process.env.COGNODB_PASSWORD || "",
  },
};

module.exports = config;
