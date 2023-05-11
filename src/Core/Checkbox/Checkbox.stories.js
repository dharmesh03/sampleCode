import React from 'react';
import { withKnobs, text, boolean } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import AECheckbox from './Checkbox';
export default {
  title: 'Checkbox',
  decorators: [withKnobs],
};
const Label = text('Label', 'Choose checkbox button below');
export const defaultBox = () => {
  const message = text('Text', 'click checkbox');
  return <AECheckbox onChange={action('changed!')} message={message} label={Label} />;
};
export const activeBox = () => {
  const message = text('Text', 'click checkbox');
  const checked = true;
  return <AECheckbox onChange={action('changed!')} message={message} label={Label} checked={checked} />;
};
export const disabledBox = () => {
  const message = text('Text', 'click checkbox');
  return (
    <AECheckbox message={message} onChange={action('changed!')} label={Label} disabled={boolean('Disabled', true)} />
  );
};
