import React from 'react';
import Link from './index.js';
import { withKnobs, text } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';

export default { title: 'Link', decorators: [withKnobs] };

export const firstLink = () => {
  const message = text('Text', 'Go on Second Index');
  return <Link onClick={action('clicked')}>{message}</Link>;
};

export const SecondLink = () => {
  const message = text('Text', 'Go on First link');
  return (
    <Link onClick={action('clicked')} to={'/lin'}>
      {message}
    </Link>
  );
};

export const DisableLink = () => {
  const message = text('Text', 'Disable');
  return (
    <Link onClick={action('clicked')} className="isDisable" to={'/lin'}>
      {message}
    </Link>
  );
};
