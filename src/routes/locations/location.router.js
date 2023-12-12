import express from "express";
import { prisma } from "../../utils/prisma/index.js";
// import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

// 모든 위치 조회
router.get("/locations", async (req, res) => {
  const { latitude, longitude } = req.query;
  const location = await prisma.locations.findMany(
    res.status(200).json({ data: location }),
  );
});

//특정 위치 조회
router.get("/locations/:locationId", async (req, res) => {
  const { locationId } = req.params;
  const { address, latitude, longitude } = req.body;
  const location = await prisma.locations.findMany({
    select: {
      Location: {
        address: true,
        latitude: true,
        longitude: true,
      },
      Posts: {
        select: {
          content: true,
          imgUrl: true,
          likeCount: true,
          starAvg: true,
          creatredAt: true,
        },
      },
      Categories: {
        select: {
          categoryName: true,
        },
      },
    },
  });
  return res.status(200).json({ data: location });
});

export default router;
