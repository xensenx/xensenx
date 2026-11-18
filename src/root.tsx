import { component$ } from '@builder.io/qwik';
import { QwikCityProvider, RouterOutlet } from '@builder.io/qwik-city';
import { RouterHead } from './components/router-head';
import './css/style.css';

export default component$(() => (
  <QwikCityProvider>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" type="image/svg+xml" href="/assets/site_icons/Site_icon.svg" />
      <link rel="icon" type="image/x-icon" href="/assets/site_icons/favicon.ico" sizes="16x16 32x32 48x48" />
      <link rel="apple-touch-icon" href="/assets/site_icons/Site_icon.png" />
      <link rel="preload" href="/assets/fonts/Berylium%20Rg.otf" as="font" type="font/otf" crossOrigin="anonymous" />
      <link rel="preload" href="/assets/fonts/LiberationSerif-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      <RouterHead />
    </head>
    <body lang="en">
      <audio
        id="xsn-bg-audio-player"
        class="visually-hidden-audio"
        src="/assets/audio/alex-productions-lo-fi-hip-hop-galaxy-132921.mp3"
        preload="none"
        loop
        aria-hidden="true"
        tabIndex={-1}
      />
      <RouterOutlet />
    </body>
  </QwikCityProvider>
));
