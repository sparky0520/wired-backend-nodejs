import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import questionRoutes from "./questionRoutes";
import profileRoutes from "./profileRoutes";

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend URL
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

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
