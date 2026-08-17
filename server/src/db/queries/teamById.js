const TEAM_BY_ID = `
  MATCH (t:Team {id: $id})
  OPTIONAL MATCH (t)-[:OWNS]->(s:Service)
  RETURN t, collect(s) AS services
`;

module.exports = TEAM_BY_ID;
