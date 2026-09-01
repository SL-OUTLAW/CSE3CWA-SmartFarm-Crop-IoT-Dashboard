import { useEffect, useState } from "react";
const blank = {
  crop_name: "",
  location: "",
  target_min: 0,
  target_max: 100,
  normal_water: 1,
  notes: "",
};
export default function CropForm({
  mode,
  crop,
  availableNames,
  onSave,
  onCancel,
}) {
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  useEffect(
    () =>
      setForm(
        crop ? { ...crop } : { ...blank, crop_name: availableNames[0] || "" },
      ),
    [crop, availableNames],
  );
  const change = (e) =>
    setForm((f) => ({
      ...f,
      [e.target.name]: ["target_min", "target_max", "normal_water"].includes(
        e.target.name,
      )
        ? Number(e.target.value)
        : e.target.value,
    }));
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.crop_name || !form.location.trim())
      return setError("Crop name and location are required.");
    if (
      form.target_min < 0 ||
      form.target_max > 100 ||
      form.target_min >= form.target_max
    )
      return setError(
        "Target range must be 0-100 with minimum less than maximum.",
      );
    if (form.normal_water <= 0 || form.normal_water > 10000)
      return setError(
        "Normal water must be greater than 0 and at most 10000 L.",
      );
    if (form.notes.length > 500)
      return setError("Notes must be at most 500 characters.");
    try {
      await onSave({
        crop_name: form.crop_name,
        location: form.location,
        target_min: form.target_min,
        target_max: form.target_max,
        normal_water: form.normal_water,
        notes: form.notes,
      });
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <h2>{mode === "edit" ? "Edit Crop Card" : "Add Crop Card"}</h2>
        {error && <div className="error">{error}</div>}
        <label>
          Crop name
          {mode === "edit" ? (
            <input value={form.crop_name} readOnly />
          ) : (
            <select name="crop_name" value={form.crop_name} onChange={change}>
              {availableNames.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          )}
        </label>
        <label>
          Location
          <input
            name="location"
            maxLength="100"
            value={form.location}
            onChange={change}
          />
        </label>
        <div className="form-row">
          <label>
            Target min
            <input
              name="target_min"
              type="number"
              value={form.target_min}
              onChange={change}
            />
          </label>
          <label>
            Target max
            <input
              name="target_max"
              type="number"
              value={form.target_max}
              onChange={change}
            />
          </label>
        </div>
        <label>
          Normal water (L)
          <input
            name="normal_water"
            type="number"
            value={form.normal_water}
            onChange={change}
          />
        </label>
        <label>
          Notes
          <textarea
            name="notes"
            maxLength="500"
            value={form.notes}
            onChange={change}
          />
        </label>
        <div className="actions">
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  );
}
