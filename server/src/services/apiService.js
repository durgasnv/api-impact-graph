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

function toNumber(value) {
  if (value == null) return 0;
  return typeof value.toNumber === "function" ? value.toNumber() : Number(value);
}

function buildOverviewGraph(apiRecords, depRecords) {
  const nodes = [];
  const links = [];
  const nodeIds = new Set();
  const serviceIds = new Set();
  const linkKeys = new Set();

  for (const record of apiRecords) {
    const api = record.get("a")?.properties;
    if (!api?.id) continue;
    const consumers = (record.get("consumers") || [])
      .map((node) => node?.properties)
      .filter(Boolean);
    const consumerCount = toNumber(record.get("consumerCount"));

    if (!nodeIds.has(api.id)) {
      nodeIds.add(api.id);
      nodes.push({
        id: api.id,
        label: api.name,
        type: "api",
        domain: api.domain,
        consumers: consumerCount,
      });
    }

    for (const service of consumers.slice(0, 2)) {
      if (!service.id) continue;
      if (!nodeIds.has(service.id)) {
        nodeIds.add(service.id);
        serviceIds.add(service.id);
        nodes.push({
          id: service.id,
          label: service.name,
          type: "service",
        });
      }
      const key = `${service.id}->${api.id}->CALLS`;
      if (!linkKeys.has(key)) {
        linkKeys.add(key);
        links.push({ source: service.id, target: api.id, label: "CALLS" });
      }
    }
  }

  for (const record of depRecords) {
    const source = record.get("source");
    const target = record.get("target");
    if (!serviceIds.has(source) || !serviceIds.has(target)) continue;
    const key = `${source}->${target}->DEPENDS_ON`;
    if (linkKeys.has(key)) continue;
    linkKeys.add(key);
    links.push({ source, target, label: "DEPENDS_ON" });
  }

  return { nodes, links };
}

async function getDashboard() {
  const [countRecords, graphRecords, depRecords] = await Promise.all([
    runQuery(queries.DASHBOARD),
    runQuery(queries.DASHBOARD_GRAPH),
    runQuery(queries.DASHBOARD_GRAPH_DEPS),
  ]);

  const emptyCounts = { apis: 0, services: 0, teams: 0, deprecatedVersions: 0 };
  const counts = countRecords.length === 0
    ? emptyCounts
    : {
        apis: toNumber(countRecords[0].get("apiCount")),
        services: toNumber(countRecords[0].get("serviceCount")),
        teams: toNumber(countRecords[0].get("teamCount")),
        deprecatedVersions: toNumber(countRecords[0].get("deprecatedCount")),
      };

  return {
    ...counts,
    graph: buildOverviewGraph(graphRecords, depRecords),
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
