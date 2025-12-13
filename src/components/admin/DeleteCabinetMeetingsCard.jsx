import { useState, useEffect } from "react";
import { Card } from "react-bootstrap";
import { Button, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { clearConfigCache, getDates } from "../../utils/authHelpers";
import Swal from "sweetalert2";

export default function DeleteCabinetMeetingsCard() {
  const [dates, setDates] = useState([]);
  const [datesLoading, setDatesLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Load dates from Firestore
  useEffect(() => {
    loadDates();
  }, []);

  const loadDates = async () => {
    setDatesLoading(true);
    try {
      const fetchedDates = await getDates();
      setDates(fetchedDates);
    } catch (error) {
      console.error("Error loading admin dates:", error);
    } finally {
      setDatesLoading(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!selectedDate) {
      Swal.fire("No Date Selected", "Please select a cabinet meeting date to delete.", "error");
      return;
    }

    // Find the display name for the selected date
    const selectedMeeting = dates.find(d => d.value === selectedDate);
    const displayName = selectedMeeting ? selectedMeeting.text : selectedDate;

    // Confirmation dialog
    const result = await Swal.fire({
      title: "Are you sure?",
      html: `
        <p>This will remove the cabinet meeting date from cabinet/chair portals:</p>
        <ul style="text-align: left; margin: 10px 20px;">
          <li>Cabinet Meeting: <strong>${displayName}</strong></li>
          <li>Date will be removed from users upload list</li>
        </ul>
        <p style="color: #666; font-size: 0.9em;">Note: CRN files and other data will be preserved.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const db = getFirestore();
      const datesDocRef = doc(db, "config", "dates");
      const datesDoc = await getDoc(datesDocRef);
      if (datesDoc.exists()) {
        const existingDates = datesDoc.data().dates || [];
        const updatedDates = existingDates.filter(d => d.value !== selectedDate);
        await setDoc(datesDocRef, { dates: updatedDates });
      }

      // Clear the config cache so the changes are immediately reflected
      clearConfigCache();

      // Reload dates for the dropdown
      await loadDates();

      // Success message
      Swal.fire({
        title: "Removed!",
        html: `
          <p>Cabinet meeting date "${displayName}" has been successfully removed from the system.</p>
          <p><small>All CRN files and data have been preserved.</small></p>
        `,
        icon: "success",
      });

      // Reset selection
      setSelectedDate("");
    } catch (error) {
      console.error("Error removing cabinet meeting date:", error);
      Swal.fire(
        "Error",
        `Failed to remove cabinet meeting date: ${error.message}`,
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <h2 className="text-center mb-4">Remove Cabinet Meeting Dates</h2>
      <Card.Body>
        <p style={{ marginBottom: 16 }}>
          Remove a cabinet meeting date from cabinet/chairs portal. This will not delete any CRN files already submitted. Please contact the system administrator for additional assistance.
        </p>

        <FormControl fullWidth size="small" style={{ marginBottom: 16 }}>
          <InputLabel>Select Cabinet Meeting to Remove</InputLabel>
          <Select
            label="Select Cabinet Meeting to Remove"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            disabled={datesLoading || isDeleting}
          >
            {datesLoading && <MenuItem value="">Loading dates...</MenuItem>}
            {!datesLoading && dates.length === 0 && (
              <MenuItem value="" disabled>
                No cabinet meetings found
              </MenuItem>
            )}
            {!datesLoading &&
              dates.map((date, idx) => (
                <MenuItem key={date.value || idx} value={date.value}>
                  {date.text} ({date.value})
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="error"
          onClick={handleDeleteMeeting}
          disabled={!selectedDate || isDeleting || datesLoading}
          fullWidth
        >
          {isDeleting ? "Removing..." : "Remove Cabinet Meeting Date"}
        </Button>
      </Card.Body>
    </Card>
  );
}
