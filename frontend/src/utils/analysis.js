export function getAvailableCropNames(readings, crops) {
  const used = new Set(crops.map((c) => c.crop_name));
  return [...new Set(readings.map((r) => r.crop_name))]
    .filter((name) => !used.has(name))
    .sort();
}
export function getLatestReading(cropName, readings) {
  return (
    readings
      .filter((r) => r.crop_name === cropName)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0] ?? null
  );
}
export function analyseCrop(cropCard, reading) {
  if (!reading)
    return {
      crop: cropCard,
      latest_reading: null,
      condition: "N/A",
      recommended_water: "N/A",
      alerts: [],
      action: "N/A",
    };
  if (
    reading.sensor_status === "Offline" ||
    reading.sensor_status === "Faulty"
  ) {
    return {
      crop: cropCard,
      latest_reading: reading,
      condition: "Sensor Problem",
      recommended_water: "N/A",
      alerts: ["Check sensor"],
      action: "Check sensor",
    };
  }
  const invalid = [];
  if (reading.soil_moisture < 0 || reading.soil_moisture > 100)
    invalid.push("soil_moisture");
  if (reading.temperature < 0 || reading.temperature > 50)
    invalid.push("temperature");
  if (reading.rainfall < 0 || reading.rainfall > 50) invalid.push("rainfall");
  if (invalid.length)
    return {
      crop: cropCard,
      latest_reading: reading,
      condition: "Invalid Data",
      recommended_water: "N/A",
      alerts: [`Invalid field: ${invalid.join(", ")}`],
      action: "Check reading",
    };
  let condition, recommended_water, action;
  if (reading.soil_moisture < cropCard.target_min) {
    condition = "Dry";
    recommended_water = `${cropCard.normal_water} L`;
    action = "Water crop";
  } else if (reading.soil_moisture <= cropCard.target_max) {
    condition = "Healthy";
    recommended_water = "0 L";
    action = "Monitor";
  } else {
    condition = "Too Wet";
    recommended_water = "0 L";
    action = "Stop watering";
  }
  const alerts = [];
  if (reading.temperature > 35) alerts.push("High temperature");
  if (reading.rainfall >= 5) alerts.push("Rain detected");
  return {
    crop: cropCard,
    latest_reading: reading,
    condition,
    recommended_water,
    alerts,
    action,
  };
}
export function calculateFarmStatus(results, sensorSucceeded) {
  if (results.length === 0) return "No Crops";
  if (!sensorSucceeded) return "Sensor Feed Unavailable";
  if (
    results.some((r) =>
      ["Sensor Problem", "Invalid Data"].includes(r.condition),
    )
  )
    return "Critical";
  if (
    results.some(
      (r) =>
        ["Dry", "Too Wet"].includes(r.condition) ||
        r.alerts.includes("High temperature"),
    )
  )
    return "Watch";
  return "Normal";
}
