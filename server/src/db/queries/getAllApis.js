const GET_ALL_APIS = `
  MATCH (a:API)
  OPTIONAL MATCH (a)-[:HAS_VERSION]->(v:APIVersion)
  RETURN a, collect(v) AS versions
  ORDER BY a.name
`;

module.exports = GET_ALL_APIS;
