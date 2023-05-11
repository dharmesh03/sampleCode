import React from 'react';
import PropTypes from 'prop-types';
import NumericInput from 'react-numeric-input';
import cx from 'classnames';
import omit from 'lodash/omit';
import './input.scss';
import loadable from '@loadable/component';

const AEIcons = loadable(() => import('../Icon/index'));

const AEInputField = (props) => {
  const {
    placeHolder,
    message,
    size,
    color,
    valid,
    disabled,
    feedBackText,
    isFeedBackShow,
    withIcon,
    iconClass,
    symbol,
    className,
    inputType,
    required,
    rootClass,
    id,
    isCounter,
    labelClass,
    hidePasswordCharacter,
    allowIconAction,
    svgObj,
    isCheckoutCardHolder,
  } = props;
  let styles = {
    color,
    fontSize: AEInputField.sizes[size],
    paddingLeft: symbol ? '36px' : '16px',
    paddingRight: iconClass ? '36px' : '16px',
  };
  const getStyle = (valid) => {
    if (valid !== undefined) {
      styles = {
        ...styles,
        borderColor: !valid && isFeedBackShow && '#F15252',
      };
    }
    return styles;
  };

  const getStyleClass = (valid) => {
    let classNameValid = '';
    if ((valid === undefined && props.value) || (valid === undefined && props.defaultValue)) {
      classNameValid =
        props.defaultValue !== '' || props.defaultValue !== null || props.value !== '' || props.value !== null
          ? 'valid-input'
          : '';
    }
    if (valid !== undefined) {
      classNameValid = valid ? 'valid-input' : !valid && isFeedBackShow ? 'error-input' : '';
    }
    return classNameValid;
  };

  let disbledStyle = {
    display: 'block',
  };
  if (disabled) {
    disbledStyle = {
      ...disbledStyle,
      color: '#8E909B',
    };
  }
  const classes = cx('input focused', className, size);
  const rootClasses = cx('input-icon-box cursor', rootClass);
  const labelClasses = cx('inputLabel-text', labelClass);
  return (
    <div className="position-relative width-100-percent">
      {message && (
        <label className={labelClasses} style={disbledStyle} htmlFor={id} id={id}>
          {message}
          {required && <span className="red">*</span>}
        </label>
      )}
      <div className={rootClasses}>
        {props && inputType === 'Numeric' ? (
          <NumericInput
            className={cx(
              classes,
              symbol ? 'numericSymbol-padding' : 'numeric-padding',
              !props.disabled && getStyleClass(valid),
              props.disabled && 'desabled',
            )}
            style={styles}
            placeholder={placeHolder}
            ref={props.inputRef}
            {...omit(props, ['className'])}
            id={id || placeHolder}
            aria-describedby={`feedback_${id}`}
          />
        ) : (
          <input
            className={cx(
              classes,
              valid !== undefined && !valid && isFeedBackShow ? 'error-input' : '',
              props.disabled && 'desabled',
            )}
            style={getStyle(valid)}
            placeholder={placeHolder}
            ref={props.inputRef}
            {...omit(props, ['className'])}
            aria-required={!!required}
            id={id || placeHolder}
            aria-describedby={`feedback_${id}`}
          />
        )}
        {withIcon && symbol && <span className="input-currencySymbol">{symbol}</span>}
        {withIcon && svgObj && (
          <span className="input-icon">
            {
              <AEIcons
                width={svgObj[0]?.width}
                height={svgObj[0]?.height}
                svgIcon={svgObj[0]?.svgIcon}
                viewBox={svgObj[0]?.viewBox}
                fill={svgObj[0]?.fill}
                xmlns={svgObj[0]?.xmlns}
                color={svgObj[0]?.color}
                size="none"
                onClick={(e) => (allowIconAction === 'click' ? hidePasswordCharacter() : e.preventDefault())}
              />
            }
          </span>
        )}
      </div>
      {isFeedBackShow && (
        <span
          id={`feedback_${id}`}
          className={cx(
            isCheckoutCardHolder ? 'error-card-text' : 'error-text',
            valid !== undefined && !valid ? 'textRed' : 'text-left',
            valid && isCounter && 'error_text_character',
          )}
          role="alert"
        >
          {valid !== undefined && !valid && feedBackText && <AEIcons className="fa fa-info-circle" size="exSmall" />}
          {feedBackText}
        </span>
      )}
    </div>
  );
};

export default AEInputField;

AEInputField.propTypes = {
  color: PropTypes.string,
  size: PropTypes.oneOf(['small', 'normal', 'large']),
  onClick: PropTypes.func,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};

AEInputField.defaultProps = {
  color: '#333',
  size: 'normal',
  /* eslint-disable no-console */
  onClick: () => {},
  onChange: () => {},
  disabled: false,
  /* eslint-enable no-console */
};
AEInputField.sizes = {
  small: '10px',
  normal: '16px',
  large: '18px',
};
