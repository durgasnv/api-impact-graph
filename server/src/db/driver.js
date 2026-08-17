const neo4j = require("neo4j-driver");
const config = require("../config");

let driver = null;

function getDriver() {
  if (!driver) {
    driver = neo4j.driver(
      config.cognodb.uri,
      neo4j.auth.basic(config.cognodb.username, config.cognodb.password)
    );
  }
  return driver;
}

async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

module.exports = { getDriver, closeDriver };
