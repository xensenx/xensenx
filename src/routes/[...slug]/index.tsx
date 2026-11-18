import { component$ } from '@builder.io/qwik';
import { useLocation, type StaticGenerateHandler, type DocumentHead } from '@builder.io/qwik-city';
import { getPage, getPageHead, getPagePaths } from '../../content/pages';
import { PageView } from '../../components/site-shell';

export default component$(() => {
  const location = useLocation();
  const path = location.url.pathname.replace(/^\/+/, '');
  return <PageView path={path} />;
});

export const head: DocumentHead = ({ url }) => getPageHead(getPage(url.pathname));

export const onStaticGenerate: StaticGenerateHandler = () => ({
  params: getPagePaths().map((slug) => ({ slug })),
});
