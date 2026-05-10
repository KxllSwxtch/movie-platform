import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";

import { PrismaService } from "../../config/prisma.service";
import { StorageService } from "../storage/storage.service";
import { EdgeCenterService } from "../edgecenter/edgecenter.service";
import { EncodingStatus, VideoQuality } from "@movie-platform/shared";
import { EncodingStatusDto } from "../edgecenter/dto";
import {
  VIDEO_PROCESSING_QUEUE,
  VideoJobType,
  TranscodeJobData,
} from "./video-processing.constants";

@Injectable()
export class VideoProcessingService {
  private readonly logger = new Logger(VideoProcessingService.name);

  constructor(
    @InjectQueue(VIDEO_PROCESSING_QUEUE)
    private readonly videoQueue: Queue<TranscodeJobData>,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    @Optional() private readonly edgecenterService?: EdgeCenterService,
  ) {}

  private isRootStructuredContent(content: {
    contentType: string;
    series?: { parentSeriesId: string | null } | null;
  }): boolean {
    return (
      (content.contentType === "SERIES" ||
        content.contentType === "TUTORIAL") &&
      (!content.series || !content.series.parentSeriesId)
    );
  }

  /**
   * Enqueue a video for transcoding
   */
  async enqueueTranscoding(
    contentId: string,
    sourceFilePath: string,
    fileName: string,
  ): Promise<{ jobId: string }> {
    this.logger.debug(
      `[enqueueTranscoding START] contentId=${contentId}, filepath=${sourceFilePath}`,
    );

    // Verify content exists
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      include: { series: true },
    });
    if (!content) {
      this.logger.error(`[enqueueTranscoding] Content not found: ${contentId}`);
      throw new NotFoundException(`Контент ${contentId} не найден`);
    }
    if (this.isRootStructuredContent(content)) {
      throw new BadRequestException(
        "Видео для сериалов и обучения загружается только на уровне серии или урока",
      );
    }
    this.logger.debug(`[enqueueTranscoding] Content found: ${contentId}`);

    // Keep the current playable stream intact while the replacement is queued
    // and transcoded. The processor publishes the new stream only after all
    // output files are ready, so a failed replacement cannot break playback.

    // Add to BullMQ queue
    this.logger.debug(`[enqueueTranscoding] Adding to BullMQ queue`);
    const job = await this.videoQueue.add(
      VideoJobType.TRANSCODE,
      { contentId, sourceFilePath, sourceFileName: fileName },
      {
        removeOnComplete: 5,
        removeOnFail: 10,
        attempts: 1,
      },
    );
    this.logger.log(
      `Enqueued transcode job ${job.id} for content ${contentId}`,
    );

    return { jobId: String(job.id) };
  }

  /**
   * Get encoding status for a content
   * Delegates to EdgeCenterService for CDN-hosted content
   */
  async getEncodingStatus(contentId: string): Promise<EncodingStatusDto> {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      include: {
        videoFiles: {
          orderBy: { quality: "desc" },
        },
        series: true,
      },
    });

    if (!content) {
      throw new NotFoundException(`Контент ${contentId} не найден`);
    }

    if (this.isRootStructuredContent(content)) {
      return {
        contentId,
        hasVideo: false,
        status: EncodingStatus.PENDING,
        availableQualities: [],
      };
    }

    // Delegate to EdgeCenter for CDN content
    if (
      content.edgecenterClientId?.startsWith("edgecenter") &&
      this.edgecenterService
    ) {
      return this.edgecenterService.syncEncodingStatus(contentId);
    }

    // No video files → no video
    const replacementProgress = await this.getJobProgress(contentId);

    if (content.videoFiles.length === 0 && replacementProgress === undefined) {
      return {
        contentId,
        hasVideo: false,
        status: EncodingStatus.PENDING,
        availableQualities: [],
      };
    }

    // Keep existing completed files playable during replacement, but report
    // active queue work so admin UI keeps polling until the new stream is ready.
    if (replacementProgress !== undefined) {
      const qualityMapping: Record<string, VideoQuality> = {
        Q_240P: VideoQuality.Q_240P,
        Q_480P: VideoQuality.Q_480P,
        Q_720P: VideoQuality.Q_720P,
        Q_1080P: VideoQuality.Q_1080P,
        Q_4K: VideoQuality.Q_4K,
      };
      return {
        contentId,
        edgecenterVideoId: content.edgecenterVideoId || undefined,
        hasVideo: true,
        status: EncodingStatus.PROCESSING,
        availableQualities: content.videoFiles
          .filter((vf) => vf.encodingStatus === "COMPLETED")
          .map((vf) => qualityMapping[vf.quality])
          .filter(Boolean),
        progress: replacementProgress,
        thumbnailUrl: content.thumbnailUrl || undefined,
        duration: content.duration || undefined,
      };
    }

    // Determine overall status from video files
    const statuses = content.videoFiles.map((vf) => vf.encodingStatus);
    let overallStatus: EncodingStatus;
    let progress: number | undefined;

    if (statuses.some((s) => s === "FAILED")) {
      overallStatus = EncodingStatus.FAILED;
    } else if (statuses.every((s) => s === "COMPLETED")) {
      overallStatus = EncodingStatus.COMPLETED;
    } else if (statuses.some((s) => s === "PROCESSING")) {
      overallStatus = EncodingStatus.PROCESSING;
      // Try to get progress from active Bull job
      progress = replacementProgress;
    } else {
      overallStatus = EncodingStatus.PENDING;
    }

    // Map completed qualities
    const qualityMapping: Record<string, VideoQuality> = {
      Q_240P: VideoQuality.Q_240P,
      Q_480P: VideoQuality.Q_480P,
      Q_720P: VideoQuality.Q_720P,
      Q_1080P: VideoQuality.Q_1080P,
      Q_4K: VideoQuality.Q_4K,
    };

    const availableQualities = content.videoFiles
      .filter((vf) => vf.encodingStatus === "COMPLETED")
      .map((vf) => qualityMapping[vf.quality])
      .filter(Boolean);

    return {
      contentId,
      edgecenterVideoId: content.edgecenterVideoId || undefined,
      hasVideo: true,
      status: overallStatus,
      availableQualities,
      progress,
      thumbnailUrl: content.thumbnailUrl || undefined,
      duration: content.duration || undefined,
    };
  }

  /**
   * Delete video files from storage and database for a content
   * Delegates to EdgeCenterService for CDN-hosted content
   */
  async deleteVideoForContent(contentId: string): Promise<void> {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
    });
    if (!content) {
      throw new NotFoundException(`Контент ${contentId} не найден`);
    }

    // Delegate to EdgeCenter for CDN content
    if (content.edgecenterClientId === "edgecenter" && this.edgecenterService) {
      return this.edgecenterService.deleteVideoForContent(contentId);
    }

    // Delete from MinIO
    await this.storage.deleteFolder("videos", `${contentId}/`);

    // Delete thumbnail
    try {
      await this.storage.deleteFile("thumbnails", `${contentId}/thumb.jpg`);
    } catch {
      // Thumbnail may not exist
    }

    // Delete VideoFile records
    await this.prisma.videoFile.deleteMany({ where: { contentId } });

    // Reset Content fields
    await this.prisma.content.update({
      where: { id: contentId },
      data: {
        edgecenterVideoId: null,
        edgecenterClientId: null,
        duration: 0,
      },
    });

    this.logger.log(`Deleted video for content ${contentId}`);
  }

  /**
   * Get Bull job progress for a content
   */
  private async getJobProgress(contentId: string): Promise<number | undefined> {
    const jobs = [
      ...(await this.videoQueue.getActive()),
      ...(await this.videoQueue.getWaiting()),
      ...(await this.videoQueue.getDelayed()),
    ];
    const job = jobs.find((j) => j.data.contentId === contentId);
    if (job) {
      const progress = await job.progress();
      return typeof progress === "number" ? progress : 0;
    }
    return undefined;
  }
}
