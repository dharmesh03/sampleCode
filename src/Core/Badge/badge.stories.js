import React from 'react';
import { withKnobs, text } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import { withDesign } from 'storybook-addon-designs';
import Badge from './Badge.js';

export default { title: 'Badge', decorators: [withKnobs, withDesign] };

export const badge = () => {
  const label = text('Text', 'Click here now!');
  return <Badge onClick={action('clicked')} label={label} variant="info" />;
};

export const PrimaryBadge = () => {
  const label = text('Text', 'Primary Badge');
  return <Badge onClick={action('clicked')} label={label} variant="primary" />;
};

export const SecondaryBadge = () => {
  const label = text('Text', 'Secondary Badge');
  return <Badge onClick={action('clicked')} label={label} variant="secondary" />;
};

export const SuccessBadge = () => {
  const label = text('Text', 'Success Badge');
  return <Badge onClick={action('clicked')} label={label} variant="success" />;
};

export const WarningBadge = () => {
  const label = text('Text', 'Warning Badge');
  return <Badge onClick={action('clicked')} label={label} variant="warning" />;
};

export const DangerBadge = () => {
  const label = text('Text', 'Danger Badge');
  return <Badge onClick={action('clicked')} label={label} variant="danger" />;
};

PrimaryBadge.parameters = {
  design: {
    variant: 'figma',
    url: 'https://www.figma.com/file/naVNRLulQvzdzp1XNG6krg/Style-Guide?node-id=809%3A228',
  },
};
