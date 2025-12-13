import React, { useState, useEffect } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Container,
  Box,
} from "@mui/material";
import Swal from "sweetalert2";
import { app, firestore } from "../firebase";
import { getStorage, uploadBytes, ref } from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";
import { where, limit, query, collection } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useCollection } from "react-firebase-hooks/firestore";
import { Col, Row } from "react-bootstrap";
import "../Dashboard.css";
import { getDates } from "../utils/authHelpers";

// Simple ErrorBoundary for Dashboard
class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // You can log errorInfo to a service here
  }
  render() {
    if (this.state.hasError) {
      return (
        <Container style={{ marginTop: 40 }}>
          <Typography variant="h4" color="error" gutterBottom>
            Something went wrong in the Dashboard.
          </Typography>
          <Typography variant="body1" color="error">
            {this.state.error?.message || "Unknown error."}
          </Typography>
        </Container>
      );
    }
    return this.props.children;
  }
}

export default Dashboard;

function Dashboard() {
  const storage = getStorage(app);
  const [imageUpload, setImageUpload] = useState(null);
  const [crnNumber, setCrnNumber] = useState("");
  const [cabinetMeetingDate, setCabinetMeetingDate] = useState("");
  const { currentUser } = useAuth();
  const functions = getFunctions(app);
  const sendMail = httpsCallable(functions, 'sendMail');
  const [dates, setDates] = useState([]);
  const [datesLoading, setDatesLoading] = useState(true);

  // Load dates from Firestore
  useEffect(() => {
    getDates().then(fetchedDates => {
      setDates(fetchedDates);
      setDatesLoading(false);
    }).catch(error => {
      console.error("Error loading dates:", error);
      setDatesLoading(false);
    });
  }, []);

  const [value, loading, error] = useCollection(
    query(
      collection(firestore, "crnUsers"),
      where("email", "array-contains", currentUser.email),
      limit(10)
    )
  );

  const uploadImage = () => {
    if (cabinetMeetingDate === "") {
      Swal.fire(
        "Cabinet Meeting Date Not Found",
        "Please select the date of the Cabinet Meeting and try again",
        "error"
      );
      return;
    } else if (crnNumber === "") {
      Swal.fire(
        "CRN Number Not Selected",
        "Please select a CRN number and try again",
        "error"
      );
      return;
    } else if (imageUpload === null) {
      Swal.fire(
        "File not found",
        "Please select a file to upload and try again",
        "error"
      );
      return;
    } else if (imageUpload.length > 5) {
      Swal.fire(
        "File Limit Reached",
        "You are not allowed to submit more than 5 files for your CRN. Please contact the Hawaii Lions Information Technology Committee at informationtechnology@hawaiilions.org or Call Lion Kobey for IT Support at (808)542-7606 for assistance.",
        "error"
      );
    } else {
      for (let i = 0; i < imageUpload.length; i++) {
        const fileRef = ref(
          storage,
          `${cabinetMeetingDate}/${crnNumber}-${
            currentUser.email
          }-${new Date().toISOString()}-${imageUpload[i].name}`
        );
        uploadBytes(fileRef, imageUpload[i]).then(() => {
          Swal.fire(
            "File Uploaded Successfully",
            "If you uploaded multiple files, this message will appear multiple times.",
            "success"
          );
        });
        sendMail({ crn: crnNumber, dest: currentUser.email })
          .then((result) => {
            // Read result of the Cloud Function.
            var sanitizedMessage = result.data.text;
            console.log(sanitizedMessage);
          });
      }
    }
  };

  const [filename, setFilename] = useState("");

  const handleFileUpload = (e) => {
    if (!e.target.files) {
      return;
    }
    const file = e.target.files[0];
    const { name } = file;
    setFilename(name);
  };

    return (
      <DashboardErrorBoundary>
        <Container
          className="align-items-center justify-content-center"
          style={{ minHeight: "100vh" }}
        >
          <Typography variant="h3" gutterBottom>
            D50 Hawaii Lions CRN Report Submission Portal
          </Typography>
          <Box mb={2} p={2} sx={{ background: '#f8f9fa', borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Instructions
            </Typography>
            <ol style={{ paddingLeft: 20, marginBottom: 0 }}>
              <li>
                <Typography variant="body1">
                  <strong>Select the Cabinet Meeting Date</strong> and <strong>CRN Number</strong> from the dropdown menus.
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  Choose the <span style={{ color: '#1976d2', fontWeight: 600 }}>MICROSOFT WORD FILE</span> you wish to upload.
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  Press the <strong>Submit</strong> button. Your upload will only be received if you press "Submit".
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  If successful, you will see a pop up with a <span style={{ color: 'green', fontWeight: 600 }}>green checkmark</span>.
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  If you do <strong>not</strong> see a pop up, or have any issues (could not upload file, website down, etc.), please contact:
                </Typography>
                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                  <li>
                    <strong>Hawaii Lions Information Technology Committee</strong><br />
                    <a href="mailto:informationtechnology@hawaiilions.org">informationtechnology@hawaiilions.org</a>
                  </li>
                  <li>
                    <strong>Call Lion Kobey for IT Support:</strong> <span style={{ fontWeight: 600 }}>(808) 542-7606</span>
                  </li>
                </ul>
                <span style={{ fontWeight: 600 }}>Mahalo!</span>
              </li>
            </ol>
          </Box>
          <Row className="padding-element">
            <Col>
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Cabinet Meeting Date</InputLabel>
                <Select
                  label="Cabinet Meeting Date"
                  value={cabinetMeetingDate}
                  onChange={(event) => {
                    setCabinetMeetingDate(event.target.value);
                  }}
                  disabled={datesLoading}
                >
                  {datesLoading && <MenuItem value="">Loading dates...</MenuItem>}
                  {!datesLoading && dates.map((date, idx) => (
                    (new Date() < date.dueDate)
                      ? <MenuItem key={date.value || idx} value={date.value}>{date.text}</MenuItem>
                      : <MenuItem key={"deadline-" + (date.value || idx)} value={""}>Deadline passed, email Cabinet Secretary to Submit CRN</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Col>
          </Row>
          <Row className="padding-element">
            <Col>
              <FormControl sx={{ minWidth: 140 }} size="small">
                <InputLabel>CRN Number</InputLabel>
                <Select
                  label="CRN Number"
                  value={crnNumber}
                  onChange={(event) => {
                    setCrnNumber(event.target.value);
                  }}
                >
                  {error && <strong>Error: {JSON.stringify(error)}</strong>}
                  {loading && <span>Collection: Loading...</span>}
                  {value &&
                    value.docs?.map((crn) => (
                        <MenuItem value={crn.id} key={crn.id}>
                          {crn.id}
                        </MenuItem>
                      ))}
                </Select>
              </FormControl>
            </Col>
          </Row>
          <Row className="padding-element">
            <Col>
              <Button variant="outlined" component="label">
                Choose File
                <input
                  type="file"
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  hidden
                  multiple={true}
                  onChange={(event) => {
                    setImageUpload(event.target.files);
                    handleFileUpload(event);
                  }}
                />
              </Button>
              &nbsp; File Choosen:{" "}
              {filename !== "" ? filename : "No File Selected"}
            </Col>
          </Row>
          <Row className="padding-element">
            <Col>
              <Button variant="outlined" onClick={uploadImage}>
                Submit
              </Button>
            </Col>
          </Row>
        </Container>
      </DashboardErrorBoundary>
  );
}
