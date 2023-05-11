import cx from 'classnames';
import React from 'react';
import AETooltip from '../../../Core/Tooltip';
import { ViewMode, Size } from '../enums/MeetingConstant';
import useAttendee from '../hooks/useAttendee';
import AEIcons from '../../../Core/Icon/index';
import VolumnCircle from './VolumnCircle';

export default function VideoNameplate(props) {
  const { viewMode, size, attendeeId, isContentShareEnabled } = props;
  if (!attendeeId) {
    return <></>;
  }
  // eslint-disable-next-line
  const attendee = useAttendee(attendeeId);
  const name = props.name || attendee.name;
  if (!name || typeof !attendee.muted !== 'boolean') {
    return <></>;
  }

  const { muted, active, volume, isPin } = attendee;

  // const printInitials = (name) => {
  //   if (name) {
  //     const nameParts = name.split(' ');
  //     const firstName = nameParts[0];
  //     let lastName = nameParts[1];
  //     lastName = lastName && lastName.charAt(0);
  //     return `${firstName.charAt(0)}${lastName}`;
  //   }
  //   return '';
  // };

  return (
    <>
      <div className="voice-icon-box">
        {muted ? (
          <div className="muted">
            <AEIcons
              svgIcon="virtual-icon-nameplate-mute"
              viewBox="0 0 24 24"
              size="small"
              dataPrefix="fas"
              dataIcon="microphone-slash"
              id="nameplateMute"
            />
          </div>
        ) : active ? (
          <VolumnCircle volume={volume} />
        ) : null}
      </div>
      <div
        className={cx('videoNameplate mobile-videoNamePlate', {
          roomMode: viewMode === ViewMode.Room,
          screenShareMode: viewMode === ViewMode.ScreenShare,
          small: size === Size.Small,
          medium: size === Size.Medium,
          large: size === Size.Large,
          isContentShareEnabled,
        })}
      >
        {isPin ? (
          <AEIcons
            className="m-r-5 pin-icon"
            svgIcon={'virtual-icon-pin'}
            viewBox="0 0 28 28"
            dataPrefix="fas"
            dataIcon="pin"
            size="small"
          />
        ) : null}
        <div className="name">
          <AETooltip tooltip={name} tooltipProps={{ id: 'name' }} overlayProps={{ placement: 'top' }}>
            <span>{name}</span>
          </AETooltip>
        </div>
      </div>
    </>
  );
}
