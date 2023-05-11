import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import Loader from '../../Loader';

const AUTOHIDE_INTERVAL = 8000;

const MeetingWarnings = (props) => {
  const { message, autoHide = true, type, loading, onClose = () => {} } = props;
  const [showAlert, setShowAlert] = useState(!!message);
  const [alert, setAlert] = useState(message);
  const { t } = useTranslation('chime');

  useEffect(() => {
    let timer;
    if (message && autoHide) {
      timer && clearTimeout(timer);
      timer = setTimeout(() => {
        setShowAlert(false);
        setAlert('');
        onClose();
      }, AUTOHIDE_INTERVAL);
    }
    setAlert(message);
    setShowAlert(!!message);
    return () => {
      timer && clearTimeout(timer);
    };
  }, [message]);

  const onCloseHandler = () => {
    setShowAlert(false);
    setAlert('');
    onClose();
  };

  return showAlert ? (
    <div className={cx('chime-meeting-warnings', type)}>
      <div>
        {loading ? <Loader inline small /> : null}
        <span className={cx({ 'ml-4': loading })}>{t(alert)}</span>
      </div>
      <i className={cx('p-r-5 ac-icon-close ml-4')} onClick={onCloseHandler} />
    </div>
  ) : null;
};

export default MeetingWarnings;
