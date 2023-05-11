import Label from "ui-component/Label";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import CandiDateAccordion from "ui-component/CandiDatesAccordion";
import {useNavigate} from "react-router-dom"
import { styled } from "@mui/material/styles";
import CandiDatesprofileCard from "ui-component/CandiDatesprofileCard";

import { useStyles } from "../../ui-component/ProfileTabs/Tabstyles";
const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
}));

function CandidatesProfile() {
  const navigate = useNavigate()
  const classes = useStyles();

  return (
    <div>
      <Breadcrumbs aria-label="breadcrumb" className={classes.breadcrumbs}>
        <Label header="Candidates" labelClassName={classes.breadcrumbsLink} onClick={()=>navigate('/dashboard/candidates')}/>
        <Label header="Profile" labelClassName={"ae-heading1"} />
      </Breadcrumbs>
      <div>
        <Box sx={{ flexGrow: 1, marginTop: 2 }}>
          <Grid container spacing={4} columns={12}>
            <Grid
              item
              xs={2}
              sm={4}
              md={9}
              lg={8.5}
              sx={{
                "& .MuiPaper-root": {
                  boxShadow: "none",
                  borderRadius: "18px",
                },
              }}
            >
              <Item>
                <CandiDatesprofileCard />
              </Item>
            </Grid>
            <Grid
              item
              xs={2}
              sm={4}
              md={3}
              lg={3.5}
              sx={{
                "& .MuiGrid-root": {
                  marginTop: "0 !important",
                  paddingTop: "0 !important",
                },
                "& .MuiPaper-root": {
                  backgroundColor: "transparent",
                  boxShadow: "none",
                  paddingTop: 0,
                },
              }}
            >
              <Item>
                <CandiDateAccordion />
              </Item>
            </Grid>
          </Grid>
        </Box>
      </div>
    </div>
  );
}

export default CandidatesProfile;
