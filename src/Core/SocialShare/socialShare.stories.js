import React from 'react';
import { withKnobs } from '@storybook/addon-knobs';
import SocialShare from './index';

export default { title: 'Social Share', decorators: [withKnobs] };

export const auctionShare = () => {
  const list = [
    {
      title: 'facebook',
      href: location.href,
    },
    {
      title: 'twitter',
      href: location.href,
    },
    {
      title: 'email',
      href: location.href,
    },
  ];
  const style = {
    position: 'relative',
    height: '100px',
    width: '100px',
  };
  return (
    <div style={style}>
      <SocialShare list={list} />
    </div>
  );
};
