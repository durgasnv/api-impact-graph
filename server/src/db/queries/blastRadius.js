const BLAST_RADIUS = `
  MATCH (av:APIVersion {id: $versionId})<-[:USES_VERSION]-(direct:Service)
  OPTIONAL MATCH (indirect:Service)-[:DEPENDS_ON*1..4]->(direct)
  WITH collect(DISTINCT direct) + collect(DISTINCT indirect) AS allServices
  UNWIND allServices AS svc
  OPTIONAL MATCH (t:Team)-[:OWNS]->(svc)
  RETURN collect(DISTINCT svc) AS services,
         collect(DISTINCT t) AS teams
`;

const BLAST_RADIUS_DIRECT_IDS = `
  MATCH (av:APIVersion {id: $versionId})<-[:USES_VERSION]-(direct:Service)
  RETURN collect(direct.id) AS ids
`;

module.exports = { BLAST_RADIUS, BLAST_RADIUS_DIRECT_IDS };
