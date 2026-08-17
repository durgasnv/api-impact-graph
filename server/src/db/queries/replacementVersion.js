const REPLACEMENT_VERSION = `
  MATCH (:APIVersion {id: $id})-[:REPLACED_BY]->(replacement:APIVersion)
  RETURN replacement
`;

module.exports = REPLACEMENT_VERSION;
