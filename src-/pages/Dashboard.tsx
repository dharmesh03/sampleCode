import BasicCard from "component/DashBoardCard";
import Label from "ui-component/Label";
import Grid from "@mui/material/Grid";
import DashBordTab from "ui-component/DashBoardTab";
import LineCharts from "component/charts";

function dashboard() {
  return (
    <div>
      <Label header="My Dashboard" labelClassName={"ae-heading1"} />
      <BasicCard />
      <Grid
        container
        spacing={{ xs: 2, md: 3 }}
        columns={{ xs: 4, sm: 8, md: 12 }}
      >
        <Grid item xs={12} sm={8} md={9}>
          <LineCharts
            title="Overview"
            chartLabels={[
              "01/01/2023",
              "01/02/2023",
              "01/03/2023",
              "01/04/2023",
              "01/05/2023",
              "01/06/2023",
              "01/07/2023",
              "01/08/2023",
              "01/09/2023",
              "01/10/2023",
              "01/11/2023",
            ]}
            chartData={[
              {
                name: "Candidate Selected",
                type: "area",
                fill: "gradient",
                data: [44, 55, 41, 67, 22, 43, 21, 41, 56, 27, 43],
              },
              {
                name: "Candidate Rejected",
                type: "line",
                fill: "solid",
                data: [30, 25, 36, 30, 45, 35, 64, 52, 59, 36, 39],
              },
            ]}
          />
        </Grid>
        <Grid item xs={2} sm={4} md={3}>
          <DashBordTab />
        </Grid>
      </Grid>
    </div>
  );
}

export default dashboard;
