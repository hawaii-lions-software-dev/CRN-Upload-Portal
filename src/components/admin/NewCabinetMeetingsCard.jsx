import React, { useState } from "react";
import { Card, Form } from "react-bootstrap";
import { Button, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { clearConfigCache } from "../../utils/authHelpers";
import Swal from "sweetalert2";

export default function NewCabinetMeetingsCard() {
  const [cabinetMeetingDate, setCabinetMeetingDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateMeeting = async () => {
    // Validation
    if (!cabinetMeetingDate) {
      Swal.fire("Missing Information", "Please select a cabinet meeting date.", "error");
      return;
    }
    if (!dueDate) {
      Swal.fire("Missing Information", "Please select a due date for CRN submissions.", "error");
      return;
    }
    if (!displayName.trim()) {
      Swal.fire("Missing Information", "Please enter a display name for the cabinet meeting.", "error");
      return;
    }

    // Check if due date is before cabinet meeting date
    if (dueDate.isAfter(cabinetMeetingDate) || dueDate.isSame(cabinetMeetingDate, 'day')) {
      Swal.fire(
        "Invalid Dates",
        "The due date must be before the cabinet meeting date.",
        "error"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const db = getFirestore();
      
      // Format the cabinet meeting date as MM-DD-YYYY for storage key
      const month = String(cabinetMeetingDate.month() + 1).padStart(2, "0");
      const day = String(cabinetMeetingDate.date()).padStart(2, "0");
      const year = cabinetMeetingDate.year();
      const formattedValue = `${month}-${day}-${year}`;

      // Create new date entry for user-facing dates (config/dates)
      const datesDocRef = doc(db, "config", "dates");
      const datesDoc = await getDoc(datesDocRef);
      const existingDates = datesDoc.exists() ? datesDoc.data().dates || [] : [];
      
      // Check if this date already exists
      if (existingDates.some(d => d.value === formattedValue)) {
        Swal.fire(
          "Date Already Exists",
          "A cabinet meeting with this date already exists in the system.",
          "error"
        );
        setIsSubmitting(false);
        return;
      }

      const newDateEntry = {
        value: formattedValue,
        text: displayName.trim(),
        dueDate: dueDate.toDate().toISOString()
      };

      // Update config/dates document
      await setDoc(datesDocRef, {
        dates: [...existingDates, newDateEntry]
      });

      // Create new date entry for admin dates (config/adminDates)
      const adminDatesDocRef = doc(db, "config", "adminDates");
      const adminDatesDoc = await getDoc(adminDatesDocRef);
      const existingAdminDates = adminDatesDoc.exists() ? adminDatesDoc.data().dates || [] : [];

      const newAdminDateEntry = {
        value: formattedValue,
        text: displayName.trim()
      };

      // Update config/adminDates document
      await setDoc(adminDatesDocRef, {
        dates: [...existingAdminDates, newAdminDateEntry]
      });

      // Clear the config cache so the new dates are immediately available
      clearConfigCache();

      // Success message
      Swal.fire(
        "Cabinet Meeting Created!",
        `Successfully created cabinet meeting "${displayName.trim()}" for ${formattedValue} with due date ${dueDate.format('M/D/YYYY')}.`,
        "success"
      );

      // Reset form
      setCabinetMeetingDate(null);
      setDueDate(null);
      setDisplayName("");
    } catch (error) {
      console.error("Error creating cabinet meeting:", error);
      Swal.fire(
        "Error",
        `Failed to create cabinet meeting: ${error.message}`,
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <h2 className="text-center mb-4">New Cabinet Meetings</h2>
      <Card.Body>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Display Name</Form.Label>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g., January 2026 Cabinet Meeting"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isSubmitting}
              />
              <Form.Text className="text-muted">
                This is how the cabinet meeting will be displayed to users.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Cabinet Meeting Date</Form.Label>
              <DatePicker
                value={cabinetMeetingDate}
                onChange={(newValue) => setCabinetMeetingDate(newValue)}
                disabled={isSubmitting}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                  },
                }}
              />
              <Form.Text className="text-muted">
                The actual date of the cabinet meeting.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>CRN Submission Due Date</Form.Label>
              <DatePicker
                value={dueDate}
                onChange={(newValue) => setDueDate(newValue)}
                disabled={isSubmitting}
                maxDate={cabinetMeetingDate ? cabinetMeetingDate.subtract(1, 'day') : undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                  },
                }}
              />
              <Form.Text className="text-muted">
                Deadline for clubs to submit their CRN reports (must be before the cabinet meeting date).
              </Form.Text>
            </Form.Group>

            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateMeeting}
              disabled={isSubmitting}
              fullWidth
            >
              {isSubmitting ? "Creating..." : "Create Cabinet Meeting"}
            </Button>
          </Form>
        </LocalizationProvider>
      </Card.Body>
    </Card>
  );
}
