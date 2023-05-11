import React from 'react';
import { withKnobs, text } from '@storybook/addon-knobs';
import Select from './Select';

export default { title: 'Select List', decorators: [withKnobs] };
export const select = () => {
  text('text', 'Select to choose options!');
  const ListObj = [
    {
      key: '0',
      value: 1,
      label: 'Test 1',
    },
    {
      key: '1',
      value: 2,
      label: 'Test 2',
    },
    {
      key: '2',
      value: 3,
      label: 'Test 3',
    },
    {
      key: '3',
      value: 4,
      label: 'Test 4',
    },
  ];
  return <Select options={ListObj} name="select1" />;
};
