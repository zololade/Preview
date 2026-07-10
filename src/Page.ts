// Types for the page data structure
type ElementObject = {
  tag: string;
  content?: string | PageData[];
  [key: string]: unknown; // allows arbitrary HTML attributes
};

type PageData = ElementObject | PageData[] | string | number;

const DOM_RECORD: Map<HTMLElement, PageData> = new Map();

function isObject(value: unknown): value is ElementObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function build(
  incomingObject: PageData,
): HTMLElement | DocumentFragment | SVGSVGElement | SVGPathElement | Text {
  let tag: string;
  let content: string | PageData[] | undefined;
  let el: HTMLElement | DocumentFragment | SVGSVGElement | SVGPathElement;
  let att: Record<string, unknown>;

  if (isObject(incomingObject)) {
    ({ tag, content, ...att } = incomingObject);
    el =
      tag === "svg" || tag === "path"
        ? document.createElementNS("http://www.w3.org/2000/svg", tag)
        : document.createElement(tag);

    Object.entries(att).forEach(([key, value]) => {
      if (key === "xmlns") return;
      const lookupKey = key === "class" ? "className" : key;
      if (lookupKey in el && !(el instanceof SVGElement)) {
        (el as unknown as Record<string, unknown>)[lookupKey] = value;
      } else {
        (el as HTMLElement).setAttribute(key, String(value));
      }
    });
  } else if (Array.isArray(incomingObject)) {
    content = incomingObject;
    el = document.createDocumentFragment();
  } else {
    return document.createTextNode(String(incomingObject));
  }

  if (typeof content === "string") {
    (el as HTMLElement).textContent = content;
  } else if (Array.isArray(content)) {
    content.forEach((data) => {
      el.appendChild(build(data));
    });
  }

  return el;
}

function snapshotRender(currentHost: HTMLElement, elem: PageData): void {
  const previousRecord = DOM_RECORD.get(currentHost);
  if (previousRecord && JSON.stringify(previousRecord) === JSON.stringify(elem)) return;

  currentHost.innerHTML = "";
  const fragment = document.createDocumentFragment();
  fragment.appendChild(build(elem));
  currentHost.appendChild(fragment);

  DOM_RECORD.set(currentHost, elem);
}

function pureRender(
  host: HTMLElement,
  elem: HTMLElement | DocumentFragment | Text | SVGSVGElement | SVGPathElement,
) {
  host.innerHTML = "";
  const fragment = document.createDocumentFragment();
  fragment.appendChild(elem);
  host.appendChild(fragment);
}

// a utility function that render processed data in the supplied host
function renderElement(
  host: HTMLElement,
  data: PageData,
  skipTransition?: boolean,
  afterRender?: () => void,
  skipDiff?: boolean,
) {
  //check if host is available
  if (!host) return;
  const render = () => {
    if (skipDiff) {
      const fragment = build(data);
      pureRender(host, fragment);
    } else {
      snapshotRender(host, data);
    }
  };

  if (document.startViewTransition && !skipTransition) {
    const transition = document.startViewTransition(render);
    if (afterRender) {
      transition.finished.then(() => {
        afterRender();
      });
    }
  } else {
    render();
    if (afterRender) {
      afterRender();
    }
  }
}

function renderElementAsync(
  host: HTMLElement,
  data: PageData,
  skipTransition: boolean = false,
  skipDiff: boolean = false,
): Promise<void> {
  return new Promise((resolve) => {
    renderElement(host, data, skipTransition, resolve, skipDiff);
  });
}

export { type PageData, renderElement, renderElementAsync };
