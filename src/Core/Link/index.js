import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import './link.scss';

const AELink = ({ href, style, variant, size, className, dataToggle, dataTarget, children, ...props }) => {
  const styles = {
    fontSize: AELink.sizes[size],
    ...style,
  };
  const classes = cx('ae-link', className, variant);
  const commonProps = {
    style: styles,
    className: classes,
    ...props,
  };

  return href ? (
    <a href={href} data-toggle={dataToggle} data-target={dataTarget} {...commonProps}>
      {children}
    </a>
  ) : (
    <a data-toggle={dataToggle} data-target={dataTarget} {...commonProps}>
      {children}
    </a>
  );
};

export default AELink;

AELink.propTypes = {
  children: PropTypes.string.isRequired,
  variant: PropTypes.string,
  size: PropTypes.oneOf(['small', 'normal', 'large']),
  onClick: PropTypes.func,
};

AELink.defaultProps = {
  size: 'normal',
  variant: 'primary',
  onClick: () => {},
};
AELink.sizes = {
  small: '10px',
  normal: '14px',
  large: '16px',
};
