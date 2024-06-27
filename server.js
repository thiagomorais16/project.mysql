const express = require("express");
const sequelize = require("./db");
const bodyParser = require("body-parser");
const routes = require("./routes");
const User = require("./models/model");

const app = express();

app.use(express.json());

app.use("/api", routes);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

sequelize
  .sync()
  .then(() => {
    console.log("Banco de dados sincronizado");
  })
  .catch((err) => {
    console.error("Erro ao sincronizar o banco de dados:", err);
  });

app.listen(3000, () => {
  console.log("Servidor está rodando na porta 3000");
});
