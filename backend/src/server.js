const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api", routes);

// Serve o frontend estático (build simples em /frontend)
app.use(express.static(path.join(__dirname, "..", "..", "frontend")));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Helpdesk API rodando em http://localhost:${PORT}`);
});
