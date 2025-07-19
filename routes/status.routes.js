const express = require("express");
const router = express.Router();
const Service = require("../models/service.model");
const {checkLatestStatus, checkStatusByServiceName}  = require("../controllers/status.controllers")

router.get("/latest", checkLatestStatus);
router.get("/history/:serviceName",checkStatusByServiceName );

module.exports = router;
