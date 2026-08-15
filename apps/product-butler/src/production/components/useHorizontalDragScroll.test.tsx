import { fireEvent, render } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { getScrollAvailability, useHorizontalDragScroll } from "./useHorizontalDragScroll";

class TestPointerEvent extends MouseEvent {
  public readonly pointerId: number;
  public readonly pointerType: string;

  public constructor(type: string, init: PointerEventInit) {
    super(type, init);
    this.pointerId = init.pointerId ?? 0;
    this.pointerType = init.pointerType ?? "";
  }
}

function Harness({ direction = "ltr" }: { direction?: "ltr" | "rtl" }) {
  const scroll = useHorizontalDragScroll();
  const [active, setActive] = useState(false);
  return <div {...scroll.props} data-testid="scroller" dir={direction}>
    <button type="button" onClick={() => setActive(true)}>{active ? "Active" : "Filter"}</button>
    <button type="button">Second</button>
  </div>;
}

describe("useHorizontalDragScroll", () => {
  it("keeps a small pointer movement as a filter click", () => {
    vi.stubGlobal("PointerEvent", TestPointerEvent);
    const view = render(<Harness />);
    const scroller = view.getByTestId("scroller");
    const filter = view.getByRole("button", { name: "Filter" });

    fireEvent.pointerDown(filter, { button: 0, clientX: 100, pointerId: 1, pointerType: "mouse" });
    fireEvent.pointerMove(scroller, { clientX: 96, pointerId: 1, pointerType: "mouse" });
    fireEvent.pointerUp(filter, { clientX: 96, pointerId: 1, pointerType: "mouse" });
    fireEvent.click(filter);

    expect(view.getByRole("button", { name: "Active" })).toBeInTheDocument();
  });

  it("captures and suppresses the click only after a real drag", () => {
    vi.stubGlobal("PointerEvent", TestPointerEvent);
    const view = render(<Harness />);
    const scroller = view.getByTestId("scroller");
    const filter = view.getByRole("button", { name: "Filter" });
    const capture = vi.spyOn(scroller, "setPointerCapture");

    fireEvent.pointerDown(filter, { button: 0, clientX: 100, pointerId: 2, pointerType: "mouse" });
    fireEvent.pointerMove(scroller, { clientX: 80, pointerId: 2, pointerType: "mouse" });
    fireEvent.pointerUp(scroller, { clientX: 80, pointerId: 2, pointerType: "mouse" });
    fireEvent.click(filter);

    expect(capture).toHaveBeenCalledWith(2);
    expect(scroller.scrollLeft).toBe(20);
    expect(view.getByRole("button", { name: "Filter" })).toBeInTheDocument();
  });

  it("keeps RTL dragging under the pointer instead of reversing it", () => {
    vi.stubGlobal("PointerEvent", TestPointerEvent);
    const view = render(<Harness direction="rtl" />);
    const scroller = view.getByTestId("scroller");

    fireEvent.pointerDown(scroller, { button: 0, clientX: 100, pointerId: 3, pointerType: "mouse" });
    fireEvent.pointerMove(scroller, { clientX: 120, pointerId: 3, pointerType: "mouse" });
    fireEvent.pointerUp(scroller, { clientX: 120, pointerId: 3, pointerType: "mouse" });

    expect(scroller.scrollLeft).toBe(-20);
  });

  it("reports logical start and end overflow in LTR and RTL", () => {
    const scroller = document.createElement("div");
    const first = document.createElement("button");
    const last = document.createElement("button");
    scroller.append(first, last);
    Object.defineProperties(scroller, { clientWidth: { value: 100 }, scrollWidth: { value: 200 } });
    vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({ left: 0, right: 100 } as DOMRect);

    scroller.dir = "ltr";
    const firstBounds = vi.spyOn(first, "getBoundingClientRect").mockReturnValue({ left: 0, right: 40 } as DOMRect);
    const lastBounds = vi.spyOn(last, "getBoundingClientRect").mockReturnValue({ left: 160, right: 200 } as DOMRect);
    expect(getScrollAvailability(scroller)).toEqual({ end: true, overflowing: true, start: false });

    scroller.dir = "rtl";
    firstBounds.mockReturnValue({ left: 60, right: 100 } as DOMRect);
    lastBounds.mockReturnValue({ left: -100, right: -60 } as DOMRect);
    expect(getScrollAvailability(scroller)).toEqual({ end: true, overflowing: true, start: false });
  });
});
