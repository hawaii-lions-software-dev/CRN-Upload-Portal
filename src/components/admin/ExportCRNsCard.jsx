import { useState, useEffect } from "react";
import { Card } from "react-bootstrap";
import { Button, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import Swal from "sweetalert2";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { getStorage, listAll, ref, getDownloadURL } from "firebase/storage";
import { adminDates } from "../../utils/authHelpers";

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

export default function ExportCRNsCard() {
  const [dates, setDates] = useState([]);
  const [datesLoading, setDatesLoading] = useState(true);
  const [cabinetMeetingDate, setCabinetMeetingDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Load dates from Firestore
  useEffect(() => {
    adminDates()
      .then((fetchedDates) => {
        setDates(fetchedDates);
        setDatesLoading(false);
      })
      .catch((error) => {
        console.error("Error loading admin dates:", error);
        setDatesLoading(false);
      });
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleExportFileClick = async () => {
    if (cabinetMeetingDate === "") {
      Swal.fire(
        "Cabinet Meeting Date Not Found",
        "Please select the date of the Cabinet Meeting for the CRNs to export. ",
        "error"
      );
      return;
    }

    if (isExporting || cooldownSeconds > 0) {
      return; // Prevent multiple clicks or clicks during cooldown
    }

    setIsExporting(true);
    try {
      await downloadFolderAsZip(cabinetMeetingDate);
      Swal.fire(
        "Export Successful",
        "The CRN files have been downloaded as a ZIP file.",
        "success"
      );
      // Start 20-second cooldown after successful export
      setCooldownSeconds(20);
    } catch (error) {
      console.error("Error exporting files:", error);
      Swal.fire(
        "Export Failed",
        "An error occurred while exporting the files. Please try again.",
        "error"
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <h2 className="text-center mb-4">Export CRNs</h2>
      <Card.Body>
        Please select the Cabinet Meeting Date, then click the "Export CRN's in
        Database" to download a zip file.
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
            disabled={datesLoading}
          >
            {datesLoading && <MenuItem value="">Loading dates...</MenuItem>}
            {!datesLoading &&
              dates.map((date, idx) => (
                <MenuItem key={date.value || idx} value={date.value}>
                  {date.text}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <Button
          onClick={handleExportFileClick}
          disabled={isExporting || cooldownSeconds > 0}
        >
          {isExporting
            ? "Exporting..."
            : cooldownSeconds > 0
            ? `Wait ${cooldownSeconds}s...`
            : `Export CRN's in Database for ${
                cabinetMeetingDate !== "" ? cabinetMeetingDate : "N/A"
              }`}
        </Button>
      </Card.Body>
    </Card>
  );
}
