import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import Paper from "@material-ui/core/Paper";
import Tooltip from "@material-ui/core/Tooltip";
import { Button } from "@material-ui/core";
import axios from "axios";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import moment from "moment";

const API = "f4b9179473f57889dd83d9c45c269311";

function desc(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function stableSort(array, cmp) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = cmp(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map(el => el[0]);
}

function getSorting(order, orderBy) {
  return order === "desc"
    ? (a, b) => desc(a, b, orderBy)
    : (a, b) => -desc(a, b, orderBy);
}

const rows = [
  {
    id: "name",
    numeric: false,
    disablePadding: true,
    label: "City"
  },
  {
    id: "calories",
    numeric: true,
    disablePadding: false,
    label: "Maximum Temperature (in C°)"
  },
  {
    id: "fat",
    numeric: true,
    disablePadding: false,
    label: "Minimum Temperature (in C°)"
  }
];

class EnhancedTableHead extends React.Component {
  createSortHandler = property => event => {
    this.props.onRequestSort(event, property);
  };

  render() {
    const { order, orderBy } = this.props;

    return (
      <TableHead>
        <TableRow>
          {rows.map(
            row => (
              <TableCell
                key={row.id}
                align={row.label === "City" ? "left" : "center"}
                sortDirection={orderBy === row.id ? order : false}
              >
                <Tooltip
                  title="Sort"
                  placement={row.numeric ? "bottom-end" : "bottom-start"}
                  enterDelay={300}
                >
                  <TableSortLabel
                    active={orderBy === row.id}
                    direction={order}
                    onClick={this.createSortHandler(row.id)}
                  >
                    {row.label}
                  </TableSortLabel>
                </Tooltip>
              </TableCell>
            ),
            this
          )}
        </TableRow>
      </TableHead>
    );
  }
}

EnhancedTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.string.isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired
};

const styles = theme => ({
  root: {
    width: "100%",
    marginTop: theme.spacing.unit * 3
  },
  table: {
    minWidth: 1020
  },
  tableWrapper: {
    overflowX: "auto"
  }
});

class Weather extends React.Component {
  state = {
    order: "asc",
    orderBy: "calories",
    selected: [],
    data: [],
    page: 0,
    rowsPerPage: 10
  };

  handleRequestSort = (event, property) => {
    const orderBy = property;
    let order = "desc";

    if (this.state.orderBy === property && this.state.order === "desc") {
      order = "asc";
    }

    this.setState({ order, orderBy });
  };

  handleSelectAllClick = event => {
    if (event.target.checked) {
      this.setState(state => ({ selected: state.data.map(n => n.id) }));
      return;
    }
    this.setState({ selected: [] });
  };

  componentDidMount() {
    var lat, lon;
    navigator.geolocation.getCurrentPosition(
      pos => {
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        axios
          .get(
            `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=10&units=metric&APPID=${API}`
          )
          .then(res => {
            this.setState({
              data: res.data.list
            });
          })
          .catch(err => {
            console.log(err);
          });
      },
      err => {
        console.log(err);
      }
    );
  }

  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value });
  };

  isSelected = id => this.state.selected.indexOf(id) !== -1;

  handleDialog = (city, name) => {
    axios
      .get(
        `https://api.openweathermap.org/data/2.5/forecast?id=${city}&units=metric&APPID=${API}`
      )
      .then(res => {
        this.setState(
          {
            city_data: res.data.list,
            open: true,
            city_name: name
          },
          () => {
            this.convertToSingleDay();
          }
        );
      })
      .catch(err => {
        console.log(err);
      });
  };

  convertToSingleDay = () => {
    var city = this.state.city_data.filter(x => x.dt_txt.includes("12:00:00"));

    this.setState({ city_data: city });
    console.log(city);
  };

  handleClose = () => {
    this.setState({ open: false });
  };
  render() {
    const { classes } = this.props;
    const {
      data,
      order,
      orderBy,
      selected,
      rowsPerPage,
      page,
      open
    } = this.state;
    const emptyRows =
      rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);

    return (
      <div>
        <h3>Weather app for displaying details of nearby 10 cities</h3>
        <h6>By Kartik V</h6>
        <Paper className={classes.root}>
          <div className={classes.tableWrapper}>
            <Table className={classes.table} aria-labelledby="tableTitle">
              <EnhancedTableHead
                numSelected={selected.length}
                order={order}
                orderBy={orderBy}
                onRequestSort={this.handleRequestSort}
                rowCount={data.length}
              />
              <TableBody>
                {stableSort(data, getSorting(order, orderBy))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map(n => {
                    return (
                      <TableRow tabIndex={-1} key={n.id}>
                        <TableCell component="th" scope="row">
                          <Button
                            onClick={this.handleDialog.bind(this, n.id, n.name)}
                          >
                            {n.name}
                          </Button>
                        </TableCell>
                        <TableCell align="center">
                          {n.main ? n.main.temp_max : ""}
                        </TableCell>
                        <TableCell align="center">
                          {n.main ? n.main.temp_min : ""}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 49 * emptyRows }}>
                    <TableCell colSpan={6} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            rowsPerPageOptions={[10, 25]}
            component="div"
            count={data.length}
            rowsPerPage={rowsPerPage}
            page={page}
            backIconButtonProps={{
              "aria-label": "Previous Page"
            }}
            nextIconButtonProps={{
              "aria-label": "Next Page"
            }}
            onChangePage={this.handleChangePage}
            onChangeRowsPerPage={this.handleChangeRowsPerPage}
          />
        </Paper>

        <Dialog
          fullWidth={true}
          maxWidth="md"
          open={open}
          onClose={this.handleClose}
          aria-labelledby="max-width-dialog-title"
          style={{ width: "100%" }}
        >
          <DialogTitle id="max-width-dialog-title">
            5 day weather forecast for {this.state.city_name}
          </DialogTitle>

          {this.state.city_data &&
            this.state.city_data.map(city => (
              <div style={{ border: "1px solid #e1e1e1" }}>
                <div
                  className="row"
                  style={{
                    margin: "0",
                    padding: "10px",
                    maxHeight: "100%"
                  }}
                >
                  <div className="col-md-6">
                    <span>{moment(city.dt_txt).format("LL")}</span>
                  </div>
                  <div className="col-md-6">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap"
                      }}
                    >
                      <span>Max: {city.main.temp_max} °C</span>
                      <span>Min: {city.main.temp_min} °C</span>
                      <img
                        src={`http://openweathermap.org/img/w/${
                          city.weather[0].icon
                        }.png`} alt={city.weather[0].description}
                      />
                    </div>
                    <div style={{ display: "flex" }}>
                      <span>Wind: {city.wind.speed} m/s</span>
                    </div>
                    <span>
                      clouds: {city.clouds.all}%, Humidity: {city.main.humidity}
                    </span>
                  </div>
                </div>
              </div>
            ))}

          <DialogContent />
        </Dialog>
      </div>
    );
  }
}

Weather.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Weather);
