import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import env from "dotenv";

const app = express();
const port = 3000;
env.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.get("/books", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT *,TO_CHAR(date_read, 'yyyy-mm-dd') as date FROM notes"
    );
    const books = result.rows;
    res.render("home.ejs", {
      books: books,
    });
  } catch (e) {
    res.status(500).send("There were problem with db");
    console.log("There was problem with connection to db", e);
  }
});

app.get("/books/new", (req, res) => {
  res.render("modify.ejs", {
    heading: "New review",
    submit: "Create new review",
  });
});

app.post("/books", async (req, res) => {
  const rating = req.body["rating"];
  const dateRead = req.body["date_read"];
  const author = req.body["author"];
  const title = req.body["title"];
  const link = req.body["link"];
  const review = req.body["review"];

  try {
    const book = await db.query(
      "INSERT INTO notes (rating,date_read,review,author,link,title) Values ($1,$2,$3,$4,$5,$6) RETURNING *",
      [rating, dateRead, review, author, link, title]
    );
  } catch (e) {
    console.log("sth with data basse", e);
    res.status(500).send("Sth wrsadfong wisth database");
  }

  res.redirect("/books");
});

app.get("/books/edit/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const result = await db.query(
      "SELECT *, TO_CHAR(date_read, 'yyyy-mm-dd') as date FROM notes where id = $1",
      [id]
    );
    const book = result.rows[0];
    console.log(book);

    res.render("modify.ejs", {
      heading: "Edit revie",
      submit: "Update review",
      book: book,
    });
  } catch (e) {
    console.log(e);
    res.status(500).send("sth with db");
  }
});

app.post("/books/edit/:id", async (req, res) => {
  const rating = req.body["rating"];
  const dateRead = req.body["date_read"];
  const author = req.body["author"];
  const title = req.body["title"];
  const link = req.body["link"];
  const review = req.body["review"];
  const id = req.params.id;

  try {
    const book = await db.query(
      "UPDATE notes SET rating = $1,date_read = $2,review=$3,author=$4,link=$5,title=$6 where id = $7 RETURNING *",
      [rating, dateRead, review, author, link, title, id]
    );
  } catch (e) {
    console.log("sth with data basse", e);
    res.status(500).send("Sth wrsadfong wisth database");
  }

  res.redirect("/books");
});

app.get("/books/delete/:id", async (req, res) => {
  const id = req.params.id;

  try {
    await db.query("DELETE from notes where id = $1", [id]);
    res.redirect("/books");
  } catch (e) {
    res.status(500).send("sth wrong with db");
  }
});

app.listen(port, () => {
  console.log(`Running server on port ${port}`);
});
