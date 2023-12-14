import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { prisma } from "../../utils/prisma/index.js";

const router = express.Router();

// comment POST API
router.post(
  "/posts/:postId/comments",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { postId } = req.params;
      const { content } = req.body;

      const post = await prisma.posts.findFirst({
        where: { postId: +postId },
      });

      if (!post) {
        return res
          .status(401)
          .json({ message: "해당 게시글이 존재하지않습니다." });
      }

      const comment = await prisma.comments.create({
        data: {
          UserId: userId,
          PostId: +postId,
          content: content,
        },
      });

      if (!comment) {
        return res
          .status(404)
          .json({ errorMessage: "댓글을 등록할 권한이 없습니다." });
      }

      return res.status(200).json({ data: comment });
    } catch (error) {
      next(error);
    }
  },
);

// comment GET API
router.get("/posts/:postId/comments", async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await prisma.posts.findFirst({
      where: { postId: +postId },
    });
    if (!post) {
      return res
        .status(404)
        .json({ errorMessage: "존재하지 않는 게시글 입니다." });
    }
    // 게시글에 보이는 댓글 총 갯수
    const commentCount = await prisma.comments.count({
      where: { PostId: +postId },
    });

    await prisma.posts.update({
      where: { postId: +postId },
      data: { commentCount },
    });
    // 댓글 전부 조회
    const comment = await prisma.comments.findMany({
      where: { PostId: +postId },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ data: comment });
  } catch (error) {
    next(error);
  }
});

// comment DELETE API
router.delete(
  "/posts/:postId/comments/:commentId",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { postId, commentId } = req.params;

      const post = await prisma.posts.findFirst({
        where: { postId: +postId },
      });

      if (!post) {
        return res.status(400).json({ message: "존재하지 않는 게시글입니다." });
      }

      const comment = await prisma.comments.findFirst({
        where: { commentId: +commentId },
      });

      if (!comment) {
        return res.status(400).json({ message: "존재하지 않는 댓글입니다." });
      }
      await prisma.comments.delete({
        where: { UserId: userId, commentId: +commentId },
      });

      return res.status(200).json({ message: "댓글이 삭제되었습니다." });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
