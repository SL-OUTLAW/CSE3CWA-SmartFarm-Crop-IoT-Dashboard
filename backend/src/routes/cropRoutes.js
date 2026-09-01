import { Router } from "express";
import {
  createCrop,
  deleteCrop,
  getAllCrops,
  getCropById,
  updateCrop,
} from "../models/cropModel.js";
import { validateCropBody } from "../utils/cropValidator.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    res.json(await getAllCrops());
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const crop = await getCropById(req.params.id);
    if (!crop) return res.status(404).json({ error: "Crop card not found" });
    res.json(crop);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const validationError = await validateCropBody(req.body);
    if (validationError === "__SENSOR_INVALID__")
      return res.status(500).json({ error: "Sensor data file is invalid" });
    if (validationError)
      return res.status(400).json({ error: validationError });

    try {
      const crop = await createCrop(req.body);
      res.status(201).json(crop);
    } catch (error) {
      if (String(error.message).includes("UNIQUE"))
        return res.status(409).json({ error: "crop_name already exists" });
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const existing = await getCropById(req.params.id);
    if (!existing)
      return res.status(404).json({ error: "Crop card not found" });

    const validationError = await validateCropBody(req.body, {
      isEdit: true,
      existing,
    });
    if (validationError)
      return res.status(400).json({ error: validationError });

    res.json(await updateCrop(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await deleteCrop(req.params.id);
    if (!result.changes)
      return res.status(404).json({ error: "Crop card not found" });
    res.json({ deleted: true, id: Number(req.params.id) });
  } catch (error) {
    next(error);
  }
});

export default router;
