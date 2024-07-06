import JSZip from "jszip";
import { saveAs } from "file-saver";
import React, { useState } from "react";
import { Card, Container } from "react-bootstrap";
import { getStorage, listAll, ref, getDownloadURL } from "firebase/storage";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import Swal from "sweetalert2";

const downloadFolderAsZip = async (cabinetMeetingDate) => {
  const jszip = new JSZip();
  const storage = getStorage();
  const folderRef = ref(storage, cabinetMeetingDate);
  const folder = await listAll(folderRef);
  const promises = folder.items
    .map(async (item) => {
      const fileRef = ref(storage, item.fullPath);
      const fileBlob = await getDownloadURL(fileRef).then((url) => {
        return fetch(url).then((response) => response.blob());
      });
      jszip.file(item.name, fileBlob);
    })
    .reduce((acc, curr) => acc.then(() => curr), Promise.resolve());
  await promises;
  const blob = await jszip.generateAsync({ type: "blob" });
  saveAs(blob, `${cabinetMeetingDate}-CRNs.zip`);
};

export default function Admin() {
  const [cabinetMeetingDate, setCabinetMeetingDate] = useState("");

  const handleExportFileClick = () => {
    if (cabinetMeetingDate === "") {
      Swal.fire(
        "Cabinet Meeting Date Not Found",
        "Please select the date of the Cabinet Meeting for the CRNs to export. ",
        "error"
      );
      return;
    }
    downloadFolderAsZip(cabinetMeetingDate);
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <h1 className="text-center mb-4">Admin Panel</h1>
        <Card>
          <h2 className="text-center mb-4">Export CRN's</h2>
          <Card.Body>
            Please select the Cabinet Meeting Date, then click the "Export CRN's
            in Database" to download a zip file.
            <br />
            <br />
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Cabinet Meeting Date</InputLabel>
              <Select
                label="Cabinet Meeting Date"
                value={cabinetMeetingDate}
                onChange={(event) => {
                  setCabinetMeetingDate(event.target.value);
                }}
              >
                <MenuItem value={"01-28-2023"}>1/28/2023</MenuItem>
                <MenuItem value={"04-27-2023"}>4/27/2023</MenuItem>
                <MenuItem value={"08-26-2023"}>8/26/2023</MenuItem>
                <MenuItem value={"11-18-2023"}>11/18/2023</MenuItem>
                <MenuItem value={"01-27-2024"}>1/27/2024</MenuItem>
                <MenuItem value={"04-26-2024"}>4/26/2024</MenuItem>
              </Select>
            </FormControl>
            <Button onClick={handleExportFileClick}>
              Export CRN's in Database for{" "}
              {cabinetMeetingDate !== "" ? cabinetMeetingDate : "N/A"}
            </Button>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
}
