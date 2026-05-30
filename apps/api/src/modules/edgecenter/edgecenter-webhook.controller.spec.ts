import { UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { createHmac } from "crypto";

import { EdgeCenterWebhookController } from "./edgecenter-webhook.controller";
import { EdgeCenterWebhookEvent, EdgeCenterVideoStatus } from "./interfaces";

describe("EdgeCenterWebhookController", () => {
  const payload = {
    event: EdgeCenterWebhookEvent.VIDEO_READY,
    video_id: 12345,
    video_status: EdgeCenterVideoStatus.READY,
  } as any;

  function createController(secret = "webhook-secret", nodeEnv = "test") {
    const config = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === "EDGECENTER_WEBHOOK_SECRET") return secret;
        if (key === "NODE_ENV") return nodeEnv;
        return defaultValue;
      }),
    };
    const prisma = {
      content: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    return {
      controller: new EdgeCenterWebhookController(config as any, prisma as any),
      prisma,
    };
  }

  it("denies configured webhook when signature is missing", async () => {
    const { controller } = createController();

    await expect(controller.handleEncodingWebhook(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("denies configured webhook when signature is invalid", async () => {
    const { controller } = createController();

    await expect(
      controller.handleEncodingWebhook(payload, "bad-signature"),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("accepts configured webhook when signature is valid", async () => {
    const secret = "webhook-secret";
    const rawBody = JSON.stringify(payload);
    const signature = createHmac("sha256", secret).update(rawBody).digest("hex");
    const { controller } = createController(secret);

    const result = await controller.handleEncodingWebhook(payload, signature, {
      rawBody: Buffer.from(rawBody),
    } as any);

    expect(result.received).toBe(true);
  });

  it("denies production webhook when secret is not configured", async () => {
    const { controller } = createController("", "production");

    await expect(controller.handleEncodingWebhook(payload)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
