import React from 'react';
import InputColor from './InputColor';
import { withKnobs, text } from '@storybook/addon-knobs';

export default { title: 'Input Color', decorators: [withKnobs] };

export const color = () => {
  text('Choose any color');
  const defaultColor = '#000000';
  return (
    <InputColor label="Choose Color" defaultColor={defaultColor} onChangeColor={(color) => console.log({ color })} />
  );
};
