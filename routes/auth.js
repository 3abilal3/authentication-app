var express=require("express")
const authController=require('../controllers/authControllers')

var router=express.Router();

router.post('/',authController.authApi)
router.post('/register',authController.register)

module.exports=router;