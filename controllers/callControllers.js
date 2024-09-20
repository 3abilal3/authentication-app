const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
var mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);



exports.callApi = [
    
    (req, res) => {
        const token = req.headers.authorization;
        const payload = req.body;
        const endpoint = req.originalUrl;
        const method = req.method;
        const portalName = req.body.portalName;

        const logs = {
            token,
            payload,
            endpoint,
            method,
            portalName
        };
        console.log(logs);

        return apiResponse.successResponseWithData(res, "Operation success", logs);
    }
];
