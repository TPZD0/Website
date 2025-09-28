import * as React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  Box,
  ListItemIcon,
} from "@mui/material";
import { useRouter } from "next/router";
import Link from "next/link";
import FunctionsIcon from "@mui/icons-material/Functions";
import Divider from "@mui/material/Divider";
import PersonIcon from "@mui/icons-material/Person";
import useBearStore from "@/store/useBearStore";

const NavigationLayout = ({ children }) => {
  const router = useRouter();
  const appName = useBearStore((state) => state.appName);

  return (
    <>
      <AppBar position="sticky" sx={{ backgroundColor: "#ff5e15" }}>
        <Toolbar>
          <Link href={"/"}>
            <FunctionsIcon sx={{ color: "#ffffff" }} fontSize="large" />
          </Link>
          <Typography
            variant="body1"
            sx={{
              fontSize: "22px",
              fontWeight: 500,
              color: "#ffffff",
              padding: "0 10px",
              fontFamily: "Prompt",
            }}>
            {appName}
          </Typography>
          <NavigationLink href="/page1" label="Page1" />
          <div style={{ flexGrow: 1 }} />
          <Button
            color="#ffffff"
            onClick={() => {
              router.push("/page2");
            }}>
            <PersonIcon />
          </Button>
        </Toolbar>
      </AppBar>
      <main>{children}</main>
    </>
  );
};

const NavigationLink = ({ href, label }) => {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <Typography
        variant="body1"
        sx={{
          fontSize: "14px",
          fontWeight: 500,
          // textTransform: "uppercase",
          color: "#fff",
          padding: "0 10px", // Add padding on left and right
        }}>
        {label}
      </Typography>{" "}
    </Link>
  );
};

export default NavigationLayout;
