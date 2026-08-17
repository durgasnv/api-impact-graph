const API_LOOKUP = `
  MATCH (a:API {id: $id})
  OPTIONAL MATCH (a)-[:HAS_VERSION]->(v:APIVersion)
  RETURN a, collect(v) AS versions
`;

module.exports = API_LOOKUP;
