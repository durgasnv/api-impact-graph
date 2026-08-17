const DASHBOARD = `
  OPTIONAL MATCH (a:API)
  WITH count(a) AS apiCount
  OPTIONAL MATCH (s:Service)
  WITH apiCount, count(s) AS serviceCount
  OPTIONAL MATCH (t:Team)
  WITH apiCount, serviceCount, count(t) AS teamCount
  OPTIONAL MATCH (av:APIVersion {status: 'deprecated'})
  RETURN apiCount, serviceCount, teamCount, count(av) AS deprecatedCount
`;

module.exports = DASHBOARD;
