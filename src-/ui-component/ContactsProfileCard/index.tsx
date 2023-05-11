import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import CardActions from '@mui/material/CardActions';
import { styled } from '@mui/material/styles';
import ImageAvatars from 'ui-component/Avatar';
import Label from 'ui-component/Label';
import ModeEditOutlinedIcon from '@mui/icons-material/ModeEditOutlined';
import location from '../../assets/icons/location.svg';
import linkin from '../../assets/icons/in.svg';
import angellist from '../../assets/icons/angellist.svg';
import GitHub from '../../assets/icons/GitHub.svg';
import share from '../../assets/icons/share.svg';
import shareLink from '../../assets/icons/shareLink.svg';
import stackoverflow from '../../assets/icons/stackoverflow.svg';
import resume from '../../assets/icons/resume.svg';
import { useStyles } from '../ProfileTabs/Tabstyles';
import CompanyProfileTab from 'pages/company/CompaniesProfileTab';
import Status from 'ui-component/CardsList/Status';

const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
}));

const profileAddData = [
  {
    profilelabel: 'Phone No',
    profileItem: ['+1-345-678-378,', '+1-345-678-378'],
  },
  {
    profilelabel: 'Location',
    profileItem: ['Denver, Colorado'],
  },
  {
    profilelabel: 'Source',
    profileItem: ['Added by Kelley Hart'],
    publishDate: ['2/26/2022']
  },
];

const socialIcon = [
  {
    Icon: linkin,
  },
  {
    Icon: angellist,
  },
  {
    Icon: stackoverflow,
  },
  {
    Icon: GitHub,
  },
  {
    Icon: share,
  },
  {
    Icon: resume,
  },
  {
    Icon: shareLink,
  },
];
const profilesection = [
  {
    label: 'Web Development',
  },
  {
    label: 'PSD to HTML',
  },
  {
    label: 'Theme Development',
  },
  {
    label: 'Figma',
  },
  {
    label: 'Adobe XD',
  },
  {
    label: 'Magento',
  },
];

export default function ContactProfileCard() {
  const classes = useStyles();
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={0} columns={12}>
        <Grid
          item
          xs={3}
          sx={{
            '& .MuiPaper-root': {
              borderRadius: 0,
            },
            borderRight: '1px solid var(--color-light-grey)',
          }}
        >
          <Item>
            <Box className="flex flex-center" sx={{ marginBottom: '40px' }}>
              <ImageAvatars src="broken-image.jpg" width={170} height={170} />
            </Box>
            {profileAddData.map((item, index) => (
              <Box sx={{ marginY: '20px' }} key={index}>
                <Label
                  header={item.profilelabel}
                  labelClassName="ae-subtitle2"
                />
                {item.profileItem.map((item, i) => (
                  <Label header={item} className="ae-subtitle3" key={i} />
                ))}
                <Label
                  header={item.publishDate && item.publishDate}
                  styles={{ color: "var(--color-Sec-Grey)", lineHeight:"24px" }}
                  className="ae-subtitle3"
                />
              </Box>
            ))}
          </Item>
        </Grid>
        <Grid
          item
          xs={9}
          sx={{
            '& .MuiPaper-root': {
              borderRadius: 0,
            },"& .css-134cclq-MuiPaper-root":{
              padding: "0 16px"
            }
          }}
        >
          <Item>
            <Card>
              <CardHeader
                title={
                  <Label
                    header={
                      <div className="flex">
                        <span>
                          {'John Mitchel'}
                        </span>
                          <Status label={"Active"} className={classes.chipStyle}/>
                      </div>}
                    labelClassName="ae-subtitle"
                    styles={{ color: 'var(--color-secondary1)' }}
                  />
                }
                action={
                  <div>
                    <ModeEditOutlinedIcon />
                  </div>
                }
                subheader={
                  <>
                    <Label
                      header={
                        <span>
                          Denver, United States –{" "}
                          <span style={{ color: 'var(--color-Sec-Grey)' }}>
                            11:40 am local time
                          </span>
                        </span>
                      }
                      labelClassName="ae-subtitle3"
                      styles={{ color: 'var(--color-light-secondary)' }}
                      icon={
                        <img
                          src={location}
                          alt=""
                          style={{ paddingRight: "6px", width: 8 }}
                        />
                      }
                    />
                    <CardActions disableSpacing sx={{ paddingLeft: 0 }}>
                      {socialIcon.map((item, i) => (
                        <IconButton
                          aria-label="share"
                          sx={{ padding: '4px' }}
                          key={i}
                        >
                          <img src={item.Icon} alt="" />
                        </IconButton>
                      ))}
                    </CardActions>
                    <Box display={'flex'}>
                      <Label
                        header={'Title:'}
                        styles={{ color: 'var(--color-secondary1)' }}
                        labelClassName="ae-subtitle2"
                      />
                      &nbsp;
                      <Label
                        styles={{ color: 'var(--color-secondary1)' }}
                        labelClassName="ae-subtitle3"
                        header="Project Manager"
                      />
                    </Box>
                    <Box display={'flex'}>
                      <Label
                        header={'Company:'}
                        styles={{ color: 'var(--color-secondary1)' }}
                        labelClassName="ae-subtitle2"
                      />
                      &nbsp;
                      <Label
                        styles={{ color: 'var(--color-secondary1)' }}
                        labelClassName="ae-subtitle3"
                        header="Google"
                      />
                    </Box>
                    <Grid container spacing={1} marginTop={1} marginBottom={1}>
                      {profilesection?.map((item, i) => (
                        <Grid item marginBottom={2} key={i}>
                          <Label
                            header={item.label}
                            labelClassName={classes.labelstyle}
                            className="p-l-10"
                          />
                        </Grid>
                      ))}
                    </Grid>
                    <CompanyProfileTab />
                  </>
                }
              />
            </Card>
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
}
