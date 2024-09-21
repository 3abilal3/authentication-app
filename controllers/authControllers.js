const UserModel = require("../models/userModel");
const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
const Joi = require("joi");
const userModel = require("../models/userModel");


exports.authApi = [
    
    (req, res) => {
        // const token = req.headers.authorization;
        // const payload = req.body;
        // const endpoint = req.originalUrl;
        // const method = req.method;
        // const portalName = req.body.portalName;

        // const logs = {
        //     token,
        //     payload,
        //     endpoint,
        //     method,
        //     portalName
        // };
        // console.log('bilal');

        return apiResponse.successResponseWithData(res, "Operation success");
    }
];


// Define Joi schema for validation
const registerSchema = Joi.object({
    firstName: Joi.string().alphanum().min(1).required().messages({
        'string.empty': 'First name must be specified.',
        'string.alphanum': 'First name has non-alphanumeric characters.',
    }),
    lastName: Joi.string().alphanum().min(1).required().messages({
        'string.empty': 'Last name must be specified.',
        'string.alphanum': 'Last name has non-alphanumeric characters.',
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'Email must be specified.',
        'string.email': 'Email must be a valid email address.'
    }),
    password: Joi.string().min(6).required().messages({
        'string.empty': 'Password must be specified.',
        'string.min': 'Password must be 6 characters or greater.'
    })
});

const loginSchema = Joi.object({
   
    email: Joi.string().email().required().messages({
        'string.empty': 'Email must be specified.',
        'string.email': 'Email must be a valid email address.'
    }),
    password: Joi.string().min(6).required().messages({
        'string.empty': 'Password must be specified.',
        'string.min': 'Password must be 6 characters or greater.'
    })
});

const otpSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'Email must be specified.',
        'string.email': 'Email must be a valid email address.'
    }),
	otp: Joi.number().min(1).required().messages({
        'number.base': 'OTP must be a number.',
        'any.required': 'OTP must be entered.',
        'number.min': 'OTP must be at least 1 digit long.'
    })
});
/**
 * User registration.
 *
 * @param {string}      firstName
 * @param {string}      lastName
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */

exports.register = [
		
	(req, res) => {
		try {
			// Extract the validation errors from a request.
			
			const { error, value } = registerSchema.validate(req.body, { abortEarly: false });

        if (error) {
            // Send validation errors if any
            const validationErrors = error.details.map((err) => ({
                message: err.message,
                path: err.path[0]
            }));
            return apiResponse.validationErrorWithData(res, "Validation Error.", validationErrors);
        }
		else {
				//hash input password
				console.log("hash input");
				bcrypt.hash(req.body.password,10,function(err, hash) {
					// generate OTP for confirmation
					let otp = utility.randomNumber(4);
					// Create User object with escaped and trimmed data
					var user = new UserModel(
						{
							firstName: req.body.firstName,
							lastName: req.body.lastName,
							email: req.body.email,
							password: hash,
							confirmOTP: otp
						}
					);
					// Html email body
					let html = "<p>Please Confirm your Account.</p><p>OTP: "+otp+"</p>";
					// Send confirmation email
					
					mailer.send(
						constants.confirmEmails.from, 
						req.body.email,
						"Confirm Account",
						html
					).then(function(){
						// Save user.
						user.save(function (err) {
							if (err) { return apiResponse.ErrorResponse(res, err); }
							let userData = {
								_id: user._id,
								firstName: user.firstName,
								lastName: user.lastName,
								email: user.email
							};
							return apiResponse.successResponseWithData(res,"Registration Success.", userData);
						});
					}).catch(err => {
						console.log(err);
						return apiResponse.ErrorResponse(res,err);
					}) ;
				});
			}
		} catch (err) {
			//throw error in json response with status 500.
			console.log(err);
			return apiResponse.ErrorResponse(res, err);
		}
	}];

exports.login = [
		(req, res) => {
			try {
				const { error, value } = loginSchema.validate(req.body, { abortEarly: false });

        if (error) {
            // Send validation errors if any
            const validationErrors = error.details.map((err) => ({
                message: err.message,
                path: err.path[0]
            }));
            return apiResponse.validationErrorWithData(res, "Validation Error.", validationErrors);
        }else{
				userModel.findOne({ email: req.body.email }).then(user => {
					if (user) {
						// Correct bcrypt.compare syntax
						bcrypt.compare(req.body.password, user.password).then((same) => {
							if (same) {
								if (user.isConfirm) {
									if (user.status) {
										// Prepare user data
										let userData = {
											_id: user._id,
											firstName: user.firstName,
											lastName: user.lastName,
											email: user.email,
										};
	
										const jwtPayload = userData; // Payload should be the data
										const jwtData = {
											expiresIn: process.env.JWT_TIMEOUT_DURATION
										};
										const secret = process.env.JWT_SECRET;
										
										// Fix jwt.sign syntax
										userData.token = jwt.sign(jwtPayload, secret, jwtData);
	
										// Return success response
										return apiResponse.successResponseWithData(res, "Login Successfully", userData);
									} else {
										// Account not active
										return apiResponse.unauthorizedResponse(res, "Activate your account, please.");
									}
								} else {
									// Account not confirmed
									return apiResponse.unauthorizedResponse(res, "Your Account is not confirmed yet! Please confirm your account.");
								}
							} else {
								// Password mismatch
								return apiResponse.unauthorizedResponse(res, "Email or Password wrong.");
							}
						}).catch(err => {
							// Error during bcrypt comparison
							return apiResponse.ErrorResponse(res, err);
						});
					} else {
						// User not found
						return apiResponse.unauthorizedResponse(res, "Email or Password wrong.");
					}
				}
				).catch(err => {
					// Error during user lookup
					return apiResponse.ErrorResponse(res, err);
				});
			}
			}catch (err) {
				// General error
				return apiResponse.ErrorResponse(res, err);
			}
		}
	];
	

exports.verifyConfirm = [
		(req, res) => {
			try {
				const {error,value} = otpSchema.validate(req.body,{abortEarly:false});
				if (error) {
					const validationErrors = error.details.map((err) => ({
						message: err.message,
						path: err.path[0]
					}));
					return apiResponse.validationErrorWithData(res, "Validation Error.", validationErrors);
				}else {
					var query = {email : req.body.email};
					UserModel.findOne(query).then(user => {
						if (user) {
							//Check already confirm or not.
							if(!user.isConfirm){
								//Check account confirmation.
								if(user.confirmOTP == req.body.otp){
									//Update user as confirmed
									UserModel.findOneAndUpdate(query, {
										isConfirm: 1,
										confirmOTP: null 
									}).catch(err => {
										return apiResponse.ErrorResponse(res, err);
									});
									return apiResponse.successResponse(res,"Account confirmed success.");
								}else{
									return apiResponse.unauthorizedResponse(res, "Otp does not match");
								}
							}else{
								return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
							}
						}else{
							return apiResponse.unauthorizedResponse(res, "Specified email not found.");
						}
					});
				}
			} catch (err) {
				return apiResponse.ErrorResponse(res, err);
			}
}];
const resendOtpSchema = Joi.object({
	email: Joi.string().email().required().messages({
		'string.empty': 'Email must be specified.',
		'string.email': 'Email must be a valid email address.'
	})
});

exports.resendConfirmOtp = [
	(req, res) => {
		try {
			// Validate the request body
			const { error, value } = resendOtpSchema.validate(req.body, { abortEarly: false });
			
			// Debugging: Log the validation result
			console.log("Validation Result:", error, value);
			
			if (error) {
				// Extract validation errors
				const validationErrors = error.details.map((err) => ({
					message: err.message,
					path: err.path[0]
				}));

				// Log validation error
				console.log("Validation Error Occurred");
				
				// Return validation errors to the client
				return apiResponse.validationErrorWithData(res, "Validation Error.", validationErrors);
			} else {
				// Proceed if validation passes
				const query = { email: req.body.email };
				
				UserModel.findOne(query).then(user => {
					if (user) {
						// Check if account is not already confirmed
						if (!user.isConfirm) {
							// Generate a new OTP
							let otp = utility.randomNumber(4);
							// Html email body
							let html = `<p>Please Confirm your Account.</p><p>OTP: ${otp}</p>`;
							
							// Send confirmation email
							mailer.send(
								constants.confirmEmails.from,
								req.body.email,
								"Confirm Account",
								html
							).then(function () {
								// Update user data
								user.isConfirm = 0;
								user.confirmOTP = otp;
								
								// Save user details
								user.save(function (err) {
									if (err) {
										return apiResponse.ErrorResponse(res, err);
									}
									return apiResponse.successResponse(res, "Confirm OTP sent.");
								});
							}).catch(err => {
								// Handle mail sending error
								return apiResponse.ErrorResponse(res, err);
							});
						} else {
							return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
						}
					} else {
						return apiResponse.unauthorizedResponse(res, "Specified email not found.");
					}
				}).catch(err => {
					// Handle potential database error
					return apiResponse.ErrorResponse(res, err);
				});
			}
		} catch (err) {
			// Handle unexpected errors
			return apiResponse.ErrorResponse(res, err);
		}
	}
];
