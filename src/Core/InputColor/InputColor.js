import React, { useState, useRef } from 'react';
import cx from 'classnames';
import PropTypes from 'prop-types';
import { SketchPicker } from 'react-color';
import './InputColor.scss';
import AELabel from '../Label/label';

const InputColor = ({ label, defaultColor, onChangeColor, cantainerClass, labelClass, inpuTypeClass, ...props }) => {
  const [selectedColorData, setSelectedColorData] = useState({});
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [inputSelectedColor, setInputSelectedColor] = useState('');
  const colorDiv = useRef(null);

  const handleOutsideClick = (e) => {
    if (!colorDiv?.current?.contains(e.target)) {
      if (selectedColorData) {
        setShowColorPicker(false);
      }
    }
  };
  const handleChange = (data) => {
    setSelectedColorData(data);
    onChangeColor(data);
  };
  const handlePickerColorPopup = () => {
    setShowColorPicker(!showColorPicker);
    if (!showColorPicker) {
      document.addEventListener('click', handleOutsideClick, true);
    } else {
      document.removeEventListener('click', handleOutsideClick, true);
    }
  };

  const handleInput = () => {
    if (
      inputSelectedColor === '' ||
      inputSelectedColor === defaultColor ||
      inputSelectedColor?.length < 7 ||
      !/^#[0-9A-F]{6}$/i.test(inputSelectedColor)
    ) {
      setInputSelectedColor('');
      return;
    }
    const input = {};
    input.hex = inputSelectedColor;
    handleChange(input);
    setInputSelectedColor('');
  };

  return (
    <div className={cx('ae-input-color', cantainerClass)}>
      <AELabel className={labelClass} variant="captions">
        {label}
      </AELabel>
      <div className="ae-theme-color-picker cursor">
        <input
          type="text"
          className={cx('form-control lg color-text-box div-view-height', inpuTypeClass)}
          onClick={() => handlePickerColorPopup()}
          onKeyDown={(e) => e.key === 'Enter' && handlePickerColorPopup()}
          value={inputSelectedColor || (selectedColorData && selectedColorData.hex) || defaultColor}
          onChange={(e) => setInputSelectedColor(e?.target?.value)}
          onBlur={handleInput}
          maxLength={7}
          {...props}
        />
        <span
          className="color-pic"
          style={{
            background: inputSelectedColor || (selectedColorData && selectedColorData.hex) || defaultColor,
          }}
        />
        {showColorPicker ? (
          <div className="popover-box" ref={colorDiv}>
            <SketchPicker
              color={inputSelectedColor || (selectedColorData && selectedColorData.hex) || defaultColor}
              onChangeComplete={handleChange}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
export default InputColor;

InputColor.propTypes = {
  label: PropTypes.string,
  defaultColor: PropTypes.string.isRequired,
  onChangeColor: PropTypes.func,
};

InputColor.defaultProps = {
  label: '',
  onChangeColor: () => {},
};
