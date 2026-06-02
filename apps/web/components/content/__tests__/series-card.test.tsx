import { render, screen } from "@testing-library/react";

import { SeriesCard, type SeriesContent } from "@/components/content/series-card";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, unoptimized, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...rest} />;
  },
}));

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

vi.mock("@/components/content/age-badge", () => ({
  AgeBadge: ({ age }: { age: string }) => <span>{age}</span>,
}));

const series: SeriesContent = {
  id: "series-1",
  slug: "major",
  title: "Major",
  thumbnailUrl: "/major.jpg",
  seasonCount: 2,
  episodeCount: 16,
  ageCategory: "16+",
  creator: {
    id: "author-1",
    displayName: "Series Creator",
  },
};

describe("SeriesCard", () => {
  it("renders a clickable author link with id fallback", () => {
    render(<SeriesCard content={series} />);

    expect(
      screen.getByRole("link", { name: /Series Creator/ }),
    ).toHaveAttribute("href", "/authors/author-1");
  });
});
