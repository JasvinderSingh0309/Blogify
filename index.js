import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import moment from "moment";
import bcrypt from "bcrypt";

const app = express();
const port = 3000;

const saltingRounds = 10;

env.config();

async function getAllBlogs() {
  let response = await db.query("SELECT * FROM users_blogs");
  return response.rows.sort((a,b) => a.id - b.id);
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

// write a function to update existing passwords to hash
async function updatePassword() {
  let response = await db.query("SELECT * FROM users");
  let resp = response.rows;
  console.log(resp);
  // for(let i=0;i<resp.length;i++) {
  //   if(resp[i].password.length !== 60) {
  //     console.log(resp[i].id);

      // bcrypt.hash(resp[i].password, saltingRounds, async (error, hash) => {
      //   if(error) {
      //     console.log(error);
      //   }else{
      //     await db.query("UPDATE users SET password = $1 WHERE id=$2",[hash, resp[i].id]);
      //   }
      // });

    // }
  // }
}
// updatePassword();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/",async (req, res) => {
  res.render("index.ejs", {
    blogs: await getAllBlogs(),
  });
});

app.get("/login-form", (req, res) => {
  res.render("login.ejs");
})

app.get("/register", (req, res) => {
  res.render("register.ejs");
})

app.post("/login/yourHome",async (req, res) => { // bycrpt
  // console.log(req.body);
  let email = req.body.email;
  let password = req.body.password;

  let hasEmail = await db.query("SELECT * FROM users WHERE email = $1",[email]);

  if(hasEmail.rows.length) {
    let passwordFromDB = hasEmail.rows[0].password;

    // console.log(hasEmail.rows[0].id);

    bcrypt.compare(password, passwordFromDB, async (error, result) => {
      if(error) {
        res.render("login.ejs", {
          message: "Something went wrong. Please try again!!",
        });
      }else{
        console.log(result);
        if(result) {
          res.render("blog.ejs", {
            id:hasEmail.rows[0].id,
            blogs: await getUserBlogs(hasEmail.rows[0].id),
          })
        }else{
          res.render("login.ejs", {
            message: "Please enter correct password.",
          });
        }
      }
    });
  }else{
    res.render("register.ejs", {
      message: "Please register to continue.",
    });
  }
})


app.post("/register",async (req, res) => {
  // console.log(req.body);
  let email = req.body.email;
  let password = req.body.password;

  let hasEmail = await db.query("SELECT * FROM users WHERE email = $1",[email]);

  if(!hasEmail.rows.length) {

    bcrypt.hash(password, saltingRounds, async (error, hash) => {
      if(error) {
        res.render("register.ejs", {
          message: "Something went wrong. Please try again!!",
        });
      }else{
        await db.query("INSERT INTO users (email, password) VALUES ($1, $2)",[email, hash]);
        res.redirect("/login-form");
      }
    });

  }else{
    res.render("register.ejs", {
      message: "Email already exists. Please try again!!",
    });
  }
})


app.get("/addBlog",async (req, res) => {
  // console.log(req.query);
  const id = req.query.user_id;
  res.render("addBlog.ejs",{
    id:id,
    route:"showBlog",
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

app.get("/editBlog", async (req, res) => {
  // console.log(req.query);

  let resp = await db.query("SELECT * FROM users_blogs WHERE id = $1",[req.query.id]);

  // console.log(resp.rows);

  res.render("editBlog.ejs", {
    id: req.query.userID,
    route:"updateBlog",
    blog:resp.rows[0],
  });
});

app.post("/updateBlog", async (req, res) => {
  let user_id = req.body.user_id;
  let blog_id = req.body.blog_id;
  let title = req.body.title;
  let blog = req.body.blog;
  let date = moment().format("MMMM D, YYYY");

  await db.query("UPDATE users_blogs SET title=$1, blog=$2, dt=$3 WHERE id=$4 ",[
    title, blog, date, blog_id
  ]);

  res.render("blog.ejs", {
    id:user_id,
    blogs: await getUserBlogs(user_id),
  });
})

app.get("/deleteBlog",async (req, res) => {
  // console.log(req.query);

  await db.query("DELETE FROM users_blogs WHERE id = $1",[req.query.id]);

  
  res.render("blog.ejs", {
    id:req.query.userID,
    blogs: await getUserBlogs(req.query.userID),
  });
});

app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
})