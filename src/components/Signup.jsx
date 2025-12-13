import { Card, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function Signup() {
  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <Card>
          <h2 className="text-center mb-4">Sign Up Disabled</h2>
          <Card.Body>
            To Sign Up, Contact the D50 Hawaii Lions Information Technology
            Committee at informationtechnology@hawaiilions.org or Call Lion
            Kobey at (808)542-7606
          </Card.Body>
        </Card>
        <div className="w-100 text-center mt-2">
          Already have an account? <Link to="/login">Log In</Link>
        </div>
      </div>
    </Container>
  );
}
