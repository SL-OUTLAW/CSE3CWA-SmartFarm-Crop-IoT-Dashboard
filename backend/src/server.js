import express from "express";
import cors from "cors";
import cropRoutes from "./routes/cropRoutes.js";
import readingRoutes from "./routes/readingRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { initialiseDatabase } from "./utils/database.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use("/api/crops", cropRoutes);
app.use("/api/readings", readingRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

await initialiseDatabase();
app.listen(PORT, () => {
  console.log(`SmartFarm backend running at http://localhost:${PORT}`);
});
