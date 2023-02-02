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
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Alert } from "react-bootstrap";

const pages = ["edit-profile"];
const settings = ["edit-profile"];

function Navbar() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const [error, setError] = useState("");
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
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

            {currentUser && (
              <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleOpenNavMenu}
                  color="inherit"
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorElNav}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                  open={Boolean(anchorElNav)}
                  onClose={handleCloseNavMenu}
                  sx={{
                    display: { xs: "block", md: "none" },
                  }}
                >
                  {pages.map((page) => (
                    <MenuItem key={page} onClick={handleCloseNavMenu}>
                      <Typography textAlign="center">
                        <Link
                          to={`/${page}`}
                          style={{ textDecoration: "none", color: "black" }}
                        >
                          {page}
                        </Link>
                      </Typography>
                    </MenuItem>
                  ))}
                  {currentUser.email === "lionjeffching@gmail.com" && (
                    <MenuItem key="admin" onClick={handleCloseUserMenu}>
                      <Typography textAlign="center">
                        <Link
                          to={"admin"}
                          style={{ textDecoration: "none", color: "black" }}
                        >
                          admin
                        </Link>
                      </Typography>
                    </MenuItem>
                  )}
                  <MenuItem key="logout" onClick={handleCloseUserMenu}>
                    <Typography textAlign="center">
                      <Button
                        onClick={handleLogout}
                        style={{ textDecoration: "none", color: "black" }}
                      >
                        Log out
                      </Button>
                    </Typography>
                  </MenuItem>
                </Menu>
              </Box>
            )}
            {/* <AdbIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} /> */}
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
            {currentUser && (
              <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
                {pages.map((page) => (
                  <Button
                    key={page}
                    onClick={handleCloseNavMenu}
                    sx={{ my: 2, color: "white", display: "block" }}
                  >
                    <Link
                      to={`/${page}`}
                      style={{ textDecoration: "none", color: "white" }}
                    >
                      {page}
                    </Link>
                  </Button>
                ))}
                {currentUser.email === "lionjeffching@gmail.com" && (
                  <Button
                    key="admin"
                    onClick={handleCloseUserMenu}
                    sx={{ my: 2, color: "white", display: "block" }}
                  >
                    <Link
                      to="/admin"
                      style={{ textDecoration: "none", color: "white" }}
                    >
                      admin
                    </Link>
                  </Button>
                )}
                <MenuItem key="logout" onClick={handleCloseUserMenu}>
                  <Typography textAlign="center">
                    <Button
                      onClick={handleLogout}
                      style={{ textDecoration: "none", color: "white" }}
                    >
                      Log out
                    </Button>
                  </Typography>
                </MenuItem>
              </Box>
            )}

            {currentUser && (
              <Box sx={{ flexGrow: 0 }}>
                <Tooltip title="Open settings">
                  <Button
                    onClick={handleOpenUserMenu}
                    sx={{ p: 0 }}
                    style={{ textDecoration: "none", color: "white" }}
                  >
                    My Account
                  </Button>
                </Tooltip>
                <Menu
                  sx={{ mt: "45px" }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  {settings.map((setting) => (
                    <MenuItem key={setting} onClick={handleCloseUserMenu}>
                      <Typography textAlign="center">
                        <Link
                          to={`/${setting}`}
                          style={{ textDecoration: "none", color: "black" }}
                        >
                          {setting}
                        </Link>
                      </Typography>
                    </MenuItem>
                  ))}
                  {currentUser.email === "lionjeffching@gmail.com" && (
                    <MenuItem key="admin" onClick={handleCloseUserMenu}>
                      <Typography textAlign="center">
                        <Link
                          to={"admin"}
                          style={{ textDecoration: "none", color: "black" }}
                        >
                          admin
                        </Link>
                      </Typography>
                    </MenuItem>
                  )}
                  <MenuItem key="logout" onClick={handleCloseUserMenu}>
                    <Typography textAlign="center">
                      <Button onClick={handleLogout}>Log out</Button>
                    </Typography>
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
