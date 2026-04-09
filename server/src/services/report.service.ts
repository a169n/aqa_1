import { AppDataSource } from '../config/data-source';
import { POST_STATUSES } from '../constants/post-status';
import { REPORT_STATUSES, type ReportStatus } from '../constants/report-status';
import { Comment } from '../models/comment.entity';
import { Post } from '../models/post.entity';
import { Report } from '../models/report.entity';
import type { AuthenticatedUser } from '../types/auth';
import { HttpError } from '../utils/http-error';
import { serializeReport } from '../utils/serializers';

const reportRepository = () => AppDataSource.getRepository(Report);
const postRepository = () => AppDataSource.getRepository(Post);
const commentRepository = () => AppDataSource.getRepository(Comment);

const normalizeStatus = (value: string | undefined): ReportStatus | null => {
  if (!value) {
    return null;
  }

  return Object.values(REPORT_STATUSES).includes(value as ReportStatus)
    ? (value as ReportStatus)
    : null;
};

export interface ParsedReportTarget {
  commentId: number | null;
  postId: number | null;
}

export const parseReportTarget = (input: {
  commentId?: number;
  postId?: number;
}): ParsedReportTarget => {
  const postId = input.postId ? Number(input.postId) : null;
  const commentId = input.commentId ? Number(input.commentId) : null;

  if ((postId ? 1 : 0) + (commentId ? 1 : 0) !== 1) {
    throw new HttpError(400, 'Report must target exactly one post or comment.');
  }

  return {
    commentId,
    postId,
  };
};

export const reportService = {
  async createReport(
    actor: AuthenticatedUser,
    input: { postId?: number; commentId?: number; reason: string },
  ) {
    const { postId, commentId } = parseReportTarget(input);
    const reason = input.reason?.trim();

    if (!reason) {
      throw new HttpError(400, 'Report reason is required.');
    }

    if (postId) {
      const post = await postRepository().findOneBy({ id: postId });

      if (!post || post.status !== POST_STATUSES.PUBLISHED) {
        throw new HttpError(404, 'Published post not found.');
      }
    }

    if (commentId) {
      const comment = await commentRepository().findOne({
        where: { id: commentId },
        relations: {
          post: true,
        },
      });

      if (!comment || comment.post.status !== POST_STATUSES.PUBLISHED) {
        throw new HttpError(404, 'Comment not found.');
      }
    }

    const existingOpen = await reportRepository().findOne({
      where: {
        reporterId: actor.id,
        ...(postId ? { postId } : {}),
        ...(commentId ? { commentId } : {}),
        status: REPORT_STATUSES.OPEN,
      },
    });

    if (existingOpen) {
      throw new HttpError(409, 'You already have an open report for this target.');
    }

    const report = reportRepository().create({
      reporterId: actor.id,
      postId,
      commentId,
      reason,
      status: REPORT_STATUSES.OPEN,
      resolutionNote: null,
      resolvedById: null,
      resolvedAt: null,
    });

    const saved = await reportRepository().save(report);
    const fullReport = await reportRepository().findOne({
      where: { id: saved.id },
      relations: {
        reporter: true,
        resolvedBy: true,
        post: true,
        comment: true,
      },
    });

    if (!fullReport) {
      throw new HttpError(500, 'Report was created but could not be loaded.');
    }

    return serializeReport(fullReport);
  },

  async listReports(filters: { status?: string }) {
    const status = normalizeStatus(filters.status);
    const reports = await reportRepository().find({
      where: status
        ? {
            status,
          }
        : undefined,
      relations: {
        reporter: true,
        resolvedBy: true,
        post: true,
        comment: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return reports.map(serializeReport);
  },

  async updateReport(
    reportId: number,
    actor: AuthenticatedUser,
    input: { status: ReportStatus; resolutionNote?: string },
  ) {
    const report = await reportRepository().findOne({
      where: { id: reportId },
      relations: {
        reporter: true,
        resolvedBy: true,
        post: true,
        comment: true,
      },
    });

    if (!report) {
      throw new HttpError(404, 'Report not found.');
    }

    if (!Object.values(REPORT_STATUSES).includes(input.status)) {
      throw new HttpError(400, 'Invalid report status.');
    }

    report.status = input.status;

    if (input.status === REPORT_STATUSES.OPEN) {
      report.resolvedAt = null;
      report.resolvedById = null;
      report.resolutionNote = null;
    } else {
      report.resolvedAt = new Date();
      report.resolvedById = actor.id;
      report.resolutionNote = input.resolutionNote?.trim() || null;
    }

    await reportRepository().save(report);

    const updatedReport = await reportRepository().findOne({
      where: { id: reportId },
      relations: {
        reporter: true,
        resolvedBy: true,
        post: true,
        comment: true,
      },
    });

    if (!updatedReport) {
      throw new HttpError(500, 'Updated report could not be loaded.');
    }

    return serializeReport(updatedReport);
  },
};
