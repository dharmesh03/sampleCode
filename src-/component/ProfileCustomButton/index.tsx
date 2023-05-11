import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import meetSvg from "../../assets/icons/meet.svg";
import emailSvg from "../../assets/icons/sendemail.svg";
import ZoomSvg from "../../assets/icons/zoom.svg";
import bookSvg from "../../assets/icons/book.svg";
import BookTimeDialog from "component/BookTimedialog";
import React from "react";
import SendEmail from "component/SendEmail";

const ImageButton = styled(ButtonBase)(({ theme }) => ({
  position: "relative",
  height: 80,
  width: "152px !important",
  [theme.breakpoints.down("sm")]: {
    width: "100% !important",
    height: 100,
  },
}));

export default function ProfileCustomButton() {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState("");
  const [emailopen, setEmailOpen] = React.useState(false);
  // const [sendEmailopen, setsendEmailOpen] = React.useState(false);
  const handleClickOpen = (title:string) => {
    setOpen(true);
    setActive(title);
  };
  const handleClose = () => {
    setOpen(false);
    setActive("")
  };
  const openSendEmail = (title:string) => {
    setEmailOpen(true);
    setActive(title);
  };

  const handleSendEmail = () => {
    setEmailOpen(false);
    setActive("")
  };

  const images = [
    {
      url: bookSvg,
      title: "Book Time Slot",
      width: "40%",
      customdialog: handleClickOpen,
    },
    {
      url: emailSvg,
      title: "Send Email",
      customdialog: openSendEmail,
    },
    {
      url: ZoomSvg,
      title: "Zoom Meet",
    },
    {
      url: meetSvg,
      title: "Google Meet",
    },
  ];

  return (
    <Box className={"flex flex-wrap min-width-300 w-full"}>
      {images.map((image) => (
        <ImageButton
          onClick={() => image.customdialog && image.customdialog(image.title)}
          focusRipple
          key={image.title}
          sx={{
            flexDirection: "column",
            border: `${
              (open || emailopen) && active === image.title
                ? "1px solid var(--color-primary)"
                : "1px solid var(--color-light-grey)"
            }`,
            borderRadius: "8px !important",
            marginRight: "24px",
            marginY:"16px",
          }}
        >
          <img src={image.url} alt="" />
          <Box
            sx={{ marginTop: "8px !important", color: "var(--color-primary) !important",fontWeight:"bold !important" }}
            className={"small-text"}
          >
            {image.title}
          </Box>
        </ImageButton>
      ))}
      <BookTimeDialog handleOnclick={handleClose} open={open} />
      <SendEmail handleOnclick={handleSendEmail} emailopen={emailopen} />
    </Box>
  );
}
