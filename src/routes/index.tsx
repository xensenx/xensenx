import { component$ } from '@builder.io/qwik';
import { getPage, getPageHead } from '../content/pages';
import { PageView } from '../components/site-shell';

export default component$(() => <PageView path="index.html" />);

export const head = getPageHead(getPage('index.html'));
