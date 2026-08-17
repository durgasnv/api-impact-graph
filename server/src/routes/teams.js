const express = require("express");
const router = express.Router();
const controller = require("../controllers/apiController");
const { validateIdParam } = require("../middleware/validate");

router.get("/teams", controller.getAllTeams);
router.get("/teams/:id", validateIdParam, controller.getTeamById);

module.exports = router;
