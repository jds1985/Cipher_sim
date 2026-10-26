// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
import { Readable, Writable } from "node:stream";

export class FakeRes extends Writable {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.chunks = [];
    this.redirectTo = null;
    this.body = null;
  }
  _write(chunk, _enc, cb) {
    this.chunks.push(Buffer.from(chunk));
    cb();
  }
  status(c) {
    this.statusCode = c;
    return this;
  }
  setHeader(k, v) {
    this.headers[k.toLowerCase()] = v;
    return this;
  }
  json(o) {
    this.body = o;
    return this;
  }
  send(s) {
    this.body = s;
    return this;
  }
  redirect(c, url) {
    this.statusCode = c;
    this.redirectTo = url;
    return this;
  }
}

export function jsonReq({ method = "POST", body, headers = {}, query = {} } = {}) {
  return { method, body, headers, query };
}

/** A raw-stream request like Next gives when bodyParser is off. */
export function rawReq({ method = "POST", payload = "", headers = {} } = {}) {
  const r = Readable.from([Buffer.from(payload)]);
  r.method = method;
  r.headers = headers;
  return r;
}

export function memoryStore() {
  const m = new Map();
  return {
    m,
    async setNX(k, v) {
      if (m.has(k)) return false;
      m.set(k, v);
      return true;
    },
    async get(k) {
      return m.has(k) ? m.get(k) : null;
    },
    async set(k, v) {
      m.set(k, v);
    },
    async del(k) {
      m.delete(k);
    },
  };
}
