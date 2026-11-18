import { defineConfig } from 'vite';
import { qwikCity } from '@builder.io/qwik-city/vite';
import { qwikVite } from '@builder.io/qwik/optimizer';

const stripDevRequestEvent = {
  name: 'qwik-dev-request-event',
  apply: 'serve' as const,
  configureServer(server: import('vite').ViteDevServer) {
    server.middlewares.use((_request, response, next) => {
      // Qwik City includes its Node RequestEvent in dev data; its socket is circular and isn't needed in the browser.
      type QwikCityEnvData = {
        [key: string]: unknown;
        qwikcity?: { [key: string]: unknown; ev?: unknown };
      };
      let envData: QwikCityEnvData | undefined;
      const qwikResponse = response as typeof response & { _qwikEnvData?: QwikCityEnvData };
      Object.defineProperty(qwikResponse, '_qwikEnvData', {
        configurable: true,
        get: () => envData,
        set: (value: QwikCityEnvData | undefined) => {
          if (value?.qwikcity) {
            const { ev: _requestEvent, ...serializableQwikCity } = value.qwikcity;
            envData = { ...value, qwikcity: serializableQwikCity };
          } else {
            envData = value;
          }
        },
      });
      next();
    });
  },
};

export default defineConfig(() => ({
  plugins: [qwikCity({ trailingSlash: true }), stripDevRequestEvent, qwikVite()],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  server: {
    headers: {
      'Cache-Control': 'no-cache',
    },
  },
}));
