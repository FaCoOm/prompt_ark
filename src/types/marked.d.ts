declare module '../../../../lib/marked.min.js' {
  interface MarkedOptions {
    async?: boolean;
    breaks?: boolean;
    gfm?: boolean;
    pedantic?: boolean;
    silent?: boolean;
  }

  interface MarkedInstance {
    parse(content: string, options?: MarkedOptions): string | Promise<string>;
    parseInline(content: string, options?: MarkedOptions): string;
  }

  export const marked: MarkedInstance;
}
