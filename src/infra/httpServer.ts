import type { Server } from 'http';
import { createServer as createServerHttp } from 'http';
import { createServer as createServerHttps } from 'https';
import type { Express } from 'express';

export type SslType =
    | {
          key: string;
          cert: string;
      }
    | undefined;

export const createHttpServer = (app: Express, ssl: SslType): Server => {
    // 1. https server
    if (ssl && ssl.key && ssl.cert) {
        return createServerHttps(ssl, app);
    }

    // 2. http server
    return createServerHttp(app);
};
