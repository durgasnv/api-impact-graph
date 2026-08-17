const SERVICE_DETAIL = `
  MATCH (s:Service {id: $id})
  OPTIONAL MATCH (t:Team)-[:OWNS]->(s)
  OPTIONAL MATCH (s)-[:CALLS]->(a:API)
  OPTIONAL MATCH (s)-[:DEPENDS_ON]->(dep:Service)
  RETURN s,
         collect(DISTINCT t) AS teams,
         collect(DISTINCT a) AS apis,
         collect(DISTINCT dep) AS dependencies
`;

module.exports = SERVICE_DETAIL;
