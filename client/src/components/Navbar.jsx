import { NavLink, useNavigate, Link } from 'react-router-dom';
import { Navbar as BsNavbar, Nav, Container, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <BsNavbar bg="white" expand="lg" className="border-bottom shadow-sm">
      <Container>
        <BsNavbar.Brand as={Link} to="/" className="text-success">
          <i className="bi bi-trophy-fill me-1" /> Golato
        </BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="main-nav" />
        <BsNavbar.Collapse id="main-nav">
          <Nav className="ms-auto align-items-lg-center gap-1">
            {!user && (
              <>
                <Nav.Link as={NavLink} to="/login">Sign in</Nav.Link>
                <Nav.Link as={NavLink} to="/register">Sign up</Nav.Link>
              </>
            )}
            {user?.role === 'owner' && (
              <>
                <Nav.Link as={NavLink} to="/owner" end>My stadiums</Nav.Link>
                <Nav.Link as={NavLink} to="/owner/stadiums/new">Add stadium</Nav.Link>
                <Nav.Link as={NavLink} to="/owner/stats">Statistics</Nav.Link>
                <Nav.Link as={NavLink} to="/owner/messages">Messages</Nav.Link>
              </>
            )}
            {user?.role === 'user' && (
              <>
                <Nav.Link as={NavLink} to="/" end>Browse</Nav.Link>
                <Nav.Link as={NavLink} to="/reservations">My reservations</Nav.Link>
                <Nav.Link as={NavLink} to="/messages">Messages</Nav.Link>
              </>
            )}
            {user && (
              <Button
                variant="light"
                size="sm"
                className="ms-2"
                onClick={() => { logout(); navigate('/'); }}
              >
                Sign out ({user.name})
              </Button>
            )}
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
}
