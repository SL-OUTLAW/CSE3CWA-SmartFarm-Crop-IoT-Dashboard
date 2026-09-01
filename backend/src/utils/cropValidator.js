import { readValidSensorData } from "./sensorValidator.js";

export async function validateCropBody(
  body,
  { isEdit = false, existing = null } = {},
) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    return "Request body is required";
  if (
    isEdit &&
    body.crop_name !== undefined &&
    body.crop_name !== existing.crop_name
  )
    return "crop_name cannot be changed";

  const cropName = isEdit ? existing.crop_name : body.crop_name;
  if (!isEdit && (typeof cropName !== "string" || cropName.length === 0))
    return "crop_name is required";
  if (typeof body.location !== "string" || body.location.trim().length === 0)
    return "location is required";
  if (body.location.trim().length > 100)
    return "location must be 1 to 100 characters";
  if (
    typeof body.target_min !== "number" ||
    !Number.isFinite(body.target_min) ||
    body.target_min < 0 ||
    body.target_min > 100
  )
    return "target_min must be a number from 0 to 100";
  if (
    typeof body.target_max !== "number" ||
    !Number.isFinite(body.target_max) ||
    body.target_max < 0 ||
    body.target_max > 100
  )
    return "target_max must be a number from 0 to 100";
  if (body.target_min >= body.target_max)
    return "target_min must be less than target_max";
  if (
    typeof body.normal_water !== "number" ||
    !Number.isFinite(body.normal_water) ||
    body.normal_water <= 0 ||
    body.normal_water > 10000
  )
    return "normal_water must be greater than 0 and at most 10000";
  if (body.notes !== undefined && typeof body.notes !== "string")
    return "notes must be a string";
  if ((body.notes ?? "").length > 500)
    return "notes must be at most 500 characters";

  if (!isEdit) {
    let readings;
    try {
      readings = await readValidSensorData();
    } catch {
      return "__SENSOR_INVALID__";
    }
    if (!readings.some((reading) => reading.crop_name === cropName))
      return "crop_name does not exist in sensor data";
  }

  return null;
}
