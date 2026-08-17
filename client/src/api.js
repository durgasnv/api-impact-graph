import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

export async function fetchDashboard() {
  const { data } = await api.get("/dashboard");
  return data;
}

export async function fetchAllApis() {
  const { data } = await api.get("/apis");
  return data;
}

export async function fetchApiById(id) {
  const { data } = await api.get(`/apis/${id}`);
  return data;
}

export async function fetchApiConsumers(id) {
  const { data } = await api.get(`/apis/${id}/consumers`);
  return data;
}

export async function fetchBlastRadius(apiId, versionId) {
  const params = versionId ? { versionId } : {};
  const { data } = await api.get(`/apis/${apiId}/blast-radius`, { params });
  return data;
}

export async function fetchAllTeams() {
  const { data } = await api.get("/teams");
  return data;
}

export async function fetchTeamById(id) {
  const { data } = await api.get(`/teams/${id}`);
  return data;
}

export async function fetchAllServices() {
  const { data } = await api.get("/services");
  return data;
}

export async function fetchServiceById(id) {
  const { data } = await api.get(`/services/${id}`);
  return data;
}

export async function fetchServiceDependencies(id) {
  const { data } = await api.get(`/services/${id}/dependencies`);
  return data;
}

export async function fetchDependencyPath(sourceId, targetId) {
  const { data } = await api.get(`/services/${sourceId}/paths/${targetId}`);
  return data;
}
