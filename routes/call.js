var express = require("express");
const callController = require("../controllers/callControllers");

var router = express.Router();

router.post("/",callController.callApi);


module.exports = router;