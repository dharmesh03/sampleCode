import React, { useContext, useState } from 'react';
import { connect } from 'react-redux';
import map from 'lodash/map';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import getChimeContext from '../context/getChimeContext';
import AEButton from '../../../Core/Button/Button';
import WithParams from '../../WrapperComponents/WithParams';
import { startLiveTranscription, stopLiveTranscription } from '../../../routes/event/portal/Workshop/action';
import { getEventData } from '../../../routes/event/action/selector';
import AERadioButton from '../../../Core/RadioButton/RadioButton';
import { selectorChimeTranscription } from '../action/selectorChime';
import CustomScrollbar from '../../../Core/CustomScrollbar';

function LiveTranscriptionModal(props) {
  const { showMessage, eventData, setShowTranscriptionPopup, transcription } = props;
  const { transcriptionLang } = transcription || {};
  const { eventUrl, eventURL } = eventData || {};
  const chime = useContext(getChimeContext());
  const [selectedLanguage, setSelectedLanguage] = useState(transcriptionLang || 'en-US');
  const { t } = useTranslation(['breakoutRoom', 'common', 'chime']);
  const languageOptions = [
    {
      id: 1,
      name: 'US English (en-US)',
      value: 'en-US',
    },
    {
      id: 2,
      name: 'British English (en-GB)',
      value: 'en-GB',
    },
    {
      id: 3,
      name: 'Australian English (en-AU)',
      value: 'en-AU',
    },
    {
      id: 4,
      name: 'US Spanish (es-US)',
      value: 'es-US',
    },
    {
      id: 5,
      name: 'Canadian French (fr-CA)',
      value: 'fr-CA',
    },
    {
      id: 6,
      name: 'French (fr-FR)',
      value: 'fr-FR',
    },
    {
      id: 7,
      name: 'Italian (it-IT)',
      value: 'it-IT',
    },
    {
      id: 8,
      name: 'German (de-DE)',
      value: 'de-DE',
    },
    {
      id: 9,
      name: 'Brazilian Portuguese (pt-BR)',
      value: 'pt-BR',
    },
    {
      id: 10,
      name: 'Japanese (ja-JP)',
      value: 'ja-JP',
    },
    {
      id: 11,
      name: 'Korean (ko-KR)',
      value: 'ko-KR',
    },
    {
      id: 12,
      name: 'Mandarin Chinese - Mainland (zh-CN)',
      value: 'zh-CN',
    },
  ];

  const startLiveTranscription = () => {
    if (!selectedLanguage) {
      showMessage('Please select live transcription language', true);
      return;
    }
    if ((eventUrl || eventURL) && chime.meetingId) {
      props
        .startLiveTranscription(eventUrl || eventURL, chime.meetingId, selectedLanguage)
        .then((res) => {
          if (res && !res.message && !res.errorMessage) {
            showMessage(t('toasterMsg:Live transcription started'));
            setShowTranscriptionPopup(false);
          } else {
            showMessage(t('common:Something went wrong.'), true);
            setShowTranscriptionPopup(false);
          }
        })
        .catch(() => {
          showMessage(t('common:Something went wrong.'), true);
          setShowTranscriptionPopup(false);
        });
    }
  };

  const stopLiveTranscription = () => {
    if ((eventUrl || eventURL) && chime.meetingId) {
      setSelectedLanguage('stop');
      props
        .stopLiveTranscription(eventUrl || eventURL, chime.meetingId, selectedLanguage)
        .then((res) => {
          if (res && !res.message && !res.errorMessage) {
            showMessage(t('toasterMsg:Live transcription stopped'));
            setShowTranscriptionPopup(false);
          } else {
            showMessage(t('common:Something went wrong.'), true);
            setShowTranscriptionPopup(false);
          }
        })
        .catch(() => {
          showMessage(t('common:Something went wrong.'), true);
          setShowTranscriptionPopup(false);
        });
    }
  };

  const handleLanguageJson = () => {
    const data = map(languageOptions, (language) => ({
      key: language.id,
      value: language.value,
      label: `${language.name}`,
    }));
    return data;
  };

  const handleLanguageChange = (event) => {
    const languageCode = event || '';
    setSelectedLanguage(languageCode);
  };

  return (
    <div className="">
      <div>
        <hr className="m-t-0 m-b-10" />
        <CustomScrollbar maxHeight="250px" trackTop="0" trackBottom="76px">
          <div
            className={cx('transcription-language', selectedLanguage === 'stop' && 'transcription-language-selected')}
          >
            <AERadioButton
              value={'stop'}
              name="createOption"
              id={`langOption`}
              onChange={() => setSelectedLanguage('stop')}
              radioClass="m-t-3"
              checked={selectedLanguage === 'stop'}
            />
            <span>{t('common:Off (disable)')}</span>
          </div>
          {handleLanguageJson().map((lang, i) => (
            <div
              className={cx(
                'transcription-language',
                selectedLanguage === lang.value && 'transcription-language-selected',
              )}
            >
              <AERadioButton
                value={lang.value}
                name="createOption"
                id={`langOption${i}`}
                onChange={() => handleLanguageChange(lang.value)}
                radioClass="m-t-3"
                checked={selectedLanguage === lang.value}
              />
              <span>{lang.label}</span>
            </div>
          ))}
        </CustomScrollbar>
      </div>
      <div>
        <div className="m-t-15">
          <div className="text-right">
            <AEButton
              variant="secondary"
              className="m-r-5"
              id="CancelTranscription"
              onClick={() => {
                setShowTranscriptionPopup(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowTranscriptionPopup(false);
                }
              }}
            >
              {t('common:Cancel')}
            </AEButton>
            <AEButton
              onClick={() => {
                if (selectedLanguage === 'stop') {
                  stopLiveTranscription();
                } else {
                  startLiveTranscription();
                }
              }}
              id="StartTranscription"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  startLiveTranscription();
                }
              }}
            >
              {t('common:Apply')}
            </AEButton>
          </div>
        </div>
      </div>
    </div>
  );
}
const mapDispatchToProps = {
  startLiveTranscription,
  stopLiveTranscription,
};
const mapStateToProps = (state) => ({
  eventData: getEventData(state),
  transcription: selectorChimeTranscription(state),
});

export default connect(mapStateToProps, mapDispatchToProps)(WithParams(LiveTranscriptionModal));
