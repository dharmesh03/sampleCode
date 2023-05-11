import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Avatar from "@mui/material/Avatar";
import dayjs, { Dayjs } from 'dayjs';
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import { useStyles } from "../../ui-component/ProfileDialog/profiledialogstyle";
import ButtonBox from "ui-component/Button";
import DatePicker from "./DatePicker";
import SelectTab from "./SelectTab";
import Label from "ui-component/Label";
import location from "../../assets/icons/location.svg";
import book from "../../assets/icons/book.svg";
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

export interface DialogTitleProps {
  id?: string;
  children?: React.ReactNode;
  onClose: () => void;
}

function BootstrapDialogTitle(props: DialogTitleProps) {
  const { children, onClose, ...other } = props;
  return (
    <DialogTitle
      sx={{ m: 0, fontSize: "16px", fontFamily: "Montserrat" }}
      {...other}
    >
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
}

const timeSlot = [
  {
    title: '12:15 PM',
  },
  {
    title: '12:45 PM',
  },
  {
    title: '1:15 PM',
  },
  {
    title: '1:45 PM',
  },
  {
    title: '2:15 PM',
  },
  {
    title: '2:45 PM',
  },
  {
    title: '3:15 PM',
  },
  {
    title: '3:45 PM',
  },
  {
    title: '4:15 PM',
  },
  {
    title: '4:45 PM',
  },
];

type ProfileDialog = {
  handleOnclick?: any;
  open: boolean;
  DialogTitle?: string;
};

export default function BookTimeDialog(props: ProfileDialog) {
  const { handleOnclick, open } = props;
  const [value, setValue] = React.useState<Dayjs | null>(dayjs())
  const [selectedTime,setSelectedTime] = React.useState<any>(timeSlot[0].title)

  const classes = useStyles(props);
  return (
    <div>
      <BootstrapDialog
        onClose={handleOnclick}
        aria-labelledby="customized-dialog-title"
        open={open}
        className={classes.bootstrapDialogtitle}
      >
        <BootstrapDialogTitle
          id="customized-dialog-title"
          onClose={handleOnclick}
        >
          Book Slot
        </BootstrapDialogTitle>
        <Box sx={{ paddingX: "24px" }}>
          <Box>
            <Card sx={{boxShadow:"none",padding:0,"& .MuiPaper-root": {
                boxShadow:"none !important"
                },}}>
              <CardHeader
              sx={{boxShadow:"none",paddingTop:"4px"}}
                avatar={
                  <Avatar sx={{}} aria-label="recipe">
                    R
                  </Avatar>
                }
                title={
                  <Label
                    header={"John Mitchel"}
                    labelClassName="ae-subtitle"
                    styles={{ color: "var(--color-secondary1)" }}
                  />
                }
                subheader={
                  <>
                    <Label
                      header={<span>United States</span>}
                      labelClassName="ae-captions"
                      styles={{ color: "var(--color-light-secondary)" }}
                      icon={
                        <img
                          src={location}
                          alt=""
                          style={{ paddingRight: "2px", width: 8 }}
                        />
                      }
                    />
                  </>
                }
                action={
                  <Box className={'flex flex-align-center'}>
                    <img src={book} alt="" style={{paddingRight:"16px"}}/>
                    <span style={{ color: "#232323",fontSize:"14px",fontWeight:"500" }}>45 Mins</span>
                  </Box>
                }
              />
            </Card>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={8}>
            <Label
              header={"Select Date"}
              labelClassName="ae-body2"
              styles={{ color: "var(--color-secondary1)",marginLeft:"20px" }}
            />
                <DatePicker value={value} setValue={setValue}/>
            </Grid>
            <Grid item xs={4}>
            <Label
              header={"Select Time Slots"}
              labelClassName="ae-body2"
              styles={{ color: "var(--color-secondary1)"}}
            />
              <SelectTab
                selectedTime={selectedTime}
                setSelectedTime={setSelectedTime}
                timeSlot={timeSlot}
              />
            </Grid>
          </Grid>
        </Box>
        <Box
          sx={{
            paddingX: '24px',
            color: 'var(--color-secondary1)',
            fontSize: '16px',
            paddingY: '17px',
          }}
        >
          <Typography>{value && value.format('dddd, MMM D')}</Typography>
          <Typography>{selectedTime} ({value && value.format('zzz')})</Typography>
        </Box>
        <Box marginBottom={"24px"} marginLeft={"24px"}>
          <Grid container spacing={2}>
            <Grid xs={4} sx={{ marginX: "10px", marginY: "17px" }}>
              <ButtonBox
                label="Confirm"
                borderColor="var(--color-primary)"
                color="var(--color-primary)"
                borderRadius="35px"
              />
            </Grid>
            <Grid xs={4} sx={{ marginX: "10px", marginY: "17px" }}>
              <ButtonBox
                label="Cancel"
                borderColor="var(--color-Sec-Grey)"
                color="var(--color-Sec-Grey)"
                borderRadius="35px"
                onClick={handleOnclick}
              />
            </Grid>
          </Grid>
        </Box>
      </BootstrapDialog>
    </div>
  );
}
