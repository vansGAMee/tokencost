import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnimatedValue } from "./animated-value";

describe("AnimatedValue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("keeps the previous value during a compositor transition", () => {
    const { rerender } = render(
      <AnimatedValue value="$0.00044" ariaLabel="Estimated cost $0.00044" />,
    );

    rerender(
      <AnimatedValue value="$0.00052" ariaLabel="Estimated cost $0.00052" />,
    );

    expect(screen.getByText("$0.00044")).toHaveClass(
      "animated-value__face--leaving",
    );
    expect(screen.getByText("$0.00052")).toHaveClass(
      "animated-value__face--entering",
    );
    expect(screen.getByLabelText("Estimated cost $0.00052")).toBeVisible();

    act(() => vi.advanceTimersByTime(480));

    expect(screen.queryByText("$0.00044")).not.toBeInTheDocument();
    expect(screen.getByText("$0.00052")).toHaveClass(
      "animated-value__face--settled",
    );
  });

  it("marks long monetary values for compact fitting", () => {
    const { rerender } = render(
      <AnimatedValue value="$0.00108" ariaLabel="Estimated cost $0.00108" />,
    );

    expect(screen.getByLabelText("Estimated cost $0.00108")).toHaveAttribute(
      "data-length",
      "standard",
    );

    rerender(
      <AnimatedValue
        value="$0.00000044"
        ariaLabel="Estimated cost $0.00000044"
      />,
    );

    expect(screen.getByLabelText("Estimated cost $0.00000044")).toHaveAttribute(
      "data-length",
      "long",
    );
  });

  it("restarts the transition for every real-time value update", () => {
    const { container, rerender } = render(
      <AnimatedValue value="$0.01" ariaLabel="Estimated cost $0.01" />,
    );

    rerender(<AnimatedValue value="$0.02" ariaLabel="Estimated cost $0.02" />);
    const firstEntering = container.querySelector(
      ".animated-value__face--entering",
    );

    rerender(<AnimatedValue value="$0.03" ariaLabel="Estimated cost $0.03" />);
    const secondEntering = container.querySelector(
      ".animated-value__face--entering",
    );

    expect(firstEntering).not.toBeNull();
    expect(secondEntering).not.toBeNull();
    expect(secondEntering).not.toBe(firstEntering);
  });
});
