import { component$ } from '@builder.io/qwik';
import { useDocumentHead } from '@builder.io/qwik-city';

export const RouterHead = component$(() => {
  const head = useDocumentHead();

  return (
    <>
      <title>{head.title || 'xensenx'}</title>
      {head.meta.map((meta, index) => <meta key={`meta-${index}`} {...meta} />)}
      {head.links.map((link, index) => <link key={`link-${index}`} {...link} />)}
    </>
  );
});
