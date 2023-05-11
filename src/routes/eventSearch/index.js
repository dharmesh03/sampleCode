import React from 'react';

import EventSearchHeader from './EventSearchHeader';

const EventSearch = React.lazy(() => import('./EventSearch'));
const sentryTest = React.lazy(() => import('../home/Home'));
const WLInformation = React.lazy(() => import('./WLInformation'));

export default [
  {
    path: '/sentryTest',
    component: sentryTest,
    title: 'Event Search',
    exact: true,
  },
  {
    path: '/events',
    component: EventSearch,
    title: 'Event Search',
    exact: true,
    wrapperLayout: EventSearchHeader,
    layoutProps: {},
  },
  {
    path: '/events/:whiteLabelUrl',
    component: EventSearch,
    title: 'Event Search',
    exact: true,
    iswhiteLabelEventList: true,
    wrapperLayout: EventSearchHeader,
    layoutProps: { iswhiteLabelEventList: true },
  },
  {
    path: '/events/:whiteLabelUrl/:type',
    component: WLInformation,
    title: 'Event Search',
    exact: true,
    iswhiteLabelEventList: true,
    wrapperLayout: EventSearchHeader,
    layoutProps: { iswhiteLabelEventList: true, isWLInformationPage: true },
  },
  {
    path: '/',
    component: EventSearch,
    title: 'Event Search',
    exact: true,
    isFrom: 'homePage',
    wrapperLayout: EventSearchHeader,
    layoutProps: { isFrom: 'homePage', iswhiteLabelEventList: true },
  },
];
