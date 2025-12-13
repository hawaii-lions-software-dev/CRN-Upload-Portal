import React, { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Alert } from "react-bootstrap";

function Navbar() {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [error, setError] = useState("");
  const { currentUser, logout, isUserAdmin, adminCheckLoading } = useAuth();
  const navigate = useNavigate();

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  async function handleLogout() {
    setError("");
    try {
      await logout();
      navigate("/login");
    } catch {
      setError("Failed to log out");
    }
  }

  return (
    <div>
      <AppBar position="static" style={{ marginBottom: "35px" }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {/* Desktop Logo */}
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                display: { xs: "none", md: "flex" },
                fontWeight: 700,
                letterSpacing: ".1rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              D50 Hawaii Lions CRN Portal
            </Typography>

            {/* Mobile Logo */}
            <Typography
              variant="h5"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                display: { xs: "flex", md: "none" },
                flexGrow: 1,
                fontWeight: 700,
                letterSpacing: ".1rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              D50 CRN Portal
            </Typography>

            {/* Desktop Navigation Buttons */}
            {currentUser && (
              <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, ml: 3, gap: 2 }}>
                <Button
                  component={Link}
                  to="/"
                  sx={{ my: 2, color: "white", display: "flex", alignItems: "center" }}
                  startIcon={<HomeIcon />}
                >
                  Home
                </Button>
                <Button
                  component={Link}
                  to="/edit-profile"
                  sx={{ my: 2, color: "white", display: "flex", alignItems: "center" }}
                  startIcon={<PersonIcon />}
                >
                  Edit Profile
                </Button>
                {!adminCheckLoading && isUserAdmin && (
                  <Button
                    component={Link}
                    to="/admin"
                    sx={{ my: 2, color: "white", display: "flex", alignItems: "center" }}
                    startIcon={<AdminPanelSettingsIcon />}
                  >
                    Admin
                  </Button>
                )}
                <Button
                  onClick={handleLogout}
                  sx={{ my: 2, color: "white", display: "flex", alignItems: "center" }}
                  startIcon={<LogoutIcon />}
                >
                  Log Out
                </Button>
              </Box>
            )}

            {/* Hamburger Menu (Mobile and Desktop) */}
            {currentUser && (
              <Box>
                <IconButton
                  size="large"
                  aria-label="navigation menu"
                  onClick={handleOpenNavMenu}
                  color="inherit"
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorElNav}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorElNav)}
                  onClose={handleCloseNavMenu}
                >
                  <MenuItem component={Link} to="/" onClick={handleCloseNavMenu}>
                    <HomeIcon sx={{ mr: 1 }} />
                    <Typography>Home</Typography>
                  </MenuItem>
                  <MenuItem component={Link} to="/edit-profile" onClick={handleCloseNavMenu}>
                    <PersonIcon sx={{ mr: 1 }} />
                    <Typography>Edit Profile</Typography>
                  </MenuItem>
                  {!adminCheckLoading && isUserAdmin && (
                    <MenuItem component={Link} to="/admin" onClick={handleCloseNavMenu}>
                      <AdminPanelSettingsIcon sx={{ mr: 1 }} />
                      <Typography>Admin</Typography>
                    </MenuItem>
                  )}
                  <MenuItem onClick={() => { handleCloseNavMenu(); handleLogout(); }}>
                    <LogoutIcon sx={{ mr: 1 }} />
                    <Typography>Log Out</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      {error && (
        <Alert variant="danger" style={{ marginBottom: "35px" }}>
          {error}
        </Alert>
      )}
    </div>
  );
}

export default Navbar;
