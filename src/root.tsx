import { component$ } from '@builder.io/qwik';
import { QwikCityProvider, RouterOutlet } from '@builder.io/qwik-city';
import { RouterHead } from './components/router-head';
import './css/style.css';

export default component$(() => (
  <QwikCityProvider>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="color-scheme" content="dark" />
      <link rel="icon" type="image/svg+xml" href="/assets/site_icons/Site_icon.svg" />
      <link rel="icon" type="image/x-icon" href="/assets/site_icons/favicon.ico" sizes="16x16 32x32 48x48" />
      <link rel="apple-touch-icon" href="/assets/site_icons/Site_icon.png" />
      <link rel="preload" href="/assets/fonts/Berylium%20Rg.otf" as="font" type="font/otf" crossOrigin="anonymous" />
      <link rel="preload" href="/assets/fonts/LiberationSerif-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      <RouterHead />
    </head>
    <body lang="en">
      <RouterOutlet />
    </body>
  </QwikCityProvider>
));
