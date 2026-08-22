export class RoutePath {
  #segments;

  constructor(pathname = globalThis.location.pathname) {
    this.#segments = pathname
      .split('/')
      .filter(Boolean)
      .map((segment) => RoutePath.decode(segment));
  }

  segment(index, fallback = '') {
    return this.#segments[index] || fallback;
  }

  number(index, fallback = null) {
    const value = Number(this.#segments[index]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  isRoot(name) {
    return this.segment(0) === name;
  }

  static encode(value) {
    return encodeURIComponent(String(value));
  }

  static decode(value) {
    try {
      return decodeURIComponent(value);
    } catch (_) {
      return value;
    }
  }
}
