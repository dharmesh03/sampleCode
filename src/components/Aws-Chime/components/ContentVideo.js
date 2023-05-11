import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import React, { useContext, useEffect, useRef } from 'react';
import { DefaultModality } from 'amazon-chime-sdk-js';
import getChimeContext from '../context/getChimeContext';
import AESpinner from '../../../Core/Spinner/Spinner';
import AELabel from '../../../Core/Label/label';
import { useContentShareState } from '../providers/ContentShareProvider/index';
import AETooltip from '../../../Core/Tooltip/index';

export default function ContentVideo() {
  const videoEl = useRef(null);
  const { t } = useTranslation(['chime']);
  const chime = useContext(getChimeContext());
  const { tileId, paused, isLocalUserSharing, sharingAttendeeId } = useContentShareState();
  const modality = new DefaultModality(sharingAttendeeId);
  const { name } = chime?.roster[modality.base()] || {};
  const audioVideo = chime?.audioVideo;

  useEffect(() => {
    if (!audioVideo || !videoEl?.current || !tileId || isLocalUserSharing) {
      return () => {};
    }

    audioVideo.bindVideoElement(tileId, videoEl.current);

    return () => {
      const tile = audioVideo.getVideoTile(tileId);
      if (tile) {
        audioVideo.unbindVideoElement(tileId);
      }
    };
  }, [audioVideo, tileId, isLocalUserSharing]);

  return (
    <div className="contentVideo">
      {!isLocalUserSharing && paused && (
        <div className="text-center content-share-msg">
          <AESpinner type="SpinnerSmall" />
          <AETooltip
            tooltip={`${name} ${t('meetingDetails:is presenting')}`}
            overlayProps={{ target: '_blank', placement: 'top' }}
          >
            <AELabel
              header={`${name} ${t('meetingDetails:is presenting')}`}
              variant={'subtitle'}
              labelClass="font-mob-24"
              color="#fff"
              className="justify-content-center"
            />
          </AETooltip>
        </div>
      )}
      {/* Remote screen share are binded with this video element */}
      <video ref={videoEl} className={cx('video', { hide: isLocalUserSharing })} />
      {/* Local screen share are binded with this video element */}
      <video id="content-video-element-id" className={cx('video', { hide: !isLocalUserSharing })} />
    </div>
  );
}
