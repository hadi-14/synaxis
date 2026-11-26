declare module "*.mdx" {
  import type { ComponentType } from "react";
  export const meta: { title: string; updated: string };
  const Content: ComponentType;
  export default Content;
}
