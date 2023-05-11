import * as React from 'react';
import Typography from '@mui/material/Typography'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Box from '@mui/material/Box'
import Label from 'ui-component/Label';
import ButtonBox from 'ui-component/Button';
import CustomPagination from 'ui-component/Pagination';
import { useStyles } from '../../../ui-component/ProfileTabs/Tabstyles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import JobHeader from '../../../ui-component/JobHeader';

interface TabPanelProps {
  children?: React.ReactNode;
  index?: number;
  value?: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function CompanyProfileTab(props: any) {
  const [value, setValue] = React.useState(0);
  const classes = useStyles(props);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log(event);
    setValue(newValue);
  };

  const ProfileCardItem = [
    {
      title: 'Design a home page',
      Subtitle: 'Visual Designer',
    },
    {
      title: 'Design a home page',
      Subtitle: 'Senior Designer',
    },
    {
      title: 'Design a home page',
      Subtitle: 'Development Engineer- BE/B.Tech',
    },
    {
      title: 'Design a home page',
      Subtitle: 'Senior Software Engineer ',
    },
  ];

  const CompanyCandidateDetail = [
    {
      title: 'Sourced',
      candidateCount: 120,
    },
    {
      title: 'Active',
      candidateCount: 25,
    },
    {
      title: 'Rejected',
      candidateCount: 10,
    },
    {
      title: 'Placed',
      candidateCount: 0,
    },
  ];

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
          className={classes.Tabstyle}
        >
          <Tab
            label="Active Jobs"
            {...a11yProps(0)}
            sx={{
              minHeight: 0,
              fontSize: '16px',
              lineHeight: '48px',
              fontWeight: 600,
              padding: 0,
            }}
          />
          <Tab
            label="Closed Jobs"
            {...a11yProps(1)}
            sx={{
              minHeight: 0,
              fontSize: '16px',
              lineHeight: '48px',
              fontWeight: 600,
              padding: 0,
              marginX: 2,
            }}
          />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        {ProfileCardItem.map((item, index) => (
          <Card
            sx={{ borderBottom: '1px solid var(--color-light-grey)' }}
            key={index}
          >
            <JobHeader Item={item} />
            <CardContent sx={{ paddingLeft: '0 !important' }}>
              <Grid container>
                <Grid item xs={2} sm={4} md={3}>
                  <Box>
                    <Label
                      header={'Date Opened'}
                      labelClassName="ae-subtitle2"
                    />
                    <Label header={'02/28/22'} />
                  </Box>
                </Grid>
                <Grid item xs={2} sm={4} md={3}>
                  <Box>
                    <Label
                      header={'Hiring Manager'}
                      labelClassName="ae-subtitle2"
                    />
                    <Label header={'Roger Harper'} />
                  </Box>
                </Grid>
              </Grid>
              <Accordion
                className={classes.MuiAccordionroot}
              >
                <AccordionSummary
                  expandIcon={
                    <ExpandMoreIcon sx={{ color: 'var(--color-primary)' }} />
                  }
                  aria-controls="panel1a-content"
                  id="panel1a-header"
                  sx={{ display: 'inline-flex' }}
                  className={classes.MuiAccordionSummary}
                >
                  <Typography
                    sx={{ fontWeight: 'bold', color: 'var(--color-primary)',marginRight:"10px" }}
                  >
                    Candidates
                  </Typography>
                </AccordionSummary>
                <AccordionDetails className={classes.MuiAccordionDetails}>
                  <Grid container>
                    {CompanyCandidateDetail.map((item, index) => (
                        <Grid item xs={2} sm={4} md={2} key={index}>
                          <Box>
                            <Label
                              header={item.title}
                              labelClassName="ae-subtitle2"
                            />
                            <Label header={item.candidateCount} />
                          </Box>
                        </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
              <Box sx={{ width: '312px', padding: '8px 0 16px' }}>
                <ButtonBox
                  label="View Job Details"
                  borderColor="var(--color-primary)"
                  color="var(--color-primary)"
                  borderRadius="35px"
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </TabPanel>
      <TabPanel value={value} index={1}>
        {ProfileCardItem.map((item, index) => (
          <Card
            sx={{ borderBottom: '1px solid var(--color-light-grey)' }}
            key={index}
          >
            <JobHeader Item={item} />
            <CardContent sx={{ paddingLeft: '0 !important' }}>
              <Grid container>
                <Grid item xs={2} sm={4} md={3}>
                  <Box>
                    <Label
                      header={'Date Opened'}
                      labelClassName="ae-subtitle2"
                    />
                    <Label header={'02/28/22'} />
                  </Box>
                </Grid>
                <Grid item xs={2} sm={4} md={3}>
                  <Box>
                    <Label
                      header={'Hiring Manager'}
                      labelClassName="ae-subtitle2"
                    />
                    <Label header={'Roger Harper'} />
                  </Box>
                </Grid>
              </Grid>
              <Box sx={{ width: '312px', padding: '16px' }}>
                <ButtonBox
                  label="View Job Details"
                  borderColor="var(--color-light-grey)"
                  color="var(--color-light-grey)"
                  borderRadius="35px"
                  disabled
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </TabPanel>
      <CustomPagination />
    </Box>
  );
}
