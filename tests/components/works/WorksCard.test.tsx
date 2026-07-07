// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WorksCard } from "@/components/works/WorksCard.tsx";
import type { Work } from "@/lib/works/data.ts";

const withImage: Work = {
  title: "airbeat",
  description: "Offline first metronome application.",
  image: "/images/icon-airbeat.svg",
  urls: [
    { type: "website", url: "https://airbeat.hizapp.blue/" },
    { type: "github", url: "https://github.com/hiz8/airbeat" },
  ],
};

const noImage: Work = {
  title: "NAUTILUS OFFICIAL WEBSITE",
  description: "NAUTILUS の公式ウェブサイト",
  urls: [{ type: "website", url: "https://nautilus-jp.com/" }],
};

describe("WorksCard", () => {
  it("title と description を表示する", () => {
    render(<WorksCard {...withImage} />);
    expect(screen.getByText("airbeat")).toBeInTheDocument();
    expect(screen.getByText("Offline first metronome application.")).toBeInTheDocument();
  });

  it("画像を title を alt として表示する", () => {
    render(<WorksCard {...withImage} />);
    const img = screen.getByRole("img", { name: "airbeat" });
    expect(img).toHaveAttribute("src", "/images/icon-airbeat.svg");
  });

  it("website / github をラベル付きの外部リンクとして表示する", () => {
    render(<WorksCard {...withImage} />);
    const website = screen.getByRole("link", { name: "Website" });
    const github = screen.getByRole("link", { name: "GitHub" });
    expect(website).toHaveAttribute("href", "https://airbeat.hizapp.blue/");
    expect(website).toHaveAttribute("target", "_blank");
    expect(website).toHaveAttribute("rel", "noreferrer");
    expect(github).toHaveAttribute("href", "https://github.com/hiz8/airbeat");
  });

  it("image が無いエントリは <img> を描画しない", () => {
    render(<WorksCard {...noImage} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
