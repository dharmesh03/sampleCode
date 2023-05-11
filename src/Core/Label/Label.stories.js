import React from 'react';
import { withKnobs, text, select } from '@storybook/addon-knobs';
import Label from './label';

export default { title: 'Label', decorators: [withKnobs] };

export const large = () => {
  const message = text('Text', 'Click here now!');
  return <Label header={message} variant="heading1" />;
};

export const medium = () => {
  const message = text('Text', 'Click here now!');
  return <Label header={message} size="medium" />;
};

export const small = () => {
  const options = {
    heading1: 'Heading1',
    heading2: 'Heading2',
    heading3: 'Heading3',
    heading4: 'Heading4',
    subtitle: 'subtitle',
    subtitle2: 'subtitle2',
    body1: 'body1',
    body2: 'body2',
    captions1: 'captions1',
    captions: 'captions',
  };
  const message = text('Text', 'Click here now!');
  return <Label header={message} variant={select('variant', options, 'captions')} />;
};

export const headerLabel = () => {
  const message = text('Text', 'Header');
  return <Label header={message} variant="subtitle" />;
};

export const IconLabel = () => {
  const message = text('Text', 'Click here now!');
  return (
    <div className="breadcrumb">
      <Label header={message} iconType="ac-icon-layout" iconSize="medium" iconColor="#ffff" size="large" />
    </div>
  );
};

export const LabelWithDescription = () => {
  const label = text('Label', 'Label');
  const subLabelMessage = text('Sub Label', 'sub label');
  return (
    <div className="labelWithDescription">
      <Label header={label} subHeader={subLabelMessage} />
    </div>
  );
};
