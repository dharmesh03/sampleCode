import React from 'react';
import cx from 'classnames';
import omit from 'lodash/omit';
import './AECheckbox.scss';
import loadable from '@loadable/component';

const AELabel = loadable(() => import('../Label/label'));

const AECheckbox = (props) => {
  const { message, inputRef, messageClass, id, variant } = props;
  return (
    <>
      <label className={cx('check-button cursor', props.className)}>
        <input type="checkbox" className="check-button__input" ref={inputRef} {...omit(props, ['className'])} />
        <span className={cx('check-button__control', props.disabled && 'disabled')} id={`${id}_ae_checkbox`} />
        <span className={cx('check-button__label', messageClass)}>
          <AELabel
            htmlFor={props.id}
            variant={variant || 'body2'}
            color={props.disabled ? '#8E909B' : '#4b4d5f'}
            labelClass="cursor"
          >
            {message}
          </AELabel>
        </span>
      </label>
    </>
  );
};

export default AECheckbox;
