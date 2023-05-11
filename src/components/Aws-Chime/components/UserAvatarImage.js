import React, { memo, useCallback } from 'react';
import cx from 'classnames';
import { connect } from 'react-redux';
import VideoNameplate from './VideoNameplate';
import AEImage from '../../../Core/Image';
import { cloudinary_name, imgUrl as IMAGE_URL } from '../../../clientConfig';
import OverlayControls from './OverlayControls';
import useActiveSpeaker from '../hooks/useActiveSpeaker';
import { showAlert } from '../../../routes/event/action/portalAction';

const PulsEffect = memo(({ volume }) => (
  <div
    className={cx('pulse', {
      'pulse-75': volume > 75,
      'pulse-50': volume > 50,
      'pulse-25': volume > 25,
    })}
  />
));

const Pluse = () => {
  const activeSpeaker = useActiveSpeaker();
  const volume = activeSpeaker?.volume;
  return <PulsEffect volume={volume} />;
};

const UserAvatar = (props) => {
  const {
    viewMode,
    attendeeId,
    isContentShareEnabled,
    videoId,
    name,
    raisedHand,
    hideOverlayControl,
    activeSpeaker,
    numberOfVisibleIndices,
    profilePic,
    firstName,
    lastName,
  } = props;

  const showMessage = useCallback((text, isError = false) => {
    props.showAlert({ message: text, success: !isError });
  });

  const user = firstName && lastName ? { firstName, lastName } : { firstName: name, lastName: '' };

  return (
    <div className={cx('chimeUserAvatar', !hideOverlayControl && 'overlay-control', videoId)}>
      <div className={cx('userAvatarBox', { activeSpeaker })}>
        {numberOfVisibleIndices > 1 && <OverlayControls attendeeId={attendeeId} showMessage={showMessage} />}
        <AEImage
          dpr="auto"
          crop="crop"
          height="1080"
          width="1080"
          gravity="faces"
          sizes="23vw"
          cloudName={cloudinary_name}
          type="fetch"
          fetchFormat="auto"
          quality="auto"
          imageType="avatar"
          variant="large"
          secure
          user={user}
          responsive
          publicId={profilePic ? `${IMAGE_URL}${profilePic}` : ''}
          rootClassName="avatar"
        />
        {activeSpeaker && <Pluse />}
        <VideoNameplate
          viewMode={viewMode}
          size={props.size}
          isContentShareEnabled={isContentShareEnabled}
          attendeeId={attendeeId}
          name={name}
        />
        {raisedHand && (
          <div className="raisedHand">
            <span role="img" aria-label={'Raise Hand'}>
              ✋
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const mapDispatchToProps = { showAlert };
export default connect(null, mapDispatchToProps)(UserAvatar);
