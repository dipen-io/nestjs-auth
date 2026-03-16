import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

// export const corsConfig = (): CorsOptions => ({
//   origin: process.env.CORS_ORIGIN?.split(',') || '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   credentials: true,
// });

export const corsConfig = (): CorsOptions => {
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
  return {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow server-to-server requests
      const isAllowed = allowedOrigins.some(o => o === origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  };
};
