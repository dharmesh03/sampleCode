import React from 'react';
import PropTypes from 'prop-types';
import './Spinner.scss';
import cx from 'classnames';

const Spinner = ({ className, style, type }) => {
  const styles = {
    width: Spinner.sizes[type],
    height: Spinner.sizes[type],
    ...style,
  };
  const classes = cx('spinner', className);
  return <div className={classes} style={styles} />;
};
export default Spinner;

Spinner.propTypes = {
  type: PropTypes.oneOf([
    'SpinnerExtraTiny',
    'SpinnerExtraSmall',
    'SpinnerSmall',
    'SpinnerMedium',
    'SpinnerLarge',
    'SpinnerTiny',
  ]),
};
Spinner.sizes = {
  SpinnerExtraTiny: '18px',
  SpinnerTiny: '30px',
  SpinnerExtraSmall: '40px',
  SpinnerSmall: '48px',
  SpinnerMedium: '64px',
  SpinnerLarge: '80px',
};
Spinner.defaultProps = {
  type: 'SpinnerExtraSmall'.isRequired,
};
