import React from "react";
import { Link,useNavigate } from "react-router-dom";
import '../styles/Navbar.css';
// import LoginButton from "../Login";
import nec_logo from "../assets/nec_logo.jpg"
import nec_logo2 from "../assets/nec_logo_2.jpg"
import KR_logo from "../assets/KR_logo.jpg"
import nec_name from "../assets/clg name.jpg"

const Navbar = () => {
    const navigate=useNavigate();
  return (
    <nav className="navbar">
      {/* Logo Section */}
      <div className="navbar-logo">
        <img 
          src="https://lms.nec.edu.in/pluginfile.php/1/theme_academi/logo/1739862648/logo.jpeg" 
          alt="NEC Logo" 
          className="navbar-logo-img"
        />
        {/* <img 
          src={nec_name}
          alt="NEC Logo" 
          className="navbar-logo-img"
        /> */}
        {/* <img 
          src={nec_logo2} 
          alt="NEC Logo" 
          className="navbar-logo-img"
        />
        <img 
          src={KR_logo} 
          alt="NEC Logo" 
          className="navbar-logo-img"
        />*/}
        <h2 id="clgname">National Engineering College</h2> 
      </div>

      {/* Right Section: Icons & Logout */}
      <div className="navbar-right">
        
      <button className="loginbutton" onClick={() => navigate("/placement/login")}>Login</button>
      </div>
    </nav>
  );
};

export default Navbar;
