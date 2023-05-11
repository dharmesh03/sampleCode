import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import map from 'lodash/map';
import cx from 'classnames';
import loadable from '@loadable/component';
import { socialShareLinks } from '../../constants/constData';
import './SocialShare.scss';

const AEIcon = loadable(() => import('../Icon'));

const SocialShare = ({ list, isSocialShare, placement, eventName, className }) => {
  const iconInput = useRef(null);
  const otherParams =
    eventName && eventName !== '' ? `&title=${eventName}&summary=${eventName}&source=${eventName}` : '';
  const showIconsOnFocus = (isShow) => {
    if (isShow) {
      iconInput && iconInput.current.classList.toggle('tab_hover_focus');
    } else {
      iconInput && iconInput.current.classList.toggle('tab_hover_focus');
    }
  };
  return (
    <div className={cx('ae-social-share-btn', className)} id="socialShareBtn" onClick={(e) => e.stopPropagation()}>
      <div className="ae-item-social-media" id="socialMediaIcons">
        <div className="ae-item-share-btn" id="socialShareBtn">
          <a className={'cursor'}>
            <AEIcon
              type={'fa fa-share hide-on-hover'}
              role="link"
              className="outline_offset_14 b_rad_100 cursor"
              tabIndex="0"
              onFocus={() => showIconsOnFocus(true)}
              aria-label={`Share on social media`}
            />
            <AEIcon type={`ac-icon-close show-on-hover`} />
          </a>
        </div>
        <div
          className={cx('ae-social-media-section', !isSocialShare && 'share-off', `ae-social-${placement}`)}
          ref={iconInput}
        >
          {map(list, (data) => {
            const title = data.title.toLowerCase();
            return (
              <div className={cx('share-tag', title === 'linkedin' && 'soc_linkedin')}>
                <a
                  href={
                    title === 'email'
                      ? `${data.link}`
                      : title === 'linkedin'
                      ? `${(socialShareLinks && socialShareLinks.linkedIn) || ''}${data.link}${otherParams}`
                      : `${socialShareLinks[title]}${data.link}`
                  }
                  title={data.title}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex="0"
                  className="outline_offset_2 cursor"
                  aria-label={`Share item to ${data.title}`}
                >
                  <AEIcon type={title === 'linkedin' ? `fa fa-${title}` : `ac-icon-${title}`} />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SocialShare;

SocialShare.propTypes = {
  isSocialShare: PropTypes.bool,
  placement: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
};

SocialShare.defaultProps = {
  isSocialShare: true,
  placement: 'right',
};
