import React from 'react';
import PropTypes from 'prop-types';
import './SocialLink.scss';
import loadable from '@loadable/component';
import { IconPropsTypes } from '../Icon';

const AETooltip = loadable(() => import('../Tooltip'));
const AEIcon = loadable(() => import('../Icon'));

let iconClass = '';

const SocialLink = ({
  label,
  rootClassName,
  data,
  socialShareLinks,
  eventName,
  size,
  style,
  isUserSocialLink,
  onClick,
  newThemeDesign,
}) => {
  const renderShareRef = (data) => {
    let ShareUrl = '#';

    if (data.title === 'facebook') {
      ShareUrl = isUserSocialLink
        ? `${data.url}`
        : `${(socialShareLinks && socialShareLinks.facebook) || ''}${data.url}`;
      //  ShareUrl += ShareUrl.indexOf(eventUrl) === -1 ? eventUrl : '';
      iconClass = 'fa-facebook';
    } else if (data.title === 'twitter') {
      ShareUrl = isUserSocialLink
        ? `${data.url}`
        : `${(socialShareLinks && socialShareLinks.twitter) || ''}${data.url}`;
      iconClass = 'fa-twitter';
    } else if (data.title === 'linkedIn') {
      const otherParams =
        eventName && eventName !== '' ? `&title=${eventName}&summary=${eventName}&source=${eventName}` : '';
      ShareUrl = isUserSocialLink
        ? `${data.url}`
        : `${(socialShareLinks && socialShareLinks.linkedIn) || ''}${data.url}${otherParams}`;
      iconClass = 'fa-linkedin';
    } else if (data.title === 'instagram') {
      ShareUrl = isUserSocialLink
        ? `${data.url}`
        : `${(socialShareLinks && socialShareLinks.instagram) || ''}${data.url}`;
      iconClass = 'fa-instagram';
    } else if (data.title === 'email') {
      ShareUrl = `mailto:${''}?subject=${`You\'re invited to ${eventName}`}&body=${"I'd like to share this event with you!"} ${
        data.url
      }`;
      //  ShareUrl += ShareUrl.indexOf(eventUrl) === -1 ? eventUrl : '';
      iconClass = 'fa-envelope';
    }
    return ShareUrl;
  };

  return (
    <div className={rootClassName}>
      <div>{label}</div>
      <ul
        className={`ae-social-share width-max-content ${newThemeDesign ? 'ae-social-share-landing-page' : ''}`}
        id="socialShareButton"
      >
        {data.map((item, index) => (
          <li>
            <a
              key={index}
              style={{ ...style }}
              href={renderShareRef(item)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClick}
              aria-label={item.message}
              className={`social-share-link ${newThemeDesign ? `new-theme-social-icons-svg ${item.title}-class` : ''}`}
            >
              <AETooltip tooltipProps={{ id: item.title }} tooltip={item.message} key={index}>
                {newThemeDesign ? (
                  <AEIcon size={size} svgIcon={`new-theme-icon-${item.title}`} />
                ) : (
                  <AEIcon size={size} type={`fa ${iconClass} social-icon-btn ae-${size}`} />
                )}
              </AETooltip>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default SocialLink;

SocialLink.defaultProps = {
  label: '',
  size: 'small',
  data: [],
  socialShareLinks: {},
  eventName: '',
  style: {},
  isUserSocialLink: false,
};

SocialLink.propTypes = {
  size: PropTypes.oneOf(IconPropsTypes.size),
  label: PropTypes.string,
  data: PropTypes.arrayOf(PropTypes.string),
  socialShareLinks: PropTypes.objectOf(PropTypes.object),
  eventName: PropTypes.string,
  style: PropTypes.objectOf(PropTypes.object),
  isUserSocialLink: PropTypes.bool,
};
