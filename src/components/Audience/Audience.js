import React from 'react';
import { Col, Row } from 'react-bootstrap';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { connect } from 'react-redux';
import get from 'lodash/get';
import size from 'lodash/size';
import { withTranslation } from 'react-i18next';
import loadable from '@loadable/component';
import cx from 'classnames';
import WithParams from '../WrapperComponents/WithParams';
import {
  getAudienceFilterMasterJson,
  createFilter,
  getAudienceAllFilter,
  getAudienceByFilter,
  updateFilter,
  deleteFilter,
  getAudienceDownloadByFilterId,
  getAudienceDownloadByFilterIdAndWhiteLabelURL,
  getAudienceAllFilterByWhiteLabelURL,
  getAudienceByFilterAndWhiteLabelURL,
  getColumnMasterJson,
  getAudienceSelectedColumnByOrganizerAndFilterId,
  getAudienceSelectedColumnByWhitelabelAndFilterId,
  createColumnSelectionByWhitelabel,
  createColumnSelectionByOrganizer,
  updateColumnSelectionById,
  columnMasterJsonSource,
  storeAudienceColumnMasterJson,
} from './action';
import { doGetEventPlanConfig } from '../Sessions/actions/index';
import SegmentForm from './segmentForm/SegmentForm';
import './_audience.scss';

const AudienceAnalysisSidebar = loadable(() => import('./AudienceAnalysisSidebar'));
const AESpinner = loadable(() => import('../../Core/Spinner/Spinner'));
const AEButton = loadable(() => import('../../Core/Button/Button'));
const PopupModel = loadable(() => import('../PopupModal'));
const AESearchbox = loadable(() => import('../../Core/SearchBox/Search'));
const Alerts = loadable(() => import('../Widget/Alerts'));
const AESelect = loadable(() => import('../../Core/Select/Select'));
const AEInputField = loadable(() => import('../../Core/Input'));
const AELabel = loadable(() => import('../../Core/Label/label'));
const AEIcon = loadable(() => import('../../Core/Icon'));
const AETooltip = loadable(() => import('../../Core/Tooltip'));
const LabelTooltip = loadable(() => import('../LabelWithTooltip/LabelTooltip'));
const ColumnSelection = loadable(() => import('./columnSelection/ColumnSelection'));

let dataTimeout;
class Audience extends React.Component {
  defaultErrorMessage = 'Something went wrong!';

  defaultPageAndSize = { page: 1, sizePerPage: 10 };

  sourceConst = {
    organizer: 'ORGANIZER',
    whiteLabel: 'WHITELABEL',
  };

  isFilterListLoadedFirstTime = false;

  isEventNotExist = false;

  constructor(props) {
    super(props);
    this.state = {
      ...this.defaultPageAndSize,
      loadingAttendees: true,
      selectedAttendee: null,
      attendees: [],
      searchKey: '',
      openUpdatePlanPopup: false,
      chargebeePlanName: '',
      selectedSegment: { value: -1 },
      listOfSegment: [],
      showSegmentForm: false,
      isSegmentSaved: false,
      showNameInputField: false,
      segmentFilter: null,
      isNamePresent: false,
      totalSize: null,
      showMessage: '',
      isError: false,
      allFilter: [],
      isEditing: false,
      showLoadingForSegmentSaved: false,
      showPreFetchCountLoader: false,
      isValidSegmentName: true,
      isShowPopup: false,
      isPopupForDeleteSegment: false,
      popupHeaderText: '',
      popupErrorMessage: '',
      loadingForDeletingSegment: false,
      isDownloading: false,
      showLengthForName: false,
      loadingSegment: true,
      openColumnSelectionPopup: false,
      tableColumns: [],
    };
  }

  componentDidMount() {
    this.getAudienceAllFilter();
    this.getAudienceByFilterWithColumnSelection();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { eventDetails, isFromWhiteLabel } = this.props;
    const { eventDetails: updatedEventDetails } = nextProps;
    if (eventDetails !== updatedEventDetails && !isFromWhiteLabel) {
      this.doGetEventPlanConfig();
    }
  }

  doGetEventPlanConfig = () => {
    const { eventDetails, planConfiguration } = this.props || {};
    if (planConfiguration) {
      const { chargebeePlanName } = planConfiguration;
      this.setState({ chargebeePlanName });
    } else if (eventDetails) {
      this.props
        .doGetEventPlanConfig(eventDetails?.eventUrl)
        .then((resp) => {
          this.setState({
            chargebeePlanName: resp?.chargebeePlanName,
          });
        })
        .catch(() => {});
    }
  };

  renderLabelNameWithCount = (data) => {
    const { t } = this.props;
    return (
      <div className="d-flex align-items-center select-box-audience" id="aud_dropDown">
        <span className="mr-auto overflow-txt-ellipsis"> {t(`common:${data.name}`)}</span>
        <span className="ml-2"> {data.totalAudience}</span>
      </div>
    );
  };

  clearMessage = () => {
    setTimeout(() => this.setState({ showMessage: '', isError: false }), 2000);
  };

  getAudienceAllFilter = () => {
    const { organizer, t, isFromWhiteLabel, whiteLabel } = this.props;
    const { selectedSegment } = this.state;
    const { organizerPageURL } = organizer || {};
    const { whiteLabelUrl } = whiteLabel || {};
    if (!(organizerPageURL || whiteLabelUrl)) {
      this.setState({ loadingSegment: false });
      return;
    }
    this.setState({ loadingSegment: true });
    let apiCall;
    if (isFromWhiteLabel) {
      apiCall = this.props.getAudienceAllFilterByWhiteLabelURL(whiteLabelUrl);
    } else {
      apiCall = this.props.getAudienceAllFilter(organizerPageURL);
    }

    apiCall
      .then((resp) => {
        if (resp && !resp.errorMessage && !resp.message) {
          if (Array.isArray(resp)) {
            let everyoneSegment;
            const filteredSegment = resp.filter((segment) => {
              if (segment.id !== -1) {
                return true;
              }
              everyoneSegment = segment;
              return false;
            });
            let segmentGroup;
            if (filteredSegment && Array.isArray(filteredSegment)) {
              segmentGroup = filteredSegment.map((segment) => ({
                label: this.renderLabelNameWithCount(segment),
                value: segment.id,
                data: segment,
              }));
            }
            const options = [
              {
                label: this.renderLabelNameWithCount(everyoneSegment),
                value: everyoneSegment.id,
                data: everyoneSegment,
              },
              { label: t('common:SEGMENTS'), options: segmentGroup },
            ];
            let updatedSegment;
            if (selectedSegment && selectedSegment.value) {
              updatedSegment = segmentGroup.find((segment) => segment.value === selectedSegment.value);
            }
            this.setState(
              {
                listOfSegment: options,
                selectedSegment: updatedSegment || options[0],
                allFilter: resp,
                loadingSegment: false,
                ...(this.isFilterListLoadedFirstTime && { loadingAttendees: true }),
              },
              () => {
                if (this.isFilterListLoadedFirstTime) {
                  this.getAudienceByFilterWithColumnSelection();
                }
              },
            );
            this.isFilterListLoadedFirstTime = true;
          }
        } else {
          const errorMessage = resp?.errorMessage || resp?.error || this.defaultErrorMessage;
          this.setState(
            {
              isError: true,
              showMessage: errorMessage,
              loadingAttendees: false,
              loadingSegment: false,
            },
            this.clearMessage,
          );
          if (resp?.errorCode === '4040200') {
            this.isEventNotExist = true;
          }
        }
      })
      .catch(() => {
        this.setState(
          {
            loadingAttendees: false,
            loadingSegment: false,
            isError: true,
            showMessage: this.defaultErrorMessage,
          },
          this.clearMessage,
        );
      });
  };

  openSideBarTab = (data) => {
    const { chargebeePlanName } = this.state;
    if (
      (chargebeePlanName === 'Starter' || chargebeePlanName === 'Free' || chargebeePlanName === 'SingleEventUnit') &&
      !this.props.isFromWhiteLabel
    ) {
      this.setState({
        toggle: false,
        openUpdatePlanPopup: true,
        isShowPopup: true,
        popupHeaderText: 'Upgrade Required',
      });
      return;
    }
    if (data && data.userId) {
      this.setState({ toggle: true, selectedAttendee: data });
    }
  };

  closeUpdatePlanPopup = () => {
    this.setState({
      openUpdatePlanPopup: false,
      isShowPopup: false,
      isPopupForDeleteSegment: false,
      popupHeaderText: '',
      popupErrorMessage: '',
    });
  };

  updateToggle = (toggle) => {
    this.setState({ toggle, selectedAttendee: null });
  };

  handleChange = (searchKey) => {
    this.setState({ searchKey });
    if (dataTimeout) {
      clearTimeout(dataTimeout);
      dataTimeout = null;
    }
    dataTimeout = setTimeout(() => {
      this.getAudienceByFilter(true);
    }, 1000);
  };

  handleSelectOnSegment = (item) => {
    if (item.value !== this.state.selectedSegment?.value) {
      this.setState({ selectedSegment: item, ...this.defaultPageAndSize, loadingAttendees: true }, () =>
        this.getAudienceByFilterWithColumnSelection(),
      );
    }
  };

  handleShowPopupSegment = (isEditing = false) => {
    const { filterMasterJson, t } = this.props || {};
    if (!filterMasterJson) {
      this.props
        .getAudienceFilterMasterJson()
        .then((resp) => {
          if (!resp?.errorMessage && !resp?.error) {
            const filters = get(resp, 'filters');
            const operators = get(resp, 'operator');
            if (filters && operators) {
              this.setState({
                showSegmentForm: true,
                filterMasterJson: resp,
                isEditing,
              });
            } else {
              this.setState({ showMessage: t('audience:missing filter json!'), isError: true }, this.clearMessage);
            }
          } else {
            this.setState(
              { showMessage: resp?.errorMessage || resp?.error || t('audience:missing filter json!'), isError: true },
              this.clearMessage,
            );
          }
        })
        .catch(() => {
          this.setState({ showMessage: this.defaultErrorMessage, isError: true }, this.clearMessage);
        });
    } else {
      this.setState({ showSegmentForm: true, filterMasterJson, isEditing });
    }
    this.setState({ showNameInputField: false, segmentName: '', isValidSegmentName: true, isNamePresent: false });
  };

  handleClickOnSettingIconOfColumn = () => {
    const { columnMasterJson } = this.props || {};
    if (columnMasterJson) {
      this.setState({
        openColumnSelectionPopup: true,
      });
    } else {
      this.setState({ showMessage: this.defaultErrorMessage, isError: true }, this.clearMessage);
    }
  };

  handleOnChangeName = (value) => {
    this.setState({
      segmentName: value,
      isValidSegmentName: true,
      isNamePresent: false,
    });
  };

  isNameAlreadyTaken = (value) => {
    const { allFilter } = this.state;
    if (!value || !Array.isArray(allFilter)) {
      return false;
    }
    return allFilter.some((segment) => segment.name.toLowerCase() === value.toLowerCase());
  };

  handleClickOnSaveSegmentName = () => {
    const leadingAndTrailingWhiteSpaceRegex = /^\S$|^\S[\s\S]*\S$/;
    const { segmentName, segmentFilter } = this.state;
    const { loggedInUser, organizer, t, isFromWhiteLabel, whiteLabel } = this.props;
    const { userId } = loggedInUser || {};
    const { organizerId } = organizer || {};
    const { whiteLabelId } = whiteLabel || {};
    const isValidSegmentName = leadingAndTrailingWhiteSpaceRegex.test(segmentName);
    const isNamePresent = this.isNameAlreadyTaken(segmentName);

    if (!isValidSegmentName || isNamePresent) {
      this.setState({ isValidSegmentName, isNamePresent });
      return;
    }

    if (userId && segmentFilter && (organizerId || whiteLabelId)) {
      this.setState({ showLoadingForSegmentSaved: true });
      this.props
        .createFilter({
          filterJson: segmentFilter && segmentFilter.filterJson,
          name: segmentName,
          userId,
          source: isFromWhiteLabel ? this.sourceConst.whiteLabel : this.sourceConst.organizer,
          sourceId: organizerId || whiteLabelId,
        })
        .then((resp) => {
          if (resp && !resp.errorMessage && !resp.error && !resp.errors) {
            this.setState(
              {
                isSegmentSaved: false,
                segmentName: '',
                segmentFilter: null,
                showMessage: t('audience:Segment Created'),
                ...this.defaultPageAndSize,
              },
              () => {
                this.clearMessage();
                this.getAudienceAllFilter();
              },
            );
          } else {
            let errorMessage =
              (resp && resp.errorMessage) || (resp && resp.error) || t('audience:Segment is not created');
            if (resp.errors && Array.isArray(resp.errors) && resp.errors.length > 0) {
              errorMessage = resp.errors[0].message;
            }
            this.setState(
              {
                showMessage: errorMessage,
                isError: true,
              },
              this.clearMessage,
            );
          }
          this.setState({ showLoadingForSegmentSaved: false });
        })
        .catch(() => {
          this.setState(
            { showMessage: t('audience:Segment is not created'), isError: true, showLoadingForSegmentSaved: false },
            this.clearMessage,
          );
        });
    }
  };

  handleClickOnSaveSegmentBtn = () => {
    this.setState({ showNameInputField: true });
  };

  handleOnUpdateFilter = (filterToUpdate) => {
    const { t } = this.props;
    if (filterToUpdate && filterToUpdate.id) {
      this.props
        .updateFilter(filterToUpdate)
        .then((resp) => {
          if (resp && !resp.errorMessage && !resp.error && !resp.errors) {
            this.setState(
              {
                segmentFilter: null,
                showSegmentForm: false,
                showMessage: t('audience:Segment Updated'),
                isEditing: false,
                ...this.defaultPageAndSize,
                loadingAttendees: true,
              },
              this.clearMessage,
            );
            this.getAudienceAllFilter();
          } else {
            let errorMessage =
              (resp && resp.errorMessage) || (resp && resp.error) || t('audience:Segment is not updated');
            if (resp.errors && Array.isArray(resp.errors) && resp.errors.length > 0) {
              errorMessage = resp.errors[0].message;
            }
            this.setState(
              {
                showMessage: errorMessage,
                isError: true,
              },
              this.clearMessage,
            );
          }
        })
        .catch(() => {
          this.setState({ showMessage: t('audience:Segment is not updated'), isError: true }, this.clearMessage);
        });
    }
  };

  handleDeleteAction = () => {
    const { t } = this.props;
    const { selectedSegment } = this.state;
    const { data } = selectedSegment || {};
    this.setState({
      isShowPopup: true,
      isPopupForDeleteSegment: true,
      popupHeaderText: t('myevents:Delete Confirmation'),
      popupErrorMessage: data.name,
    });
  };

  handleOnDeleteFilter = () => {
    const { t } = this.props;
    const { selectedSegment, listOfSegment } = this.state;
    const { value } = selectedSegment || {};
    if (value) {
      this.setState({ loadingForDeletingSegment: true });
      this.props.deleteFilter(value).then((resp) => {
        if (resp && !resp.errorMessage && !resp.error) {
          this.setState(
            {
              selectedSegment: listOfSegment[0],
              ...this.defaultPageAndSize,
              showMessage: t('audience:Segment deleted'),
              isShowPopup: false,
              isPopupForDeleteSegment: false,
            },
            this.clearMessage,
          );
          this.getAudienceAllFilter();
        } else {
          this.setState(
            {
              showMessage: (resp && resp.errorMessage) || (resp && resp.error) || t('audience:Segment is not deleted'),
              isError: true,
            },
            this.clearMessage,
          );
        }
        this.setState({ loadingForDeletingSegment: false });
      });
    } else {
      this.setState({ showMessage: t('audience:Segment is not deleted'), isError: true }, this.clearMessage);
    }
  };

  handleOnSaveToSetState = (data) => {
    if (data && data.id) {
      this.handleOnUpdateFilter(data);
    } else {
      this.setState(
        {
          isSegmentSaved: true,
          segmentFilter: data,
          showSegmentForm: false,
          ...this.defaultPageAndSize,
          showPreFetchCountLoader: true,
          loadingAttendees: true,
        },
        () => this.getAudienceByFilterWithColumnSelection(),
      );
    }
  };

  handleOnCloseSlidePopup = () => {
    this.setState({ showSegmentForm: false, isEditing: false });
  };

  getAudienceByFilterWithColumnSelection = () => {
    const { organizer, whiteLabel, isFromWhiteLabel, columnMasterJson } = this.props;
    const { organizerPageURL } = organizer || {};
    const { whiteLabelUrl } = whiteLabel || {};
    const { page, sizePerPage, selectedSegment, isSegmentSaved, segmentFilter } = this.state;
    let apiCallForAudience;
    let apiCallForColumnSelection;
    let filterJsonForQuery;
    let columnData = columnMasterJson || {};
    const { value: segmentId } = selectedSegment || {};

    if (!((organizerPageURL || whiteLabelUrl) && segmentId && page && sizePerPage)) {
      return;
    }
    if (isSegmentSaved && segmentFilter) {
      filterJsonForQuery = segmentFilter;
    }
    const offset = (page - 1) * sizePerPage;
    if (isFromWhiteLabel) {
      apiCallForAudience = this.props.getAudienceByFilterAndWhiteLabelURL(
        whiteLabelUrl,
        segmentId,
        offset,
        sizePerPage,
        '',
        filterJsonForQuery,
      );
      apiCallForColumnSelection = () =>
        this.props.getAudienceSelectedColumnByWhitelabelAndFilterId(whiteLabelUrl, !isSegmentSaved && segmentId);
    } else {
      apiCallForAudience = this.props.getAudienceByFilter(
        organizerPageURL,
        segmentId,
        offset,
        sizePerPage,
        '',
        filterJsonForQuery,
      );
      apiCallForColumnSelection = () =>
        this.props.getAudienceSelectedColumnByOrganizerAndFilterId(organizerPageURL, !isSegmentSaved && segmentId);
    }
    const promises = [
      apiCallForAudience,
      ...(columnMasterJson ? [] : [this.props.getColumnMasterJson(columnMasterJsonSource.AUDIENCE_FILTER)]),
    ];
    Promise.all([...promises])
      .then((resp) => {
        const [attendeeResp, columnMasterJsonResp] = resp || [];
        /* when user open audience tab first time then this code executed */
        if (!columnMasterJson && columnMasterJsonResp) {
          this.props.storeAudienceColumnMasterJson(columnMasterJsonResp);
          columnData = columnMasterJsonResp;
        }
        let tableColumns = [];
        if (attendeeResp && columnData) {
          if (Array.isArray(attendeeResp.data)) {
            attendeeResp.data = attendeeResp.data.map((audience) => ({
              ...audience,
              ...audience.columnSelectionData,
            }));
          }
          const attendeeData = { attendees: attendeeResp.data || [], totalSize: attendeeResp.recordsTotal || 0 };
          if (!isSegmentSaved) {
            apiCallForColumnSelection().then((savedColumnResp) => {
              if (savedColumnResp?.status === 200) {
                if (!this.isFilterListLoadedFirstTime) {
                  const options = [
                    {
                      label: this.renderLabelNameWithCount({
                        name: 'Everyone',
                        totalAudience: attendeeResp.recordsTotal || 0,
                      }),
                      value: -1,
                      data: { name: 'Everyone', id: -1 },
                    },
                  ];
                  !this.isFilterListLoadedFirstTime && this.setState({ listOfSegment: options });
                }
                if (savedColumnResp?.data?.id) {
                  const allColumns = [...columnData.defaultColumns, ...columnData.customiseColumns];
                  savedColumnResp.data.columnSelection?.forEach((savedColumn) => {
                    allColumns.forEach((column) => {
                      if (column.key === savedColumn.key && column.type === savedColumn.type) {
                        tableColumns.push({ ...column });
                      }
                    });
                  });
                } else {
                  tableColumns = [...columnData.defaultColumns];
                }
                this.setState({
                  savedSelectedColumn: savedColumnResp?.data,
                  tableColumns,
                  ...attendeeData,
                });
              } else {
                this.setState(
                  {
                    isError: true,
                    showMessage: savedColumnResp?.errorMessage || savedColumnResp?.error || this.defaultErrorMessage,
                  },
                  this.clearMessage,
                );
              }
              this.setState({ loadingAttendees: false, showPreFetchCountLoader: false });
            });
          } else {
            tableColumns = [...columnData.defaultColumns];
            this.setState({ loadingAttendees: false, showPreFetchCountLoader: false, tableColumns, ...attendeeData });
          }
        } else {
          const errorMessage = attendeeResp?.errorMessage || attendeeResp?.error || this.defaultErrorMessage;
          this.setState(
            {
              isError: true,
              showMessage: errorMessage,
              attendees: [],
              totalSize: 0,
              ...this.defaultPageAndSize,
            },
            this.clearMessage,
          );
          this.setState({ loadingAttendees: false, showPreFetchCountLoader: false });
        }
      })
      .catch(() => {
        this.setState(
          {
            loadingAttendees: false,
            isError: true,
            showMessage: this.defaultErrorMessage,
            showPreFetchCountLoader: false,
            attendees: [],
            totalSize: 0,
            ...this.defaultPageAndSize,
          },
          this.clearMessage,
        );
      });
  };

  getAudienceByFilter = (formSearch) => {
    const { organizer, whiteLabel, isFromWhiteLabel } = this.props;
    const { organizerPageURL } = organizer || {};
    const { whiteLabelUrl } = whiteLabel || {};
    const { page: selectedPage, sizePerPage, selectedSegment, searchKey, isSegmentSaved, segmentFilter } = this.state;
    let page = selectedPage;
    let filterJsonForQuery;
    let apiCall;
    const { value: segmentId } = selectedSegment || {};
    if (formSearch) {
      page = 1;
    }

    if (isSegmentSaved && segmentFilter) {
      filterJsonForQuery = segmentFilter;
    }
    if (!((organizerPageURL || whiteLabelUrl) && segmentId && page && sizePerPage)) {
      return;
    }
    const offset = (page - 1) * sizePerPage;
    if (isFromWhiteLabel) {
      apiCall = this.props.getAudienceByFilterAndWhiteLabelURL(
        whiteLabelUrl,
        segmentId,
        offset,
        sizePerPage,
        searchKey,
        filterJsonForQuery,
      );
    } else {
      apiCall = this.props.getAudienceByFilter(
        organizerPageURL,
        segmentId,
        offset,
        sizePerPage,
        searchKey,
        filterJsonForQuery,
      );
    }
    apiCall
      .then((resp) => {
        if (resp && !resp.errorMessage && !resp.error) {
          /* when user open audience tab first time then this code executed */
          if (!this.isFilterListLoadedFirstTime) {
            const options = [
              {
                label: this.renderLabelNameWithCount({ name: 'Everyone', totalAudience: resp.recordsTotal || 0 }),
                value: -1,
                data: { name: 'Everyone', id: -1 },
              },
            ];
            !this.isFilterListLoadedFirstTime && this.setState({ listOfSegment: options });
          }
          if (Array.isArray(resp.data)) {
            resp.data = resp.data.map((audience) => ({ ...audience, ...audience.columnSelectionData }));
          }
          this.setState({
            attendees: resp.data || [],
            totalSize: resp.recordsTotal || 0,
          });
        } else {
          this.setState(
            {
              isError: true,
              showMessage: resp?.errorMessage || resp?.error || this.defaultErrorMessage,
              attendees: [],
              totalSize: 0,
              ...this.defaultPageAndSize,
            },
            this.clearMessage,
          );
        }
        this.setState({ loadingAttendees: false, showPreFetchCountLoader: false });
      })
      .catch(() => {
        this.setState(
          {
            loadingAttendees: false,
            isError: true,
            showMessage: this.defaultErrorMessage,
            showPreFetchCountLoader: false,
            attendees: [],
            totalSize: 0,
            ...this.defaultPageAndSize,
          },
          this.clearMessage,
        );
      });
  };

  handlePageChange = (page, changedSizePerPage) => {
    const { sizePerPage } = this.state;
    if (sizePerPage === changedSizePerPage) {
      this.setState({ page, sizePerPage: changedSizePerPage }, () => this.getAudienceByFilter());
    } else {
      this.setState({ ...this.defaultPageAndSize, sizePerPage: changedSizePerPage }, () => this.getAudienceByFilter());
    }
  };

  filterOptions = (options, inputValue) => {
    const name = get(options, 'data.data.name');
    return inputValue && name ? name.toLowerCase().includes(inputValue.toLowerCase()) : true;
  };

  handleClickOnDownload = () => {
    const { t, organizer, isFromWhiteLabel, whiteLabel } = this.props;
    const { selectedSegment } = this.state;
    const { organizerPageURL } = organizer || {};
    const { whiteLabelUrl } = whiteLabel || {};
    const name = get(selectedSegment, 'data.name');
    const { value } = selectedSegment || {};
    if (name && value && (organizerPageURL || whiteLabelUrl)) {
      this.setState({ isDownloading: true });
      let apiCall;
      if (isFromWhiteLabel) {
        apiCall = this.props.getAudienceDownloadByFilterIdAndWhiteLabelURL(whiteLabelUrl, value, name);
      } else {
        apiCall = this.props.getAudienceDownloadByFilterId(organizerPageURL, value, name);
      }
      apiCall
        .then((resp) => {
          let message = '';
          let isError = false;
          if (resp && !resp.errorMessage && !resp.error) {
            message = t('audience:File downloaded successfully');
          } else {
            message = (resp && (resp.error || resp.errorMessage)) || this.defaultErrorMessage;
            isError = true;
          }
          this.setState({ isDownloading: false, showMessage: message, isError }, this.clearMessage);
        })
        .catch(() => {
          this.setState(
            { isDownloading: false, showMessage: this.defaultErrorMessage, isError: true },
            this.clearMessage,
          );
        });
    }
  };

  handleOnCloseColumnSelection = () => this.setState({ openColumnSelectionPopup: false });

  handleClickOnApplyForCreate = (selectedColumnList) => {
    const { isFromWhiteLabel, whiteLabel, organizer } = this.props || {};
    const { selectedSegment } = this.state;
    const data = {
      area: 'AUDIENCE_FILTER',
      filterId: selectedSegment?.value,
      columnSelection: [...selectedColumnList],
    };
    let apiCall;
    if (isFromWhiteLabel) {
      apiCall = this.props.createColumnSelectionByWhitelabel(whiteLabel?.whiteLabelUrl, data);
    } else {
      apiCall = this.props.createColumnSelectionByOrganizer(organizer?.organizerPageURL, data);
    }
    apiCall
      .then((resp) => {
        if (resp && !resp.errorMessage && !resp.error) {
          this.setState({ openColumnSelectionPopup: false });
          this.getAudienceByFilterWithColumnSelection();
        } else {
          const errorMessage = resp?.errorMessage || resp?.error || this.defaultErrorMessage;
          this.setState({ showMessage: errorMessage, isError: true }, this.clearMessage);
        }
      })
      .catch(() => this.setState({ showMessage: this.defaultErrorMessage, isError: true }, this.clearMessage));
  };

  handleClickOnApplyForUpdate = (updatedColumnList) => {
    if (updatedColumnList?.id) {
      this.props
        .updateColumnSelectionById(updatedColumnList?.id, { columnSelection: updatedColumnList.columnSelection })
        .then((resp) => {
          if (resp && !resp.errorMessage && !resp.error) {
            this.setState({ openColumnSelectionPopup: false });
            this.getAudienceByFilterWithColumnSelection();
          } else {
            const errorMessage = resp?.errorMessage || resp?.error || this.defaultErrorMessage;
            this.setState({ showMessage: errorMessage, isError: true }, this.clearMessage);
          }
        })
        .catch(() => this.setState({ showMessage: this.defaultErrorMessage, isError: true }, this.clearMessage));
    }
  };

  resetSelectedFilter = () => {
    const { listOfSegment } = this.state;
    this.setState(
      {
        selectedSegment: listOfSegment[0],
        ...this.defaultPageAndSize,
        isEditing: false,
        segmentFilter: null,
        isSegmentSaved: false,
        segmentName: '',
        showNameInputField: false,
        isValidSegmentName: true,
        isNamePresent: false,
        loadingAttendees: true,
      },
      () => {
        this.getAudienceByFilterWithColumnSelection();
      },
    );
  };

  renderResetButton = () => {
    const { t } = this.props;
    const { loadingAttendees, loadingSegment } = this.state;
    return (
      <AEButton
        key="reset-segment"
        label={t('common:Reset')}
        className="ml-2"
        disabled={loadingAttendees || loadingSegment}
        isPrevIcon
        icon="glyphicon glyphicon-repeat"
        iconSize="exSmall"
        variant="secondary"
        onClick={this.resetSelectedFilter}
      />
    );
  };

  handleFocusOnSegmentName = () => {
    this.setState({ showLengthForName: true });
  };

  handleBlurOnSegmentName = () => {
    this.setState({ showLengthForName: false });
  };

  renderEditButton = (isEditing) => {
    const { t } = this.props;
    const { loadingAttendees, loadingSegment } = this.state;
    return (
      <AEButton
        key="edit-segment"
        label={t('common:Edit')}
        isPrevIcon
        icon="ac-icon-edit"
        iconSize="exSmall"
        variant="secondary"
        disabled={loadingAttendees || loadingSegment}
        onClick={() => this.handleShowPopupSegment(isEditing)}
      />
    );
  };

  renderDeleteButton = () => {
    const { t } = this.props;
    const { loadingAttendees, loadingSegment } = this.state;
    return (
      <AEButton
        id="delete-segment"
        key="delete-segment"
        label={t('common:Delete')}
        isPrevIcon
        className="ml-2"
        icon="ac-icon-bin"
        iconSize="exSmall"
        variant="secondary"
        disabled={loadingAttendees || loadingSegment}
        onClick={() => this.handleDeleteAction()}
      />
    );
  };

  renderNoRecordsView = () => {
    const { isSegmentSaved } = this.state;
    const { t } = this.props;
    return (
      <div className="text-center">
        <AEIcon type="virtual-icon-filter-1" size="exlarge" className="mb-3" color="#6D6F7D" />
        <AELabel
          header={t('No contacts match the current filters')}
          className="d-md-inline d-sm-inline d-xs-inline d-lg-inline"
          variant="body2"
        />
        {isSegmentSaved && (
          <div className="mt-3">
            {this.renderEditButton(false)}
            {this.renderResetButton()}
          </div>
        )}
      </div>
    );
  };

  renderPlanValidationInfo = () => (
    <>
      Please upgrade plan to access advanced analytics.
      <div className="modal-footer">
        <AEButton id="cancel" onClick={this.closeUpdatePlanPopup}>
          Cancel
        </AEButton>
      </div>
    </>
  );

  renderDeleteSegmentInfo = () => {
    const { t } = this.props;
    const { popupErrorMessage, loadingForDeletingSegment } = this.state;
    const message = `${t('audience:Are you sure you want to delete segment')} "${popupErrorMessage}"`;
    return (
      <>
        {message}
        <div className="modal-footer">
          <AEButton
            variant="primary"
            id="deleteSegment"
            loading={loadingForDeletingSegment}
            onClick={() => this.handleOnDeleteFilter()}
            label={t('common:Confirm')}
          />
          <AEButton variant="danger" onClick={this.closeUpdatePlanPopup} label={t('common:Close')} className="ml-2" />
        </div>
      </>
    );
  };

  render() {
    const {
      attendees,
      loadingAttendees,
      loadingSegment,
      selectedAttendee,
      toggle,
      openUpdatePlanPopup,
      listOfSegment,
      selectedSegment,
      showSegmentForm,
      filterMasterJson,
      isSegmentSaved,
      showNameInputField,
      segmentName,
      isNamePresent,
      totalSize,
      page,
      sizePerPage,
      showMessage,
      isError,
      isEditing,
      showLoadingForSegmentSaved,
      segmentFilter,
      showPreFetchCountLoader,
      isValidSegmentName,
      isShowPopup,
      isPopupForDeleteSegment,
      popupHeaderText,
      isDownloading,
      showLengthForName,
      openColumnSelectionPopup,
      savedSelectedColumn,
      tableColumns,
    } = this.state;
    const { organizer, t, whiteLabel, isFromWhiteLabel, columnMasterJson } = this.props;
    const nodataText = t('No options');
    const loadingCount = loadingAttendees && showPreFetchCountLoader;
    this.paginationOptions = {
      page,
      sizePerPageList: [
        {
          text: '10',
          value: 10,
        },
        {
          text: '50',
          value: 50,
        },
        {
          text: '100',
          value: 100,
        },
      ],
      onPageChange: this.handlePageChange,
      sizePerPage,
      prePage: t('common:Prev'),
      nextPage: t('common:Next'),
      paginationPosition: 'bottom',
      hideSizePerPage: !(totalSize && totalSize > 0),
      noDataText: this.renderNoRecordsView(),
    };

    const handleDataFormat = (cell, row, enumObject, index, key) => (
      <LabelTooltip
        key={`${key}-${index}`}
        id={`${key}-${index}`}
        header={cell || 'N/A'}
        variant="body2"
        color="#4B4D5F"
      />
    );

    const selectRow = {
      mode: 'radio',
      onSelect: this.openSideBarTab.bind(this),
      hideSelectColumn: true,
      className: 'selected-auction-item',
      clickToSelect: true,
      selected: selectedAttendee?.email ? [selectedAttendee?.email] : [],
    };
    return (
      <div>
        <Alerts loading={isDownloading} message={showMessage} isError={isError} />
        <div className="main-box no-header audience">
          <Row>
            <Col md={12}>
              {isSegmentSaved ? (
                <>
                  <div className="p-l-20 mr-2 d-md-inline">
                    {!loadingCount && !showNameInputField && (
                      <span>{t(`audience:{{totalSize}} Attendees`, { totalSize })}</span>
                    )}
                  </div>
                  {showNameInputField ? (
                    <>
                      <Col md={3} className="p-0 mr-2">
                        <AEInputField
                          key={'segment-name'}
                          onChange={(e) => this.handleOnChangeName(e.target.value)}
                          onBlur={this.handleBlurOnSegmentName}
                          onFocus={this.handleFocusOnSegmentName}
                          type="text"
                          placeholder={t('audience:Enter segment name')}
                          name="segment-name"
                          value={segmentName}
                          valid={isValidSegmentName && !isNamePresent}
                          feedBackText={
                            isValidSegmentName && !isNamePresent
                              ? `${segmentName.length}/255`
                              : isNamePresent
                              ? t('audience:Segment name has been already taken')
                              : !segmentName
                              ? t('audience:Segment name required')
                              : t('audience:Remove leading & trailing white space')
                          }
                          isFeedBackShow={!(isValidSegmentName && !isNamePresent) || showLengthForName}
                          maxLength="255"
                          isCounter
                        />
                      </Col>
                      <AEButton
                        loading={showLoadingForSegmentSaved && loadingAttendees}
                        label={t('common:Save')}
                        className="mr-2"
                        disabled={loadingAttendees}
                        onClick={this.handleClickOnSaveSegmentName}
                      />
                    </>
                  ) : (
                    <AEButton
                      label={t('audience:Save Segment')}
                      className="mr-2"
                      disabled={loadingAttendees}
                      onClick={this.handleClickOnSaveSegmentBtn}
                    />
                  )}

                  {!(loadingAttendees || loadingSegment) && totalSize && totalSize > 0 ? (
                    <>
                      {this.renderEditButton(false)} {this.renderResetButton()}
                    </>
                  ) : (
                    ''
                  )}
                </>
              ) : (
                <div className="d-flex">
                  <Col md={4} sm={4} lg={4} xs={4}>
                    <AESelect
                      options={listOfSegment}
                      nodataText={nodataText}
                      isTwoDimensional
                      value={selectedSegment && selectedSegment.value}
                      onChange={(e) => this.handleSelectOnSegment(e)}
                      isSearchable
                      filterOption={this.filterOptions}
                      isDisabled={!size(listOfSegment)}
                    />
                  </Col>
                  {selectedSegment && selectedSegment.value !== -1 ? (
                    <>
                      {this.renderEditButton(true)}
                      {this.renderDeleteButton()}
                      {this.renderResetButton()}
                    </>
                  ) : (
                    <AEButton
                      key="create-segment"
                      label={t('audience:Create Segment')}
                      id="aud_create_seg"
                      onClick={() => this.handleShowPopupSegment()}
                      disabled={this.isEventNotExist}
                    />
                  )}
                  <AEButton
                    variant="secondary"
                    id="download-attendee"
                    className="ml-auto"
                    isPrevIcon
                    icon="m-r-5 ac-icon-download"
                    label={t('common:Download')}
                    disabled={isDownloading || loadingAttendees || loadingSegment || this.isEventNotExist}
                    onClick={this.handleClickOnDownload}
                  />
                </div>
              )}
              <Col md={2} className="d-none">
                <AESearchbox
                  type="text"
                  onChange={this.handleChange}
                  autoFocus
                  showClearIcon
                  value={this.state.searchKey}
                  placeholder={'Search'}
                  aria-label="Search here for attendees"
                />
              </Col>
              {showSegmentForm && (
                <SegmentForm
                  showSegmentForm={showSegmentForm}
                  handleSegmentClose={this.handleOnCloseSlidePopup}
                  filterMasterJson={filterMasterJson}
                  handleOnSaveSegment={this.handleOnSaveToSetState}
                  isEditing={isEditing}
                  savedSegment={isEditing ? selectedSegment : { data: segmentFilter }}
                  isNameAlreadyTaken={this.isNameAlreadyTaken}
                  isEditBeforeCreate={isSegmentSaved}
                  organizer={organizer}
                  whiteLabel={whiteLabel}
                  isFromWhiteLabel={isFromWhiteLabel}
                />
              )}
            </Col>
          </Row>
          <div>
            <Row className="m-t-10">
              <Col md={12} className="tags-table">
                {!loadingAttendees ? (
                  <>
                    <BootstrapTable
                      data={attendees || []}
                      trClassName="trClassFormat"
                      tableBodyClass="spacingBorder"
                      tableContainerClass={cx('tableContainer table-responsive table-small', {
                        'empty-column': size(tableColumns) === 0,
                      })}
                      tableHeaderClass="tableHeader"
                      remote
                      hover
                      condensed
                      selectRow={selectRow}
                      bordered={false}
                      pagination
                      options={this.paginationOptions}
                      fetchInfo={{ dataTotalSize: totalSize }}
                    >
                      <TableHeaderColumn isKey dataField="email" hidden />
                      {tableColumns.map((column, mapIndex) => (
                        <TableHeaderColumn
                          dataField={column.key}
                          width="350"
                          dataFormat={(cell, row, enumObject, index) =>
                            handleDataFormat(cell, row, enumObject, index, column.key)
                          }
                          thStyle={{ whiteSpace: 'nowrap' }}
                          className={cx({ 'last-column-header': tableColumns.length === mapIndex + 1 })}
                        >
                          {t(`audience:${column.label}`)}
                        </TableHeaderColumn>
                      ))}
                    </BootstrapTable>
                    {!isSegmentSaved && (
                      <div className="icon-position" disabled={this.isEventNotExist}>
                        <AETooltip tooltip={'Edit Columns'} tooltipProps={{ id: 'edit-columns-audience-table' }}>
                          <AEIcon
                            className={cx(
                              'column-setting-icon',
                              { cursor: !this.isEventNotExist },
                              { disabled: this.isEventNotExist },
                            )}
                            type="ac-icon-settings"
                            color="#6D6F7D"
                            onClick={this.handleClickOnSettingIconOfColumn}
                          />
                        </AETooltip>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="performance-table-wrap m-t-20">
                    <div className="text-align-center">
                      <AESpinner type="SpinnerSmall" />
                    </div>
                  </div>
                )}
              </Col>
            </Row>
            {isShowPopup && (
              <PopupModel
                id="recuring-event"
                showModal={isShowPopup}
                headerText={popupHeaderText}
                onCloseFunc={this.closeUpdatePlanPopup}
                modalBodyClassName="audience-modal-body"
              >
                {isPopupForDeleteSegment && this.renderDeleteSegmentInfo()}
                {openUpdatePlanPopup && this.renderPlanValidationInfo()}
              </PopupModel>
            )}
            {toggle && (
              <AudienceAnalysisSidebar
                togglePopup={toggle}
                attendee={selectedAttendee}
                handleTogglePopup={this.updateToggle}
                organizer={organizer}
                whiteLabel={whiteLabel}
                isFromWhiteLabel={isFromWhiteLabel}
              />
            )}
            {openColumnSelectionPopup && (
              <ColumnSelection
                openPopup={openColumnSelectionPopup}
                handleOnClose={this.handleOnCloseColumnSelection}
                columnMasterJson={columnMasterJson}
                savedSelectedColumn={savedSelectedColumn}
                handleClickOnApply={this.handleClickOnApply}
                handleClickOnApplyForCreate={this.handleClickOnApplyForCreate}
                handleClickOnApplyForUpdate={this.handleClickOnApplyForUpdate}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}
const mapDispatchToProps = {
  doGetEventPlanConfig,
  getAudienceFilterMasterJson,
  getColumnMasterJson,
  createFilter,
  getAudienceAllFilter,
  getAudienceByFilter,
  updateFilter,
  deleteFilter,
  getAudienceDownloadByFilterId,
  getAudienceAllFilterByWhiteLabelURL,
  getAudienceByFilterAndWhiteLabelURL,
  getAudienceDownloadByFilterIdAndWhiteLabelURL,
  getAudienceSelectedColumnByOrganizerAndFilterId,
  getAudienceSelectedColumnByWhitelabelAndFilterId,
  createColumnSelectionByWhitelabel,
  createColumnSelectionByOrganizer,
  updateColumnSelectionById,
  storeAudienceColumnMasterJson,
};
const mapStateToProps = (state) => ({
  loggedInUser: state.session.user,
  eventDetails: state.host && state.host.eventDetails,
  storeOrganizer: state.organizer.storeOrganizer,
  filterMasterJson: state.host.audienceFilterMasterJson,
  columnMasterJson: state.host?.audienceColumnMasterJson,
  planConfiguration: get(state, 'host.planConfiguration'),
});
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(WithParams(withTranslation('audience', 'attendeeDetails')(Audience)));
