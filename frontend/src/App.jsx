import { useEffect, useMemo, useState } from "react";
import {
  createCrop,
  deleteCrop,
  getCrops,
  getReadings,
  updateCrop,
} from "./services/api.js";
import {
  analyseCrop,
  calculateFarmStatus,
  getAvailableCropNames,
  getLatestReading,
} from "./utils/analysis.js";
import CropCard from "./components/CropCard.jsx";
import CropForm from "./components/CropForm.jsx";
import SensorHistory from "./components/SensorHistory.jsx";

export default function App() {
  const [crops, setCrops] = useState([]),
    [readings, setReadings] = useState([]),
    [cropsReady, setCropsReady] = useState(false),
    [sensorSucceeded, setSensorSucceeded] = useState(false);
  const [loading, setLoading] = useState(true),
    [appError, setAppError] = useState(""),
    [refreshError, setRefreshError] = useState(""),
    [message, setMessage] = useState(""),
    [lastRefresh, setLastRefresh] = useState("Never");
  const [form, setForm] = useState(null),
    [history, setHistory] = useState(null);
  const loadInitial = async () => {
    setLoading(true);
    setAppError("");
    setRefreshError("");
    try {
      const cs = await getCrops();
      setCrops(cs);
      setCropsReady(true);
    } catch (e) {
      setCropsReady(false);
      setAppError(e.message);
      setLoading(false);
      return;
    }
    try {
      const rs = await getReadings();
      setReadings(rs);
      setSensorSucceeded(true);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (e) {
      setSensorSucceeded(false);
      setReadings([]);
      setRefreshError(e.message);
    }
    setLoading(false);
  };
  useEffect(() => {
    loadInitial();
  }, []);
  const results = useMemo(
    () =>
      crops.map((c) =>
        analyseCrop(
          c,
          sensorSucceeded ? getLatestReading(c.crop_name, readings) : null,
        ),
      ),
    [crops, readings, sensorSucceeded],
  );
  const status = calculateFarmStatus(results, sensorSucceeded);
  const available = sensorSucceeded
    ? getAvailableCropNames(readings, crops)
    : [];
  const refresh = async () => {
    setRefreshError("");
    try {
      const rs = await getReadings();
      setReadings(rs);
      setSensorSucceeded(true);
      setLastRefresh(new Date().toLocaleTimeString());
      setMessage("Sensor data refreshed successfully.");
    } catch (e) {
      setRefreshError(
        `Refresh failed: ${e.message}. Showing last successful sensor data.`,
      );
    }
  };
  const save = async (data) => {
    const saved =
      form.mode === "edit"
        ? await updateCrop(form.crop.id, data)
        : await createCrop(data);
    setCrops((cs) =>
      form.mode === "edit"
        ? cs.map((c) => (c.id === saved.id ? saved : c))
        : [...cs, saved],
    );
    setForm(null);
    setMessage(
      `Crop card ${form.mode === "edit" ? "updated" : "created"} successfully.`,
    );
  };
  const remove = async (crop) => {
    if (
      !confirm(
        `Delete ${crop.crop_name} crop card? Sensor data will not be changed.`,
      )
    )
      return;
    try {
      await deleteCrop(crop.id);
      setCrops((cs) => cs.filter((c) => c.id !== crop.id));
      setMessage(`${crop.crop_name} crop card deleted successfully.`);
    } catch (e) {
      setAppError(e.message);
    }
  };
  if (loading)
    return (
      <main className="shell">
        <div className="loading">Loading SmartFarm dashboard...</div>
      </main>
    );
  if (!cropsReady)
    return (
      <main className="shell">
        <div className="error">
          <b>Application error:</b> {appError}
        </div>
        <button onClick={loadInitial}>Retry</button>
      </main>
    );
  return (
    <main className="shell">
      <header>
        <div>
          <p className="eyebrow">GREENFIELDS FARM</p>
          <h1>SmartFarm Crop Dashboard</h1>
          <p className="subtitle">
            Crop configuration and live simulated IoT conditions
          </p>
        </div>
        <div
          className={`status status-${status.toLowerCase().replaceAll(" ", "-")}`}
        >
          <small>Overall Farm Status</small>
          <b>{status}</b>
        </div>
      </header>
      <section className="toolbar">
        <div>
          <b>{crops.length}</b>
          <span>Crop Cards</span>
        </div>
        <div>
          <b>{lastRefresh}</b>
          <span>Last sensor refresh</span>
        </div>
        <div className="toolbar-actions">
          <button
            disabled={!sensorSucceeded || available.length === 0}
            onClick={() => setForm({ mode: "create" })}
          >
            + Add Crop Card
          </button>
          <button className="secondary" onClick={refresh}>
            Refresh Sensor Data
          </button>
        </div>
      </section>
      {message && (
        <div className="success" onClick={() => setMessage("")}>
          {message}
        </div>
      )}
      {refreshError && <div className="error">{refreshError}</div>}
      {!sensorSucceeded && (
        <div className="warning">
          Sensor feed unavailable. Crop Cards remain visible, sensor results are
          N/A, Create is disabled, and last refresh remains Never.
        </div>
      )}
      {crops.length === 0 ? (
        <section className="empty">
          <h2>No Crop Cards</h2>
          <p>Add a Crop Card when sensor data is available.</p>
        </section>
      ) : (
        <section className="grid">
          {results.map((r) => (
            <CropCard
              key={r.crop.id}
              result={r}
              onEdit={(crop) => setForm({ mode: "edit", crop })}
              onDelete={remove}
              onHistory={setHistory}
            />
          ))}
        </section>
      )}
      {form && (
        <CropForm
          mode={form.mode}
          crop={form.crop}
          availableNames={available}
          onSave={save}
          onCancel={() => setForm(null)}
        />
      )}{" "}
      {history && (
        <SensorHistory
          crop={history}
          readings={readings}
          onClose={() => setHistory(null)}
        />
      )}
      <footer>
        Sensor readings are read-only. Dashboard analysis is calculated in
        React.
      </footer>
    </main>
  );
}
