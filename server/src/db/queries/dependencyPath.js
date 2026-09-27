const DEPENDENCY_PATH = `
  MATCH path = (target {id: $targetId})-[:DEPENDS_ON|CALLS|USES_VERSION|HAS_VERSION|REPLACED_BY*1..4]->(source {id: $sourceId})
  RETURN path
  LIMIT 10
`;

module.exports = DEPENDENCY_PATH;
