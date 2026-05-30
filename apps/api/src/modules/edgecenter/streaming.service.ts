import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AgeCategory } from "@prisma/client";
import { createHash } from "crypto";

import { PrismaService } from "../../config/prisma.service";
import { UserRole, VideoQuality } from "@movie-platform/shared";
import { StreamUrlResponseDto, ContentAccessResultDto } from "./dto";
import { EdgeCenterService } from "./edgecenter.service";
import { StorageService } from "../storage/storage.service";

interface ContentAccessContext {
  userId?: string;
  userRole?: string;
  userAgeCategory?: AgeCategory;
  verificationStatus?: string;
  userSubscriptionTier?: string;
}

@Injectable()
export class StreamingService {
  private readonly cdnHostname: string;
  private readonly signedUrlExpiryHours: number;
  private readonly edgecenterCdnSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly edgecenterService: EdgeCenterService,
    private readonly storageService: StorageService,
  ) {
    this.cdnHostname = this.configService.get<string>(
      "EDGECENTER_CDN_HOSTNAME",
      "",
    );
    this.signedUrlExpiryHours = this.configService.get<number>(
      "SIGNED_URL_EXPIRY_HOURS",
      4,
    );
    this.edgecenterCdnSecret = this.configService.get<string>(
      "EDGECENTER_CDN_SECRET",
      "",
    );
  }

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

  private getAllowedAgeCategories(
    userAgeCategory?: AgeCategory,
    verificationStatus?: string,
  ): AgeCategory[] {
    const order: AgeCategory[] = [
      AgeCategory.ZERO_PLUS,
      AgeCategory.SIX_PLUS,
      AgeCategory.TWELVE_PLUS,
      AgeCategory.SIXTEEN_PLUS,
      AgeCategory.EIGHTEEN_PLUS,
    ];

    if (!userAgeCategory) {
      return [
        AgeCategory.ZERO_PLUS,
        AgeCategory.SIX_PLUS,
        AgeCategory.TWELVE_PLUS,
        AgeCategory.SIXTEEN_PLUS,
      ];
    }

    const index = order.indexOf(userAgeCategory);
    const allowed = index >= 0 ? order.slice(0, index + 1) : [AgeCategory.ZERO_PLUS];

    if (verificationStatus !== "VERIFIED") {
      return allowed.filter((category) => category !== AgeCategory.EIGHTEEN_PLUS);
    }

    return allowed;
  }

  private getAllowedAgeCategoriesForRole(
    userAgeCategory?: AgeCategory,
    userRole?: string,
    verificationStatus?: string,
  ): AgeCategory[] {
    if (userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR) {
      return [
        AgeCategory.ZERO_PLUS,
        AgeCategory.SIX_PLUS,
        AgeCategory.TWELVE_PLUS,
        AgeCategory.SIXTEEN_PLUS,
        AgeCategory.EIGHTEEN_PLUS,
      ];
    }

    return this.getAllowedAgeCategories(userAgeCategory, verificationStatus);
  }

  /**
   * Get streaming URL for content
   * Supports local (MinIO) and EdgeCenter video sources
   */
  async getStreamUrl(
    contentId: string,
    context?: ContentAccessContext,
  ): Promise<StreamUrlResponseDto> {
    return this.getStreamUrlInternal(contentId, context, new Set());
  }

  private async getStreamUrlInternal(
    contentId: string,
    context: ContentAccessContext | undefined,
    visited: Set<string>,
  ): Promise<StreamUrlResponseDto> {
    if (visited.has(contentId)) {
      throw new NotFoundException(
        "Не удалось определить источник видео (циклическая ссылка)",
      );
    }
    visited.add(contentId);

    // Get content with video files — support both UUID and slug lookup
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        contentId,
      );
    const content = await this.prisma.content.findUnique({
      where: isUuid ? { id: contentId } : { slug: contentId },
      include: {
        videoFiles: true, // Get ALL video files to check encoding status
        series: true, // Needed to distinguish root content from episodes/lessons
      },
    });

    if (!content) {
      throw new NotFoundException(`Контент с ID ${contentId} не найден`);
    }

    if (this.isRootStructuredContent(content)) {
      throw new NotFoundException(
        "РЈ СЃРµСЂРёР°Р»Р° РёР»Рё РѕР±СѓС‡РµРЅРёСЏ РЅРµС‚ РѕСЃРЅРѕРІРЅРѕРіРѕ РІРёРґРµРѕ. РћС‚РєСЂРѕР№С‚Рµ РєРѕРЅРєСЂРµС‚РЅСѓСЋ СЃРµСЂРёСЋ РёР»Рё СѓСЂРѕРє.",
      );
    }

    // Check if any completed video exists (local or EdgeCenter)
    const completedVideoFiles = content.videoFiles.filter(
      (vf) => vf.encodingStatus === "COMPLETED",
    );
    const legacyLocalMasterExists =
      !content.edgecenterVideoId &&
      completedVideoFiles.length === 0 &&
      (await this.storageService.fileExists(
        "videos",
        `${content.id}/master.m3u8`,
      ));
    const hasCompletedVideos =
      !!content.edgecenterVideoId ||
      completedVideoFiles.length > 0 ||
      legacyLocalMasterExists;

    if (!hasCompletedVideos) {
      // Provide specific error message based on status
      if (content.videoFiles.length > 0) {
        const processingCount = content.videoFiles.filter(
          (vf) => vf.encodingStatus === "PROCESSING",
        ).length;
        const pendingCount = content.videoFiles.filter(
          (vf) => vf.encodingStatus === "PENDING",
        ).length;
        const failedCount = content.videoFiles.filter(
          (vf) => vf.encodingStatus === "FAILED",
        ).length;

        if (processingCount > 0) {
          throw new NotFoundException(
            `Видео ${processingCount === 1 ? "кодируется" : `кодируется (${processingCount} файлов)`}. ` +
              `Пожалуйста, подождите, кодирование занимает несколько минут.`,
          );
        }
        if (pendingCount > 0) {
          throw new NotFoundException(
            `Видео ещё не готово (${pendingCount} файлов в очереди). ` +
              `Кодирование начнётся в ближайшее время.`,
          );
        }
        if (failedCount > 0) {
          throw new NotFoundException(
            `Кодирование видео не удалось (${failedCount} файлов). ` +
              `Загрузите видео снова.`,
          );
        }
      }

      throw new NotFoundException(`У контента нет загруженного видео`);
    }

    // Verify access
    const accessResult = await this.verifyContentAccess(content, context);
    if (!accessResult.hasAccess) {
      throw new ForbiddenException(accessResult.reason || "Доступ запрещён");
    }

    // Get available qualities from video files
    const availableQualities = this.mapDbQualitiesToEnum(
      completedVideoFiles.map((vf) => vf.quality),
    );

    // Determine max quality based on access type
    const maxQuality = this.getMaxQualityForAccess(
      availableQualities,
      accessResult.accessType,
    );

    // Set expiry time (for client-side cache management)
    const expiryTimestamp =
      Math.floor(Date.now() / 1000) + this.signedUrlExpiryHours * 3600;

    const shouldServeLocal =
      content.edgecenterClientId === "local" ||
      (!!content.edgecenterVideoId &&
        content.edgecenterVideoId.startsWith("local:")) ||
      (!content.edgecenterVideoId &&
        (completedVideoFiles.length > 0 || legacyLocalMasterExists));

    // LOCAL VIDEO: Serve HLS from MinIO
    if (shouldServeLocal) {
      const localMasterKey =
        completedVideoFiles.find((vf) => vf.fileUrl?.endsWith(".m3u8"))
          ?.fileUrl || `${content.id}/master.m3u8`;
      const streamUrl = this.storageService.getPublicUrl(
        "videos",
        localMasterKey,
      );
      const cacheBuster = content.updatedAt
        ? `?v=${content.updatedAt.getTime()}`
        : "";

      return {
        streamUrl: `${streamUrl}${cacheBuster}`,
        expiresAt: new Date(expiryTimestamp * 1000).toISOString(),
        maxQuality,
        availableQualities,
        thumbnailUrls: content.thumbnailUrl
          ? [content.thumbnailUrl]
          : undefined,
        duration: content.duration,
        title: content.title,
        description: content.description,
        contentType: content.contentType,
      };
    }

    // EDGECENTER VIDEO: Fetch from CDN API
    if (!content.edgecenterVideoId) {
      throw new NotFoundException(`У контента ${contentId} нет видео`);
    }

    const ecVideo = await this.edgecenterService.getVideo(
      content.edgecenterVideoId,
    );

    if (!ecVideo.hls_url) {
      const previousVideoId = content.edgecenterClientId?.startsWith(
        "edgecenter-replacing:",
      )
        ? content.edgecenterClientId.split(":")[1]
        : undefined;

      if (previousVideoId) {
        const previousVideo =
          await this.edgecenterService.getVideo(previousVideoId);
        if (previousVideo.hls_url) {
          const fallbackStreamUrl = this.generateSignedHlsUrl(
            previousVideo.hls_url,
            this.signedUrlExpiryHours,
          );
          const fallbackThumbnails =
            this.edgecenterService.getThumbnailUrls(previousVideo);

          return {
            streamUrl: fallbackStreamUrl,
            expiresAt: new Date(expiryTimestamp * 1000).toISOString(),
            maxQuality,
            availableQualities,
            thumbnailUrls:
              fallbackThumbnails.length > 0 ? fallbackThumbnails : undefined,
            duration: content.duration,
            title: content.title,
            description: content.description,
            contentType: content.contentType,
          };
        }
      }
      throw new NotFoundException(
        `Видео ${content.edgecenterVideoId} не готово для трансляции`,
      );
    }

    const streamUrl = this.generateSignedHlsUrl(
      ecVideo.hls_url,
      this.signedUrlExpiryHours,
    );
    const thumbnailUrls = this.edgecenterService.getThumbnailUrls(ecVideo);

    return {
      streamUrl,
      expiresAt: new Date(expiryTimestamp * 1000).toISOString(),
      maxQuality,
      availableQualities,
      thumbnailUrls: thumbnailUrls.length > 0 ? thumbnailUrls : undefined,
      duration: content.duration,
      title: content.title,
      description: content.description,
      contentType: content.contentType,
    };
  }

  /**
   * Verify user has access to content
   */
  async verifyContentAccess(
    content: {
      id: string;
      creatorId?: string | null;
      isFree: boolean;
      individualPrice: any;
      status: string;
      ageCategory: AgeCategory;
    },
    context?: ContentAccessContext,
  ): Promise<ContentAccessResultDto> {
    // Admin/moderator always has access
    if (context?.userRole === "ADMIN" || context?.userRole === "MODERATOR") {
      return { hasAccess: true, accessType: "admin" };
    }

    const allowedAgeCategories = this.getAllowedAgeCategoriesForRole(
      context?.userAgeCategory,
      context?.userRole,
      context?.verificationStatus,
    );
    if (!allowedAgeCategories.includes(content.ageCategory)) {
      return {
        hasAccess: false,
        reason: "Content is not available for this age category",
      };
    }

    if (context?.userId && content.creatorId === context.userId) {
      return { hasAccess: true, accessType: "admin" };
    }

    // Check if content is published (unless admin)
    if (content.status !== "PUBLISHED") {
      return { hasAccess: false, reason: "Content is not available" };
    }

    // Free content is accessible to everyone
    if (content.isFree) {
      return { hasAccess: true, accessType: "free" };
    }

    // For premium content, user must be authenticated
    if (!context?.userId) {
      return {
        hasAccess: false,
        reason: "Authentication required for premium content",
      };
    }

    // Check if user has an active subscription that includes this content
    const hasSubscriptionAccess = await this.checkSubscriptionAccess(
      context.userId,
      content.id,
    );
    if (hasSubscriptionAccess) {
      return { hasAccess: true, accessType: "subscription" };
    }

    // Check if user has purchased this content individually
    const hasPurchaseAccess = await this.checkPurchaseAccess(
      context.userId,
      content.id,
    );
    if (hasPurchaseAccess) {
      return { hasAccess: true, accessType: "purchase" };
    }

    // No access
    return {
      hasAccess: false,
      reason: "Premium subscription or individual purchase required",
    };
  }

  /**
   * Check if user has subscription access to content
   */
  private async checkSubscriptionAccess(
    userId: string,
    contentId: string,
  ): Promise<boolean> {
    // Check for active subscription that includes this content via SubscriptionAccess
    const subscriptionAccess = await this.prisma.subscriptionAccess.findFirst({
      where: {
        contentId,
        subscription: {
          userId,
          status: "ACTIVE",
          expiresAt: { gt: new Date() },
        },
      },
    });

    if (subscriptionAccess) {
      return true;
    }

    // Also check if user has a subscription plan that directly references this content
    const directSubscription = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
        plan: {
          contentId,
        },
      },
    });

    return !!directSubscription;
  }

  /**
   * Check if user has purchased this content individually
   */
  private async checkPurchaseAccess(
    userId: string,
    contentId: string,
  ): Promise<boolean> {
    // This is already covered by checkSubscriptionAccess with plan.contentId
    // Keep this method for future individual purchase implementation
    void userId;
    void contentId;
    return false;
  }

  /**
   * Get max quality based on access type
   */
  private getMaxQualityForAccess(
    availableQualities: VideoQuality[],
    accessType?: "free" | "subscription" | "purchase" | "admin",
  ): VideoQuality {
    const qualityPriority = [
      VideoQuality.Q_4K,
      VideoQuality.Q_1080P,
      VideoQuality.Q_720P,
      VideoQuality.Q_480P,
      VideoQuality.Q_240P,
    ];

    // Find the highest available quality
    let maxQuality = VideoQuality.Q_240P;
    for (const quality of qualityPriority) {
      if (availableQualities.includes(quality)) {
        maxQuality = quality;
        break;
      }
    }

    // Limit quality for free content
    if (accessType === "free") {
      const freeMaxIndex = qualityPriority.indexOf(VideoQuality.Q_720P);
      const currentIndex = qualityPriority.indexOf(maxQuality);
      if (currentIndex < freeMaxIndex) {
        maxQuality = VideoQuality.Q_720P;
      }
    }

    return maxQuality;
  }

  /**
   * Map database quality enum to VideoQuality
   */
  private mapDbQualitiesToEnum(dbQualities: string[]): VideoQuality[] {
    const mapping: Record<string, VideoQuality> = {
      Q_240P: VideoQuality.Q_240P,
      Q_480P: VideoQuality.Q_480P,
      Q_720P: VideoQuality.Q_720P,
      Q_1080P: VideoQuality.Q_1080P,
      Q_4K: VideoQuality.Q_4K,
    };

    return dbQualities.filter((q) => q in mapping).map((q) => mapping[q]);
  }

  /**
   * Generate a Gcore Secure Token signed HLS URL
   * Uses MD5-based signature: md5(base64url({expires}{path} {secret}))
   * If no CDN secret is configured, returns the raw URL unchanged.
   */
  private generateSignedHlsUrl(rawUrl: string, expiryHours: number): string {
    if (!this.edgecenterCdnSecret || !rawUrl) {
      return rawUrl;
    }

    try {
      const url = new URL(rawUrl);
      const pathname = url.pathname;
      const expires = Math.floor(Date.now() / 1000) + expiryHours * 3600;

      // Gcore secure token: md5({expires}{path} {secret}) → base64url
      const signInput = `${expires}${pathname} ${this.edgecenterCdnSecret}`;
      const md5Hash = createHash("md5").update(signInput).digest("base64url");

      url.searchParams.set("md5", md5Hash);
      url.searchParams.set("expires", String(expires));

      return url.toString();
    } catch {
      // If URL parsing fails, return raw URL
      return rawUrl;
    }
  }

  /**
   * Get direct MP4 URL for a specific quality (if available)
   */
  getDirectUrl(videoId: string, quality: VideoQuality): string {
    // EdgeCenter may provide direct download URLs through the video API
    // For now, return empty - implement based on EdgeCenter API response
    return `https://${this.cdnHostname}/videos/${videoId}/${quality}.mp4`;
  }
}
