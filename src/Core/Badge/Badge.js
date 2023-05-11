import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import './badge.scss';

const AEBadge = ({ color, size, onClick, id, className, children, variant, style, label, type, ...props }) => {
  const styles = {
    color,
    ...style,
    fontSize: AEBadge.sizes[size],
  };

  const classes = cx('ae-badge', type, className, size, variant);

  return (
    <span className={classes} id={id} style={styles} {...props}>
      {children || label}
    </span>
  );
};

export default AEBadge;

AEBadge.propTypes = {
  children: PropTypes.string.isRequired,
  color: PropTypes.string,
  variant: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  onClick: PropTypes.func,
};

AEBadge.defaultProps = {
  color: '#fff',
  size: 'medium',
  variant: 'primary',
  onClick: () => {},
};
AEBadge.sizes = {
  small: '12px',
  normal: '13px',
  medium: '14px',
  large: '16px',
};
