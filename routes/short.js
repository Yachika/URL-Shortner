import express from 'express';
import cacheService from "express-api-cache";
const cache = cacheService.cache;

import { createShortURL, getShortURL } from "../controller/short.js";
var router = express.Router();

router.post("/short", cache("5 hours"), createShortURL);
router.get("/:shortUrl", getShortURL);

export default router;
