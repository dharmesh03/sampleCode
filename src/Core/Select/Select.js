import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import PropsTypes from 'prop-types';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import loadable from '@loadable/component';
import { flatten, map } from 'lodash';

const AEIcons = loadable(() => import('../Icon/index'));

const AESelect = ({
  style,
  id,
  className,
  defaultValue,
  nodataText,
  isSearchable,
  options,
  value,
  onChange,
  isCounter,
  valid,
  isFeedBackShow,
  feedBackText,
  isTwoDimensional,
  selectType,
  isFromNewMeeting,
  downArrow,
  addPropsVal,
  menuPortalTarget = null,
  menuPosition = 'absolute',
  closeMenuOnScroll = false,
  components = {},
  isGroupedOptions = false,
  showSelectIcon = false,
  selectRef,
  ...props
}) => {
  const classes = cx('ae-select-box', className);
  const [val, setVal] = useState(defaultValue || value);
  const [ariaFocusMessage, setAriaFocusMessage] = useState('');

  const onFocus = ({ focused, isDisabled }) => {
    const msg = `You are currently focused on option ${focused.label}${isDisabled ? ', disabled' : ''}`;
    setAriaFocusMessage(msg);
    return ariaFocusMessage;
  };

  const handleChange = (selectedOption) => {
    onChange(selectedOption);
    setVal(selectedOption.value);
  };

  const menuPortalZIndex = (base) => {
    const menuPortalBase = { ...base };
    return menuPortalTarget ? { ...menuPortalBase, zIndex: 99999 } : menuPortalBase;
  };
  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      color: '#35374B',
      background: showSelectIcon && state.isSelected ? 'unset' : state.isSelected ? '#F3F4F6' : 'white',
      padding: '6px 12px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: ' space-between',
      alignItems: 'center',
      zIndex: 4,
      '&:hover': {
        backgroundColor: '#F3F4F6',
        '&:focus-within': { border: '1px solid #406AE8' },
        borderRadius: showSelectIcon && '4px',
      },
      '&:after': {
        content: showSelectIcon && state.isSelected && '"\\38"',
        color: '#406AE8',
        fontSize: '15px',
        fontFamily: 'accelevents-virtual-event',
        fontStyle: 'normal',
        fontWeight: '300',
      },
    }),
    control: (base, state) => ({
      ...base,
      minHeight: 44,
      borderColor: state.isFocused ? '#406AE8' : '#E9E9EB',
      borderRadius: 8,
      boxShadow: 'none',
      color: '#6d6f7d',
      cursor: 'pointer',
      '&:hover': { background: '#F1F2F6', border: '1px solid #f1f2f6' },
      '&:focus': { border: '1px solid #406ae8' },
    }),
    menu: (provided) => ({
      ...provided,
      border: '1px solid #F1F2F6',
      boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.08)',
      borderRadius: 8,
      zIndex: 20,
    }),
    placeholder: (defaultStyles) => ({
      ...defaultStyles,
      color: '#585757',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#4B4D5F',
      width: '90%',
    }),
    menuPortal: (base) => menuPortalZIndex(base),
  };

  useEffect(() => {
    if (selectType !== 'asyncSelect') {
      value && setVal(value);
    }
  }, [value]);
  const groupedOption = isGroupedOptions && map(options, (item) => item.options);

  const d =
    selectType !== 'asyncSelect' &&
    (addPropsVal ||
      (isTwoDimensional
        ? options
            .flatMap((group) => {
              if (!group.options) {
                return group;
              }
              return group.options;
            })
            .filter((item) => item.value === (val || value))
        : isGroupedOptions
        ? flatten(groupedOption).filter((item) => item.value === (value || val))
        : options.filter((item) => item.value === (val || value))));

  return (
    <>
      {selectType === 'asyncSelect' ? (
        <AsyncSelect
          className={classes}
          styles={customStyles}
          onChange={handleChange}
          defaultInputValue={props.defaultInputValue}
          inputId={id}
          id={`asyncSelect_${id}`}
          aria-labelledby={`${id}_label`}
          ariaLiveMessages={{
            onFocus,
          }}
          loadOptions={options}
          noOptionsMessage={() => nodataText || 'No options'}
          components={{
            IndicatorSeparator: () => null,
            DropdownIndicator: (props) =>
              props?.selectProps?.menuIsOpen ? (
                <AEIcons className="ac-icon-arrow-up m-r-5" size="exSmall" />
              ) : (
                <AEIcons className="ac-icon-arrow-down m-r-5" size="exSmall" />
              ),
            LoadingIndicator: () => null,
          }}
          value={value}
          {...props}
        />
      ) : (
        <Select
          className={classes}
          styles={customStyles}
          onChange={handleChange}
          value={d}
          noOptionsMessage={() => nodataText || 'No options'}
          inputId={id}
          id={`coreSelect_${id}`}
          aria-labelledby={`${id}_label`}
          ariaLiveMessages={{
            onFocus,
          }}
          menuPortalTarget={menuPortalTarget}
          menuPosition={menuPosition}
          closeMenuOnScroll={closeMenuOnScroll}
          isSearchable={isSearchable}
          options={options}
          components={{
            IndicatorSeparator: () => null,
            DropdownIndicator: (props) =>
              isFromNewMeeting ? (
                <AEIcons className="virtual-icon-schedule m-r-5" size="small" />
              ) : props?.selectProps?.menuIsOpen ? (
                <AEIcons className="ac-icon-arrow-up m-r-5" size="exSmall" />
              ) : (
                <AEIcons className="ac-icon-arrow-down m-r-5" id={downArrow} size="exSmall" />
              ),
            ...components,
          }}
          ref={selectRef}
          {...props}
        />
      )}
      {isFeedBackShow && (
        <span
          id={`feedback_${id}`}
          className={cx(
            'error-text',
            valid !== undefined && !valid ? 'textRed' : 'text-right',
            valid && isCounter && 'error_text_character',
          )}
          role="alert"
        >
          {valid !== undefined && !valid && feedBackText && <AEIcons className="fa fa-info-circle" size="exSmall" />}
          {feedBackText}
        </span>
      )}
    </>
  );
};

export default AESelect;

AESelect.PropsTypes = {
  className: PropsTypes.string,
  disabled: PropsTypes.bool,
};

AESelect.defaultProps = {
  onChange: () => {},
  isSearchable: false,
};
