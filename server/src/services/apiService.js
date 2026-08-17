const { getDriver } = require("../db/driver");
const queries = require("../db/queries");

function recordToProps(record, key) {
  const node = record.get(key);
  return node ? node.properties : null;
}

function recordsToProps(records, key) {
  return records.map((r) => r.get(key).properties);
}

async function runQuery(cypher, params) {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

async function getAllApis() {
  const records = await runQuery(queries.GET_ALL_APIS);
  return records.map((r) => ({
    ...r.get("a").properties,
    versions: r.get("versions").map((v) => v.properties),
  }));
}

async function getApiById(id) {
  const records = await runQuery(queries.API_LOOKUP, { id });
  if (records.length === 0) return null;
  const r = records[0];
  return {
    ...r.get("a").properties,
    versions: r.get("versions").map((v) => v.properties),
  };
}

async function getDirectConsumers(apiId) {
  const records = await runQuery(queries.DIRECT_CONSUMERS, { apiId });
  return recordsToProps(records, "s");
}

async function getBlastRadius(apiId, versionId) {
  let resolvedVersionId = versionId;
  if (!resolvedVersionId) {
    const api = await getApiById(apiId);
    if (!api) return null;
    const active = api.versions.find((v) => v.status === "active");
    resolvedVersionId = active ? active.id : api.versions[0]?.id;
  }
  const [blastRecords, directRecords] = await Promise.all([
    runQuery(queries.BLAST_RADIUS, { versionId: resolvedVersionId }),
    runQuery(queries.BLAST_RADIUS_DIRECT_IDS, { versionId: resolvedVersionId }),
  ]);
  if (blastRecords.length === 0) return { services: [], teams: [], directIds: [] };
  const r = blastRecords[0];
  const directIds = directRecords.length > 0 ? directRecords[0].get("ids") : [];
  return {
    services: r.get("services").map((s) => s.properties),
    teams: r.get("teams").map((t) => t.properties),
    directIds,
  };
}

async function getAllServices() {
  const records = await runQuery(queries.GET_ALL_SERVICES);
  return recordsToProps(records, "s");
}

async function getServiceById(id) {
  const records = await runQuery(queries.SERVICE_DETAIL, { id });
  if (records.length === 0) return null;
  const r = records[0];
  return {
    ...r.get("s").properties,
    teams: r.get("teams").map((t) => t.properties),
    apis: r.get("apis").map((a) => a.properties),
    dependencies: r.get("dependencies").map((d) => d.properties),
  };
}

async function getServiceDependencies(id) {
  const records = await runQuery(queries.MULTI_HOP_DEPENDENCIES, { id });
  return recordsToProps(records, "affected");
}

async function getDependencyPath(sourceId, targetId) {
  const records = await runQuery(queries.DEPENDENCY_PATH, {
    sourceId,
    targetId,
  });
  if (records.length === 0) return null;
  const paths = records.map((r) => {
    const path = r.get("path");
    const nodes = [];
    const rels = [];
    for (const seg of path.segments) {
      nodes.push({ id: seg.start.properties.id, label: seg.start.labels[0] });
      rels.push(seg.relationship.type);
    }
    nodes.push({ id: path.end.properties.id, label: path.end.labels[0] });
    return { nodes, relationships: rels };
  });
  paths.sort((a, b) => a.nodes.length - b.nodes.length);
  return paths[0];
}

async function getAllTeams() {
  const records = await runQuery(queries.GET_ALL_TEAMS);
  return records.map((r) => ({
    ...r.get("t").properties,
    services: r.get("services").map((s) => s.properties),
  }));
}

async function getTeamById(id) {
  const records = await runQuery(queries.TEAM_BY_ID, { id });
  if (records.length === 0) return null;
  const r = records[0];
  return {
    ...r.get("t").properties,
    services: r.get("services").map((s) => s.properties),
  };
}

async function getDashboard() {
  const records = await runQuery(queries.DASHBOARD);
  if (records.length === 0) {
    return { apis: 0, services: 0, teams: 0, deprecatedVersions: 0 };
  }
  const r = records[0];
  return {
    apis: r.get("apiCount").toNumber(),
    services: r.get("serviceCount").toNumber(),
    teams: r.get("teamCount").toNumber(),
    deprecatedVersions: r.get("deprecatedCount").toNumber(),
  };
}

module.exports = {
  getAllApis,
  getApiById,
  getDirectConsumers,
  getBlastRadius,
  getAllServices,
  getServiceById,
  getServiceDependencies,
  getDependencyPath,
  getAllTeams,
  getTeamById,
  getDashboard,
};
