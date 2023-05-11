import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import IconButton from '@mui/material/IconButton'
import CardActions from '@mui/material/CardActions'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import Typography from '@mui/material/Typography'
import AccordionDetails from '@mui/material/AccordionDetails'
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ButtonBox from 'ui-component/Button';

const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
}));

const ContactData = [
  {
    contactlabel: 'Name',
    detail: 'Roger Harper',
  },
  {
    contactlabel: 'Title ',
    detail: 'UI/UX Designer',
  },
  {
    contactlabel: 'Phone no',
    detail: '+1-345-678-378',
  },
  {
    contactlabel: 'Email',
    email: "john.mitchel@gmail.com",
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

const Contact = [
  {
    name: 'Contacts 1',
  },
  {
    name: 'Contacts 2',
  },
  {
    name: 'Contacts 3',
  },
];

export default function CompanyProfileCard() {
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
            <Box className={"flex flex-center"}
              sx={{ marginBottom: '40px' }}
            >
              <ImageAvatars src="broken-image.jpg" width={170} height={170} />
            </Box>
            <Box className={classes.accordionStyle}>
            {Contact.map((item, index) => (
              <Accordion key={index} className={classes.MuiAccordionroot}>
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
                    sx={{
                      fontWeight: 'bold',
                      color: 'var(--color-primary)',
                      marginRight: '10px',
                    }}
                  >
                    {item.name}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails className={classes.MuiAccordionDetails} >
                  {ContactData.map((item, index) => (
                    <Box sx={{ marginY: '20px' }} key={index}>
                      <Label
                        header={item.contactlabel}
                        labelClassName="ae-subtitle2"
                      />
                      <Label header={item?.detail } 
                      className="ae-subtitle3"/>
                      <Label header={item?.email} 
                      styles={{wordBreak:"break-word",color:"var(--color-primary)"}}
                      className="ae-subtitle3"/>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
            <Box className={classes.contactBtn}>
              <ButtonBox
                label="Add New Contact"
                borderColor="var(--color-primary)"
                color="var(--color-primary)"
                borderRadius="35px"
                iconClassName={classes.btn}
              />
            </Box>
          </Item>
        </Grid>
        <Grid
          item
          xs={9}
          sx={{
            '& .MuiPaper-root': {
              borderRadius: 0,
            },
            "& .css-134cclq-MuiPaper-root":{
              padding: "0 16px"
            }
          }}
        >
          <Item>
            <Card>
              <CardHeader
                title={
                  <Label
                    header={'Google'}
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
