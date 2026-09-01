import { analyseCrop } from "../utils/analysis.js";
export default function SensorHistory({ crop, readings, onClose }) {
  const history = readings
    .filter((r) => r.crop_name === crop.crop_name)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return (
    <div className="modal-backdrop">
      <div className="modal history">
        <div className="card-head">
          <div>
            <h2>{crop.crop_name} Sensor History</h2>
            <p>Newest first - read-only</p>
          </div>
          <button className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
        {history.map((r) => {
          const a = analyseCrop(crop, r);
          return (
            <div className="history-row" key={r.timestamp}>
              <b>{r.timestamp}</b>
              <span>{r.soil_moisture}% moisture</span>
              <span>{r.temperature} C</span>
              <span>{r.rainfall} mm rain</span>
              <span>{r.sensor_status}</span>
              <strong>{a.condition}</strong>
              <small>
                {a.alerts.join(", ") || "No alerts"} - {a.action}
              </small>
            </div>
          );
        })}
      </div>
    </div>
  );
}
