var express = require("express");
var authRouter = require("./auth");
// var bookRouter = require("./book");
var  callRouter = require("./call");

var app = express();
app.use(express.json());

app.use("/auth/", authRouter);
// app.use("/book/", bookRouter);
app.use("/call/",callRouter)

module.exports = app;