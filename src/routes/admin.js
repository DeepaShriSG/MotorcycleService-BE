import express from "express";
import AdminController from "../controller/admin.js";
import Auth from "../common/auth.js";

const router = express.Router();



router.get("/activeengineers",Auth.validate,AdminController.ActiveEngineers)
router.post("/assign/:id",Auth.validate,AdminController.assignEngineer)

router.get("/completedusers",Auth.validate,AdminController.completedUsers)
router.get("/reports",AdminController.getReports)
router.get("/servicereports",AdminController.serviceReports)

router.post("/create", AdminController.createAdmin);
router.get("/getadmin/:id",AdminController.getadmin)



export default router;




