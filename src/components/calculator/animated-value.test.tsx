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

    act(() => vi.advanceTimersByTime(440));

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
});
