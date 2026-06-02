import {
  getAuthorHref,
  normalizeCreatorIdentity,
} from "@/lib/author-identity";

describe("author identity helpers", () => {
  it("uses /author/:username before id fallback", () => {
    expect(getAuthorHref({ id: "author-1", username: "test4852" })).toBe(
      "/author/test4852",
    );
  });

  it("falls back to /authors/:id when username is missing", () => {
    expect(getAuthorHref({ id: "author-1" })).toBe("/authors/author-1");
  });

  it("preserves explicit public authorUrl", () => {
    expect(
      getAuthorHref({
        id: "author-1",
        username: "test4852",
        authorUrl: "/channel/test4852",
      }),
    ).toBe("/channel/test4852");
  });

  it("normalizes display name, avatar, and author stats", () => {
    expect(
      normalizeCreatorIdentity({
        id: "author-1",
        username: "test4852",
        displayName: "Test Author",
        avatarUrl: "/avatar.jpg",
        totalPublishedVideos: 7,
        totalViews: 1200,
      }),
    ).toEqual({
      id: "author-1",
      username: "test4852",
      displayName: "Test Author",
      avatarUrl: "/avatar.jpg",
      href: "/author/test4852",
      role: undefined,
      totalVideos: 7,
      totalViews: 1200,
      subscriberCount: undefined,
    });
  });
});
