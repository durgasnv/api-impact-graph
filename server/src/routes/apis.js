const express = require("express");
const router = express.Router();
const controller = require("../controllers/apiController");
const { validateIdParam, validateVersionIdQuery } = require("../middleware/validate");

router.get("/apis", controller.getAllApis);
router.get("/apis/:id", validateIdParam, controller.getApiById);
router.get("/apis/:id/consumers", validateIdParam, controller.getDirectConsumers);
router.get("/apis/:id/blast-radius", validateIdParam, validateVersionIdQuery, controller.getBlastRadius);

module.exports = router;
