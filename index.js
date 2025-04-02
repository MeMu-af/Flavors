require("dotenv").config();
const pg = require("pg");
const client = new pg.Client(process.env.DATABASE_URL);
const express = require("express");
const app = express();

app.use(require("morgan")("dev"));
app.use(express.json());

const init = async () => {
  await client.connect();
  console.log("connect to database");

  let SQL = /* sql */ `
        DROP TABLE IF EXISTS flavors;
        CREATE TABLE flavors(
            id SERIAL PRIMARY KEY,
            txt VARCHAR(255) NOT NULL,
            ranking INTEGER DEFAULT 3 NOT NULL,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now()
        );
    `;
  await client.query(SQL);
  console.log("tables created");

  SQL = /* SQL */ `
        INSERT INTO flavors(txt, ranking) VALUES ('pickle', 5);
        INSERT INTO flavors(txt) VALUES('bread');
        INSERT INTO flavors(txt, ranking) VALUES('yellow', 1);
    `;
  await client.query(SQL);
  console.log("seeded database")

  const port = process.env.PORT || 3000; // Use environment port or default to 3000
  app.listen(port, () => console.log(`listen on port ${port}`));
};

init();

// Routes

// GET /api/flavors
app.get("/api/flavors", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM flavors");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/flavors/:id
app.get("/api/flavors/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query("SELECT * FROM flavors WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Flavor not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/flavors
app.post("/api/flavors", async (req, res) => {
  const { txt, ranking } = req.body;
  try {
    const result = await client.query(
      "INSERT INTO flavors (txt, ranking) VALUES ($1, $2) RETURNING *",
      [txt, ranking]
    );
    res.status(201).json(result.rows[0]); // 201 Created
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /api/flavors/:id
app.put("/api/flavors/:id", async (req, res) => {
  const { id } = req.params;
  const { txt, ranking } = req.body;
  try {
    const result = await client.query(
      "UPDATE flavors SET txt = $1, ranking = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [txt, ranking, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Flavor not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/flavors/:id
app.delete("/api/flavors/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query("DELETE FROM flavors WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Flavor not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
