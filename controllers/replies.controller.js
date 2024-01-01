import { RepliesService } from "../services/replies.service";

export class RepliesController {
    // 등록
  createReply = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { postId, commentId } = req.params;

      if (!userId) {
        return res.status(401).json({ message: "로그인 후 사용하여 주세요." });
      }

      const validation = await this.commentsService.validateReply(req.body);
      const { content } = validation;

      const reply = await this.commentsService.createReply(
        userId,
        commentId,
        content,
      );

      return res.status(200).json({ data: reply });
    } catch (error) {
      next(error);
    }
  };
}

// 조회

getReplies = async (req, res, next) => {
    try {
      const { commentId } = req.params;
      const replies = await this.commentsService.getRepliesWithImages(commentId);

      return res.status(200).json({ data: replies });
    } catch (error) {
      next(error);
    }
  };


// 삭제
deleteReply = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { replyId, commentId } = req.params;

      if (!userId) {
        return res.status(401).json({ message: "로그인 후 사용하여 주세요." });
      }

      await this.commentsService.deleteReply(userId, replyId, commentId);

      return res.status(200).json({ message: "댓글이 삭제되었습니다." });
    } catch (error) {
      next(error);
    }
  };
