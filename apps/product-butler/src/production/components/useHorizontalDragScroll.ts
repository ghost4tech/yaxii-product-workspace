import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";

interface DragState {
  moved: boolean;
  pointerId: number;
  startScroll: number;
  startX: number;
}

function scrollFromKeyboard(event: KeyboardEvent<HTMLDivElement>) {
  if (event.target !== event.currentTarget) return;
  const scroller = event.currentTarget;
  const rtl = getComputedStyle(scroller).direction === "rtl";
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
  const [dragging, setDragging] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const scroller = ref.current;
    if (!scroller) return;
    const measure = () => setOverflowing(scroller.scrollWidth > scroller.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    measure();
    return () => observer.disconnect();
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || event.button !== 0) return;
    drag.current = {
      moved: false,
      pointerId: event.pointerId,
      startScroll: event.currentTarget.scrollLeft,
      startX: event.clientX,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const distance = event.clientX - active.startX;
    if (Math.abs(distance) > 4) active.moved = true;
    const direction = getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1;
    event.currentTarget.scrollLeft = active.startScroll - distance * direction;
    if (active.moved) event.preventDefault();
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    suppressClick.current = drag.current.moved;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
  };

  return {
    dragging,
    overflowing,
    props: {
      onClickCapture,
      onKeyDown: scrollFromKeyboard,
      onPointerCancel: finishDrag,
      onPointerDown,
      onPointerMove,
      onPointerUp: finishDrag,
      ref,
      tabIndex: 0,
    },
  };
}
