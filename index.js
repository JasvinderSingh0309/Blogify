import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import moment from "moment";

const app = express();
const port = 3000;

env.config();

function getAllBlogs() {
  // write code for this
}

async function getUserBlogs(id) {
  let response = await db.query("SELECT * FROM users_blogs WHERE user_id = $1",[id]);
  return response.rows;
}

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
      res.render("blog.ejs", {
        id:hasEmail.rows[0].id,
        blogs: await getUserBlogs(hasEmail.rows[0].id),
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


app.get("/addBlog",async (req, res) => {
  console.log(req.query);
  const id = req.query.user_id;
  res.render("addBlog.ejs",{
    id:id,
    route:"showBlog",
    blogs: await getUserBlogs(id),
  });
})

app.post("/showBlog", async (req, res) => {
  let user_id = req.body.user_id;
  let title = req.body.title;
  let blog = req.body.blog;
  let date = moment().format("MMMM D, YYYY");

  await db.query("INSERT INTO users_blogs (title, blog, dt, user_id) VALUES ($1, $2, $3, $4)",[
    title, blog, date, user_id
  ]);

  res.render("blog.ejs", {
    id:user_id,
    blogs: await getUserBlogs(user_id),
  });
})

// edit and delete functionality.

app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
})