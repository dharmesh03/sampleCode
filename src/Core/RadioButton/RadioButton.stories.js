import React from 'react';
import { withKnobs, text, boolean } from '@storybook/addon-knobs';
import RadioButton from './RadioButton';

export default { title: 'Radio Button', decorators: [withKnobs] };

export const defaultButton = () => {
  const radioObj = [
    {
      id: 'radiobtn1',
      name: 'radiobtn',
      value: 1,
      label: 'Radio Button 1',
    },
    {
      id: 'radiobtn2',
      name: 'radiobtn',
      value: 2,
      label: 'Radio Button 2',
    },
  ];
  return radioObj.map((item) => (
    <div style={{ display: 'flex' }}>
      <RadioButton
        label={item && item.label}
        defaultChecked={(item && item.checked) || false}
        name={item && item.name}
        value={item && item.value}
        id={item && item.id}
        onChange={(e) => console.log('selected button', e.target.value)}
      />
    </div>
  ));
};
export const Disabled = () => {
  const radioObj = [
    {
      id: 'radiobtn1',
      name: 'radiobtn',
      value: 1,
      label: 'Radio Button 1',
    },
  ];
  return radioObj.map((item) => (
    <div style={{ display: 'flex' }}>
      <RadioButton
        label={item && item.label}
        defaultChecked={(item && item.checked) || false}
        name={item && item.name}
        value={item && item.value}
        id={item && item.id}
        onChange={(e) => console.log('selected button', e.target.value)}
        disabled={boolean('Disabled', true)}
      />
    </div>
  ));
};
export const Active = () => {
  text('Select radio button');
  const radioObj = [
    {
      id: 'radiobtn1',
      name: 'radiobtn',
      value: 1,
      label: 'Radio Button 1',
      checked: true,
    },
    {
      id: 'radiobtn2',
      name: 'radiobtn',
      value: 2,
      label: 'Radio Button 2',
    },
  ];

  return radioObj.map((item) => (
    <div style={{ display: 'flex' }}>
      <RadioButton
        label={item && item.label}
        name={item && item.name}
        value={item && item.value}
        id={item && item.id}
        onChange={(e) => console.log('selected button', e.target.value)}
        defaultChecked={(item && item.checked) || false}
      />
    </div>
  ));
};
