import JSZip from "jszip";
import { saveAs } from "file-saver";
import React, { useState } from "react";
import { Card, Container, Modal } from "react-bootstrap";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, listAll, ref, getDownloadURL } from "firebase/storage";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import Swal from "sweetalert2";
import { adminDates } from "../utils/authHelpers";

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
  const dates = adminDates();
  const [cabinetMeetingDate, setCabinetMeetingDate] = useState("");
  const [crnNumber, setCrnNumber] = useState("");
  const [modalShow, setModalShow] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalEditMode, setModalEditMode] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const handleEditEmailArray = () => {
    setModalEditMode(true);
  };

  const handleEmailChange = (idx, value) => {
    setModalData((prev) => {
      const arr = [...prev];
      arr[idx] = value;
      return arr;
    });
  };

  const handleAddEmail = () => {
    setModalData((prev) => [...prev, ""]);
  };

  const handleRemoveEmail = (idx) => {
    setModalData((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveEmailArray = async () => {
    setModalSaving(true);
    setModalError("");
    try {
      const db = getFirestore();
      const docRef = doc(db, "crnUsers", crnNumber);
      await updateDoc(docRef, { email: modalData });
      setModalEditMode(false);
    } catch (err) {
      setModalError("Error saving email array: " + err.message);
    }
    setModalSaving(false);
  };
  const [modalError, setModalError] = useState("");

  const handleCrnInputChange = (e) => {
    // Only allow integer input
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setCrnNumber(value);
    }
  };

  const handleQueryCrnUser = async () => {
    setModalError("");
    setModalData([]);
    if (!crnNumber) {
      setModalError("Please enter a CRN number.");
      setModalShow(true);
      return;
    }
    try {
      const db = getFirestore();
      const docRef = doc(db, "crnUsers", crnNumber);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data?.email)) {
          setModalData(data.email);
        } else {
          setModalError("Document found, but no 'email' array field present.");
        }
      } else {
        setModalError("No document found for this CRN number.");
      }
    } catch (err) {
      setModalError("Error fetching document: " + err.message);
    }
    setModalShow(true);
  };

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
          <h2 className="text-center mb-4">Export CRNs</h2>
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
                {
                  dates.map((date, idx) => (
                    <MenuItem key={date.value || idx} value={date.value}>{date.text}</MenuItem>
                  ))
                }
              </Select>
            </FormControl>
            <Button onClick={handleExportFileClick}>
              Export CRN's in Database for{" "}
              {cabinetMeetingDate !== "" ? cabinetMeetingDate : "N/A"}
            </Button>
          </Card.Body>
        </Card>

        <br />

        <Card>
          <h2 className="text-center mb-4">CRN Number Changes</h2>
          <Card.Body>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="crnNumberInput">Enter CRN Number:</label>
              <input
                id="crnNumberInput"
                type="text"
                value={crnNumber}
                onChange={handleCrnInputChange}
                style={{ marginLeft: 8, width: 120 }}
                placeholder="e.g. 123"
              />
              <Button
                style={{ marginLeft: 12 }}
                variant="primary"
                onClick={handleQueryCrnUser}
              >
                Query CRN User
              </Button>
            </div>
            <Modal show={modalShow} onHide={() => setModalShow(false)}>
              <Modal.Header closeButton>
                <Modal.Title>CRN User Data</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {modalError ? (
                  <div style={{ color: 'red' }}>{modalError}</div>
                ) : (
                  <>
                    <div>Email array for CRN {crnNumber}:</div>
                    {modalEditMode ? (
                      <>
                        {modalData.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                            <input
                              type="text"
                              value={item}
                              onChange={e => handleEmailChange(idx, e.target.value)}
                              style={{ flex: 1, marginRight: 8 }}
                            />
                            <Button variant="danger" size="sm" onClick={() => handleRemoveEmail(idx)}>
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button variant="secondary" size="sm" onClick={handleAddEmail} style={{ marginBottom: 8 }}>
                          Add Email
                        </Button>
                        <br />
                        <Button variant="success" onClick={handleSaveEmailArray} disabled={modalSaving}>
                          {modalSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button variant="secondary" style={{ marginLeft: 8 }} onClick={() => setModalEditMode(false)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <ul>
                          {modalData.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                        <Button variant="primary" onClick={handleEditEmailArray} style={{ marginTop: 8 }}>
                          Edit
                        </Button>
                      </>
                    )}
                  </>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setModalShow(false)}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
}
