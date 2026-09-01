import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sensorPath = path.resolve(__dirname, "../../data/sensor-readings.json");
const CROPS = ["Tomato", "Lettuce", "Wheat", "Maize"];
const STATUSES = ["Online", "Offline", "Faulty"];
const FIELDS = [
  "crop_name",
  "timestamp",
  "soil_moisture",
  "temperature",
  "rainfall",
  "sensor_status",
  "notes",
];
const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

function isValidTimestamp(value) {
  if (typeof value !== "string" || !timestampPattern.test(value)) return false;
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second
  );
}

export async function readValidSensorData() {
  let readings;
  try {
    readings = JSON.parse(await fs.readFile(sensorPath, "utf8"));
  } catch {
    throw new Error("SENSOR_INVALID");
  }

  if (!Array.isArray(readings) || readings.length !== 20)
    throw new Error("SENSOR_INVALID");

  const counts = Object.fromEntries(CROPS.map((crop) => [crop, 0]));
  const timestamps = new Set();
  let invalidNumericReadings = 0;

  for (const reading of readings) {
    if (!reading || typeof reading !== "object" || Array.isArray(reading))
      throw new Error("SENSOR_INVALID");
    const keys = Object.keys(reading);
    if (
      keys.length !== FIELDS.length ||
      FIELDS.some((field) => !keys.includes(field))
    )
      throw new Error("SENSOR_INVALID");
    if (
      typeof reading.crop_name !== "string" ||
      !CROPS.includes(reading.crop_name)
    )
      throw new Error("SENSOR_INVALID");
    if (!isValidTimestamp(reading.timestamp)) throw new Error("SENSOR_INVALID");
    if (
      typeof reading.soil_moisture !== "number" ||
      !Number.isFinite(reading.soil_moisture)
    )
      throw new Error("SENSOR_INVALID");
    if (
      typeof reading.temperature !== "number" ||
      !Number.isFinite(reading.temperature)
    )
      throw new Error("SENSOR_INVALID");
    if (
      typeof reading.rainfall !== "number" ||
      !Number.isFinite(reading.rainfall)
    )
      throw new Error("SENSOR_INVALID");
    if (
      typeof reading.sensor_status !== "string" ||
      !STATUSES.includes(reading.sensor_status)
    )
      throw new Error("SENSOR_INVALID");
    if (typeof reading.notes !== "string") throw new Error("SENSOR_INVALID");

    const timestampKey = `${reading.crop_name}|${reading.timestamp}`;
    if (timestamps.has(timestampKey)) throw new Error("SENSOR_INVALID");
    timestamps.add(timestampKey);
    counts[reading.crop_name] += 1;

    const invalidFields = [
      reading.soil_moisture < 0 || reading.soil_moisture > 100,
      reading.temperature < 0 || reading.temperature > 50,
      reading.rainfall < 0 || reading.rainfall > 50,
    ].filter(Boolean).length;

    if (invalidFields > 0) {
      if (invalidFields !== 1) throw new Error("SENSOR_INVALID");
      invalidNumericReadings += 1;
    }
  }

  if (CROPS.some((crop) => counts[crop] !== 5))
    throw new Error("SENSOR_INVALID");
  if (invalidNumericReadings !== 1) throw new Error("SENSOR_INVALID");

  return readings;
}
