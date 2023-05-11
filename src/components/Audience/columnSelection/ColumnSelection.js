import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sortable from 'react-sortablejs';
import size from 'lodash/size';
import cx from 'classnames';
import uuid from 'uuid';
import AELabel from '../../../Core/Label/label';
import AESearchBox from '../../../Core/SearchBox/Search';
import AECheckBox from '../../../Core/Checkbox/Checkbox';
import CustomScrollbar from '../../../Core/CustomScrollbar';
import AEPopup from '../../../Core/Popup';
import AEButton from '../../../Core/Button/Button';
import AEIcon from '../../../Core/Icon';
import './_column_selection.scss';

const ColumnSelection = ({ openPopup, columnMasterJson, savedSelectedColumn, ...props }) => {
  const { t } = useTranslation(['toasterMsg', 'common']);
  const [selectedColumn, setSelectedColumn] = useState([]);
  const [columns, setColumns] = useState([]);
  const [searchedColumns, setSearchedColumns] = useState([]);
  const [searchString, setSearchString] = useState('');
  const [isUpdated, setIsUpdated] = useState(false);

  // starting initialization
  useEffect(() => {
    const { customiseColumns, defaultColumns } = columnMasterJson;
    const customiseList = {
      label: 'Other',
      column: customiseColumns.map((column) => ({ ...column, id: uuid(), checked: false })),
    };
    const defaultList = {
      label: 'Primary',
      column: defaultColumns.map((column) => ({ ...column, id: uuid() + Math.random(), checked: false })),
    };
    let selectedColumnData = [];
    let columnData = [];

    if (!savedSelectedColumn?.id) {
      defaultList.column.forEach((column) => (column.checked = true));
      selectedColumnData = [...defaultList.column];
      columnData = [{ ...defaultList }, { ...customiseList }];
    } else {
      const columnSelection = savedSelectedColumn?.columnSelection;
      columnData = [{ ...defaultList }, { ...customiseList }];
      if (columnSelection) {
        columnSelection.forEach((savedColumn) => {
          columnData.forEach((column) => {
            column.column.forEach((column) => {
              if (column.key === savedColumn.key && column.type === savedColumn.type) {
                column.checked = true;
                selectedColumnData.push({ ...column });
              }
            });
          });
        });
      }
    }
    setSelectedColumn(selectedColumnData);
    setColumns(columnData);
  }, [columnMasterJson, savedSelectedColumn]);

  const handleClickOnCheckBox = (checkBoxValue, columnForHandle) => {
    // manage selected column
    if (checkBoxValue) {
      const updatedSelectedColumn = selectedColumn.filter((column) => column.id !== columnForHandle.id);
      setSelectedColumn(updatedSelectedColumn);
    } else {
      selectedColumn.push(columnForHandle);
      setSelectedColumn([...selectedColumn]);
    }

    // update column data
    columns.forEach((obj) => {
      obj.column.forEach((column) => {
        if (column.id === columnForHandle.id) {
          column.checked = !checkBoxValue;
        }
      });
    });

    // case: when searchString applied
    if (searchString && size(searchedColumns)) {
      searchedColumns.forEach((obj) => {
        obj.column.forEach((column) => {
          if (column.id === columnForHandle.id) {
            column.checked = !checkBoxValue;
          }
        });
      });
    }

    // update state
    setColumns([...columns]);
    setIsUpdated(true);
  };

  const handleClickOnMoveToTop = (index) => {
    if (size(selectedColumn)) {
      selectedColumn.unshift(selectedColumn.splice(index, 1)[0]);
      setSelectedColumn([...selectedColumn]);
      setIsUpdated(true);
    }
  };

  const handleClickOnCrossForRemove = (index, id) => {
    // remove from selected column
    selectedColumn.splice(index, 1);

    // update column data
    columns.forEach((obj) =>
      obj.column.forEach((column) => {
        if (column.id === id) {
          column.checked = false;
        }
      }),
    );

    // case: when searchString applied
    if (searchString && size(searchedColumns)) {
      searchedColumns.forEach((obj) =>
        obj.column.forEach((column) => {
          if (column.id === id) {
            column.checked = false;
          }
        }),
      );
    }

    setColumns([...columns]);
    setSelectedColumn([...selectedColumn]);
    setIsUpdated(true);
  };

  // drag & drop callback
  const handleOnListChange = (order, sortable, event) => {
    const { oldIndex, newIndex } = event || {};
    if (!isNaN(oldIndex) && !isNaN(newIndex)) {
      const object = selectedColumn.splice(oldIndex, 1)[0];
      selectedColumn.splice(newIndex, 0, object);
    }
    setSelectedColumn([...selectedColumn]);
    setIsUpdated(true);
  };

  const handleChangeOnSearch = (value) => {
    const searchString = value?.trim() || '';
    setSearchString(searchString);
    const searchedArray = [];
    if (searchString) {
      // creating deep copy of object
      JSON.parse(JSON.stringify(columns)).forEach((obj) => {
        const list = obj.column.filter((col) => col?.label?.toLowerCase().includes(searchString.toLowerCase()));
        if (size(list)) {
          obj.column = list;
          searchedArray.push(obj);
        }
      });
    }
    setSearchedColumns(searchedArray);
  };

  const handleClickOnCancel = () => {
    props.handleOnClose();
  };

  const handleClickOnApply = () => {
    const columnList = selectedColumn.map((column, index) => ({ key: column.key, type: column.type, order: index }));
    if (savedSelectedColumn?.id) {
      // if state updated then call put API
      if (isUpdated) {
        savedSelectedColumn.columnSelection = columnList;
        if (typeof props.handleClickOnApplyForUpdate === 'function') {
          props.handleClickOnApplyForUpdate(savedSelectedColumn);
        }
      } else {
        props.handleOnClose();
      }
    } else {
      // Create API call
      typeof props.handleClickOnApplyForCreate === 'function' && props.handleClickOnApplyForCreate(columnList);
    }
  };

  const handleClickOnResetColumn = () => {
    const selectedColumnList = [];
    // show primary column selected in column data
    columns.forEach((obj) => {
      if (obj.label === 'Primary') {
        obj.column.forEach((column) => {
          column.checked = true;
          selectedColumnList.push({ ...column }); // also create selected column array
        });
      } else {
        obj.column.forEach((column) => {
          column.checked = false;
        });
      }
    });
    setSelectedColumn(selectedColumnList);
    setColumns(columns);
    setIsUpdated(true);
  };

  /* Popup Footer */
  const renderFooter = () => (
    <div className="d-flex">
      <AEButton
        id="reset-columns"
        label={t('common:Reset Columns')}
        className="custom mr-auto"
        onClick={handleClickOnResetColumn}
        size="medium"
      />
      <AEButton
        id="cancel"
        size="medium"
        label={t('common:Cancel')}
        variant="secondary"
        className="custom-btn-size"
        onClick={handleClickOnCancel}
      />
      <AEButton
        id="apply"
        size="medium"
        label={t('common:Apply')}
        className="ml-3 custom-btn-size"
        onClick={handleClickOnApply}
      />
    </div>
  );

  const showRecordsNotFound = searchString && !size(searchedColumns);

  const data = searchString && size(searchedColumns) ? searchedColumns : columns;

  return (
    <AEPopup
      id="audience-column-selection"
      showModal={openPopup}
      headerText={
        <AELabel className="mb-3" header={t('common:Customize table columns')} variant="heading3" color="#1E2137" />
      }
      onCloseFunc={props.handleOnClose}
      custClassName={'audience-column-selection-popup'}
      type="style2"
      modelFooter={renderFooter()}
    >
      <div className="row body-container">
        <div className="col-md-6 col-lg-6 col-sm-6 col-xs-6 column-options-list">
          <AELabel header={t('common:Columns List')} variant="subtitle" color="#1E2137" />
          <AESearchBox
            id="search-column"
            placeholder={t('common:Search for properties')}
            className="m-b-16"
            defaultValue=""
            onChange={handleChangeOnSearch}
            showClearIcon
          />
          <div style={{ position: 'relative' }}>
            <CustomScrollbar
              id="column-selection-scrollable"
              trackTop="0px"
              trackBottom="0px"
              style={{
                height: 'calc(100vh - 400px)',
              }}
            >
              {!showRecordsNotFound ? (
                data?.map((object, i1) => (
                  <>
                    <AELabel
                      key={i1}
                      header={t(`common:${object.label}`)}
                      variant="custom-captions"
                      color="#4B4D5F"
                      className="m-b-12"
                    />
                    {object.column.map((column) => (
                      <AECheckBox
                        id={`${column.key}-${column.type}-checkbox`}
                        key={column.id}
                        message={column.label}
                        variant="caption2"
                        checked={column.checked}
                        onClick={() => handleClickOnCheckBox(column.checked, column)}
                        className="m-b-16"
                      />
                    ))}
                  </>
                ))
              ) : (
                <AELabel header={t("common:This property doesn't exit")} variant="body2" color="#6D6F7D" />
              )}
            </CustomScrollbar>
          </div>
        </div>

        <div className="col-md-6 col-lg-6 col-sm-6 col-xs-6 selected-column-list">
          <div className="d-flex m-b-16">
            <AELabel header={t('common:Selected Columns')} variant="subtitle" color="#1E2137" />
            <AELabel header={`(${size(selectedColumn)})`} variant="body1" color="#6D6F7D" className="ml-1" />
          </div>
          <div style={{ position: 'relative' }}>
            <CustomScrollbar
              id="column-selection-scrollable"
              trackTop="0px"
              trackBottom="0px"
              style={{
                height: 'calc(100vh - 350px)',
              }}
            >
              {size(selectedColumn) ? (
                <Sortable
                  key={Math.random()}
                  options={{
                    handle: '.dragHandle',
                  }}
                  tag="div"
                  onChange={(order, sortable, event) => handleOnListChange(order, sortable, event)}
                >
                  {selectedColumn?.map((column, index) => (
                    <div className="selected-column-container" key={column.key} data-reactid={column.key}>
                      <AEIcon
                        svgIcon="sortable-icon"
                        className="cursor dragHandle"
                        id={`${column.key}_${column.type}_sortable`}
                        key={column.key}
                      />
                      <AELabel
                        key={column.key}
                        header={column.label}
                        variant="body2"
                        color="#4B4D5F"
                        labelClass="mb-0"
                      />
                      {index !== 0 && (
                        <AEButton
                          label={t('commmon:Move to top')}
                          variant="captions1"
                          className="custom"
                          onClick={() => handleClickOnMoveToTop(index)}
                        />
                      )}
                      <AEIcon
                        type="ac-icon-close"
                        className={cx('cursor', { 'ml-auto': index === 0 })}
                        size="small"
                        onClick={() => handleClickOnCrossForRemove(index, column.id)}
                      />
                    </div>
                  ))}
                </Sortable>
              ) : (
                <AELabel header={t('common:No columns selected')} variant="body2" color="#6D6F7D" />
              )}
            </CustomScrollbar>
          </div>
        </div>
      </div>
    </AEPopup>
  );
};

export default ColumnSelection;
