import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import './RadioButton.scss';
import AELabel from '../Label/label';

const AERadioButton = (props) => {
  const { label, onChange, disabled, checked, labelClass, radioClass } = props;

  const labelClassName = cx('radio-button__label', labelClass);
  const radioClassName = cx('radio-button__control', radioClass);

  return (
    <div className="d-flex">
      <label className="radio-button cursor">
        <input
          type="radio"
          className="radio-button__input"
          onChange={onChange}
          disabled={disabled}
          checked={checked}
          {...props}
        />
        <span id={`${props.id}Radio`} style={props.style} className={radioClassName} />
      </label>
      <span className={labelClassName}>
        <AELabel htmlFor={props.id} variant="caption2" color="#4b4d4f">
          {label}
        </AELabel>
      </span>
    </div>
  );
};
export default AERadioButton;

AERadioButton.propTypes = {
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  checked: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
};

AERadioButton.defaultProps = {
  disabled: false,
  onChange: (event) => {
    console.log('You have changed me!', event.target);
  },
};
