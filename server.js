const express = require("express");
const sequelize = require("./db");
const bodyParser = require("body-parser");
const routes = require("./routes");
const User = require("./models/model");

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api", routes);

sequelize
  .sync({ force: true }) // `force: true` recria as tabelas a cada inicialização
  .then(() => {
    console.log("Banco de dados sincronizado");
  })
  .catch((err) => {
    console.error("Erro ao sincronizar o banco de dados:", err);
  });

app.listen(3000, () => {
  console.log("Servidor está rodando na porta 3000");
});
