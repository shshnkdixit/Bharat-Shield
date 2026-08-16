import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analysisRouter from "./analysis";
import modelsRouter from "./models";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analysisRouter);
router.use(modelsRouter);

export default router;
