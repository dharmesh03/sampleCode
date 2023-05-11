import React from 'react';
import { useTranslation } from 'react-i18next';
import AEButton from '../../../Core/Button/Button';

export default function Error(props) {
  const { errorMessage, btnText } = props;
  const { t } = useTranslation(['common', 'toasterMsg']);
  return (
    <div className="chime-error">
      <div className="errorMessage">{errorMessage || t('toasterMsg:Something went wrong')}</div>
      {props.onLeave && (
        <AEButton
          className="m-t-10"
          onClick={() => {
            props.onLeave();
          }}
          id="leaveBtn"
          label={btnText || t('Leave')}
        />
      )}
    </div>
  );
}
