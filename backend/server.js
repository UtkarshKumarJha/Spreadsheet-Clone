const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory data storage
let sheetData = Array(100).fill(null).map(() => Array(20).fill(""));

// API Endpoints
app.get("/data", (req, res) => {
    res.json(sheetData);
});

app.post("/data", (req, res) => {
    const { row, col, value } = req.body;

    if (
        row >= 0 &&
        row < sheetData.length &&
        col >= 0 &&
        col < sheetData[0].length
    ) {
        sheetData[row][col] = value;
        res.json({ success: true, message: "Data updated successfully." });
    } else {
        res.status(400).json({ success: false, message: "Invalid cell coordinates." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
