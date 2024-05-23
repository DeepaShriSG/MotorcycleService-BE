import express from "express";
import UsersController from "../controller/user.js";
import CommonController from "../common/general.js"
import Auth from "../common/auth.js";

const router = express.Router();


router.get("/activeusers",Auth.validate,Auth.adminGuard,UsersController.getActiveUsers)

router.get("/getuser", Auth.validate,UsersController.getUserByid);

router.post('/bookservice',Auth.validate,UsersController.BookService)
router.get("/getservice",Auth.validate,UsersController.servicedetails)
router.put("/editservice",UsersController.EditService)


export default router;
