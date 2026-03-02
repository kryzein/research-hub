declare module "mammoth/mammoth.browser" {
  interface ImageElement {
    read(encoding: "base64"): Promise<string>;
    contentType: string;
  }

  interface ImgElement {
    (
      callback: (image: ImageElement) => Promise<{ src: string }>
    ): (image: ImageElement) => Promise<{ src: string }>;
  }

  interface ConvertResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  interface ConvertOptions {
    convertImage?: (image: ImageElement) => Promise<{ src: string }>;
    [key: string]: unknown;
  }

  const mammoth: {
    convertToHtml(
      input: { arrayBuffer: ArrayBuffer },
      options?: ConvertOptions
    ): Promise<ConvertResult>;
    images: {
      imgElement(
        callback: (image: ImageElement) => Promise<{ src: string }>
      ): (image: ImageElement) => Promise<{ src: string }>;
    };
  };

  export default mammoth;
}
