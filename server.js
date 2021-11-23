const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();
const port = 4000;
const Users = require("./src/models/User");

require("dotenv").config();

app.use(cors());
app.use(express.json());

const mongoURI =
  "mongodb+srv://userTest:secret123@cluster0.hgkll.mongodb.net/myFirstDatabase?authSource=admin&replicaSet=atlas-eu2ek5-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true";
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database Connection Established...!");
  })
  .catch((err) => {
    console.log("Error: Database connection can not be established...!", err);
  });

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.status(401).send("please provide token");

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, user) {
      if (err) {
        return res.status(403).send("forbidden");
      }
      req.user = user;
      next();
    });
  } catch (error) {
    console.log("~ error", error);
    return res.status(500).send("Something went wrong.");
  }
};

app.get("/user", authenticateToken, async (req, res) => {
  try {
    const userDetails = await Users.find({});
    res.send(userDetails);
  } catch (err) {
    console.log("~ errc", err);
    return res.status(500).send("Something went wrong.");
  }
});

app.post("/user", authenticateToken, async (req, res) => {
  try {
    const newUser = new Users(req.body);
    console.log("~ newUser", newUser);
    newUser.save(function (err, data) {
      if (err) {
        return res.status(500).send("User is not created");
      } else {
        res.status(200).send("Data inserted");
      }
    });
  } catch (err) {
    console.log("~ errc", err);
    return res.status(500).send("Something went wrong.");
  }
});

app.delete("/user/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    await Users.remove({ _id: id });
    res.send("User deleted successfully");
  } catch (err) {
    console.log(err);
    authenticateToken;
    return res.status(500).send("Something went wrong.");
  }
});

app.put("/user/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    await Users.findByIdAndUpdate({ _id: id }, { ...req.body });
    res.send("User updated successfully");
  } catch (err) {
    console.log("~ errc", err);
    return res.status(500).send("Something went wrong.");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const isUserExists = await Users.findOne({ email, password });
    if (!isUserExists) {
      console.log("User not exist");
      return res.status(500).send("user does not exist");
    }
    console.log("User done");
    const user = { name: isUserExists.firstName };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
    // expiresIn: "10s",
    return res.send(accessToken);
  } catch (err) {
    console.log("~ errc", err);
    return res.status(500).send("Something went wrong.");
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
