import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import loadable from '@loadable/component';
import './btn.scss';

const Icon = loadable(() => import('../Icon/index'));
const AESpinner = loadable(() => import('../Spinner/Spinner'));

const Button = ({
  color,
  size,
  children,
  variant,
  label,
  icon,
  isPrevIcon,
  isNextIcon,
  style,
  className,
  loading,
  block,
  isButtonIcon,
  iconSize,
  svgIcon,
  viewBox,
  ...props
}) => {
  const styles = {
    color,
    fontSize: Button.sizes[size],
    ...style,
  };
  const onlyIcon = icon && !isPrevIcon && !(children || label);
  const classes = cx(
    'ae-button',
    className,
    variant,
    size,
    isPrevIcon && 'prev-icon',
    isNextIcon && 'next-icon',
    onlyIcon && 'custom-btn-icon',
    block && 'bt-block',
  );
  const buttonStyle = (
    <>
      {(icon || svgIcon) && isPrevIcon && (
        <Icon
          type={icon}
          svgIcon={svgIcon}
          onClick={(e) => {
            e.stopPropagation();
          }}
          color={color}
          size={iconSize}
          viewBox={viewBox}
        />
      )}
      {children || label}
      {(icon || svgIcon) && !isPrevIcon && (
        <Icon
          onClick={(e) => {
            e.stopPropagation();
          }}
          svgIcon={svgIcon}
          type={icon}
          color={color}
          size={iconSize}
        />
      )}
    </>
  );

  return (
    // eslint-disable-next-line react/button-has-type
    <button className={cx(classes, loading && 'position-relative')} style={styles} {...props}>
      {loading && <AESpinner type="SpinnerExtraTiny" className="position-absolute btn-show-loader" />}
      {loading ? <span className={loading && 'btn-opacity-0'}>{buttonStyle}</span> : <> {buttonStyle}</>}
    </button>
  );
};

export default Button;

Button.propTypes = {
  label: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info']),
  size: PropTypes.oneOf(['small', 'normal', 'large', 'medium']),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'reset', 'submit', null]),
};

Button.defaultProps = {
  size: 'normal',
  disabled: false,
  loading: false,
  variant: 'primary',
  type: 'button',
  /* eslint-disable no-console */
  onClick: (event) => {
    console.log('You have clicked me!', event.target);
  },
};

Button.sizes = {
  small: '13px',
  exsmall: '12px',
  normal: '16px',
  medium: '16px',
  large: '18px',
};

Button.variants = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  danger: 'danger',
  warning: 'warning',
  info: 'info',
};
