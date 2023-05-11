import ReactApexChart from "react-apexcharts";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useChart from "./useChart";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import IconButton from '@mui/material/IconButton';

// ----------------------------------------------------------------------

type btnProps = {
  title: string;
  subheader?: string;
  chartData: any;
  chartLabels: any;
  other?: any;
};

export default function Charts({
  title,
  chartLabels,
  chartData,
  ...other
}: btnProps) {
  const chartOptions = useChart({
    plotOptions: { bar: { columnWidth: "16%" } },
    fill: { type: chartData.map((i: any) => i.fill) },
    labels: chartLabels,
    xaxis: { type: "datetime" },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (y: any) => {
          if (typeof y !== "undefined") {
            return `${y.toFixed(0)}`;
          }
          return y;
        },
      },
    },
  });

  return (
    <Box {...other}>
      <Box className={'flex flex-space-between flex-align-center p-l-20 p-r-20'}>
          <Typography sx={{fontSize:"18px",fontWeight:600, paddingX:3}}>{title}</Typography>
          <IconButton color="inherit">
            <MoreHorizIcon/>
          </IconButton>
      </Box>
      <Box sx={{ p: 3, pb: 1 }} dir="ltr">
        <ReactApexChart
          type="line"
          series={chartData}
          options={chartOptions}
          height={364}
        />
      </Box>
    </Box>
  );
}
