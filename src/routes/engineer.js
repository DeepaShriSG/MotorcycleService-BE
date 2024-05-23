import express from "express";
import EngineerController from "../controller/engineer.js";
import CommonController from "../common/general.js"
import Auth from "../common/auth.js";

const router = express.Router();

router.get("/assignedusers", Auth.validate, EngineerController.AssignedUsers);

router.get("/reports",Auth.validate,EngineerController.getReports)
router.get("/servicereports",Auth.validate,EngineerController.serviceReports)
router.get("/userslist", Auth.validate, EngineerController.userslist);
router.put("/editService/:id", EngineerController.EditService);

router.get( "/getengineers", Auth.validate, Auth.adminGuard, EngineerController.getEngineers);
router.get("/getengineer/:id", EngineerController.getengineerById);


export default router;
