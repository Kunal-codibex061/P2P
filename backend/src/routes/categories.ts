import { Router } from "express";
import { CATEGORIES, USE_CASE_COLLECTIONS } from "../utils/constants";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ data: { categories: CATEGORIES, collections: USE_CASE_COLLECTIONS } });
});

export default router;
