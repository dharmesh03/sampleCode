import React from 'react';
import { withKnobs, text, boolean } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import NewInput from './index';

export default {
  title: 'Input Field',
  decorators: [withKnobs],
  argTypes: { onClick: { action: 'clicked' }, onChange: { action: 'changed' } },
};

const EnabledInputComponent = (message, isIcon) => (
  <NewInput
    onClick={action('clicked')}
    onChange={action('changed')}
    message={message}
    placeHolder={message}
    name="enabled"
    type="text"
    withIcon={isIcon}
    iconClass={'ac-icon-user'}
  />
);

const FocusedInputComponent = (message, isIcon) => (
  <NewInput
    onClick={action('clicked')}
    message={message}
    placeHolder={message}
    name="focused"
    type="text"
    size="normal"
    variant="focused"
    withIcon={isIcon}
    iconClass={'ac-icon-user'}
  />
);

const CompletedInputComponent = (message, isIcon) => (
  <NewInput
    onClick={action('clicked')}
    message={message}
    placeHolder={message}
    name="completed"
    type="text"
    size="normal"
    valid
    withIcon={isIcon}
    iconClass={'ac-icon-user'}
  />
);

const NoteInputComponent = (message, isIcon) => (
  <NewInput
    onClick={action('clicked')}
    message={message}
    placeHolder={message}
    name="note"
    type="text"
    size="normal"
    feedBackText={'Notes here...'}
    isFeedBackShow
    feedBackVariant="error-text"
    withIcon={isIcon}
    iconClass={'ac-icon-user'}
  />
);

const ErrorInputComponent = (message, isIcon) => (
  <NewInput
    onClick={action('clicked')}
    message={message}
    placeHolder={message}
    name="errorText"
    type="text"
    size="normal"
    valid={false}
    feedBackText={'Error here...'}
    isFeedBackShow
    withIcon={isIcon}
    iconClass={'ac-icon-user'}
  />
);

const DisabledInputComponent = (message, isIcon) => (
  <NewInput
    onClick={action('clicked')}
    message={message}
    placeHolder={message}
    name="disabledText"
    disabled={boolean('Disabled', true)}
    withIcon={isIcon}
    iconClass={'ac-icon-user'}
  />
);

export const EnabledInput = () => {
  const message = text('label', 'Label');
  return (
    <>
      <p>Default Input</p>
      {EnabledInputComponent(message)}
      <div className="m-t-b-20" />
      <p>Outlined Input</p>
      {EnabledInputComponent(message, true)}
    </>
  );
};

export const FocusedInput = () => {
  const message = text('Text', 'Label');
  return (
    <>
      <p>Default Input</p>
      {FocusedInputComponent(message)}
      <div className="m-t-b-20" />
      <p>Outlined Input</p>
      {FocusedInputComponent(message, true)}
    </>
  );
};

export const CompletedInput = () => {
  const message = text('Text', 'Label');
  return (
    <>
      <p>Default Input</p>
      {CompletedInputComponent(message)}
      <div className="m-t-b-20" />
      <p>Outlined Input</p>
      {CompletedInputComponent(message, true)}
    </>
  );
};

export const NoteInput = () => {
  const message = text('Text', 'Label');
  return (
    <>
      <p>Default Input</p>
      {NoteInputComponent(message)}
      <div className="m-t-b-20" />
      <p>Outlined Input</p>
      {NoteInputComponent(message, true)}
    </>
  );
};

export const ErrorInput = () => {
  const message = text('Text', 'Label');
  return (
    <>
      <p>Default Input</p>
      {ErrorInputComponent(message)}
      <div className="m-t-b-20" />
      <p>Outlined Input</p>
      {ErrorInputComponent(message, true)}
    </>
  );
};

export const DisabledInput = () => {
  const message = text('Text', 'Label');
  return (
    <>
      <p>Default Input</p>
      {DisabledInputComponent(message)}
      <div className="m-t-b-20" />
      <p>Outlined Input</p>
      {DisabledInputComponent(message, true)}
    </>
  );
};
