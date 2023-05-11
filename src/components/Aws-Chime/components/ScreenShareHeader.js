import React from 'react';
import { useTranslation } from 'react-i18next';
import { DefaultModality } from 'amazon-chime-sdk-js';
import useAttendees from '../hooks/useAttendees';
import AEIcons from '../../../Core/Icon';
import { useContentShareControls, useContentShareState } from '../providers/ContentShareProvider/index';

export default function ScreenShareHeader() {
  const { t } = useTranslation(['chime', 'common', 'meetingDetails']);
  const roster = useAttendees();
  const { toggleContentShare } = useContentShareControls();
  const { sharingAttendeeId, isLocalUserSharing } = useContentShareState();
  const modality = new DefaultModality(sharingAttendeeId);
  const { name } = roster[modality.base()] || {};
  return (
    <>
      {sharingAttendeeId && name ? (
        <div className="screenShareHeader">
          {isLocalUserSharing ? (
            <>
              <div className="screenShareMsg">
                <AEIcons viewBox="0 0 28 28" svgIcon="virtual-icon-bar-share-screen" />
                {t("meetingDetails:You're presenting to everyone")}
              </div>
              <div className="btnStopShare" onClick={toggleContentShare}>
                {t('meetingDetails:Stop presenting')}
              </div>
            </>
          ) : (
            <div className="screenShareMsg">
              <AEIcons viewBox="0 0 28 28" svgIcon="virtual-icon-bar-share-screen" />
              {`${name} ${t('meetingDetails:is presenting to everyone')}`}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
