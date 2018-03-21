import templating = require("url-template");

// A url template is simply a unary function that returns a URL.
// However, it can also have a string representation as an RFC 6570 template,
// which can be sent to the client directly (to help it build related URIs) or
// shown in documentation. Not all template functions can be represented with
// RFC 6570, though, and sometimes there's no plausible reason we'd need to
// show the template, so not every UrlTemplate will have the
export const RFC6570String = Symbol('RFC6570String');
export type UrlTemplate = {
  (data: any): string;
  [RFC6570String]?: string;
}

export function fromRFC6570(template: string) {
  // tslint:disable-next-line:no-unbound-method
  const fn = templating.parse(template).expand as UrlTemplate;
  fn[RFC6570String] = template;

  return fn;
}

export function fromUrl(url: string) {
  return () => url;
}
