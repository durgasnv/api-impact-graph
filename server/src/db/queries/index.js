const API_LOOKUP = require("./apiLookup");
const DIRECT_CONSUMERS = require("./directConsumers");
const MULTI_HOP_DEPENDENCIES = require("./multiHopDependencies");
const { BLAST_RADIUS, BLAST_RADIUS_DIRECT_IDS } = require("./blastRadius");
const DEPENDENCY_PATH = require("./dependencyPath");
const REPLACEMENT_VERSION = require("./replacementVersion");
const SERVICE_DETAIL = require("./serviceDetail");
const DASHBOARD = require("./dashboard");
const { DASHBOARD_GRAPH, DASHBOARD_GRAPH_DEPS } = require("./dashboardGraph");
const GET_ALL_APIS = require("./getAllApis");
const GET_ALL_SERVICES = require("./getAllServices");
const GET_ALL_TEAMS = require("./getAllTeams");
const TEAM_BY_ID = require("./teamById");

module.exports = {
  API_LOOKUP,
  DIRECT_CONSUMERS,
  MULTI_HOP_DEPENDENCIES,
  BLAST_RADIUS,
  BLAST_RADIUS_DIRECT_IDS,
  DEPENDENCY_PATH,
  REPLACEMENT_VERSION,
  SERVICE_DETAIL,
  DASHBOARD,
  DASHBOARD_GRAPH,
  DASHBOARD_GRAPH_DEPS,
  GET_ALL_APIS,
  GET_ALL_SERVICES,
  GET_ALL_TEAMS,
  TEAM_BY_ID,
};
