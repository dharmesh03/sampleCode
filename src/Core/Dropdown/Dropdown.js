import React from 'react';
import { Dropdown, DropdownButton } from 'react-bootstrap';
import PropTypes from 'prop-types';
import $ from 'jquery';
import cx from 'classnames';
import './Dropdown.scss';
import AEIcons from '../Icon/index';
import AEButton from '../Button/Button';
import CustomScrollbar from '../CustomScrollbar';

class CustomToggle extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.dropdownRef = React.createRef();
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    e.preventDefault();
    this.props.onClick(e);
    if (e?.target?.nextSibling) {
      // remove old Element and move current place
      this.el &&
        $(this.el).css({
          top: '100%',
          left: 0,
          opacity: 0,
          visibility: 'hidden',
          transition: 'opacity 0.3s linear',
          transform: 'scale(1, 0)',
        });
      this.el && this.target && $(this.target?.offsetParent).append(this.el);
      if (this.parentEl && parseInt(this.parentEl.childElementCount, 10) === 0) {
        this.props?.openTarget.contains(this.parentEl) && this.props?.openTarget.removeChild(this.parentEl);
      }

      // creat div and move to target
      this.parentEl = document.createElement('div');
      this.parentEl?.setAttribute('id', 'ae-dropdown');
      this.target = e?.target;
      this.target?.focus();
      this.el = this.target?.nextSibling;

      const eOffset = $(this.target)?.offset();
      const openTargetOffset = $(this.props?.openTarget)?.offset();

      $(this.parentEl).append(this.el);
      $(this.props.openTarget).append(this.parentEl);

      $(this.el).css({
        display: 'block',
        top: eOffset?.top + $(this.target)?.outerHeight() - openTargetOffset?.top,
        left: eOffset?.left - openTargetOffset?.left,
        opacity: 1,
        visibility: 'visible',
        transition: 'opacity 0.3s linear',
        transform: 'scale(1, 1)',
      });
    } else {
      this.handleBlur(e);
    }
  }

  handleBlur = (e) => {
    setTimeout(() => {
      e.preventDefault();

      $(this.el).css({
        top: '100%',
        left: 0,
        opacity: 0,
        visibility: 'hidden',
        transition: 'opacity 0.3s linear',
        transform: 'scale(1, 0)',
      });

      $(this.target?.offsetParent).append(this.el);
      if (this.parentEl && parseInt(this.parentEl.childElementCount, 10) === 0) {
        this.props?.openTarget.contains(this.parentEl) && this.props?.openTarget.removeChild(this.parentEl);
      }
      this.props.open && this.props.onClick(this.target);
    }, 300);
  };

  componentDidMount() {
    if (this.props.openTarget) {
      $(this.props.openTarget).on('touchstart', (e) => {
        this.props.open && this.handleBlur(e);
      });
    }
  }

  render() {
    return (
      <AEButton
        id="dropdownBasic"
        ref={this.dropdownRef}
        className={this.props.classes}
        style={this.props.styles}
        onClick={this.handleClick}
        onBlur={this.handleBlur}
      >
        {this.props.children}
      </AEButton>
    );
  }
}

const AEDropdown = ({
  title,
  isShowCaret,
  onSelect,
  icon,
  children,
  className,
  style,
  isFilter,
  arrowDown,
  tooltip,
  openTarget,
  maxScrollHeight,
  ...props
}) => {
  const classes = cx('ae-dropdown-btn', icon && 'outline-dropbtn', !title && 'icon-dropbtn', className);
  const styles = { ...style };
  const buttonTitle = () => (
    <span className="dropdown-caret-icon">
      {tooltip || (
        <>
          {icon && <AEIcons id={`${props.id}Icon`} className={icon} aria-hidden="true" />}
          {title}
          {isShowCaret && (
            <AEIcons
              id={arrowDown}
              className="caret-icon"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              svgIcon="downSolidArrow"
              size="small"
              aria-hidden="true"
            />
          )}
        </>
      )}
    </span>
  );

  return (
    <div id="ae-dropdown">
      {openTarget ? (
        <Dropdown pullRight={props.pullRight}>
          <CustomToggle
            bsRole="toggle"
            classes={`${classes} ${props.disabled ? 'disable-dropdown' : ''}`}
            styles={styles}
            openTarget={openTarget}
          >
            {buttonTitle()}
          </CustomToggle>
          <Dropdown.Menu>
            <CustomScrollbar maxHeight={maxScrollHeight || '530px'} trackTop="16px" trackBottom="16px">
              {children}
            </CustomScrollbar>
          </Dropdown.Menu>
        </Dropdown>
      ) : (
        <DropdownButton id="dropdownBtn" className={classes} style={styles} title={buttonTitle()} {...props}>
          <CustomScrollbar maxHeight={maxScrollHeight || '530px'} trackTop="16px" trackBottom="16px">
            {children}
          </CustomScrollbar>
        </DropdownButton>
      )}
    </div>
  );
};

export default AEDropdown;

AEDropdown.propTypes = {
  title: PropTypes.string.isRequired,
  className: PropTypes.string,
  icon: PropTypes.string,
  isShowCaret: PropTypes.bool,
};

AEDropdown.defaultProps = {
  /* eslint-disable no-console */
  className: '',
  icon: null,
  isShowCaret: true,
  /* eslint-enable no-console */
};
