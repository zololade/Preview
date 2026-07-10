type ElementAttributes<T extends Element> = {
  [K in keyof T as T[K] extends string | number | boolean ? K : never]?: T[K];
};

type ValidTagNameMap = HTMLElementTagNameMap & SVGElementTagNameMap;

type BuiltEl = HTMLElement | SVGSVGElement | SVGPathElement | Text;
type DOMBuilderEl = HTMLElement | SVGSVGElement | SVGPathElement;

interface VNode<T extends keyof ValidTagNameMap = keyof ValidTagNameMap> {
  tag: T;
  children?: VNode<keyof ValidTagNameMap>[] | string;
  ref?: string;
  actions?: Record<string, (el: ValidTagNameMap[T]) => void>;
  onMount?: (el: ValidTagNameMap[T]) => void | Promise<void>;
  props?: ElementAttributes<ValidTagNameMap[T]>;
  attrs?: Record<string, string>;
}

interface Engine {
  mount(container: HTMLElement, rootVNode: VNode): void;
  dispatch(ref: string, command: string): void;
  render(): void;
}

type Registry = Map<string, { dom: DOMBuilderEl; actions: Record<string, (el: any) => void> }>;

export type { VNode, Engine, Registry, BuiltEl, DOMBuilderEl, ValidTagNameMap };
