import express from "express";
import cors from "cors";
import cookieParser from "cookieparser";
import questionRoutes from "./questionRoutes.js";
import profileRoutes from "./profileRoutes.js";

const app = express();

// Middleware
app.use(cors({}));
app.use(express.json());

// Routes
app.use("/question", questionRoutes);
app.use("/profile", profileRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
