export default function CropCard({ result, onEdit, onDelete, onHistory }) {
  const {
    crop,
    latest_reading: r,
    condition,
    recommended_water,
    alerts,
    action,
  } = result;
  return (
    <article className="card">
      <div className="card-head">
        <div>
          <h2>{crop.crop_name}</h2>
          <p>{crop.location}</p>
        </div>
        <span
          className={`badge ${condition.toLowerCase().replaceAll(" ", "-")}`}
        >
          {condition}
        </span>
      </div>
      <div className="settings">
        <span>
          Target {crop.target_min}-{crop.target_max}%
        </span>
        <span>Normal water {crop.normal_water} L</span>
      </div>
      {r ? (
        <>
          <p className="timestamp">Latest: {r.timestamp}</p>
          <div className="metrics">
            <div>
              <b>{r.soil_moisture}%</b>
              <span>Moisture</span>
            </div>
            <div>
              <b>{r.temperature} C</b>
              <span>Temperature</span>
            </div>
            <div>
              <b>{r.rainfall} mm</b>
              <span>Rainfall</span>
            </div>
          </div>
          <p>
            <b>Sensor:</b> {r.sensor_status}
          </p>
        </>
      ) : (
        <p>Sensor results: N/A</p>
      )}
      <div className="result">
        <p>
          <b>Recommended:</b> {recommended_water}
        </p>
        <p>
          <b>Alerts:</b> {alerts.length ? alerts.join(", ") : "None"}
        </p>
        <p>
          <b>Action:</b> {action}
        </p>
      </div>
      {crop.notes && <p className="notes">{crop.notes}</p>}
      <div className="actions">
        <button className="secondary" onClick={() => onHistory(crop)}>
          Sensor History
        </button>
        <button className="secondary" onClick={() => onEdit(crop)}>
          Edit
        </button>
        <button className="danger" onClick={() => onDelete(crop)}>
          Delete
        </button>
      </div>
    </article>
  );
}
