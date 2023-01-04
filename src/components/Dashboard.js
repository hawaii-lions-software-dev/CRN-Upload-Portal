import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Container,
} from "@mui/material";
import Swal from "sweetalert2";
import { app, firestore } from "../firebase";
import { getStorage, uploadBytes, ref } from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";
import { where, limit, query, collection } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";

export default function Dashboard() {
  const storage = getStorage(app);
  const [imageUpload, setImageUpload] = useState(null);
  const [crnNumber, setCrnNumber] = useState("");
  const [cabinetMeetingDate, setCabinetMeetingDate] = useState("");
  const { currentUser } = useAuth();

  const [value, loading, error] = useCollection(
    query(
      collection(firestore, "users"),
      where("email", "==", currentUser.email),
      limit(1)
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
        "You are not allowed to submit more than 5 files for your CRN. Please contact the Hawaii Lions Information Technology Committee at information-technology@hawaiilions.org or Call Lion Kobey for IT Support at (808)542-7606 for assistance.",
        "error"
      );
    } else {
      for (let i = 0; i < imageUpload.length; i++) {
        const fileRef = ref(
          storage,
          `${cabinetMeetingDate}/${crnNumber}-${new Date().toISOString()}-${
            imageUpload[i].name
          }`
        );
        uploadBytes(fileRef, imageUpload[i]).then(() => {
          Swal.fire(
            "File Uploaded Successfully",
            "If you uploaded multiple files, this message will appear multiple times.",
            "success"
          );
        });
      }
    }
  };

  return (
    <>
      <Container
        className="align-items-center justify-content-center"
        style={{ minHeight: "100vh" }}
      >
        <Typography variant="h3" gutterBottom>
          D50 Hawaii Lions CRN Report Submission Portal
        </Typography>
        <Typography variant="body1" gutterBottom>
          Please select the Cabinet Meeting Date and CRN Number. When these
          options are selected, choose the file that you wish to upload, then
          press the submit button. Your upload will only be recieved if you
          press the "Submit" button. If successful, you should see a pop up with
          a green checkmark. If you do not see a pop up, please contact the
          Hawaii Lions Information Technology Committee at
          information-technology@hawaiilions.org or Call Lion Kobey for IT
          Support at (808)542-7606. Mahalo!
        </Typography>
        <br />
        <Typography variant="body1" gutterBottom>
          If you need help or have questions, please contact the Hawaii Lions
          Information Technology Committee at
          information-technology@hawaiilions.org or Call Lion Kobey for IT
          Support at (808)542-7606. Mahalo!
        </Typography>
        <br />
        <FormControl sx={{ m: 1, minWidth: 200 }} size="small">
          <InputLabel>Cabinet Meeting Date</InputLabel>
          <Select
            label="Cabinet Meeting Date"
            value={cabinetMeetingDate}
            onChange={(event) => {
              setCabinetMeetingDate(event.target.value);
            }}
          >
            <MenuItem value={"01-28-2023"}>1/28/2023</MenuItem>
          </Select>
        </FormControl>
        <br />
        <FormControl sx={{ m: 1, minWidth: 140 }} size="small">
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
              value.docs[0].data().CRNs.map((crn) => (
                <MenuItem value={crn} key={crn}>
                  {crn}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <br />
        <Button variant="outlined" component="label">
          Choose File
          <input
            type="file"
            hidden
            multiple={true}
            onChange={(event) => {
              setImageUpload(event.target.files);
            }}
          />
        </Button>
        <br />
        <br />
        <Button variant="outlined" onClick={uploadImage}>
          Submit
        </Button>
      </Container>
    </>
  );
}
