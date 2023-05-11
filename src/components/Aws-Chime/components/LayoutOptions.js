import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import AERadioButton from '../../../Core/RadioButton/RadioButton';
import AEIcons from '../../../Core/Icon/index';
import AETooltip from '../../../Core/Tooltip';
import AELabel from '../../../Core/Label/label';
import { ViewMode } from '../enums/MeetingConstant';
import getChimeContext from '../context/getChimeContext';

function VolumnCircle(props) {
  const { t } = useTranslation('controller');
  const chime = useContext(getChimeContext());
  const { viewMode, onLayoutChange } = props;
  const [tilesCount, setTilesCount] = useState(chime.maxVideoTilesCount);

  const value = ((tilesCount - 1) / (25 - 1)) * 100;
  const tileSlider = document.getElementById('tile-slider');
  if (tileSlider) {
    tileSlider.style.background = `linear-gradient(to right, #4068e8 0%, #4068e8 ${value}%, #fff ${value}%, white 100%)`;
  }

  const onChangeLayout = (e) => {
    e.persist();
    const { value } = e.target;
    onLayoutChange(value);
  };

  const renderVideoTiles = (valueCount) => {
    if (valueCount > 0) {
      chime.setMaxVideoTilesCount(parseFloat(valueCount));
      setTilesCount(parseFloat(valueCount));
    }
  };

  return (
    <div className="layout-options">
      <div>
        <hr className="m-t-0 m-b-10" />
        <div>
          <div className="p-b-10">
            <div className="options d-flex">
              <div className="option-title">
                <AERadioButton
                  radioClass={'m-t-2'}
                  value={'Room'}
                  name="layoutOption"
                  id="layoutOption1"
                  onChange={(e) => onChangeLayout(e)}
                  label={t('Tiled')}
                  checked={ViewMode.Room === viewMode}
                />
              </div>
              <div className="">
                <AEIcons
                  className=" m-t-10"
                  width="144"
                  height="84"
                  size="exlarge"
                  svgIcon="virtual-icon-tiled-layout"
                  viewBox="0 0 144 84"
                />
              </div>
            </div>
            <div className="options d-flex m-t-10">
              <div className="option-title">
                <AERadioButton
                  radioClass={'m-t-2'}
                  value={'Featured'}
                  name="layoutOption"
                  id="layoutOption2"
                  checked={ViewMode.Featured === viewMode}
                  onChange={(e) => onChangeLayout(e)}
                  label={t('Sidebar')}
                />
              </div>
              <div className="">
                <AEIcons
                  className=" m-t-10"
                  width="144"
                  height="84"
                  size="exlarge"
                  svgIcon="virtual-icon-sidebar-layout"
                  viewBox="0 0 144 84"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="d-inline-flex">
          <div className="options">
            <AELabel header={t('Tiles')} htmlFor="speaker" id="speaker_label" variant={'captions'} />
            <span className="help-text">{t('Maximum tiles to display')}</span>
            <div className="d-flex">
              <div className="col-md-2 p-0">
                <AEIcons
                  className=" m-t-10"
                  width="130"
                  height="84"
                  size="medium"
                  svgIcon="virtual-icon-spotlight-layout"
                  viewBox="0 0 144 84"
                />
              </div>
              <div className="col-md-8 m-auto">
                <AETooltip tooltip={tilesCount} overlayProps={{ placement: 'top' }}>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={tilesCount}
                    step="1"
                    className="tile-slider"
                    id="tile-slider"
                    onChange={(event) => renderVideoTiles(event.target.value)}
                  />
                </AETooltip>
              </div>
              <div className="col-md-2 p-0">
                <AEIcons
                  className=" m-t-10"
                  width="130"
                  height="84"
                  size="medium"
                  svgIcon="virtual-icon-tiled-layout"
                  viewBox="0 0 144 84"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VolumnCircle;
