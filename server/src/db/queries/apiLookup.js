const API_LOOKUP = `
  MATCH (a:API {id: $id})
  OPTIONAL MATCH (a)-[:HAS_VERSION]->(v:APIVersion)
  OPTIONAL MATCH (v)-[:REPLACED_BY]->(replacement:APIVersion)
  RETURN a, collect(DISTINCT {version: v, replacedBy: replacement.id}) AS versions
`;

module.exports = API_LOOKUP;
