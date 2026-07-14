// event handler
type HandlerFn<E extends Event = Event> = (match: HTMLElement, e: E) => void;

// event map
type HandlersByEvent = {
  [K in keyof HTMLElementEventMap]?: Record<string, HandlerFn<HTMLElementEventMap[K]>>;
};

function initializeEvents(handlers: HandlersByEvent, rootElement: HTMLElement) {
  const actionHandlers = new Map(Object.entries(handlers) as [string, Record<string, HandlerFn>][]);

  actionHandlers.forEach((v, k) =>
    rootElement.addEventListener(k, (e) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const el = target.closest("[data-action]") as HTMLElement | null;

      if (!el) return;
      const action = el.dataset["action"];
      const actions = action?.split(" ") ?? [];

      actions.forEach((a) => {
        const handler = v[a];
        if (handler) handler(el, e);
      });
    }),
  );
}

export { initializeEvents, type HandlersByEvent };
