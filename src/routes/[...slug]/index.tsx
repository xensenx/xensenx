import { component$ } from '@builder.io/qwik';
import { useLocation, type DocumentHead, type StaticGenerateHandler } from '@builder.io/qwik-city';
import { getSitePageHead, getStaticPageSlugs } from '../../content/site-pages';
import { PageView } from '../../components/site-shell';

export default component$(() => {
  const location = useLocation();
  return <PageView path={location.url.pathname} />;
});

export const head: DocumentHead = ({ url }) => getSitePageHead(url.pathname);

export const onStaticGenerate: StaticGenerateHandler = () => ({
  params: getStaticPageSlugs().map((slug) => ({ slug })),
});
