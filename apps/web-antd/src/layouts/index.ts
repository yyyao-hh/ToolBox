const BasicLayout = () => import('./basic.vue');
const AuthPageLayout = () => import('./auth.vue');

const IFrameView = () => import('#/components/Layout/Iframe').then((m) => m.IFrameView);

export { AuthPageLayout, BasicLayout, IFrameView };
