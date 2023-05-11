import { createTheme, ThemeProvider } from "@mui/material/styles";
import MUIRichTextEditor from "mui-rte";
import { useStyles } from "./editorstyle";

const save = (data: any) => {
  console.log(data);
};

const myTheme = createTheme({});
Object.assign(myTheme, {
  overrides: {
    MUIRichTextEditor: {
      container: {
        display: "flex",
        flexDirection: "column",
        margin: 0,
      },
      toolbar: {
        display: "block",
        order: 2,
        position: "relative",
      },
      placeHolder: {
        position: "relative",
      },
    },
  },
});

export default function Editor(props: any) {
  const classes = useStyles(props);
  return (
    <div className={classes.editorblock}>
      <ThemeProvider theme={myTheme}>
        <MUIRichTextEditor
          label="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam in dictum metus, a hendrerit leo. Cras sit amet congue ipsum, quis placerat lectus. Mauris felis lorem, porttitor vel est non, maximus scelerisque dui. Nullam consectetur quis mauris ac sagittis. Vivamus suscipit nisi et velit interdum, in varius nibh porta. Donec ornare risus metus, vitae faucibus nisl consectetur vitae. Nullam semper enim ac nulla condimentum convallis.  "
          onSave={save}
          inlineToolbar={true}
          controls={["bold", "italic", "underline", "link"]}
        />
      </ThemeProvider>
    </div>
  );
}
