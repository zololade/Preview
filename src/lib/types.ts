type ElementAttributes<T extends Element> = {
  [K in keyof T as T[K] extends string | number | boolean ? K : never]?: T[K];
};

type ValidTagNameMap = HTMLElementTagNameMap & SVGElementTagNameMap;

type BuiltEl = HTMLElement | SVGElement | Text;
type DOMBuilderEl = HTMLElement | SVGElement;

type VNodeMap = {
  [T in keyof ValidTagNameMap]: {
    tag: T;
    children?: VNode[] | string;
    ref?: string;
    actions?: Record<string, (el: ValidTagNameMap[T]) => void>;
    onMount?: (el: ValidTagNameMap[T]) => void | Promise<void>;
    props?: ElementAttributes<ValidTagNameMap[T]>;
    attrs?: Record<string, string>;
  };
};
type VNode = VNodeMap[keyof VNodeMap];

interface Engine {
  mount(container: HTMLElement): void;
  dispatch(ref: string, command: string): void;
  render(): void;
}

type Registry = Map<string, { dom: DOMBuilderEl; actions: Record<string, (el: any) => void> }>;

export type { VNode, Engine, Registry, BuiltEl, DOMBuilderEl, ValidTagNameMap };
