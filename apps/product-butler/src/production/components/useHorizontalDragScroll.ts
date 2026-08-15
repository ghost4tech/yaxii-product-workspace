import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";

interface DragState {
  moved: boolean;
  pointerId: number;
  startScroll: number;
  startX: number;
}

interface ScrollAvailability {
  end: boolean;
  overflowing: boolean;
  start: boolean;
}

const DRAG_THRESHOLD = 6;

function isRtl(element: HTMLElement): boolean {
  const directionRoot = element.closest<HTMLElement>("[dir]");
  return directionRoot ? directionRoot.dir === "rtl" : getComputedStyle(element).direction === "rtl";
}

export function getScrollAvailability(scroller: HTMLElement): ScrollAvailability {
  const overflowing = scroller.scrollWidth > scroller.clientWidth + 1;
  const first = scroller.firstElementChild;
  const last = scroller.lastElementChild;
  if (!overflowing || !first || !last) return { end: false, overflowing, start: false };

  const bounds = scroller.getBoundingClientRect();
  const firstBounds = first.getBoundingClientRect();
  const lastBounds = last.getBoundingClientRect();
  const rtl = isRtl(scroller);
  return rtl
    ? { end: lastBounds.left < bounds.left - 1, overflowing, start: firstBounds.right > bounds.right + 1 }
    : { end: lastBounds.right > bounds.right + 1, overflowing, start: firstBounds.left < bounds.left - 1 };
}

function scrollFromKeyboard(event: KeyboardEvent<HTMLDivElement>) {
  if (event.target !== event.currentTarget) return;
  const scroller = event.currentTarget;
  const rtl = isRtl(scroller);
  if (event.key === "ArrowLeft") scroller.scrollBy({ left: -120, behavior: "smooth" });
  else if (event.key === "ArrowRight") scroller.scrollBy({ left: 120, behavior: "smooth" });
  else if (event.key === "Home") scroller.scrollTo({ left: 0, behavior: "smooth" });
  else if (event.key === "End") {
    const end = scroller.scrollWidth - scroller.clientWidth;
    scroller.scrollTo({ left: rtl ? -end : end, behavior: "smooth" });
  } else return;
  event.preventDefault();
}

export function useHorizontalDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const suppressTimer = useRef<number>();
  const [dragging, setDragging] = useState(false);
  const [availability, setAvailability] = useState<ScrollAvailability>({ end: false, overflowing: false, start: false });

  const measure = useCallback(() => {
    if (!ref.current) return;
    const next = getScrollAvailability(ref.current);
    setAvailability((current) => current.end === next.end
      && current.overflowing === next.overflowing
      && current.start === next.start ? current : next);
  }, []);

  useEffect(() => {
    const scroller = ref.current;
    if (!scroller) return;
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    Array.from(scroller.children).forEach((child) => observer.observe(child));
    measure();
    return () => {
      observer.disconnect();
      if (suppressTimer.current !== undefined) window.clearTimeout(suppressTimer.current);
    };
  }, [measure]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || event.button !== 0) return;
    drag.current = {
      moved: false,
      pointerId: event.pointerId,
      startScroll: event.currentTarget.scrollLeft,
      startX: event.clientX,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const distance = event.clientX - active.startX;
    if (!active.moved && Math.abs(distance) <= DRAG_THRESHOLD) return;
    if (!active.moved) {
      active.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    event.currentTarget.scrollLeft = active.startScroll - distance;
    event.preventDefault();
    measure();
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    suppressClick.current = drag.current.moved;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (suppressClick.current) {
      suppressTimer.current = window.setTimeout(() => { suppressClick.current = false; }, 0);
    }
  };

  const cancelDrag = (event: PointerEvent<HTMLDivElement>) => {
    suppressClick.current = false;
    finishDrag(event);
    suppressClick.current = false;
  };

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
  };

  return {
    dragging,
    canScrollEnd: availability.end,
    canScrollStart: availability.start,
    props: {
      onClickCapture,
      onKeyDown: scrollFromKeyboard,
      onPointerCancel: cancelDrag,
      onPointerDown,
      onPointerMove,
      onPointerUp: finishDrag,
      onScroll: measure,
      ref,
      tabIndex: 0,
    },
  };
}
