import { render, screen } from "@testing-library/react";

import {
  TutorialCard,
  type TutorialContent,
} from "@/components/content/tutorial-card";

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

const tutorial: TutorialContent = {
  id: "tutorial-1",
  slug: "python-basics",
  title: "Python Basics",
  thumbnailUrl: "/python.jpg",
  lessonCount: 5,
  completedLessons: 0,
  ageCategory: "0+",
  creator: {
    id: "author-1",
    username: "teacher",
    displayName: "Teacher",
  },
};

describe("TutorialCard", () => {
  it("renders a clickable author link with username route", () => {
    render(<TutorialCard content={tutorial} />);

    expect(screen.getByRole("link", { name: /Teacher/ })).toHaveAttribute(
      "href",
      "/author/teacher",
    );
  });
});
