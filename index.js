require("dotenv").config();
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
var cors = require("cors");
const swaggerUi = require('swagger-ui-express')

const connectDb = require("./database/db");
const swaggerFile = require('./swagger_output.json')

const user = require('./routes/User/User');
const role = require('./routes/User/Roles');

const app = express();
const port = process.env.PORT || 3013;

const http = require('http').createServer(app);

const session = require('express-session');


connectDb();

app.use(session({ secret: 'super-secret-phrase', resave: false, saveUninitialized: true }));

app.use(express.static(__dirname, { dotfiles: 'allow' }));
app.use(express.json({ extended: true }));
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors({ origin: true, credentials: false }));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});
app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))

app.get("/", (req, res) => {
    res.render('index.html', { message: 'This is a demo' });
})



app.use("/user", user);
app.use("/role", role);

http.listen(port, () => console.log("app running at - " + port))
