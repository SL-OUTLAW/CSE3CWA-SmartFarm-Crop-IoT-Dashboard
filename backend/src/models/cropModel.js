import { all, get, run } from "../utils/database.js";

const cropFields =
  "id, crop_name, location, target_min, target_max, normal_water, notes, created_at";

export function getAllCrops() {
  return all(`SELECT ${cropFields} FROM crops ORDER BY id`);
}

export function getCropById(id) {
  return get(`SELECT ${cropFields} FROM crops WHERE id = ?`, [id]);
}

export async function createCrop({
  crop_name,
  location,
  target_min,
  target_max,
  normal_water,
  notes = "",
}) {
  const result = await run(
    "INSERT INTO crops (crop_name, location, target_min, target_max, normal_water, notes) VALUES (?, ?, ?, ?, ?, ?)",
    [crop_name, location.trim(), target_min, target_max, normal_water, notes],
  );
  return getCropById(result.id);
}

export async function updateCrop(
  id,
  { location, target_min, target_max, normal_water, notes = "" },
) {
  await run(
    "UPDATE crops SET location = ?, target_min = ?, target_max = ?, normal_water = ?, notes = ? WHERE id = ?",
    [location.trim(), target_min, target_max, normal_water, notes, id],
  );
  return getCropById(id);
}

export async function deleteCrop(id) {
  return run("DELETE FROM crops WHERE id = ?", [id]);
}
