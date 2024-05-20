import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

const app = express();
const port = 3000;

env.config();

const db = new pg.Client({
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
});
db.connect();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  // get all data from the user-Blog db and send to index.ejs.
  res.render("index.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
})

app.get("/register", (req, res) => {
  res.render("register.ejs");
})

app.post("/login",async (req, res) => {
  console.log(req.body);
  let email = req.body.email;
  let password = req.body.password;

  let hasEmail = await db.query("SELECT * FROM users WHERE email = $1",[email]);

  if(hasEmail.rows.length) {
    let passwordFromDB = hasEmail.rows[0].password;

    console.log(hasEmail.rows[0].id);

    if(passwordFromDB === password) {
      //get all the users blog from user-Blog db and sent it while rendering blog.ejs
      res.render("blog.ejs", {
        id:hasEmail.rows[0].id,
        // blogs: [{}]
      })
    }else{
      res.render("login.ejs", {
        message: "Please enter correct password.",
      });
    }
  }else{
    res.render("register.ejs", {
      message: "Please register to continue.",
    });
  }
})

app.post("/register",async (req, res) => {
  console.log(req.body);
  let email = req.body.email;
  let password = req.body.password;

  let hasEmail = await db.query("SELECT * FROM users WHERE email = $1",[email]);

  if(!hasEmail.rows.length) {
    await db.query("INSERT INTO users (email, password) VALUES ($1, $2)",[email, password]);
    res.redirect("/login");
  }else{
    res.render("register.ejs", {
      message: "Email already exists. Please try again!!",
    });
  }
})

app.get("/login/addBlog", (req, res) => {
  console.log(req.query);
  const id = req.query.user_id;
  res.render("login.ejs");
})

app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
})