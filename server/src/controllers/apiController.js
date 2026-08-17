const apiService = require("../services/apiService");

function handleError(res, err, context) {
  console.error(`${context}:`, err.message);
  res.status(500).json({ error: "Internal server error" });
}

async function getAllApis(req, res) {
  try {
    const apis = await apiService.getAllApis();
    res.json(apis);
  } catch (err) {
    handleError(res, err, "getAllApis");
  }
}

async function getApiById(req, res) {
  try {
    const api = await apiService.getApiById(req.params.id);
    if (!api) return res.status(404).json({ error: "API not found" });
    res.json(api);
  } catch (err) {
    handleError(res, err, "getApiById");
  }
}

async function getDirectConsumers(req, res) {
  try {
    const consumers = await apiService.getDirectConsumers(req.params.id);
    res.json(consumers);
  } catch (err) {
    handleError(res, err, "getDirectConsumers");
  }
}

async function getBlastRadius(req, res) {
  try {
    const result = await apiService.getBlastRadius(
      req.params.id,
      req.query.versionId
    );
    if (!result) return res.status(404).json({ error: "API not found" });
    res.json(result);
  } catch (err) {
    handleError(res, err, "getBlastRadius");
  }
}

async function getAllServices(req, res) {
  try {
    const services = await apiService.getAllServices();
    res.json(services);
  } catch (err) {
    handleError(res, err, "getAllServices");
  }
}

async function getServiceById(req, res) {
  try {
    const service = await apiService.getServiceById(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json(service);
  } catch (err) {
    handleError(res, err, "getServiceById");
  }
}

async function getServiceDependencies(req, res) {
  try {
    const deps = await apiService.getServiceDependencies(req.params.id);
    res.json(deps);
  } catch (err) {
    handleError(res, err, "getServiceDependencies");
  }
}

async function getDependencyPath(req, res) {
  try {
    const path = await apiService.getDependencyPath(
      req.params.id,
      req.params.targetId
    );
    if (!path) return res.status(404).json({ error: "No path found" });
    res.json(path);
  } catch (err) {
    handleError(res, err, "getDependencyPath");
  }
}

async function getAllTeams(req, res) {
  try {
    const teams = await apiService.getAllTeams();
    res.json(teams);
  } catch (err) {
    handleError(res, err, "getAllTeams");
  }
}

async function getTeamById(req, res) {
  try {
    const team = await apiService.getTeamById(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.json(team);
  } catch (err) {
    handleError(res, err, "getTeamById");
  }
}

async function getDashboard(req, res) {
  try {
    const dashboard = await apiService.getDashboard();
    res.json(dashboard);
  } catch (err) {
    handleError(res, err, "getDashboard");
  }
}

module.exports = {
  getAllApis,
  getApiById,
  getDirectConsumers,
  getBlastRadius,
  getAllServices,
  getServiceById,
  getServiceDependencies,
  getDependencyPath,
  getAllTeams,
  getTeamById,
  getDashboard,
};
