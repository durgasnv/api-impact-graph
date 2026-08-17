const GET_ALL_TEAMS = `
  MATCH (t:Team)
  OPTIONAL MATCH (t)-[:OWNS]->(s:Service)
  RETURN t, collect(s) AS services
  ORDER BY t.name
`;

module.exports = GET_ALL_TEAMS;
