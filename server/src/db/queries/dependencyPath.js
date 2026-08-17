const DEPENDENCY_PATH = `
  MATCH path = (source {id: $sourceId})-[:DEPENDS_ON|CALLS|USES_VERSION|HAS_VERSION|REPLACED_BY*1..4]->(target {id: $targetId})
  RETURN path
  LIMIT 10
`;

module.exports = DEPENDENCY_PATH;
