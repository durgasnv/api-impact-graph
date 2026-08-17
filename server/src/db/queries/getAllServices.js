const GET_ALL_SERVICES = `
  MATCH (s:Service)
  RETURN s
  ORDER BY s.name
`;

module.exports = GET_ALL_SERVICES;
