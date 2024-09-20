const jwt = require("express-jwt");

require("dotenv").config();
console.log(process.env.JWT_SECRET);
const authenticate =jwt({
	secret: process.env.JWT_SECRET,
	algorithms: ["HS256"]
});



module.exports = authenticate;
