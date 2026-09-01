# SmartFarm Crop IoT Dashboard

> A full-stack web application that combines user-managed crop configuration with a simulated IoT sensor feed to produce a live crop-health dashboard.

## Overview

SmartFarm lets farm staff create, view, edit and delete **Crop Cards** (location, target moisture range, normal water amount, notes). A separate, read-only **sensor feed** (`backend/data/sensor-readings.json`) simulates 20 IoT readings across four crops. The frontend joins the two sources by `crop_name`, selects each crop's latest reading by timestamp, and calculates a live condition (Dry / Healthy / Too Wet / Sensor Problem / Invalid Data) for each card.

---

## Tech stack

| Layer    | Technology        |
| -------- | ----------------- |
| Frontend | React + Vite      |
| Backend  | Node.js + Express |
| Database | SQLite            |

---

## Project structure

```
CSE3CWA-SmartFarm-Crop-IoT-Dashboard/
├── backend/
│   ├── data/
│   │   └── sensor-readings.json
│   ├── db/
│   │   └── init.sql
│   └── src/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── utils/
│       └── server.js
├── frontend/
│   └── src/
│       ├── components/
│       ├── services/
│       ├── utils/
│       └── App.jsx
├── .gitignore
└── README.md
```

---

## How to install and run the project

### Required

- [Node.js](https://nodejs.org/) (v18+ recommended)

### 1. Clone the repository

```bash
git clone https://github.com/SL-OUTLAW/CSE3CWA-SmartFarm-Crop-IoT-Dashboard.git
cd CSE3CWA-SmartFarm-Crop-IoT-Dashboard
```

### 2. Set up and run the backend

```bash
cd backend
npm install
npm start
```

> The API runs on `http://localhost:3001`.

### 3. Set up and run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173`. Vite proxies any request to `/api/*` through to `http://localhost:3001`, so no manual CORS configuration is needed in development (Express also has `cors()` enabled as a fallback).

---

## How the database is created and initialised

The SQLite database is set up via `init.sql` (`./backend/db/init.sql`) and run automatically by `initialiseDatabase()` every time the backend starts.

- The `crops` table is created if it doesn't already exist, with `crop_name` constrained to `Tomato`, `Lettuce`, `Wheat` or `Maize`, `target_min < target_max`, `target_min`/`target_max` between 0–100, and `normal_water` between 0 (exclusive) and 10000.
- On first run only (row count = 0), the backend seeds **Tomato, Lettuce and Wheat**.
- Restarting the backend does not duplicate the seed rows - the seed check re-counts the table before inserting.

---

## Data ownership

The two data sources are kept strictly separate, and only one of them is ever written to by the application:

| Data                                                                          | Where it lives                      | Who can change it                           |
| ----------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------- |
| Crop Cards                                                                    | SQLite `crops` table                | The user, via Create/Edit/Delete            |
| Sensor readings                                                               | `backend/data/sensor-readings.json` | Nobody - read-only inside the app           |
| Dashboard results (condition, alerts, recommended water, Overall Farm Status) | React state only                    | Calculated on every render, never persisted |

There are no `POST`/`PUT`/`DELETE` routes for sensor readings, and the backend never calculates or stores a condition - that logic lives entirely in the frontend (`frontend/src/utils/analysis.js`), so every card and the Sensor History view use the exact same function.

---

## `crop_name` matching and latest-timestamp selection

`crop_name` is the single join key between a Crop Card and its sensor readings, and the match is **exact and case-sensitive** (`Tomato` does not match `tomato`).

For a given card, all readings sharing its `crop_name` are filtered out of the 20-reading feed, then sorted to find the greatest timestamp - the sensor file's array order is intentionally scrambled, so the last item in the array is never assumed to be the latest:

```js
export function getLatestReading(cropName, readings) {
  return (
    readings
      .filter((r) => r.crop_name === cropName)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0] ?? null
  );
}
```

Because every timestamp uses the fixed `YYYY-MM-DDTHH:mm:ss` format, a plain string comparison (`localeCompare`) is sufficient to sort them chronologically without parsing dates.

---

## Sensor feed validation

`GET /api/readings` re-reads and re-validates the JSON file on **every** request (so the Refresh button reflects a replaced file without restarting the server), and separates two different ideas:

- **Structural validity** (file-level): exactly 20 objects; exactly 5 readings per crop; all seven required fields present with correct types; timestamps in the correct format and unique within each crop; `sensor_status` is one of `Online`/`Offline`/`Faulty`. If any of this fails, the route returns `500` with `{"error":"Sensor data file is invalid"}` and the frontend never sees the broken data.
- **Invalid Data** (business-level): a reading can be structurally fine but still have an `Online` value outside its normal business range (moisture 0–100, temperature 0–50, rainfall 0–50). This is _not_ rejected by the backend - it's returned as-is and labelled `Invalid Data` by the frontend's decision logic. Exactly one such reading exists in the shipped JSON (an older Wheat reading with `soil_moisture: 120`), and it is deliberately not the latest reading for its crop.

---

## Dashboard decision priority

`analyseCrop(cropCard, reading)` (`frontend/src/utils/analysis.js`) applies the following checks **in order**, stopping at the first match:

1. `sensor_status` is `Offline` or `Faulty` → **Sensor Problem** (recommended water `N/A`, action `Check sensor`)
2. Otherwise, an `Online` reading with moisture/temperature/rainfall outside its normal range → **Invalid Data** (recommended water `N/A`, action `Check reading`)
3. `soil_moisture < target_min` → **Dry** (recommended water = `normal_water`, action `Water crop`)
4. `target_min <= soil_moisture <= target_max` → **Healthy** (recommended water `0 L`, action `Monitor`)
5. `soil_moisture > target_max` → **Too Wet** (recommended water `0 L`, action `Stop watering`)

A valid `Online` reading is then also checked for two additive alerts that never change the main condition: `temperature > 35°C` → **High temperature**, and `rainfall >= 5mm` → **Rain detected**.

**Overall Farm Status** is derived from the current set of Crop Card results, checked in this order: no cards → `No Crops`; at least one card but no successful sensor request yet → `Sensor Feed Unavailable`; any card `Sensor Problem` or `Invalid Data` → `Critical`; any card `Dry`/`Too Wet`/`High temperature` → `Watch`; otherwise → `Normal`.

---

## Loading, refresh and failure states

- **Initial load** requests `GET /api/crops` and `GET /api/readings` together. If the crops request fails, the app shows an error + Retry and does **not** render editable cards or forms.
- If the **first** sensor request fails, existing Crop Cards stay visible, all sensor results show `N/A`, `lastRefresh` stays `Never`, the Create dropdown is disabled, and Overall Farm Status shows `Sensor Feed Unavailable`.
- A **later** refresh failure keeps the last successful readings, card results and `lastRefresh` value on screen and only shows an error banner.
- `lastRefresh` is React state only - it is never written to SQLite, and it resets to `Never` on a page reload.
- Create/Edit/Delete all re-fetch `GET /api/crops` (or use the response body) and then recalculate the dashboard against the current sensor-reading state.

---

## API and error format

| Method & route          | Purpose                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `GET /api/crops`        | Return all Crop Cards                                                                            |
| `GET /api/crops/:id`    | Return one Crop Card                                                                             |
| `POST /api/crops`       | Create a Crop Card (`crop_name` must exist in the valid sensor feed and not already have a card) |
| `PUT /api/crops/:id`    | Update all fields except `crop_name`                                                             |
| `DELETE /api/crops/:id` | Delete a Crop Card only - never touches the sensor JSON                                          |
| `GET /api/readings`     | Read + structurally validate the sensor file and return it raw                                   |

Every failed response uses the same JSON shape, `{"error": "..."}`, never plain text:

| Failure                                 | Status | Example                                                 |
| --------------------------------------- | ------ | ------------------------------------------------------- |
| Missing/invalid field, wrong type       | `400`  | `{"error":"target_min must be a number from 0 to 100"}` |
| `crop_name` not in the sensor feed      | `400`  | `{"error":"crop_name does not exist in sensor data"}`   |
| Attempt to change `crop_name` on `PUT`  | `400`  | `{"error":"crop_name cannot be changed"}`               |
| Duplicate `crop_name`                   | `409`  | `{"error":"crop_name already exists"}`                  |
| Crop card id not found                  | `404`  | `{"error":"Crop card not found"}`                       |
| Sensor file fails structural validation | `500`  | `{"error":"Sensor data file is invalid"}`               |

All of the above have been manually verified against a running instance with `curl` (type coercion, duplicate rejection, immutable `crop_name`, 404s, and that deleting a Crop Card leaves all 20 sensor readings untouched).

---

## AI use statement

- **Tool used:** Claude (Anthropic).

- **Final prompt used to generate the 20 sensor readings:**

  > Generate a valid JSON array containing exactly 20 simulated SmartFarm sensor readings. Use these crop_name values exactly and create exactly 5 readings for each: Tomato, Lettuce, Wheat, Maize. Every object must contain exactly these fields: crop_name, timestamp, soil_moisture, temperature, rainfall, sensor_status, notes. Use timestamps in YYYY-MM-DDTHH:mm:ss format. Timestamps must be distinct within each crop. The same timestamp may be used by different crops. Mix the array order so the latest reading is not always the last object. Use sensor_status only as Online, Offline or Faulty. Most numeric values must be realistic: soil_moisture 0-100, temperature 0-50, rainfall 0-50. Include exactly one structurally valid older reading with one deliberately out-of-range numeric value. That invalid reading must not be the latest reading for its crop. Make the latest readings produce these cases with the default Crop Card settings: latest Tomato: Online, Dry, temperature above 35 C; latest Lettuce: Online and Healthy; latest Wheat: Online, Too Wet, rainfall at least 5 mm; latest Maize: sensor_status Faulty. Return only the JSON array. Do not use Markdown or explanation.

- **What it helped with:** scaffolding the Express/React folder structure, the first pass of the 20-reading sensor JSON, and drafting this README.

- **Problem found and corrected in the AI-generated JSON:** the first draft placed the intentionally invalid Wheat reading (`soil_moisture: 120`) as the _latest_ Wheat reading instead of an older one, which would have made the current Wheat card show `Invalid Data` instead of the required `Too Wet` result. I manually moved the invalid reading to an earlier timestamp and re-verified all four "latest reading" outcomes by hand against Section 15's worked examples before wiring it into the backend.

- **How `crop_name` uniqueness and exact matching were verified:** by running the seeded app, attempting to create a second `Maize` card (rejected with `409`), and confirming in `getLatestReading`/`getAvailableCropNames` that comparisons use strict string equality (`===`), so `Tomato` and `tomato` are never treated as the same crop.

- **How the latest-timestamp and required cases were verified:** by hand-sorting each crop's 5 timestamps against the JSON file, confirming the greatest timestamp for each crop matches the reading that produces the required dashboard case (Tomato = Dry + high temperature, Lettuce = Healthy, Wheat = Too Wet + Rain detected, Maize = Sensor Problem), and cross-checking with `curl http://localhost:3001/api/readings` while the app is running.

- **An implementation decision I can explain independently:** the sensor feed is re-read from disk on every `GET /api/readings` call rather than cached in memory, so that swapping the JSON file on disk and clicking "Refresh Sensor Data" reflects the change immediately without restarting the backend, matching the brief's requirement that Refresh retrieve a replaced file.

---

## Limitations

- The frontend disables the Create dropdown and shows `N/A` results when the _first_ sensor request fails, but there is no automatic retry/polling - the user must click Refresh once the feed becomes available again.

---

###### **_OUTLAW_**
