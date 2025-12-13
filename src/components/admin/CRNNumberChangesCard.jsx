import React, { useState } from "react";
import { Card, Modal } from "react-bootstrap";
import { Button } from "@mui/material";
import { getFirestore, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { getAuth, fetchSignInMethodsForEmail } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../firebase";

export default function CRNNumberChangesCard() {
  const [crnNumber, setCrnNumber] = useState("");
  const [modalShow, setModalShow] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalEditMode, setModalEditMode] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState("");

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

  return (
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

          <Button onClick={handleQueryCrnUser}>Query CRN User</Button>
          <div className="mb-3">
            <div
              className="alert alert-info"
              style={{ fontSize: "1rem", lineHeight: "1.7", padding: "1rem" }}
            >
              <strong>Frequent Issues:</strong>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>
                  <strong>
                    A Lion has successfully logged in but cannot see their CRN Number:
                  </strong>
                  <br />
                  Ensure you have inputted the correct email address{" "}
                  <span style={{ fontStyle: "italic" }}>
                    (ask the Lion what email they signed in with)
                  </span>
                  .
                </li>
                <li>
                  <strong>A Lion has forgot their password:</strong>
                  <br />
                  Instruct them the default password is{" "}
                  <span style={{ fontWeight: "bold", color: "#d63384" }}>
                    &quot;imuagary&quot;
                  </span>
                  . If that does not work, instruct them to reset their password using{" "}
                  <span style={{ fontWeight: "bold" }}>
                    &quot;Forgot Password?&quot;
                  </span>
                  .
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
              <div style={{ color: "red" }}>{modalError}</div>
            ) : (
              <>
                <div>Email addresses for CRN {crnNumber}:</div>
                {modalEditMode ? (
                  <>
                    {modalData.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleEmailChange(idx, e.target.value)}
                          style={{ flex: 1, marginRight: 8 }}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveEmail(idx)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAddEmail}
                      style={{ marginBottom: 8 }}
                    >
                      Add Email
                    </Button>
                    <br />
                    <Button
                      variant="success"
                      onClick={handleSaveEmailArray}
                      disabled={modalSaving}
                    >
                      {modalSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="secondary"
                      style={{ marginLeft: 8 }}
                      onClick={() => setModalEditMode(false)}
                    >
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
                    <Button
                      variant="primary"
                      onClick={handleEditEmailArray}
                      style={{ marginTop: 8 }}
                    >
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
  );
}
