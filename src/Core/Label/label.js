import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import './label.scss';
import loadable from '@loadable/component';

const Icon = loadable(() => import('../Icon/index'));

const Label = ({
  iconType,
  iconSize,
  color,
  onClick,
  children,
  variant,
  header,
  labelClass,
  subHeader,
  style,
  className,
  iconConfig,
  ...props
}) => {
  const styles = {
    ...style,
    color,
  };
  const SubLabelStyles = {
    color,
  };

  const classes = cx('ae-label', className);
  const type = `ae-${variant}`;

  const labelClassName = cx(type, labelClass);
  const labelIdName = cx(type);
  return (
    <div className={classes} onClick={onClick}>
      {(iconSize || iconType) && (
        <div className="header-icon">
          <div className="breadcrumb-icon">
            <Icon type={iconType} size={iconSize} {...iconConfig} />
          </div>
        </div>
      )}
      <div className="label-block">
        {(header || children) && (
          <label className={labelClassName} id={labelIdName} style={styles} {...props}>
            {children || header}
          </label>
        )}
        {subHeader && (
          <label
            className={`ae-captions1 ${labelClassName}`}
            id={`ae-captions1 ${labelIdName}`}
            style={SubLabelStyles}
            {...props}
          >
            {subHeader}
          </label>
        )}
      </div>
    </div>
  );
};

export default Label;

Label.propTypes = {
  children: PropTypes.string.isRequired,
  color: PropTypes.string,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf([
    'heading1',
    'heading2',
    'heading3',
    'heading4',
    'subtitle',
    'subtitle2',
    'body1',
    'body2',
    'captions',
    'captions1',
    'custom-captions',
    'footer1',
  ]),
  iconType: PropTypes.string,
  iconSize: PropTypes.string,
  style: PropTypes.objectOf(PropTypes.object),
  className: PropTypes.string,
  labelClass: PropTypes.string,
  iconConfig: PropTypes.objectOf(PropTypes.object),
  header: PropTypes.string,
  subHeader: PropTypes.string,
};

Label.defaultProps = {
  color: '#35374B',
  variant: 'heading3',
  onClick: (event) => {
    console.log('You have clicked me!', event.target);
  },
  iconType: null,
  iconSize: null,
  style: null,
  className: null,
  labelClass: null,
  iconConfig: null,
  header: null,
  subHeader: null,
};
