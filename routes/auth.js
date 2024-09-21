var express=require("express")
const authController=require('../controllers/authControllers')

var router=express.Router();

router.post('/',authController.authApi)
router.post('/register',authController.register)
router.post('/login',authController.login)
router.post('/verify-otp',authController.verifyConfirm)
router.post('/resend-verify-otp',authController.resendConfirmOtp)
module.exports=router;