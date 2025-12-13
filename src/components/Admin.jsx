import JSZip from "jszip";
import { saveAs } from "file-saver";
import React, { useState, useEffect } from "react";
import { Card, Container, Modal } from "react-bootstrap";
import { getFirestore, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { getAuth, fetchSignInMethodsForEmail } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage, listAll, ref, getDownloadURL } from "firebase/storage";
import { app } from "../firebase";
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
  const [dates, setDates] = useState([]);
  const [datesLoading, setDatesLoading] = useState(true);
  const [cabinetMeetingDate, setCabinetMeetingDate] = useState("");
  const [crnNumber, setCrnNumber] = useState("");
  const [modalShow, setModalShow] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalEditMode, setModalEditMode] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  
  // Load dates from Firestore
  useEffect(() => {
    adminDates().then(fetchedDates => {
      setDates(fetchedDates);
      setDatesLoading(false);
    }).catch(error => {
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
    // Pad with 0 if under 10 and not already padded
    let saveCrn = crnNumber;
    if (/^\d+$/.test(crnNumber) && Number(crnNumber) < 10 && crnNumber.length < 2) {
      saveCrn = "0" + Number(crnNumber);
    }
    try {
      const db = getFirestore();
      const docRef = doc(db, "crnUsers", saveCrn);
      await updateDoc(docRef, { email: modalData });

      // Create Firebase Auth accounts for new emails using a Cloud Function (to avoid logging in as the new user)
      const auth = getAuth();
      const functions = getFunctions(app);
      const createUser = httpsCallable(functions, "adminCreateUser");
      for (const email of modalData) {
        try {
          // Check if email already has an account
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if ((!methods || methods.length === 0) && !!email) {
            // Call Cloud Function to create user with default password
            await createUser({ email: email, password: "imuagary" });
          }
        } catch (err) {
          // Ignore error if user already exists, otherwise show error
          if (err.code !== "auth/email-already-in-use") {
            setModalError("Error creating user for " + email + ": " + err.message);
            setModalSaving(false);
            return;
          }
        }
      }

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
    // Pad with 0 if under 10 and not already padded
    let lookupCrn = crnNumber;
    if (/^\d+$/.test(crnNumber) && Number(crnNumber) < 10 && crnNumber.length < 2) {
      lookupCrn = "0" + Number(crnNumber);
    }
    try {
      const db = getFirestore();
      const docRef = doc(db, "crnUsers", lookupCrn);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data?.email)) {
          setModalData(data.email);
        } else {
          setModalError("Document found, but no 'email' array field present.");
        }
      } else {
        // Create new document with empty email array
        await setDoc(docRef, { email: [] });
        setModalData([]);
      }
    } catch (err) {
      setModalError("Error fetching document: " + err.message);
    }
    setModalShow(true);
  };

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
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <h1 className="text-center mb-4">Admin Panel</h1>

        <Card>
          <h2 className="text-center mb-4">New Cabinet Meetings</h2>
          <Card.Body>
            To create new cabinet meetings, please contact Kobey Arai at kobeyarai@hawaiilions.org. Specify date of the cabinet meeting and CRN Portal submission close date. Functionality to do so in the portal will be created at a later date.
          </Card.Body>
        </Card>

        <br />


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
                disabled={datesLoading}
              >
                {datesLoading && <MenuItem value="">Loading dates...</MenuItem>}
                {!datesLoading && dates.map((date, idx) => (
                    <MenuItem key={date.value || idx} value={date.value}>{date.text}</MenuItem>
                  ))
                }
              </Select>
            </FormControl>
            <Button onClick={handleExportFileClick} disabled={isExporting || cooldownSeconds > 0}>
              {isExporting 
                ? "Exporting..." 
                : cooldownSeconds > 0 
                  ? `Wait ${cooldownSeconds}s...`
                  : `Export CRN's in Database for ${cabinetMeetingDate !== "" ? cabinetMeetingDate : "N/A"}`
              }
            </Button>
          </Card.Body>
        </Card>

        <br />

        <Card>
          <h2 className="text-center mb-4">CRN Number Changes</h2>
          <Card.Body>
            <div style={{ marginBottom: 16 }}>
              <strong>Use this to View/Update who has access to a specific CRN number.</strong>
            </div>
            
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <label htmlFor="crnNumberInput">Enter CRN Number:</label>
              <input
                id="crnNumberInput"
                type="text"
                value={crnNumber}
                onChange={handleCrnInputChange}
                style={{ marginLeft: 8, width: 120 }}
                placeholder="e.g. 123"
              />
              
              <Button onClick={handleQueryCrnUser}>
              Query CRN User
            </Button>
            <div className="mb-3">
              <div className="alert alert-info" style={{ fontSize: '1rem', lineHeight: '1.7', padding: '1rem' }}>
                <strong>Frequent Issues:</strong>
                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                  <li>
                    <strong>A Lion has successfully logged in but cannot see their CRN Number:</strong><br />
                    Ensure you have inputted the correct email address <span style={{ fontStyle: 'italic' }}>(ask the Lion what email they signed in with)</span>.
                  </li>
                  <li>
                    <strong>A Lion has forgot their password:</strong><br />
                    Instruct them the default password is <span style={{ fontWeight: 'bold', color: '#d63384' }}>&quot;imuagary&quot;</span>. If that does not work, instruct them to reset their password using <span style={{ fontWeight: 'bold' }}>&quot;Forgot Password?&quot;</span>.
                  </li>
                </ul>
              </div>
            </div>
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
                    <div>Email addresses for CRN {crnNumber}:</div>
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

        {/* <br /> */}

        {/* Delete all CRN Users section */}
        {/* <Card>
          <h2 className="text-center mb-4">DO NOT USE: Danger Zone</h2>
          <Card.Body>
            <Button variant="outlined" color="error" onClick={async () => {
              const db = getFirestore();
              const colRef = db.collection ? db.collection("crnUsers") : null;
              // Use Firestore v9 modular API
              const { getDocs, collection, deleteDoc } = await import("firebase/firestore");
              const docsSnap = await getDocs(collection(db, "crnUsers"));
              if (docsSnap.empty) {
                Swal.fire("No documents found", "crnUsers collection is already empty.", "info");
                return;
              }
              Swal.fire({
                title: "Are you sure?",
                text: `This will delete ALL CRN User documents (${docsSnap.size}). This cannot be undone!`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Delete All",
                cancelButtonText: "Cancel"
              }).then(async (result) => {
                if (result.isConfirmed) {
                  let errorCount = 0;
                  for (const doc of docsSnap.docs) {
                    try {
                      await deleteDoc(doc.ref);
                    } catch {
                      errorCount++;
                    }
                  }
                  Swal.fire(
                    errorCount === 0 ? "All documents deleted!" : "Some documents failed to delete.",
                    errorCount === 0 ? "All CRN User documents have been deleted." : `${errorCount} documents failed to delete.`,
                    errorCount === 0 ? "success" : "error"
                  );
                }
              });
            }}>
              Delete ALL CRN User Documents
            </Button>
          </Card.Body>
        </Card> */}
      </div>
    </Container>
  );
}
