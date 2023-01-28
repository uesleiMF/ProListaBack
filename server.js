const dotenv = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRoute = require("./routes/userRoute");
const productRoute = require("./routes/productRoute");
const contactRoute = require("./routes/contactRoute");
const errorHandler = require("./middleware/errorMiddleware");
const path = require("path");
// Import cookie parser
const cookieParser = require("cookie-parser");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Fix Cors
app.use(
  cors({
    origin: ["http://localhost:3000", "https://pinvent.vercel.app"],
    credentials: true,
  })
);
// Save cookie from server proxy
// app.set("trust proxy", 1);

// Routes Middleware
app.use("/api/users", userRoute);
app.use("/api/products", productRoute);
app.use("/api/", contactRoute);

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the home page");
});

// errorHandler Should be the last middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
// Connect DB & start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() =>
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}...`);
    })
  )
  .catch((err) => console.log(err));
