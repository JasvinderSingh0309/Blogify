import express from "express";

const app = express();
const port = 3000;

app.use(express.static('public'))

app.get("/login", (req, res) => {
  res.render("login.ejs");
})

app.get("/register", (req, res) => {
  res.render("register.ejs");
})

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
})