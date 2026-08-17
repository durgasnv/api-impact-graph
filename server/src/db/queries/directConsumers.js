const DIRECT_CONSUMERS = `
  MATCH (s:Service)-[:CALLS]->(a:API {id: $apiId})
  RETURN s
`;

module.exports = DIRECT_CONSUMERS;
