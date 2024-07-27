declare module 'colorthief' {
  class ColorThief {
    getColor(img: HTMLImageElement, quality?: number): number[];
    getPalette(
      img: HTMLImageElement,
      colorCount?: number,
      quality?: number,
    ): number[][];
  }

  export = ColorThief;
}
