import React from 'react';
import Button from './Button.js';
import { withKnobs, text, select } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import { withDesign } from 'storybook-addon-designs';

export default {
  title: 'Button',
  decorators: [withKnobs, withDesign],
  argTypes: { onClick: { action: 'clicked' }, onChange: { action: 'changed' } },
};

const options = {
  small: 'small',
  medium: 'medium',
  normal: 'normal',
  large: 'large',
};

const ButtonComponent = (message, color, variant, disabled, icon, isPrevIcon, isNextIcon, isButtonIcon) => {
  return (
    <Button
      onClick={action('clicked')}
      variant={variant}
      label={message}
      disabled={disabled}
      icon={icon}
      isPrevIcon={isPrevIcon}
      isNextIcon={isNextIcon}
      isButtonIcon={isButtonIcon}
      size={select('Size', options, 'normal')}
    >
      {isButtonIcon && <i className={icon} />}
    </Button>
  );
};

export const button = () => {
  const message = text('Text', 'Button Name');
  return (
    <>
      <p>Active & Hover Button</p>
      {ButtonComponent(message, '#fff', 'primary')}
      <div className="m-t-b-20" />
      <p>Disabled Button</p>
      {ButtonComponent(message, '#fff', 'primary', true)}
    </>
  );
};

export const BeforeIcon = () => {
  const message = text('Text', 'Button Name');
  return (
    <>
      <p>Active & Hover Button</p>
      {ButtonComponent(message, '#fff', 'primary', false, 'ac-icon-plus-round', true)}
      <div className="m-t-b-20" />
      <p>Disabled Button</p>
      {ButtonComponent(message, '#fff', 'primary', true, 'ac-icon-plus-round', true)}
    </>
  );
};

export const AfterIcon = () => {
  const message = text('Text', 'Button Name');
  return (
    <>
      <p>Active & Hover Button</p>
      {ButtonComponent(message, '#fff', 'primary', false, 'ac-icon-plus-round', false, true)}
      <div className="m-t-b-20" />
      <p>Disabled Button</p>
      {ButtonComponent(message, '#fff', 'primary', true, 'ac-icon-plus-round', false, true)}
    </>
  );
};

export const ButtonIcon = () => {
  const message = text('Text', '');
  return (
    <>
      <p>Active & Hover Button</p>
      {ButtonComponent(message, '#fff', 'primary', false, 'ac-icon-plus-round', false, false, true)}
      <div className="m-t-b-20" />
      <p>Disabled Button</p>
      {ButtonComponent(message, '#fff', 'primary', true, 'ac-icon-plus-round', false, false, true)}
    </>
  );
};

button.parameters = {
  design: {
    type: 'figma',
    url: 'https://www.figma.com/file/pfBKMWyUqrOQ6LBsbTpvJ5/storybook-addon-button-sizes?node-id=1%3A113',
  },
};

BeforeIcon.parameters = {
  design: {
    type: 'figma',
    url: 'hhttps://www.figma.com/file/LwRDRdCkZjGGhdehSjoJIX/Storybook-addon-button-beforeicon',
  },
};

AfterIcon.parameters = {
  design: {
    type: 'figma',
    url: 'https://www.figma.com/file/f4f9vW9usj1QhZS9ULa6ZY/Storybook-addon-button-aftericon',
  },
};
ButtonIcon.parameters = {
  design: {
    type: 'figma',
    url: 'https://www.figma.com/file/9JLyqstdMotmjXRogOG6CB/storybook-addon-button-icon?node-id=14%3A139',
  },
};
