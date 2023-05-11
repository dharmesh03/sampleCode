import React, { useContext, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import cx from 'classnames';
import { Transcript, TranscriptionStatus, TranscriptionStatusType, TranscriptItemType } from 'amazon-chime-sdk-js';
import { ResizeObserver } from 'resize-observer';
import { debounce } from 'throttle-debounce';
import getChimeContext from '../context/getChimeContext';
import { setChimeTranscription } from '../action/index';
import { selectorChimeTranscription } from '../action/selectorChime';

let resizeObserver;
function LiveTranscription(props) {
  const { transcription } = props;
  const { isHideTranscriptionContainer } = transcription || {};

  let transcriptContainerDiv = null;
  const liveTranscriptionDisplayables = [];
  let partialTranscriptDiv = null;
  const partialTranscriptResultTimeMap = new Map();
  const LANGUAGES_NO_WORD_SEPARATOR = new Set(['ja-JP', 'zh-CN']);
  const partialTranscriptResultMap = new Map();
  const chime = useContext(getChimeContext());
  const [enableLiveTranscription, setEnableLiveTranscription] = useState(false);

  const populatePartialTranscriptSegmentsFromResult = (segments, result) => {
    let startTimeMs = null;
    let content = '';
    let attendee = null;
    for (const item of result?.alternatives[0]?.items) {
      if (!startTimeMs) {
        content = item?.content;
        attendee = item?.attendee;
        startTimeMs = item.startTimeMs;
      } else if (item.type === TranscriptItemType.PUNCTUATION) {
        content += item.content;
        segments.push({
          content,
          attendee,
          startTimeMs,
          endTimeMs: item.endTimeMs,
        });
        content = '';
        startTimeMs = null;
        attendee = null;
      } else if (chime.noWordSeparatorForTranscription) {
        content += item.content;
      } else {
        content = `${content} ${item.content}`;
      }
    }

    // Reached end of the result but there is no closing punctuation
    if (startTimeMs) {
      segments.push({
        content,
        attendee,
        startTimeMs,
        endTimeMs: result.endTimeMs,
      });
    }
  };

  const appendNewSpeakerTranscriptDiv = (segment, speakerToTranscriptSpanMap) => {
    const speakerTranscriptDiv = document.createElement('div');
    const latterProfileDiv = document.createElement('div');

    latterProfileDiv?.classList?.add('latterProfilePic');
    speakerTranscriptDiv?.classList?.add('transcript');
    speakerTranscriptDiv?.classList?.add('m-l-15');
    const imgSpan = document.createElement('span');
    const initial = `${segment?.attendee?.externalUserId?.substring(
      0,
      segment?.attendee?.externalUserId?.indexOf('_'),
    )} `;
    imgSpan.innerText = `${initial.split(' ')[0][0]}${initial.split(' ')[1] && initial.split(' ')[1][0]}` || '';

    latterProfileDiv?.appendChild(imgSpan);
    const elem = document.getElementById('transcript-container');
    if (elem) {
      elem.scrollTop = elem.scrollHeight;
    }
    const speakerSpan = document.createElement('div');
    speakerSpan.classList.add('transcript-speaker');
    speakerSpan.innerText = initial;
    speakerTranscriptDiv?.appendChild(speakerSpan);

    const transcriptSpan = document.createElement('span');
    transcriptSpan?.classList?.add('transcript-content');
    transcriptSpan.innerText = segment?.content;
    speakerTranscriptDiv?.appendChild(transcriptSpan);

    const parentDiv = document.createElement('div');
    parentDiv?.classList.add('d-flex');
    parentDiv.appendChild(latterProfileDiv);
    parentDiv.appendChild(speakerTranscriptDiv);

    partialTranscriptDiv?.classList.add('m-b-10');
    partialTranscriptDiv?.classList.add('trans-width');
    partialTranscriptDiv?.appendChild(parentDiv);

    speakerToTranscriptSpanMap.set(segment?.attendee?.attendeeId, transcriptSpan);
  };

  const updatePartialTranscriptDiv = () => {
    partialTranscriptDiv.innerHTML = '';

    const partialTranscriptSegments = [];
    for (const result of partialTranscriptResultMap?.values()) {
      populatePartialTranscriptSegmentsFromResult(partialTranscriptSegments, result);
    }
    partialTranscriptSegments.sort((a, b) => a.startTimeMs - b.startTimeMs);

    const speakerToTranscriptSpanMap = new Map();
    for (const segment of partialTranscriptSegments) {
      const newSpeakerId = segment?.attendee?.attendeeId;
      if (!speakerToTranscriptSpanMap?.has(newSpeakerId)) {
        appendNewSpeakerTranscriptDiv(segment, speakerToTranscriptSpanMap);
      } else {
        const partialResultSpeakers = Array.from(speakerToTranscriptSpanMap.keys());
        if (partialResultSpeakers.indexOf(newSpeakerId) < partialResultSpeakers.length - 1) {
          // Not the latest speaker and we reach the end of a sentence, clear the speaker to Span mapping to break line
          speakerToTranscriptSpanMap.delete(newSpeakerId);
          appendNewSpeakerTranscriptDiv(segment, speakerToTranscriptSpanMap);
        } else {
          const transcriptSpan = speakerToTranscriptSpanMap.get(newSpeakerId);
          transcriptSpan.innerText = `${transcriptSpan.innerText}\u00a0${segment.content}`;
        }
      }
    }
  };

  const renderPartialTranscriptResults = () => {
    if (partialTranscriptDiv) {
      // Keep updating existing partial result div
      updatePartialTranscriptDiv();
    } else {
      // All previous results were finalized. Create a new div for new results, update, then add it to DOM
      partialTranscriptDiv = document.createElement('div');
      updatePartialTranscriptDiv();
      transcriptContainerDiv?.appendChild(partialTranscriptDiv);
    }
  };

  const updateLiveTranscriptionDisplayState = () => {
    for (const elem of liveTranscriptionDisplayables) {
      elem?.classList?.toggle('live-transcription-active', chime.enableLiveTranscription);
    }
  };

  const transcriptEventHandler = (transcriptEvent) => {
    if (!chime.enableLiveTranscription) {
      // Toggle disabled 'Live Transcription' button to enabled when we receive any transcript event
      chime.enableLiveTranscription = true;
      props.setChimeTranscription({ enableLiveTranscription: true, isHideTranscriptionContainer: true });
      setEnableLiveTranscription(true);
      updateLiveTranscriptionDisplayState();

      // Transcripts view and the button to show and hide it are initially hidden
      // Show them when when live transcription gets enabled, and do not hide afterwards
      // this.setButtonVisibility('button-live-transcription', true, 'on');
      transcriptContainerDiv.style.display = 'block';
    }
    try {
      if (transcriptEvent instanceof TranscriptionStatus) {
        if (transcriptEvent?.type === TranscriptionStatusType.STARTED) {
          // Determine word separator based on language code
          let languageCode = null;
          const transcriptionConfiguration = JSON.parse(transcriptEvent?.transcriptionConfiguration);
          if (transcriptionConfiguration) {
            if (transcriptionConfiguration?.EngineTranscribeSettings) {
              languageCode = transcriptionConfiguration?.EngineTranscribeSettings?.LanguageCode;
            } else if (transcriptionConfiguration?.EngineTranscribeMedicalSettings) {
              languageCode = transcriptionConfiguration?.EngineTranscribeMedicalSettings?.languageCode;
            }
          }
          if (languageCode && LANGUAGES_NO_WORD_SEPARATOR?.has(languageCode)) {
            chime.noWordSeparatorForTranscription = true;
          }
          props.setChimeTranscription({ transcriptionLang: languageCode });
        } else if (transcriptEvent?.type === TranscriptionStatusType.STOPPED && chime.enableLiveTranscription) {
          // When we receive a STOPPED status event:
          // 1. toggle enabled 'Live Transcription' button to disabled
          chime.enableLiveTranscription = false;
          props.setChimeTranscription({ enableLiveTranscription: false, isHideTranscriptionContainer: true });
          setEnableLiveTranscription(false);
          chime.noWordSeparatorForTranscription = false;
          updateLiveTranscriptionDisplayState();

          // 2. force finalize all partial results
          partialTranscriptResultTimeMap?.clear();
          partialTranscriptDiv = null;
          partialTranscriptResultMap?.clear();
        }
      } else if (transcriptEvent instanceof Transcript) {
        for (const result of transcriptEvent?.results) {
          const resultId = result?.resultId;
          const isPartial = result?.isPartial;

          partialTranscriptResultMap.set(resultId, result);
          partialTranscriptResultTimeMap.set(resultId, result?.endTimeMs);
          renderPartialTranscriptResults();
          if (isPartial) {
            // eslint-disable-next-line no-continue
            continue;
          }

          // Force finalizing partial results that's 5 seconds older than the latest one,
          // to prevent local partial results from indefinitely growing
          for (const [olderResultId, endTimeMs] of partialTranscriptResultTimeMap) {
            if (olderResultId === resultId) {
              break;
            } else if (endTimeMs < result?.endTimeMs - 5000) {
              partialTranscriptResultTimeMap.delete(olderResultId);
            }
          }

          partialTranscriptResultTimeMap.delete(resultId);

          if (partialTranscriptResultTimeMap.size === 0) {
            // No more partial results in current batch, reset current batch
            partialTranscriptDiv = null;
            partialTranscriptResultMap.clear();
          }
        }
      }

      transcriptContainerDiv.scrollTop = transcriptContainerDiv.scrollHeight;
    } catch (error) {
      console.log('Error while LiveTranscription', error);
    }
  };

  const transcriptionDivResize = () => {
    const centerBlock = document.querySelector('#transcript-container');
    if (centerBlock) {
      centerBlock.style.overflow = 'scroll';
      centerBlock.scrollTo(0, document.querySelector('#transcript-container').scrollHeight);
      centerBlock.style.overflow = 'hidden';
    }
  };

  useEffect(() => {
    const centerBlock = document.querySelector('#transcript-container');
    window.addEventListener('resize', transcriptionDivResize());
    const handleResize = debounce(0, () => {
      transcriptionDivResize();
    });
    resizeObserver = new ResizeObserver(handleResize);
    if (centerBlock) resizeObserver.observe(centerBlock);
    return () => {
      const centerBlock = document.querySelector('#transcript-container');
      if (resizeObserver && centerBlock) resizeObserver.unobserve(centerBlock);
    };
  }, []);

  useEffect(() => {
    if (!enableLiveTranscription) {
      transcriptContainerDiv = document.getElementById('transcript-container');
      chime?.audioVideo?.transcriptionController?.subscribeToTranscriptEvent(transcriptEventHandler);
    }
    return async () => {
      chime?.audioVideo?.transcriptionController?.unsubscribeFromTranscriptEvent(transcriptEventHandler);
    };
  }, [chime?.audioVideo]);

  return (
    <div
      id="transcript-container"
      className={cx(
        'transcript-box transcript-container',
        (!enableLiveTranscription || isHideTranscriptionContainer) && 'd-none',
      )}
    />
  );
}
const mapDispatchToProps = {
  setChimeTranscription,
};
const mapStateToProps = (state) => ({
  transcription: selectorChimeTranscription(state),
});

export default connect(mapStateToProps, mapDispatchToProps)(LiveTranscription);
