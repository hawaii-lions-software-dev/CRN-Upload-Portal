import React from "react";
import { Container } from "react-bootstrap";
import NewCabinetMeetingsCard from "./admin/NewCabinetMeetingsCard";
import ExportCRNsCard from "./admin/ExportCRNsCard";
import CRNNumberChangesCard from "./admin/CRNNumberChangesCard";

export default function Admin() {
  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <h1 className="text-center mb-4">Admin Panel</h1>

        <NewCabinetMeetingsCard />

        <br />

        <ExportCRNsCard />

        <br />

        <CRNNumberChangesCard />
      </div>
    </Container>
  );
}

