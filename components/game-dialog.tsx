"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

export default function GameDialog({ id, title, onClose, children }: {
  id: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);

  function keepFocusInside(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]');
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  return (
    <dialog ref={ref} id={id} className="game-dialog" aria-labelledby={`${id}-title`} onClose={onClose} onKeyDown={keepFocusInside} onClick={(event) => { if (event.target === event.currentTarget) ref.current?.close(); }}>
      <button className="game-dialog-close" type="button" onClick={() => ref.current?.close()} aria-label="Fermer la fenêtre">×</button>
      <h2 id={`${id}-title`}>{title}</h2>
      {children}
    </dialog>
  );
}
