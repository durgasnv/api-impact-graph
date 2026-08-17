const MULTI_HOP_DEPENDENCIES = `
  MATCH (affected:Service)-[:DEPENDS_ON*1..4]->(origin:Service {id: $id})
  RETURN DISTINCT affected
`;

module.exports = MULTI_HOP_DEPENDENCIES;
