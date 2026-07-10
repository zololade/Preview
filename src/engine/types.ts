type ElementAttributes<T extends HTMLElement> = {
  [K in keyof T as T[K] extends string | number | boolean ? K : never]?: T[K];
};

type BuiltEl = HTMLElement | DocumentFragment | SVGSVGElement | SVGPathElement | Text;

interface VNode<T extends keyof HTMLElementTagNameMap = keyof HTMLElementTagNameMap> {
  tag: T;
  children?: VNode<keyof HTMLElementTagNameMap>[] | string;
  ref?: string;
  actions?: Record<string, (el: HTMLElementTagNameMap[T]) => void>;
  onMount?: (el: HTMLElementTagNameMap[T]) => void | Promise<void>;
  props?: ElementAttributes<HTMLElementTagNameMap[T]>;
  attrs?: Record<string, string>;
}

interface Engine {
  mount(container: HTMLElement, rootVNode: VNode): void;
  dispatch(ref: string, command: string): void;
  render(): void;
}

type Registry = Map<
  string,
  { dom: HTMLElement; actions: Record<string, (el: HTMLElement) => void> }
>;

export type { VNode, Engine, Registry, BuiltEl };
