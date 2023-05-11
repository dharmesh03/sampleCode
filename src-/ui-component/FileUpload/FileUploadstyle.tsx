import { makeStyles } from "@material-ui/core/styles";
const useStyles = makeStyles({
  fileUpload: {
    border: "2px dashed var(--color-primary) !important",
    borderRadius: "25px",
    padding: "53px 33px",
    "& .MuiButtonBase-root:hover": {
      backgroundColor: "transparent !important",
    },
  },
  filetitle: {
    fontSize: "16px",
    fontWeight: 600,
    lineHeight: "19.5px",
    fontFamily: "Montserrat",
    color: "var(--color-secondary1)",
    textAlign: "center",
  },
  filetypography: {
    fontSize: "12px",
    lineHeight: "15px",
    textAlign: "center",
    color: "var(--color-Sec-Greyy)",
    padding: "5px 0",
  },
});

export { useStyles };
