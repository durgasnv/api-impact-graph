const express = require("express");
const router = express.Router();
const controller = require("../controllers/apiController");
const { validateIdParam, validateTargetIdParam } = require("../middleware/validate");

router.get("/services", controller.getAllServices);
router.get("/services/:id", validateIdParam, controller.getServiceById);
router.get("/services/:id/dependencies", validateIdParam, controller.getServiceDependencies);
router.get("/services/:id/paths/:targetId", validateTargetIdParam, controller.getDependencyPath);

module.exports = router;
