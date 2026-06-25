import { afterEach, describe, expect, it } from "vitest";

import {
  getPublicAppBaseUrl,
  getPublicContentPath,
  getPublicContentUrl,
} from "../public-content-url";

describe("public content urls", () => {
  const originalEnv = { ...process.env };
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env = { ...originalEnv };
    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalNodeEnv,
      configurable: true,
    });
  });

  it("maps content types to public paths with slug before id", () => {
    expect(getPublicContentPath({ id: "1", slug: "short-one", contentType: "SHORT" })).toBe(
      "/shorts/short-one",
    );
    expect(getPublicContentPath({ id: "2", slug: "video-one", contentType: "VIDEO" })).toBe(
      "/watch/video-one",
    );
    expect(getPublicContentPath({ id: "3", slug: "series-one", contentType: "SERIES" })).toBe(
      "/series/series-one",
    );
    expect(getPublicContentPath({ id: "4", slug: "tutorial-one", contentType: "TUTORIAL" })).toBe(
      "/tutorials/tutorial-one",
    );
  });

  it("falls back to id and watch route", () => {
    expect(getPublicContentPath({ id: "clip-id", contentType: "CLIP" })).toBe(
      "/watch/clip-id",
    );
    expect(getPublicContentUrl({ id: "unknown-id" }, "https://example.com/")).toBe(
      "https://example.com/watch/unknown-id",
    );
  });

  it("does not use an ip origin for production public urls", () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      configurable: true,
    });

    expect(getPublicAppBaseUrl("http://89.108.66.37")).toBe("https://sesh-tv.com");
    expect(
      getPublicContentUrl(
        { id: "short-id", contentType: "SHORT" },
        "http://89.108.66.37",
      ),
    ).toBe("https://sesh-tv.com/shorts/short-id");
  });
});
