const DASHBOARD_GRAPH = `
  MATCH (s:Service)-[:CALLS]->(a:API)
  WITH a, collect(DISTINCT s) AS consumers, count(DISTINCT s) AS consumerCount
  ORDER BY consumerCount DESC
  LIMIT 10
  RETURN a, consumers, consumerCount
`;

const DASHBOARD_GRAPH_DEPS = `
  MATCH (s:Service)-[:DEPENDS_ON]->(d:Service)
  RETURN s.id AS source, d.id AS target
`;

module.exports = { DASHBOARD_GRAPH, DASHBOARD_GRAPH_DEPS };
