const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api", routes);

// Serve o build do frontend (gerado com `npm run build` em /frontend)
const FRONTEND_DIST = path.join(__dirname, "..", "..", "frontend", "dist");
app.use(express.static(FRONTEND_DIST));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Helpdesk API rodando em http://localhost:${PORT}`);
});
