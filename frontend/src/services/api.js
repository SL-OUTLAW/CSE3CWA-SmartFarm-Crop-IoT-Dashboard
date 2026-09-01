import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error || error.message || "Request failed";
    return Promise.reject(new Error(message));
  },
);

export const getCrops = async () => (await api.get("/crops")).data;
export const getReadings = async () => (await api.get("/readings")).data;
export const createCrop = async (data) => (await api.post("/crops", data)).data;
export const updateCrop = async (id, data) =>
  (await api.put(`/crops/${id}`, data)).data;
export const deleteCrop = async (id) => (await api.delete(`/crops/${id}`)).data;
