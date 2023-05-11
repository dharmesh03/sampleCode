import React from 'react';
import { withKnobs, text } from '@storybook/addon-knobs';
import SocialLink from '../SocialLink';

export default { title: 'Social Links', decorators: [withKnobs] };

export const socialLink = () => {
  text('Click on it');
  const dataObj = [
    {
      title: 'facebook',
      url: '#',
      message: 'Post to facebook',
    },
    {
      title: 'twitter',
      url: '#',
      message: 'Share on Twitter',
    },
    {
      title: 'linkedIn',
      url: '#',
      message: 'Share on LinkedIn',
    },
    {
      title: 'email',
      url: '#',
      message: 'Share by email',
    },
  ];
  const socialShareLinks = {
    twitter: 'http://twitter.com/share?url=',
    facebook: 'https://www.facebook.com/sharer/sharer.php?&u=',
    linkedIn: 'https://www.linkedin.com/shareArticle?mini=true&url=',
  };
  const style = {};
  return (
    <SocialLink
      label="Social Icons"
      data={dataObj}
      socialShareLinks={socialShareLinks}
      eventName="TestingEvent"
      style={style}
    />
  );
};
