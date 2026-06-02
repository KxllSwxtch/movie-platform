import { render, screen } from "@testing-library/react";
import { createRef } from "react";

import { ShortCard, type ShortContent } from "@/components/content/short-card";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("hls.js", () => ({
  default: class HlsMock {
    static Events = { MANIFEST_PARSED: "manifestParsed", ERROR: "error" };
    static isSupported() {
      return false;
    }
    loadSource() {}
    attachMedia() {}
    on() {}
    destroy() {}
  },
}));

vi.mock("@/hooks/use-streaming", () => ({
  useStreamUrl: () => ({ data: null, isLoading: false, error: null }),
}));

vi.mock("@/hooks/use-comments", () => ({
  useContentComments: () => ({
    data: { total: 0, items: [] },
    isLoading: false,
    isError: false,
  }),
  useCreateContentComment: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-likes", () => ({
  useContentLikeStatus: () => ({ data: { liked: false, likeCount: 1234 } }),
  useLikeContent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUnlikeContent: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/stores/auth.store", () => ({
  useIsAuthenticated: () => true,
  useUser: () => ({ firstName: "Test", lastName: "User" }),
}));

const mockShort: ShortContent = {
  id: "s1",
  title: "Test Short",
  thumbnailUrl: "/test.jpg",
  creator: {
    id: "author-1",
    username: "tester",
    displayName: "Tester",
  },
  likeCount: 1234,
  commentCount: 56,
  shareCount: 78,
};

describe("ShortCard", () => {
  it("renders short title and clickable author profile link", () => {
    render(<ShortCard content={mockShort} />);

    expect(screen.getByText("Test Short")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Tester/ })).toHaveAttribute(
      "href",
      "/author/tester",
    );
  });

  it("renders like, comment, and share buttons", () => {
    render(<ShortCard content={mockShort} />);

    expect(screen.getByRole("button", { name: "Нравится" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Комментарии" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Поделиться" })).toBeInTheDocument();
    expect(screen.getByText(/1[\s\u00a0]234/)).toBeInTheDocument();
  });

  it("renders video element with poster", () => {
    render(<ShortCard content={mockShort} />);

    const video = document.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("poster", "/test.jpg");
  });

  it("sets data-short-id and forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ShortCard ref={ref} content={mockShort} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveAttribute("data-short-id", "s1");
  });

  it("sets video autoPlay when isActive=true", () => {
    render(<ShortCard content={mockShort} isActive />);

    expect(document.querySelector("video")).toHaveAttribute("autoplay");
  });
});
