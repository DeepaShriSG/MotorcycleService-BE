import express from 'express'
import userRoute from "./user.js"
import adminRoute from "./admin.js"
import engineerRoute from "./engineer.js"
import Auth from "../common/auth.js";

import CommonController from "../common/general.js"


const router = express.Router()

router.use('/user',userRoute)
router.use('/engineer',engineerRoute)
router.use('/admin',adminRoute)

router.post("/signup", CommonController.signup);
router.post("/login", CommonController.login);
router.post('/forget-password',CommonController.forgetPassword);
router.get("/allusers",Auth.validate,CommonController.AllUsers);

router.get("/getService/:id", Auth.validate,CommonController.service)
router.get("/getuser/:id", Auth.validate,CommonController.getuser);
router.post("/update/:id",Auth.validate,CommonController.update)
router.get("/getProfile",Auth.validate,CommonController.getProfile)
router.put("/editprofile",Auth.validate,CommonController.editProfile)
router.get("/sendCode",Auth.validate,CommonController.sendCode);
router.post("/verifyCode",Auth.validate,CommonController.verifyCode);
router.post('/reset-password',Auth.validate,CommonController.resetPassword)

export default router
