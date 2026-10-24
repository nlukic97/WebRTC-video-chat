import dotenv from 'dotenv';
dotenv.config();

export const HOST = process.env.HOST || 'localhost';

export const PORT = process.env.PORT || 443;

export const PEER_PORT: number = Number(process.env.PEER_PORT) || 9000;

// check for useHTTPS
if (!['true', 'false'].includes(process.env.USE_HTTPS || '')) {
    throw new Error('USE_HTTPS env variable specified incorrectly');
}
export const useHttps = process.env.USE_HTTPS === 'true';

// check for ENV
if (!process.env.ENV) {
    throw new Error('ENV env variable specified incorrectly');
}
export const ENV = process.env.ENV;
