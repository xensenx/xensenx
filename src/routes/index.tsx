import { component$ } from '@builder.io/qwik';
import { getSitePageHead } from '../content/site-pages';
import { PageView } from '../components/site-shell';

export default component$(() => <PageView path="/" />);

export const head = getSitePageHead('/');
