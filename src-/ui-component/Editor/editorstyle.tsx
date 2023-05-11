import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
    editorblock: {  
    "& .MUIRichTextEditor-placeHolder-9":{
        position:"relative"
    },
    "& .MUIRichTextEditor-root-1":{
        border: "1px solid var(--color-Sec-Grey);",
        borderRadius: "10px",
        padding:"24px"

    },
  },
});

export { useStyles };