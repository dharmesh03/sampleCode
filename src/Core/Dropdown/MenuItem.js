import React from 'react';
import { MenuItem } from 'react-bootstrap';
import PropTypes from 'prop-types';
import cx from 'classnames';
import './Dropdown.scss';

const AEMenuItem = ({ className, style, value, children, onSelect, ...props }) => {
  const classes = cx('ae-option-label pad_option_label', className);

  return (
    <MenuItem className={classes} style={style} value={value} onClick={() => onSelect(value)} {...props}>
      {children}
    </MenuItem>
  );
};

export default AEMenuItem;

AEMenuItem.propTypes = {
  onSelect: PropTypes.func,
  className: PropTypes.string,
  value: PropTypes.string,
};

AEMenuItem.defaultProps = {
  /* eslint-disable no-console */
  className: '',
  value: 0,
  onSelect: (event) => {
    console.log('You have clicked me!', event);
  },
  /* eslint-enable no-console */
};
