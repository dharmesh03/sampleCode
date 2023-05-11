import React from 'react';
import { withKnobs, select } from '@storybook/addon-knobs';
import Spinner from './Spinner';
export default { title: 'Spinner', decorators: [withKnobs] };
export const ProgressSpinner = () => {
  const label = 'Spinner Type';
  const arrayOfObjects = [
    { label: 'Extra Small', type: 'SpinnerExtraSmall' },
    { label: 'Small', type: 'SpinnerSmall' },
    { label: 'Medium', type: 'SpinnerMedium' },
    { label: 'Large', type: 'SpinnerLarge' },
  ];
  const defaultValue = arrayOfObjects[0];
  const value = select(label, arrayOfObjects, defaultValue);

  return <Spinner label={value.label} type={value.type} />;
};
