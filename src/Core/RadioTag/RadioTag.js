import React from 'react';
import cx from 'classnames';
import './RadioTag.scss';
import AELabel from '../Label/label';

const AERadioTag = ({ label, onChange, name, id, className, radioClass, disabled, checked, ...props }) => {
  const labelClassName = cx('radio-tag-btn btn label-border normal', className, checked && 'lable-checked');
  const radioClassName = cx('radio-tag-input', radioClass);

  return (
    <div>
      <AELabel labelClass={labelClassName} className="width-100-percent d-block">
        {label}
        <input
          type="radio"
          onChange={onChange}
          name={name}
          id={id}
          className={radioClassName}
          disabled={disabled}
          checked={checked}
          {...props}
        />
      </AELabel>
    </div>
  );
};

export default AERadioTag;
