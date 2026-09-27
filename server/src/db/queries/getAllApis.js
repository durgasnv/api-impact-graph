const GET_ALL_APIS = `
  MATCH (a:API)
  OPTIONAL MATCH (a)-[:HAS_VERSION]->(v:APIVersion)
  OPTIONAL MATCH (v)-[:REPLACED_BY]->(replacement:APIVersion)
  RETURN a, collect(DISTINCT {version: v, replacedBy: replacement.id}) AS versions
  ORDER BY a.name
`;

module.exports = GET_ALL_APIS;
