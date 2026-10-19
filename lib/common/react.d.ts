//#region src/common/react.d.ts
type Props = Record<string, any>;
type VNode = string | number | null | boolean | {
  type: string | any;
  props: Props;
  children: any[];
};
declare const DOCTYPE = "<!DOCTYPE html>";
declare function createElement(type: string | any, props?: Props | null, ...children: any[]): VNode;
declare class Component<P = object, S = object> {
  props: P;
  state: S;
  constructor(props: P);
  setState(partial: Partial<S>): void;
  render(): VNode;
  static renderToString(this: any): string;
  static renderToHtml(this: any): string;
}
declare function renderToString(vnode: any): string;
declare const Html: (first?: any, ...restChildren: any[]) => VNode;
declare const Head: (first?: any, ...restChildren: any[]) => VNode;
declare const Body: (first?: any, ...restChildren: any[]) => VNode;
declare const Title: (first?: any, ...restChildren: any[]) => VNode;
declare const Style: (first?: any, ...restChildren: any[]) => VNode;
declare const H1: (first?: any, ...restChildren: any[]) => VNode;
declare const P: (first?: any, ...restChildren: any[]) => VNode;
declare const A: (first?: any, ...restChildren: any[]) => VNode;
declare const Div: (first?: any, ...restChildren: any[]) => VNode;
//#endregion
export { A, Body, Component, DOCTYPE, Div, H1, Head, Html, P, Style, Title, createElement, renderToString };